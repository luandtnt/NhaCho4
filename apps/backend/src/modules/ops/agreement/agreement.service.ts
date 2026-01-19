import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { CreateAgreementDto } from './dto/create-agreement.dto';
import { UpdateAgreementDto } from './dto/update-agreement.dto';
import { QueryAgreementDto } from './dto/query-agreement.dto';
import { TerminateAgreementDto } from './dto/terminate-agreement.dto';
import { RenewAgreementDto } from './dto/renew-agreement.dto';
import { RequestActionDto } from './dto/request-action.dto';
import { RejectAgreementDto } from './dto/reject-agreement.dto';
import { PartyHelper } from '../../../common/helpers/party.helper';

@Injectable()
export class AgreementService {
  constructor(private prisma: PrismaService) {}

  /**
   * Tạo hợp đồng mới (DRAFT)
   */
  async create(orgId: string, landlordPartyId: string, dto: CreateAgreementDto) {
    // Validate rentable item exists
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

    // Rule 1: Check if item already has an ACTIVE agreement
    const existingActive = await this.prisma.agreement.findFirst({
      where: {
        org_id: orgId,
        rentable_item_id: dto.rentable_item_id,
        state: 'ACTIVE',
      },
    });

    if (existingActive) {
      throw new ConflictException({
        error_code: 'ITEM_OCCUPIED',
        message: 'This rentable item already has an active agreement',
        details: {
          existing_agreement_id: existingActive.id,
        },
      });
    }

    // Yêu cầu 11: Validate dates
    if (dto.end_at && new Date(dto.start_at) >= new Date(dto.end_at)) {
      throw new BadRequestException({
        error_code: 'INVALID_DATES',
        message: 'End date must be after start date',
      });
    }

    // Yêu cầu 11: Validate electricity/water rate if OWNER_RATE
    if (dto.electricity_billing === 'OWNER_RATE' && !dto.electricity_rate) {
      throw new BadRequestException({
        error_code: 'MISSING_ELECTRICITY_RATE',
        message: 'Electricity rate is required when billing type is OWNER_RATE',
      });
    }

    if (dto.water_billing === 'OWNER_RATE' && !dto.water_rate) {
      throw new BadRequestException({
        error_code: 'MISSING_WATER_RATE',
        message: 'Water rate is required when billing type is OWNER_RATE',
      });
    }

    // Auto-fill pricing from pricing policy if available
    let finalBasePrice = dto.base_price;
    let finalDepositAmount = dto.deposit_amount || 0;
    let finalServiceFee = dto.service_fee || 0;
    let finalBuildingMgmtFee = dto.building_mgmt_fee || 0;
    let finalElectricityBilling = dto.electricity_billing;
    let finalWaterBilling = dto.water_billing;

    if (rentableItem.pricing_policy_id) {
      // Get pricing policy
      const policy = await this.prisma.pricingPolicy.findUnique({
        where: { id: rentableItem.pricing_policy_id },
      });

      if (policy) {
        // Auto-fill from policy if not provided
        if (!dto.base_price && policy.base_price) {
          finalBasePrice = Number(policy.base_price);
        }
        if (!dto.deposit_amount && policy.deposit_amount) {
          finalDepositAmount = Number(policy.deposit_amount);
        }
        if (!dto.service_fee && policy.service_fee) {
          finalServiceFee = Number(policy.service_fee);
        }
        if (!dto.building_mgmt_fee && policy.building_management_fee) {
          finalBuildingMgmtFee = Number(policy.building_management_fee);
        }
        if (!dto.electricity_billing && policy.electricity_billing) {
          finalElectricityBilling = policy.electricity_billing as any;
        }
        if (!dto.water_billing && policy.water_billing) {
          finalWaterBilling = policy.water_billing as any;
        }
      }
    }

    // Yêu cầu 1: Generate contract_code (AG-YYYY-NNNNN)
    const year = new Date().getFullYear();
    const count = await this.prisma.agreement.count({
      where: { org_id: orgId },
    });
    const contractCode = `AG-${year}-${String(count + 1).padStart(5, '0')}`;

    // Create agreement
    const agreement = await this.prisma.agreement.create({
      data: {
        org_id: orgId,
        landlord_party_id: landlordPartyId,
        tenant_party_id: dto.tenant_party_id,
        rentable_item_id: dto.rentable_item_id,
        
        // Yêu cầu 1: Identity
        contract_code: contractCode,
        contract_title: dto.contract_title,
        
        // Party Information
        tenant_id_number: dto.tenant_id_number,
        
        agreement_type: dto.agreement_type,
        state: 'DRAFT',
        
        // Yêu cầu 4: Dates & Billing
        start_at: new Date(dto.start_at),
        end_at: dto.end_at ? new Date(dto.end_at) : null,
        billing_day: dto.billing_day || 1,
        payment_due_days: dto.payment_due_days || 5,
        
        // Yêu cầu 5: Pricing
        base_price: finalBasePrice,
        deposit_amount: finalDepositAmount,
        service_fee: finalServiceFee,
        building_mgmt_fee: finalBuildingMgmtFee,
        parking_fee_motorbike: dto.parking_fee_motorbike || 0,
        parking_fee_car: dto.parking_fee_car || 0,
        internet_fee: dto.internet_fee || 0,
        
        // Yêu cầu 6: Utilities
        electricity_billing: finalElectricityBilling,
        electricity_rate: dto.electricity_rate,
        water_billing: finalWaterBilling,
        water_rate: dto.water_rate,
        
        price_increase_percent: dto.price_increase_percent,
        price_increase_frequency: dto.price_increase_frequency,
        payment_cycle: dto.payment_cycle || 'MONTHLY',
        
        // Yêu cầu 7: Terms & Rules
        house_rules: dto.house_rules,
        termination_clause: dto.termination_clause,
        violation_penalty: dto.violation_penalty,
        allow_pets: dto.allow_pets || false,
        allow_smoking: dto.allow_smoking || false,
        allow_guests: dto.allow_guests !== undefined ? dto.allow_guests : true,
        
        // Yêu cầu 8: Handover
        handover_date: dto.handover_date ? new Date(dto.handover_date) : null,
        handover_condition: dto.handover_condition,
        furniture_list: dto.furniture_list || null,
        initial_electricity: dto.initial_electricity,
        initial_water: dto.initial_water,
        handover_document_url: dto.handover_document_url,
        
        // Yêu cầu 9: Documents
        contract_document_url: dto.contract_document_url,
        tenant_id_document_url: dto.tenant_id_document_url,
        property_document_url: dto.property_document_url,
        
        terms_json: dto.terms_json || {},
        landlord_notes: dto.landlord_notes,
      },
      include: {
        rentable_item: {
          include: {
            space_node: true,
          },
        },
      },
    });

    return agreement;
  }

  /**
   * Danh sách hợp đồng
   */
  async findAll(orgId: string, query: QueryAgreementDto, userRole: string, userId?: string) {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.page_size) || 20;
    const skip = (page - 1) * pageSize;

    const where: any = { org_id: orgId };

    // Role-based isolation
    if (userRole === 'Landlord' && userId) {
      const landlordPartyId = await PartyHelper.getLandlordPartyId(this.prisma, userId, orgId);
      if (landlordPartyId) {
        where.landlord_party_id = landlordPartyId;
      }
    } else if (userRole === 'Tenant' && userId) {
      const tenantPartyId = await PartyHelper.getTenantPartyId(this.prisma, userId, orgId);
      if (tenantPartyId) {
        where.tenant_party_id = tenantPartyId;
      }
    }

    // Filter by state
    if (query.state) {
      where.state = query.state;
    }

    // Filter by tenant (for explicit filtering)
    if (query.tenant_party_id && !where.tenant_party_id) {
      where.tenant_party_id = query.tenant_party_id;
    }

    // Filter by rentable item
    if (query.rentable_item_id) {
      where.rentable_item_id = query.rentable_item_id;
    }

    // Filter by agreement type
    if (query.agreement_type) {
      where.agreement_type = query.agreement_type;
    }

    // Search
    if (query.search) {
      where.OR = [
        { id: { contains: query.search, mode: 'insensitive' } },
        { landlord_notes: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // Sorting
    let orderBy: any = { created_at: 'desc' }; // default: newest
    if (query.sort === 'expiring_soon') {
      orderBy = { end_at: 'asc' };
    } else if (query.sort === 'price_high') {
      orderBy = { base_price: 'desc' };
    } else if (query.sort === 'price_low') {
      orderBy = { base_price: 'asc' };
    }

    const [agreements, total] = await Promise.all([
      this.prisma.agreement.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          rentable_item: {
            include: {
              space_node: true,
            },
          },
        },
      }),
      this.prisma.agreement.count({ where }),
    ]);

    return {
      data: agreements,
      meta: {
        page,
        page_size: pageSize,
        total,
        total_pages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Chi tiết hợp đồng
   */
  async findOne(orgId: string, id: string) {
    const agreement = await this.prisma.agreement.findFirst({
      where: {
        id,
        org_id: orgId,
      },
      include: {
        rentable_item: {
          include: {
            space_node: true,
          },
        },
        renewal_of: true,
        renewals: true,
      },
    });

    if (!agreement) {
      throw new NotFoundException({
        error_code: 'NOT_FOUND',
        message: 'Agreement not found',
      });
    }

    return agreement;
  }

  /**
   * Lấy data đầy đủ để tạo hợp đồng (preview/print)
   */
  async getContractData(orgId: string, id: string) {
    const agreement = await this.prisma.agreement.findFirst({
      where: {
        id,
        org_id: orgId,
      },
      include: {
        rentable_item: {
          include: {
            space_node: true,
          },
        },
      },
    });

    if (!agreement) {
      throw new NotFoundException({
        error_code: 'NOT_FOUND',
        message: 'Agreement not found',
      });
    }

    // Get landlord info
    const landlord = await this.prisma.user.findFirst({
      where: {
        id: agreement.landlord_party_id,
        org_id: orgId,
      },
    });

    // Get tenant info
    const tenant = await this.prisma.user.findFirst({
      where: {
        id: agreement.tenant_party_id,
        org_id: orgId,
      },
    });

    // Get organization info
    const organization = await this.prisma.organization.findUnique({
      where: { id: orgId },
    });

    return {
      agreement,
      landlord: landlord ? {
        id: landlord.id,
        name: landlord.name,
        email: landlord.email,
        phone: landlord.phone,
        id_number: landlord.id_number,
      } : null,
      tenant: tenant ? {
        id: tenant.id,
        name: tenant.name,
        email: tenant.email,
        phone: tenant.phone,
        id_number: tenant.id_number,
      } : null,
      organization: organization ? {
        id: organization.id,
        name: organization.name,
      } : null,
      property: agreement.rentable_item ? {
        id: agreement.rentable_item.id,
        name: agreement.rentable_item.space_node?.name || 'N/A',
        address: agreement.rentable_item.address_full,
        area_sqm: agreement.rentable_item.area_sqm,
        bedrooms: agreement.rentable_item.bedrooms,
        bathrooms: agreement.rentable_item.bathrooms,
      } : null,
    };
  }

  /**
   * Cập nhật hợp đồng (chỉ khi DRAFT)
   */
  async update(orgId: string, id: string, dto: UpdateAgreementDto) {
    const agreement = await this.findOne(orgId, id);

    if (agreement.state !== 'DRAFT') {
      throw new BadRequestException({
        error_code: 'INVALID_STATE',
        message: 'Can only update DRAFT agreements',
      });
    }

    const updated = await this.prisma.agreement.update({
      where: { id },
      data: {
        tenant_party_id: dto.tenant_party_id,
        rentable_item_id: dto.rentable_item_id,
        agreement_type: dto.agreement_type,
        start_at: dto.start_at ? new Date(dto.start_at) : undefined,
        end_at: dto.end_at ? new Date(dto.end_at) : undefined,
        base_price: dto.base_price,
        deposit_amount: dto.deposit_amount,
        service_fee: dto.service_fee,
        building_mgmt_fee: dto.building_mgmt_fee,
        electricity_billing: dto.electricity_billing,
        water_billing: dto.water_billing,
        price_increase_percent: dto.price_increase_percent,
        price_increase_frequency: dto.price_increase_frequency,
        payment_cycle: dto.payment_cycle,
        terms_json: dto.terms_json,
        landlord_notes: dto.landlord_notes,
      },
      include: {
        rentable_item: {
          include: {
            space_node: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Gửi hợp đồng cho tenant
   */
  async send(orgId: string, id: string) {
    const agreement = await this.findOne(orgId, id);

    if (agreement.state !== 'DRAFT') {
      throw new BadRequestException({
        error_code: 'INVALID_STATE',
        message: 'Can only send DRAFT agreements',
      });
    }

    const updated = await this.prisma.agreement.update({
      where: { id },
      data: {
        state: 'SENT',
        sent_at: new Date(),
      },
    });

    // TODO: Send notification to tenant
    // await this.notificationService.notifyTenant(...)

    return updated;
  }

  /**
   * Tenant xác nhận hợp đồng
   */
  async confirm(orgId: string, id: string, tenantPartyId: string) {
    const agreement = await this.findOne(orgId, id);

    // Verify tenant
    if (agreement.tenant_party_id !== tenantPartyId) {
      throw new BadRequestException({
        error_code: 'UNAUTHORIZED',
        message: 'You are not the tenant of this agreement',
      });
    }

    if (agreement.state !== 'SENT') {
      throw new BadRequestException({
        error_code: 'INVALID_STATE',
        message: 'Can only confirm SENT agreements',
      });
    }

    const updated = await this.prisma.agreement.update({
      where: { id },
      data: {
        state: 'PENDING_CONFIRM',
        confirmed_at: new Date(),
      },
    });

    // TODO: Notify landlord
    // await this.notificationService.notifyLandlord(...)

    return updated;
  }

  /**
   * Tenant từ chối hợp đồng
   */
  async reject(orgId: string, id: string, tenantPartyId: string, dto: RejectAgreementDto) {
    const agreement = await this.findOne(orgId, id);

    // Verify tenant
    if (agreement.tenant_party_id !== tenantPartyId) {
      throw new BadRequestException({
        error_code: 'UNAUTHORIZED',
        message: 'You are not the tenant of this agreement',
      });
    }

    if (agreement.state !== 'SENT' && agreement.state !== 'PENDING_CONFIRM') {
      throw new BadRequestException({
        error_code: 'INVALID_STATE',
        message: 'Can only reject SENT or PENDING_CONFIRM agreements',
      });
    }

    const updated = await this.prisma.agreement.update({
      where: { id },
      data: {
        state: 'CANCELLED',
        rejected_at: new Date(),
        rejection_reason: dto.rejection_reason,
      },
    });

    // TODO: Notify landlord
    // await this.notificationService.notifyLandlord(...)

    return updated;
  }

  /**
   * Kích hoạt hợp đồng (Landlord)
   */
  async activate(orgId: string, id: string) {
    const agreement = await this.findOne(orgId, id);

    if (agreement.state !== 'PENDING_CONFIRM') {
      throw new BadRequestException({
        error_code: 'INVALID_STATE',
        message: 'Can only activate PENDING_CONFIRM agreements',
      });
    }

    // Create snapshots
    const snapshotTerms = agreement.terms_json || {};
    const snapshotPricing = {
      base_price: agreement.base_price,
      deposit_amount: agreement.deposit_amount,
      service_fee: agreement.service_fee,
      building_mgmt_fee: agreement.building_mgmt_fee,
      electricity_billing: agreement.electricity_billing,
      water_billing: agreement.water_billing,
    };

    const updated = await this.prisma.agreement.update({
      where: { id },
      data: {
        state: 'ACTIVE',
        activated_at: new Date(),
        snapshot_terms: snapshotTerms as any,
        snapshot_pricing: snapshotPricing as any,
      },
    });

    // Rule 2: Update rentable item status to OCCUPIED
    if (agreement.rentable_item_id) {
      await this.prisma.rentableItem.update({
        where: { id: agreement.rentable_item_id },
        data: { status: 'OCCUPIED' },
      });
    }

    // Rule 2: Start invoice schedule (TODO: implement invoice generation)
    // await this.invoiceService.createSchedule(agreement);

    return updated;
  }

  /**
   * Chấm dứt hợp đồng
   */
  async terminate(orgId: string, id: string, dto: TerminateAgreementDto) {
    const agreement = await this.findOne(orgId, id);

    if (agreement.state !== 'ACTIVE') {
      throw new BadRequestException({
        error_code: 'INVALID_STATE',
        message: 'Can only terminate ACTIVE agreements',
      });
    }

    const updated = await this.prisma.agreement.update({
      where: { id },
      data: {
        state: 'TERMINATED',
        terminated_at: dto.terminated_at ? new Date(dto.terminated_at) : new Date(),
        termination_reason: dto.termination_reason,
        termination_type: dto.termination_type,
        termination_penalty: dto.termination_penalty,
        deposit_refund_amount: dto.deposit_refund_amount,
        landlord_notes: dto.notes,
      },
    });

    // Update rentable item status back to AVAILABLE
    if (agreement.rentable_item_id) {
      await this.prisma.rentableItem.update({
        where: { id: agreement.rentable_item_id },
        data: { status: 'AVAILABLE' },
      });
    }

    // Stop invoice schedule
    // await this.invoiceService.stopSchedule(agreement);

    return updated;
  }

  /**
   * Gia hạn hợp đồng (tạo agreement mới)
   */
  async renew(orgId: string, id: string, dto: RenewAgreementDto) {
    const oldAgreement = await this.findOne(orgId, id);

    if (oldAgreement.state !== 'ACTIVE' && oldAgreement.state !== 'EXPIRED') {
      throw new BadRequestException({
        error_code: 'INVALID_STATE',
        message: 'Can only renew ACTIVE or EXPIRED agreements',
      });
    }

    // Mark old agreement as renewed
    await this.prisma.agreement.update({
      where: { id },
      data: { is_renewed: true },
    });

    // Create new agreement
    const newAgreement = await this.prisma.agreement.create({
      data: {
        org_id: orgId,
        landlord_party_id: oldAgreement.landlord_party_id,
        tenant_party_id: oldAgreement.tenant_party_id,
        rentable_item_id: oldAgreement.rentable_item_id,
        agreement_type: oldAgreement.agreement_type,
        state: 'DRAFT',
        start_at: new Date(dto.new_start_at),
        end_at: new Date(dto.new_end_at),
        base_price: dto.new_base_price || oldAgreement.base_price,
        deposit_amount: dto.new_deposit_amount || oldAgreement.deposit_amount,
        service_fee: dto.new_service_fee || oldAgreement.service_fee,
        building_mgmt_fee: oldAgreement.building_mgmt_fee,
        electricity_billing: oldAgreement.electricity_billing,
        water_billing: oldAgreement.water_billing,
        price_increase_percent: oldAgreement.price_increase_percent,
        price_increase_frequency: oldAgreement.price_increase_frequency,
        payment_cycle: oldAgreement.payment_cycle,
        terms_json: dto.new_terms_json || oldAgreement.terms_json,
        renewal_of_agreement_id: id,
        landlord_notes: dto.notes,
      },
      include: {
        rentable_item: {
          include: {
            space_node: true,
          },
        },
      },
    });

    return newAgreement;
  }

  /**
   * Tenant yêu cầu hành động (gia hạn/chấm dứt)
   */
  async requestAction(orgId: string, id: string, tenantPartyId: string, dto: RequestActionDto) {
    const agreement = await this.findOne(orgId, id);

    // Verify tenant
    if (agreement.tenant_party_id !== tenantPartyId) {
      throw new BadRequestException({
        error_code: 'UNAUTHORIZED',
        message: 'You are not the tenant of this agreement',
      });
    }

    if (agreement.state !== 'ACTIVE') {
      throw new BadRequestException({
        error_code: 'INVALID_STATE',
        message: 'Can only request actions on ACTIVE agreements',
      });
    }

    const updated = await this.prisma.agreement.update({
      where: { id },
      data: {
        pending_request_type: dto.request_type,
        pending_request_data: {
          reason: dto.reason,
          desired_date: dto.desired_date,
          desired_extension_months: dto.desired_extension_months,
          desired_price: dto.desired_price,
          notes: dto.notes,
        },
        pending_request_at: new Date(),
      },
    });

    // TODO: Notify landlord
    // await this.notificationService.notifyLandlord(...)

    return updated;
  }

  /**
   * Xóa hợp đồng (chỉ DRAFT)
   */
  async remove(orgId: string, id: string) {
    const agreement = await this.findOne(orgId, id);

    if (agreement.state !== 'DRAFT') {
      throw new BadRequestException({
        error_code: 'INVALID_STATE',
        message: 'Can only delete DRAFT agreements',
      });
    }

    await this.prisma.agreement.delete({
      where: { id },
    });

    return { message: 'Agreement deleted successfully' };
  }

  /**
   * Check expired agreements (Cron job)
   */
  async checkExpired(orgId: string) {
    const now = new Date();

    const expiredAgreements = await this.prisma.agreement.findMany({
      where: {
        org_id: orgId,
        state: 'ACTIVE',
        end_at: {
          lte: now,
        },
      },
    });

    for (const agreement of expiredAgreements) {
      await this.prisma.agreement.update({
        where: { id: agreement.id },
        data: {
          state: 'EXPIRED',
          expired_at: now,
        },
      });

      // Update rentable item status
      if (agreement.rentable_item_id) {
        await this.prisma.rentableItem.update({
          where: { id: agreement.rentable_item_id },
          data: { status: 'AVAILABLE' },
        });
      }
    }

    return {
      expired_count: expiredAgreements.length,
      expired_ids: expiredAgreements.map(a => a.id),
    };
  }
}
