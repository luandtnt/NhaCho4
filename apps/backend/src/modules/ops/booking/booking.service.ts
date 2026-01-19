import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { CreateHoldDto } from './dto/create-hold.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CheckAvailabilityDto, AvailabilityResponseDto } from './dto/check-availability.dto';
import { CalculatePriceDto, PriceCalculationResponseDto, PriceBreakdownItemDto } from './dto/calculate-price.dto';
import { CreateBookingEnhancedDto } from './dto/create-booking-enhanced.dto';
import { PartyHelper } from '../../../common/helpers/party.helper';

@Injectable()
export class BookingService {
  constructor(private prisma: PrismaService) {}

  async createHold(orgId: string, dto: CreateHoldDto) {
    // Verify rentable item exists
    const rentableItem = await this.prisma.rentableItem.findFirst({
      where: {
        id: dto.rentable_item_id,
        org_id: orgId,
      },
    });

    if (!rentableItem) {
      throw new NotFoundException({
        error_code: 'NOT_FOUND',
        message: 'Rentable item not found',
      });
    }

    // Check for conflicts based on allocation type
    await this.checkAvailability(orgId, dto.rentable_item_id, new Date(dto.start_at), new Date(dto.end_at), rentableItem.allocation_type, rentableItem.capacity);

    // Create hold (simplified - in production, holds would have expiration logic)
    const hold = {
      id: crypto.randomUUID(),
      rentable_item_id: dto.rentable_item_id,
      start_at: dto.start_at,
      end_at: dto.end_at,
      reason: dto.reason || 'hold',
      created_at: new Date().toISOString(),
    };

    return hold;
  }

  async create(orgId: string, userId: string, dto: CreateBookingDto) {
    // Verify rentable item exists
    const rentableItem = await this.prisma.rentableItem.findFirst({
      where: {
        id: dto.rentable_item_id,
        org_id: orgId,
      },
    });

    if (!rentableItem) {
      throw new NotFoundException({
        error_code: 'NOT_FOUND',
        message: 'Rentable item not found',
      });
    }

    const quantity = dto.quantity || 1;

    // Check for conflicts
    await this.checkAvailability(
      orgId,
      dto.rentable_item_id,
      new Date(dto.start_at),
      dto.end_at ? new Date(dto.end_at) : null,
      rentableItem.allocation_type,
      rentableItem.capacity,
      quantity,
    );

    // Create booking
    const booking = await this.prisma.booking.create({
      data: {
        org_id: orgId,
        rentable_item_id: dto.rentable_item_id,
        tenant_party_id: userId, // Simplified - should map to party
        start_at: new Date(dto.start_at),
        end_at: dto.end_at ? new Date(dto.end_at) : null,
        quantity,
        status: 'PENDING',
        metadata: dto.hold_id ? { hold_id: dto.hold_id } : {},
      },
    });

    return booking;
  }

  async findAll(orgId: string, userId: string, userRole: string, page: number = 1, pageSize: number = 50, tenantPartyId?: string) {
    const pageNum = Number(page) || 1;
    const pageSizeNum = Number(pageSize) || 50;
    const skip = (pageNum - 1) * pageSizeNum;

    const where: any = { org_id: orgId };
    
    // Role-based isolation
    if (userRole === 'Landlord') {
      const landlordPartyId = await PartyHelper.getLandlordPartyId(this.prisma, userId, orgId);
      if (landlordPartyId) {
        where.rentable_item = {
          landlord_party_id: landlordPartyId,
        };
      }
    } else if (userRole === 'Tenant') {
      const tenantPartyIdFromUser = await PartyHelper.getTenantPartyId(this.prisma, userId, orgId);
      if (tenantPartyIdFromUser) {
        where.tenant_party_id = tenantPartyIdFromUser;
      }
    }
    
    // Filter by tenant_party_id if provided (for tenant users to see only their bookings)
    if (tenantPartyId && !where.tenant_party_id) {
      where.tenant_party_id = tenantPartyId;
    }

    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        skip,
        take: pageSizeNum,
        orderBy: { created_at: 'desc' },
        include: {
          rentable_item: {
            select: {
              id: true,
              code: true,
              space_node: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      data: bookings,
      meta: {
        page: pageNum,
        page_size: pageSizeNum,
        total,
        total_pages: Math.ceil(total / pageSizeNum),
      },
    };
  }

  async findOne(orgId: string, id: string) {
    const booking = await this.prisma.booking.findFirst({
      where: {
        id,
        org_id: orgId,
      },
      include: {
        rentable_item: true,
      },
    });

    if (!booking) {
      throw new NotFoundException({
        error_code: 'NOT_FOUND',
        message: 'Booking not found',
      });
    }

    return booking;
  }

  async confirm(orgId: string, id: string) {
    const booking = await this.findOne(orgId, id);

    if (booking.status !== 'PENDING') {
      throw new BadRequestException({
        error_code: 'VALIDATION_ERROR',
        message: `Cannot confirm booking with status ${booking.status}`,
      });
    }

    const updated = await this.prisma.booking.update({
      where: { id },
      data: { status: 'CONFIRMED' },
    });

    return updated;
  }

  async cancel(orgId: string, id: string) {
    const booking = await this.findOne(orgId, id);

    if (booking.status === 'CANCELLED') {
      throw new BadRequestException({
        error_code: 'VALIDATION_ERROR',
        message: 'Booking is already cancelled',
      });
    }

    const updated = await this.prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    return updated;
  }

  /**
   * Check availability for booking
   */
  async checkAvailabilityPublic(dto: CheckAvailabilityDto): Promise<AvailabilityResponseDto> {
    const rentableItem = await this.prisma.rentableItem.findUnique({
      where: { id: dto.rentable_item_id },
    });

    if (!rentableItem) {
      throw new NotFoundException({
        error_code: 'NOT_FOUND',
        message: 'Rentable item not found',
      });
    }

    const startAt = new Date(dto.start_date);
    const endAt = new Date(dto.end_date);
    const quantity = dto.quantity || 1;

    // Get overlapping bookings
    const overlappingBookings = await this.getOverlappingBookings(
      rentableItem.org_id,
      dto.rentable_item_id,
      startAt,
      endAt,
    );

    let available = true;
    let message = 'Còn trống';

    if (rentableItem.allocation_type === 'exclusive') {
      available = overlappingBookings.length === 0;
      if (!available) {
        message = 'Đã có người đặt trong khoảng thời gian này';
      }
    } else if (rentableItem.allocation_type === 'capacity') {
      const totalBooked = overlappingBookings.reduce((sum, b) => sum + b.quantity, 0);
      const availableCapacity = (rentableItem.capacity || 0) - totalBooked;
      available = availableCapacity >= quantity;
      if (!available) {
        message = `Không đủ chỗ. Còn trống: ${availableCapacity}, Yêu cầu: ${quantity}`;
      }
    }

    return {
      available,
      message,
      conflicting_bookings: available ? undefined : overlappingBookings.map(b => ({
        id: b.id,
        start_date: b.start_at.toISOString(),
        end_date: b.end_at?.toISOString() || '',
        status: b.status,
      })),
      suggested_dates: available ? undefined : await this.getSuggestedDates(
        rentableItem.org_id,
        dto.rentable_item_id,
        startAt,
        endAt,
      ),
    };
  }

  /**
   * Calculate price for booking
   */
  async calculatePrice(dto: CalculatePriceDto): Promise<PriceCalculationResponseDto> {
    const rentableItem = await this.prisma.rentableItem.findUnique({
      where: { id: dto.rentable_item_id },
    });

    if (!rentableItem) {
      throw new NotFoundException({
        error_code: 'NOT_FOUND',
        message: 'Rentable item not found',
      });
    }

    const startDate = new Date(dto.start_date);
    const endDate = new Date(dto.end_date);
    
    // Calculate nights/hours
    const diffMs = endDate.getTime() - startDate.getTime();
    const nights = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.ceil(diffMs / (1000 * 60 * 60));

    const metadata = rentableItem.metadata as any || {};
    const details = metadata.details || {};

    // Base price - Convert Decimal to number
    const basePrice = rentableItem.base_price ? Number(rentableItem.base_price) : 0;
    const priceUnit = rentableItem.price_unit || 'NIGHT';
    
    let subtotal = 0;
    if (priceUnit === 'NIGHT') {
      subtotal = basePrice * nights;
    } else if (priceUnit === 'HOUR') {
      subtotal = basePrice * hours;
    } else {
      subtotal = basePrice; // MONTH, YEAR, etc.
    }

    const breakdown: PriceBreakdownItemDto[] = [
      {
        label: `Giá cơ bản (${basePrice.toLocaleString('vi-VN')} ₫ x ${nights} đêm)`,
        amount: subtotal,
      },
    ];

    const fees: any = {};
    let totalFees = 0;

    // Cleaning fee
    if (details.cleaning_fee) {
      fees.cleaning_fee = details.cleaning_fee;
      totalFees += details.cleaning_fee;
      breakdown.push({
        label: 'Phí dọn dẹp',
        amount: details.cleaning_fee,
      });
    }

    // Extra guest fee
    const totalGuests = dto.guests.adults + (dto.guests.children || 0);
    const baseOccupancy = rentableItem.max_occupancy ? Math.floor(rentableItem.max_occupancy / 2) : 2;
    if (totalGuests > baseOccupancy && details.extra_guest_fee) {
      const extraGuests = totalGuests - baseOccupancy;
      fees.extra_guest_fee = details.extra_guest_fee * extraGuests * nights;
      totalFees += fees.extra_guest_fee;
      breakdown.push({
        label: `Phụ thu thêm người (${extraGuests} người x ${nights} đêm)`,
        amount: fees.extra_guest_fee,
      });
    }

    // Weekend surcharge
    const hasWeekend = this.hasWeekendDays(startDate, endDate);
    if (hasWeekend && details.weekend_surcharge) {
      fees.weekend_surcharge = details.weekend_surcharge;
      totalFees += details.weekend_surcharge;
      breakdown.push({
        label: 'Phụ thu cuối tuần',
        amount: details.weekend_surcharge,
      });
    }

    // Service fee (10% of subtotal)
    if (rentableItem.service_fee) {
      fees.service_fee = Math.round(subtotal * 0.1);
      totalFees += fees.service_fee;
      breakdown.push({
        label: 'Phí dịch vụ (10%)',
        amount: fees.service_fee,
      });
    }

    // Internet fee
    if (details.internet_fee) {
      fees.internet_fee = details.internet_fee;
      totalFees += details.internet_fee;
      breakdown.push({
        label: 'Phí internet',
        amount: details.internet_fee,
      });
    }

    const discounts: any = {};
    let totalDiscounts = 0;

    // Apply pricing policy if exists
    let policyAdjustment = 0;
    let policyName = null;
    if (rentableItem.pricing_policy_id) {
      try {
        const policy = await this.getPricingPolicy(rentableItem.pricing_policy_id);
        if (policy) {
          policyName = (policy.config as any)?.name;
          const adjustedPrice = await this.applyPolicyRules(basePrice, policy, dto);
          policyAdjustment = adjustedPrice - basePrice;
          if (policyAdjustment !== 0) {
            breakdown.push({
              label: `Điều chỉnh chính sách giá: ${policyName}`,
              amount: policyAdjustment,
            });
          }
        }
      } catch (error) {
        console.warn('Failed to apply pricing policy:', error);
      }
    }

    // TODO: Voucher logic
    if (dto.voucher_code) {
      // Implement voucher validation and discount calculation
    }

    // Long stay discount (7+ nights = 10% off)
    if (nights >= 7) {
      discounts.long_stay = Math.round(subtotal * 0.1);
      totalDiscounts += discounts.long_stay;
      breakdown.push({
        label: 'Giảm giá thuê dài hạn (10%)',
        amount: -discounts.long_stay,
      });
    }

    const total = subtotal + totalFees - totalDiscounts;

    // Booking hold deposit
    const bookingHoldDeposit = details.booking_hold_deposit || 0;

    return {
      base_price: basePrice,
      nights,
      hours: priceUnit === 'HOUR' ? hours : undefined,
      subtotal,
      fees,
      discounts,
      booking_hold_deposit: bookingHoldDeposit,
      total,
      breakdown,
    };
  }

  /**
   * Create booking with enhanced data
   */
  async createEnhanced(orgId: string, userId: string, dto: CreateBookingEnhancedDto) {
    // Verify rentable item
    const rentableItem = await this.prisma.rentableItem.findFirst({
      where: {
        id: dto.rentable_item_id,
        org_id: orgId,
      },
    });

    if (!rentableItem) {
      throw new NotFoundException({
        error_code: 'NOT_FOUND',
        message: 'Rentable item not found',
      });
    }

    // Check policies accepted
    if (!dto.policies_accepted) {
      throw new BadRequestException({
        error_code: 'VALIDATION_ERROR',
        message: 'Bạn phải đồng ý với chính sách và nội quy',
      });
    }

    const startAt = new Date(dto.start_date);
    const endAt = new Date(dto.end_date);
    const totalGuests = dto.guests.adults + (dto.guests.children || 0) + (dto.guests.infants || 0);

    // Check availability
    await this.checkAvailability(
      orgId,
      dto.rentable_item_id,
      startAt,
      endAt,
      rentableItem.allocation_type,
      rentableItem.capacity,
      1,
    );

    // Validate max occupancy
    if (rentableItem.max_occupancy && totalGuests > rentableItem.max_occupancy) {
      throw new BadRequestException({
        error_code: 'VALIDATION_ERROR',
        message: `Số khách vượt quá giới hạn. Tối đa: ${rentableItem.max_occupancy}`,
      });
    }

    // Determine status based on instant_booking
    const status = rentableItem.instant_booking ? 'CONFIRMED' : 'PENDING';

    // Create booking
    const booking = await this.prisma.booking.create({
      data: {
        org_id: orgId,
        rentable_item_id: dto.rentable_item_id,
        tenant_party_id: userId,
        start_at: startAt,
        end_at: endAt,
        quantity: 1,
        status,
        metadata: {
          listing_id: dto.listing_id,
          guests: {
            adults: dto.guests.adults,
            children: dto.guests.children || 0,
            infants: dto.guests.infants || 0,
          },
          contact: {
            full_name: dto.contact.full_name,
            phone: dto.contact.phone,
            email: dto.contact.email || null,
            special_requests: dto.contact.special_requests || null,
          },
          pricing: {
            total: dto.pricing.total,
            breakdown: dto.pricing.breakdown,
          },
          voucher_code: dto.voucher_code || null,
          auto_confirmed: rentableItem.instant_booking || false,
          policies_accepted: true,
          policies_accepted_at: new Date().toISOString(),
        } as any,
      },
    });

    return {
      ...booking,
      booking_code: `BK${booking.id.substring(0, 8).toUpperCase()}`,
    };
  }

  /**
   * Get booking timeline for rentable item
   */
  async getBookingTimeline(rentableItemId: string, startDate: string, endDate: string) {
    const rentableItem = await this.prisma.rentableItem.findUnique({
      where: { id: rentableItemId },
    });

    if (!rentableItem) {
      throw new NotFoundException({
        error_code: 'NOT_FOUND',
        message: 'Rentable item not found',
      });
    }

    const bookings = await this.prisma.booking.findMany({
      where: {
        rentable_item_id: rentableItemId,
        status: {
          in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'],
        },
        OR: [
          {
            AND: [
              { start_at: { lte: new Date(endDate) } },
              { end_at: { gte: new Date(startDate) } },
            ],
          },
        ],
      },
      orderBy: {
        start_at: 'asc',
      },
      select: {
        id: true,
        start_at: true,
        end_at: true,
        status: true,
        quantity: true,
        metadata: true,
      },
    });

    return {
      rentable_item_id: rentableItemId,
      start_date: startDate,
      end_date: endDate,
      bookings: bookings.map(b => ({
        id: b.id,
        booking_code: `BK${b.id.substring(0, 8).toUpperCase()}`,
        start_at: b.start_at.toISOString(),
        end_at: b.end_at?.toISOString() || null,
        status: b.status,
        quantity: b.quantity,
        guest_name: (b.metadata as any)?.contact?.full_name || 'Guest',
      })),
    };
  }

  // Helper methods
  private async getOverlappingBookings(
    orgId: string,
    rentableItemId: string,
    startAt: Date,
    endAt: Date,
  ) {
    return this.prisma.booking.findMany({
      where: {
        org_id: orgId,
        rentable_item_id: rentableItemId,
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
        OR: [
          {
            AND: [
              { start_at: { lte: startAt } },
              { end_at: { gte: startAt } },
            ],
          },
          {
            AND: [
              { start_at: { lte: endAt } },
              { end_at: { gte: endAt } },
            ],
          },
          {
            AND: [
              { start_at: { gte: startAt } },
              { start_at: { lte: endAt } },
            ],
          },
        ],
      },
    });
  }

  private async getSuggestedDates(
    orgId: string,
    rentableItemId: string,
    requestedStart: Date,
    requestedEnd: Date,
  ): Promise<{ start_date: string; end_date: string }[]> {
    // Simple logic: suggest next 3 available periods
    const suggestions: { start_date: string; end_date: string }[] = [];
    const duration = requestedEnd.getTime() - requestedStart.getTime();
    
    let checkDate = new Date(requestedEnd);
    checkDate.setDate(checkDate.getDate() + 1);

    for (let i = 0; i < 3; i++) {
      const checkEnd = new Date(checkDate.getTime() + duration);
      const overlapping = await this.getOverlappingBookings(
        orgId,
        rentableItemId,
        checkDate,
        checkEnd,
      );

      if (overlapping.length === 0) {
        suggestions.push({
          start_date: checkDate.toISOString(),
          end_date: checkEnd.toISOString(),
        });
      }

      checkDate.setDate(checkDate.getDate() + 1);
    }

    return suggestions;
  }

  private hasWeekendDays(startDate: Date, endDate: Date): boolean {
    const current = new Date(startDate);
    while (current <= endDate) {
      const day = current.getDay();
      if (day === 0 || day === 6) {
        return true;
      }
      current.setDate(current.getDate() + 1);
    }
    return false;
  }

  private async checkAvailability(
    orgId: string,
    rentableItemId: string,
    startAt: Date,
    endAt: Date | null,
    allocationType: string,
    capacity: number | null,
    requestedQuantity: number = 1,
  ) {
    // Get existing bookings that overlap
    const overlappingBookings = await this.prisma.booking.findMany({
      where: {
        org_id: orgId,
        rentable_item_id: rentableItemId,
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
        OR: [
          {
            AND: [
              { start_at: { lte: startAt } },
              endAt ? { end_at: { gte: startAt } } : {},
            ],
          },
          {
            AND: [
              endAt ? { start_at: { lte: endAt } } : {},
              endAt ? { end_at: { gte: endAt } } : {},
            ],
          },
          {
            AND: [
              { start_at: { gte: startAt } },
              endAt ? { start_at: { lte: endAt } } : {},
            ],
          },
        ],
      },
    });

    if (allocationType === 'exclusive') {
      if (overlappingBookings.length > 0) {
        throw new ConflictException({
          error_code: 'CONFLICT',
          message: 'Rentable item is not available for the requested time period',
        });
      }
    } else if (allocationType === 'capacity') {
      const totalBooked = overlappingBookings.reduce((sum, b) => sum + b.quantity, 0);
      if (totalBooked + requestedQuantity > (capacity || 0)) {
        throw new ConflictException({
          error_code: 'CONFLICT',
          message: `Insufficient capacity. Available: ${(capacity || 0) - totalBooked}, Requested: ${requestedQuantity}`,
        });
      }
    }
    // slot allocation would require more complex logic with slot boundaries
  }

  // ============================================================================
  // WALK-IN BOOKING METHODS
  // ============================================================================

  /**
   * Quick check-in for walk-in customers
   * Creates a booking with CHECKED_IN status immediately
   */
  async quickCheckin(orgId: string, userId: string, dto: any) {
    // Verify rentable item exists and belongs to org
    const rentableItem = await this.prisma.rentableItem.findFirst({
      where: {
        id: dto.rentable_item_id,
        org_id: orgId,
      },
    });

    if (!rentableItem) {
      throw new NotFoundException({
        error_code: 'NOT_FOUND',
        message: 'Rentable item not found',
      });
    }

    // Get or create tenant party for walk-in customer
    let tenantParty = await this.prisma.party.findFirst({
      where: {
        org_id: orgId,
        name: 'Walk-in Customer (Default)',
      },
    });

    if (!tenantParty) {
      // Create default walk-in party
      tenantParty = await this.prisma.party.create({
        data: {
          org_id: orgId,
          party_type: 'Tenant',
          name: 'Walk-in Customer (Default)',
          metadata: {
            is_walk_in_default: true,
          },
        },
      });
    }

    const now = new Date();
    const estimatedEndTime = new Date(now.getTime() + dto.estimated_duration_hours * 60 * 60 * 1000);

    // Check if room is currently available
    const overlapping = await this.getOverlappingBookings(
      orgId,
      dto.rentable_item_id,
      now,
      estimatedEndTime,
    );

    if (overlapping.length > 0) {
      throw new ConflictException({
        error_code: 'ROOM_OCCUPIED',
        message: 'Room is currently occupied',
        details: {
          current_booking: overlapping[0],
        },
      });
    }

    // Create booking with CHECKED_IN status
    const booking = await this.prisma.booking.create({
      data: {
        org_id: orgId,
        rentable_item_id: dto.rentable_item_id,
        tenant_party_id: tenantParty.id,
        start_at: now,
        end_at: estimatedEndTime,
        actual_start_at: now,
        actual_end_at: null,
        status: 'CHECKED_IN',
        is_walk_in: true,
        estimated_duration_hours: dto.estimated_duration_hours,
        walk_in_notes: dto.notes || null,
        quantity: 1,
        metadata: {
          guests: dto.guests,
          checked_in_by: userId,
          checked_in_at: now.toISOString(),
        },
      },
      include: {
        rentable_item: {
          select: {
            id: true,
            code: true,
            property_category: true,
            base_price: true,
            price_unit: true,
          },
        },
      },
    });

    return {
      booking_id: booking.id,
      booking_code: `WI-${booking.id.substring(0, 8).toUpperCase()}`,
      status: booking.status,
      rentable_item: booking.rentable_item,
      checked_in_at: booking.actual_start_at,
      estimated_checkout: booking.end_at,
      guests: dto.guests,
      notes: booking.walk_in_notes,
    };
  }

  /**
   * Check out a walk-in booking
   * Calculates final price based on actual duration
   */
  async checkout(orgId: string, userId: string, dto: any) {
    const booking = await this.prisma.booking.findFirst({
      where: {
        id: dto.booking_id,
        org_id: orgId,
        status: 'CHECKED_IN',
      },
      include: {
        rentable_item: true,
      },
    });

    if (!booking) {
      throw new NotFoundException({
        error_code: 'NOT_FOUND',
        message: 'Active booking not found',
      });
    }

    const now = new Date();
    const actualStartAt = booking.actual_start_at || booking.start_at;
    const durationMs = now.getTime() - actualStartAt.getTime();
    const durationHours = Math.ceil(durationMs / (1000 * 60 * 60)); // Round up to nearest hour

    // Calculate price based on actual duration
    const basePrice = Number(booking.rentable_item.base_price);
    let totalPrice = 0;

    if (booking.rentable_item.price_unit === 'HOUR') {
      totalPrice = basePrice * durationHours;
    } else if (booking.rentable_item.price_unit === 'NIGHT') {
      const nights = Math.ceil(durationHours / 24);
      totalPrice = basePrice * nights;
    } else {
      // For monthly, calculate proportionally
      const days = Math.ceil(durationHours / 24);
      totalPrice = (basePrice / 30) * days;
    }

    // Update booking
    const updatedBooking = await this.prisma.booking.update({
      where: { id: booking.id },
      data: {
        actual_end_at: now,
        end_at: now,
        status: 'CHECKED_OUT',
        metadata: {
          ...((booking.metadata as any) || {}),
          checked_out_by: userId,
          checked_out_at: now.toISOString(),
          actual_duration_hours: durationHours,
          final_price: totalPrice,
          checkout_notes: dto.notes || null,
        },
      },
    });

    return {
      booking_id: updatedBooking.id,
      booking_code: `WI-${updatedBooking.id.substring(0, 8).toUpperCase()}`,
      status: updatedBooking.status,
      checked_in_at: actualStartAt,
      checked_out_at: now,
      duration_hours: durationHours,
      total_price: totalPrice,
      currency: 'VND',
    };
  }

  /**
   * Extend a walk-in booking
   */
  async extendBooking(orgId: string, userId: string, dto: any) {
    const booking = await this.prisma.booking.findFirst({
      where: {
        id: dto.booking_id,
        org_id: orgId,
        status: 'CHECKED_IN',
      },
    });

    if (!booking) {
      throw new NotFoundException({
        error_code: 'NOT_FOUND',
        message: 'Active booking not found',
      });
    }

    const newEndTime = new Date(booking.end_at!.getTime() + dto.additional_hours * 60 * 60 * 1000);

    // Check if extension is possible (no conflicts)
    const overlapping = await this.getOverlappingBookings(
      orgId,
      booking.rentable_item_id,
      booking.end_at!,
      newEndTime,
    );

    if (overlapping.length > 0) {
      throw new ConflictException({
        error_code: 'EXTENSION_CONFLICT',
        message: 'Cannot extend - room is booked for the requested time',
        details: {
          next_booking: overlapping[0],
        },
      });
    }

    // Update booking
    const updatedBooking = await this.prisma.booking.update({
      where: { id: booking.id },
      data: {
        end_at: newEndTime,
        estimated_duration_hours: (booking.estimated_duration_hours || 0) + dto.additional_hours,
        metadata: {
          ...((booking.metadata as any) || {}),
          extensions: [
            ...((booking.metadata as any)?.extensions || []),
            {
              extended_by: userId,
              extended_at: new Date().toISOString(),
              additional_hours: dto.additional_hours,
            },
          ],
        },
      },
    });

    return {
      booking_id: updatedBooking.id,
      new_estimated_checkout: updatedBooking.end_at,
      total_estimated_hours: updatedBooking.estimated_duration_hours,
    };
  }

  /**
   * Get all active (checked-in) bookings for landlord
   */
  async getActiveBookings(orgId: string, userId: string) {
    // Get landlord party ID
    const landlordPartyId = await PartyHelper.getLandlordPartyId(this.prisma, userId, orgId);

    const where: any = {
      org_id: orgId,
      status: 'CHECKED_IN',
    };

    // Add landlord isolation
    if (landlordPartyId) {
      where.rentable_item = {
        landlord_party_id: landlordPartyId,
      };
    }

    const bookings = await this.prisma.booking.findMany({
      where,
      include: {
        rentable_item: {
          select: {
            id: true,
            code: true,
            property_category: true,
            base_price: true,
            price_unit: true,
            metadata: true,
          },
        },
      },
      orderBy: {
        actual_start_at: 'asc',
      },
    });

    const now = new Date();

    return bookings.map(booking => {
      const actualStartAt = booking.actual_start_at || booking.start_at;
      const durationMs = now.getTime() - actualStartAt.getTime();
      const durationHours = durationMs / (1000 * 60 * 60);
      const durationMinutes = Math.floor((durationMs / (1000 * 60)) % 60);

      // Calculate current price
      const basePrice = Number(booking.rentable_item.base_price);
      let currentPrice = 0;

      if (booking.rentable_item.price_unit === 'HOUR') {
        currentPrice = basePrice * Math.ceil(durationHours);
      } else if (booking.rentable_item.price_unit === 'NIGHT') {
        const nights = Math.ceil(durationHours / 24);
        currentPrice = basePrice * nights;
      } else {
        const days = Math.ceil(durationHours / 24);
        currentPrice = (basePrice / 30) * days;
      }

      return {
        booking_id: booking.id,
        booking_code: `WI-${booking.id.substring(0, 8).toUpperCase()}`,
        rentable_item: booking.rentable_item,
        checked_in_at: actualStartAt,
        estimated_checkout: booking.end_at,
        duration: {
          hours: Math.floor(durationHours),
          minutes: durationMinutes,
          total_hours: durationHours,
        },
        current_price: currentPrice,
        guests: (booking.metadata as any)?.guests || 1,
        notes: booking.walk_in_notes,
        is_walk_in: booking.is_walk_in,
      };
    });
  }

  // ============================================================================
  // PRICING POLICY APPLICATION
  // ============================================================================

  /**
   * Get pricing policy by ID
   */
  private async getPricingPolicy(policyId: string) {
    const policy = await this.prisma.configBundle.findFirst({
      where: {
        id: policyId,
        status: 'ACTIVE',
      },
    });
    return policy;
  }

  /**
   * Apply pricing policy rules to base price
   */
  private async applyPolicyRules(basePrice: number, policy: any, dto: CalculatePriceDto): Promise<number> {
    const config = policy.config as any;
    const policyType = config.policy_type;
    const rules = config.config || {};
    
    let adjustedPrice = basePrice;
    
    // Apply based on policy type
    switch (policyType) {
      case 'SEASONAL':
        adjustedPrice = this.applySeasonalAdjustment(adjustedPrice, rules, new Date(dto.start_date));
        break;
      case 'PROMOTIONAL':
        adjustedPrice = this.applyPromotionalDiscount(adjustedPrice, rules);
        break;
      case 'CUSTOM':
        adjustedPrice = this.applyCustomRules(adjustedPrice, rules, dto);
        break;
      default:
        // No adjustment
        break;
    }
    
    return adjustedPrice;
  }

  /**
   * Apply seasonal pricing adjustments
   */
  private applySeasonalAdjustment(basePrice: number, rules: any, startDate: Date): number {
    const month = startDate.getMonth() + 1; // 1-12
    const dayOfWeek = startDate.getDay(); // 0-6
    
    // High season multiplier (e.g., summer months)
    if (rules.high_season_months && rules.high_season_months.includes(month)) {
      const multiplier = rules.high_season_multiplier || 1.2;
      return basePrice * multiplier;
    }
    
    // Low season multiplier (e.g., winter months)
    if (rules.low_season_months && rules.low_season_months.includes(month)) {
      const multiplier = rules.low_season_multiplier || 0.8;
      return basePrice * multiplier;
    }
    
    // Weekend surcharge
    if (rules.weekend_multiplier && (dayOfWeek === 0 || dayOfWeek === 6)) {
      return basePrice * rules.weekend_multiplier;
    }
    
    return basePrice;
  }

  /**
   * Apply promotional discounts
   */
  private applyPromotionalDiscount(basePrice: number, rules: any): number {
    if (rules.discount_type === 'PERCENTAGE') {
      const discountPercent = rules.discount_value || 0;
      return basePrice * (1 - discountPercent / 100);
    } else if (rules.discount_type === 'FIXED_AMOUNT') {
      const discountAmount = rules.discount_value || 0;
      return Math.max(0, basePrice - discountAmount);
    }
    
    return basePrice;
  }

  /**
   * Apply custom pricing rules
   */
  private applyCustomRules(basePrice: number, rules: any, dto: CalculatePriceDto): number {
    let adjustedPrice = basePrice;
    
    // Duration-based discount
    const startDate = new Date(dto.start_date);
    const endDate = new Date(dto.end_date);
    const nights = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (rules.duration_discounts) {
      for (const tier of rules.duration_discounts) {
        if (nights >= tier.min_nights) {
          const discountPercent = tier.discount_percent || 0;
          adjustedPrice = basePrice * (1 - discountPercent / 100);
        }
      }
    }
    
    // Day of week pricing
    const dayOfWeek = startDate.getDay();
    if (rules.day_of_week_multipliers && rules.day_of_week_multipliers[dayOfWeek]) {
      adjustedPrice = basePrice * rules.day_of_week_multipliers[dayOfWeek];
    }
    
    return adjustedPrice;
  }
}
