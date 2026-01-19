import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { CreateRentableItemDto } from './dto/create-rentable-item.dto';
import { UpdateRentableItemDto } from './dto/update-rentable-item.dto';
import { QueryRentableItemDto } from './dto/query-rentable-item.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class RentableItemService {
  constructor(private prisma: PrismaService) {}

  async create(orgId: string, dto: CreateRentableItemDto) {
    // Verify space node belongs to org
    const spaceNode = await this.prisma.spaceNode.findFirst({
      where: {
        id: dto.space_node_id,
        org_id: orgId,
      },
    });

    if (!spaceNode) {
      throw new BadRequestException({
        error_code: 'VALIDATION_ERROR',
        message: 'Space node not found or does not belong to your organization',
      });
    }

    // Check for duplicate code within the same space node
    const existingItem = await this.prisma.rentableItem.findFirst({
      where: {
        org_id: orgId,
        space_node_id: dto.space_node_id,
        code: dto.code,
      },
    });

    if (existingItem) {
      throw new BadRequestException({
        error_code: 'CONFLICT',
        message: `Rentable item with code '${dto.code}' already exists in this space node`,
      });
    }

    // Validate allocation type requirements
    if (dto.allocation_type === 'capacity' && !dto.capacity) {
      throw new BadRequestException({
        error_code: 'VALIDATION_ERROR',
        message: 'Capacity is required for capacity allocation type',
      });
    }

    if (dto.allocation_type === 'slot' && !dto.slot_config) {
      throw new BadRequestException({
        error_code: 'VALIDATION_ERROR',
        message: 'Slot configuration is required for slot allocation type',
      });
    }

    // Validate property category if provided
    if (dto.property_category) {
      const category = await this.prisma.propertyCategory.findUnique({
        where: { code: dto.property_category },
      });
      if (!category) {
        throw new BadRequestException({
          error_code: 'VALIDATION_ERROR',
          message: `Invalid property category: ${dto.property_category}`,
        });
      }
    }

    const item = await this.prisma.rentableItem.create({
      data: {
        org_id: orgId,
        space_node_id: dto.space_node_id,
        code: dto.code,
        allocation_type: dto.allocation_type,
        capacity: dto.capacity || null,
        slot_config: dto.slot_config || null,
        // NEW: Property classification
        property_category: dto.property_category || null,
        rental_duration_type: dto.rental_duration_type || null,
        min_rental_days: dto.min_rental_days || 1,
        max_rental_days: dto.max_rental_days || null,
        pricing_unit: dto.pricing_unit || 'PER_MONTH',
        // NEW: Pricing Policy Integration
        pricing_policy_id: (dto as any).pricing_policy_id || null,
        pricing_policy_version: (dto as any).pricing_policy_version || null,
        pricing_snapshot_at: (dto as any).pricing_policy_id ? new Date() : null,
        // NEW: Property details
        area_sqm: dto.area_sqm || null,
        bedrooms: dto.bedrooms || null,
        bathrooms: dto.bathrooms || null,
        floor_number: dto.floor_number || null,
        // NEW: Amenities & Rules
        amenities: dto.amenities || [],
        house_rules: dto.house_rules || [],
        // NEW: Booking settings
        instant_booking: dto.instant_booking || false,
        advance_booking_days: dto.advance_booking_days || 1,
        cancellation_policy: dto.cancellation_policy || 'MODERATE',
        attrs: dto.attrs || {},
        status: 'ACTIVE',
      },
    });

    return item;
  }

  async findAll(orgId: string, query: QueryRentableItemDto) {
    const page = query.page || 1;
    const pageSize = query.page_size || 20;
    const skip = (page - 1) * pageSize;

    // Build where clause with filters
    const where: Prisma.RentableItemWhereInput = {
      org_id: orgId,
    };

    // By default, exclude INACTIVE items unless explicitly requested
    if (query.status) {
      where.status = query.status;
    } else {
      // Default: only show active items (not INACTIVE/soft deleted)
      where.status = {
        not: 'INACTIVE',
      };
    }

    if (query.property_category) {
      where.property_category = query.property_category;
    }

    if (query.rental_duration_type) {
      where.rental_duration_type = query.rental_duration_type;
    }

    if (query.space_node_id) {
      where.space_node_id = query.space_node_id;
    }

    if (query.asset_id) {
      where.space_node = {
        asset_id: query.asset_id,
      };
    }

    if (query.min_bedrooms) {
      where.bedrooms = { gte: query.min_bedrooms };
    }

    if (query.min_bathrooms) {
      where.bathrooms = { gte: query.min_bathrooms };
    }

    if (query.min_area || query.max_area) {
      where.area_sqm = {};
      if (query.min_area) {
        where.area_sqm.gte = query.min_area;
      }
      if (query.max_area) {
        where.area_sqm.lte = query.max_area;
      }
    }

    if (query.instant_booking !== undefined) {
      const instantBookingValue = query.instant_booking;
      where.instant_booking = instantBookingValue === true || instantBookingValue === 'true' as any;
    }

    // Amenities filter (check if all requested amenities are present)
    if (query.amenities) {
      const requestedAmenities = query.amenities.split(',').map(a => a.trim());
      // This is a simplified check - in production you might want to use raw SQL for better performance
      where.amenities = {
        path: '$',
        array_contains: requestedAmenities,
      } as any;
    }

    const [items, total] = await Promise.all([
      this.prisma.rentableItem.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { created_at: 'desc' },
        include: {
          space_node: {
            select: {
              id: true,
              name: true,
              node_type: true,
              path: true,
              asset: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.rentableItem.count({ where }),
    ]);

    return {
      data: items,
      meta: {
        page,
        page_size: pageSize,
        total,
        total_pages: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(orgId: string, id: string) {
    const item = await this.prisma.rentableItem.findFirst({
      where: {
        id,
        org_id: orgId,
      },
      include: {
        space_node: {
          include: {
            asset: true,
          },
        },
        bookings: {
          where: {
            status: {
              in: ['PENDING', 'CONFIRMED'],
            },
          },
          select: {
            id: true,
            start_at: true,
            end_at: true,
            status: true,
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException({
        error_code: 'NOT_FOUND',
        message: 'Rentable item not found',
      });
    }

    return item;
  }

  async update(orgId: string, id: string, dto: UpdateRentableItemDto) {
    await this.findOne(orgId, id);

    // Validate property category if provided
    if (dto.property_category) {
      const category = await this.prisma.propertyCategory.findUnique({
        where: { code: dto.property_category },
      });
      if (!category) {
        throw new BadRequestException({
          error_code: 'VALIDATION_ERROR',
          message: `Invalid property category: ${dto.property_category}`,
        });
      }
    }

    const updateData: any = {};
    
    // Only update fields that are provided
    if (dto.code !== undefined) updateData.code = dto.code;
    if (dto.capacity !== undefined) updateData.capacity = dto.capacity;
    if (dto.slot_config !== undefined) updateData.slot_config = dto.slot_config;
    if (dto.property_category !== undefined) updateData.property_category = dto.property_category;
    if (dto.rental_duration_type !== undefined) updateData.rental_duration_type = dto.rental_duration_type;
    if (dto.min_rental_days !== undefined) updateData.min_rental_days = dto.min_rental_days;
    if (dto.max_rental_days !== undefined) updateData.max_rental_days = dto.max_rental_days;
    if (dto.pricing_unit !== undefined) updateData.pricing_unit = dto.pricing_unit;
    if (dto.area_sqm !== undefined) updateData.area_sqm = dto.area_sqm;
    if (dto.bedrooms !== undefined) updateData.bedrooms = dto.bedrooms;
    if (dto.bathrooms !== undefined) updateData.bathrooms = dto.bathrooms;
    if (dto.floor_number !== undefined) updateData.floor_number = dto.floor_number;
    if (dto.amenities !== undefined) updateData.amenities = dto.amenities;
    if (dto.house_rules !== undefined) updateData.house_rules = dto.house_rules;
    if (dto.instant_booking !== undefined) updateData.instant_booking = dto.instant_booking;
    if (dto.advance_booking_days !== undefined) updateData.advance_booking_days = dto.advance_booking_days;
    if (dto.cancellation_policy !== undefined) updateData.cancellation_policy = dto.cancellation_policy;
    if (dto.attrs !== undefined) updateData.attrs = dto.attrs;

    const item = await this.prisma.rentableItem.update({
      where: { id },
      data: updateData,
    });

    return item;
  }

  async remove(orgId: string, id: string) {
    const item = await this.findOne(orgId, id);

    // Check if item has active bookings
    const activeBookings = await this.prisma.booking.count({
      where: {
        rentable_item_id: id,
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
      },
    });

    if (activeBookings > 0) {
      throw new BadRequestException({
        error_code: 'HAS_ACTIVE_BOOKINGS',
        message: `Cannot delete rentable item with ${activeBookings} active booking(s). Please cancel or complete the bookings first.`,
        details: { active_bookings: activeBookings },
      });
    }

    // Check if item is used in any listings
    const activeListings = await this.prisma.listingRentableItem.count({
      where: {
        rentable_item_id: id,
        listing: {
          status: 'PUBLISHED',
        },
      },
    });

    if (activeListings > 0) {
      throw new BadRequestException({
        error_code: 'HAS_ACTIVE_LISTINGS',
        message: `Cannot delete rentable item with ${activeListings} active listing(s). Please unpublish the listings first.`,
        details: { active_listings: activeListings },
      });
    }

    // Soft delete: Set status to INACTIVE
    await this.prisma.rentableItem.update({
      where: { id },
      data: { 
        status: 'INACTIVE',
        updated_at: new Date(),
      },
    });

    return { 
      message: 'Rentable item deactivated successfully',
      status: 'INACTIVE',
    };
  }
}
