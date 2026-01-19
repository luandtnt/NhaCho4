import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { CreatePricingPolicyDto } from './dto/create-pricing-policy.dto';
import { UpdatePricingPolicyDto } from './dto/update-pricing-policy.dto';
import { QueryPricingPolicyDto } from './dto/query-pricing-policy.dto';
import { PartyHelper } from '../../../common/helpers/party.helper';

@Injectable()
export class PricingPolicyService {
  constructor(private prisma: PrismaService) {}

  async create(orgId: string, userId: string, dto: CreatePricingPolicyDto) {
    // Get landlord party ID
    const landlordPartyId = await PartyHelper.getLandlordPartyId(this.prisma, userId, orgId);

    // Create policy
    const policy = await this.prisma.pricingPolicy.create({
      data: {
        org_id: orgId,
        landlord_party_id: landlordPartyId,
        name: dto.name,
        description: dto.description,
        status: 'ACTIVE',
        version: 1,
        property_category: dto.property_category,
        rental_duration_type: dto.rental_duration_type,
        scope_province: dto.scope_province,
        scope_district: dto.scope_district,
        pricing_mode: dto.pricing_mode || 'FIXED',
        base_price: dto.base_price,
        price_unit: dto.price_unit,
        min_rent_duration: dto.min_rent_duration,
        deposit_amount: dto.deposit_amount,
        booking_hold_deposit: dto.booking_hold_deposit,
        service_fee: dto.service_fee,
        building_management_fee: dto.building_management_fee,
        electricity_billing: dto.electricity_billing,
        water_billing: dto.water_billing,
        pricing_details: dto.pricing_details || {},
        tiered_pricing: dto.tiered_pricing,
        created_by: userId,
      },
    });

    // Create version record
    await this.prisma.pricingPolicyVersion.create({
      data: {
        policy_id: policy.id,
        version: 1,
        policy_snapshot: policy as any,
        changed_by: userId,
        change_reason: 'Initial creation',
        change_type: 'CREATE',
        changed_fields: {},
      },
    });

    return policy;
  }

  async findAll(orgId: string, userId: string, userRole: string, query: QueryPricingPolicyDto) {
    const where: any = { org_id: orgId };

    // Role-based isolation
    if (userRole === 'Landlord') {
      const landlordPartyId = await PartyHelper.getLandlordPartyId(this.prisma, userId, orgId);
      if (landlordPartyId) {
        where.landlord_party_id = landlordPartyId;
      }
    }

    if (query.property_category) {
      where.property_category = query.property_category;
    }

    if (query.rental_duration_type) {
      where.rental_duration_type = query.rental_duration_type;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.scope_province) {
      where.scope_province = query.scope_province;
    }

    if (query.scope_district) {
      where.scope_district = query.scope_district;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [policies, total] = await Promise.all([
      this.prisma.pricingPolicy.findMany({
        where,
        skip: ((query.page || 1) - 1) * (query.limit || 20),
        take: query.limit || 20,
        orderBy: { created_at: 'desc' },
        include: {
          _count: {
            select: { rentable_items: true },
          },
        },
      }),
      this.prisma.pricingPolicy.count({ where }),
    ]);

    return {
      data: policies,
      meta: {
        total,
        page: query.page || 1,
        limit: query.limit || 20,
        totalPages: Math.ceil(total / (query.limit || 20)),
      },
    };
  }

  async findOne(orgId: string, id: string) {
    const policy = await this.prisma.pricingPolicy.findFirst({
      where: { id, org_id: orgId },
      include: {
        _count: {
          select: { rentable_items: true },
        },
      },
    });

    if (!policy) {
      throw new NotFoundException('Pricing policy not found');
    }

    return policy;
  }

  async update(orgId: string, id: string, userId: string, dto: UpdatePricingPolicyDto) {
    const existing = await this.findOne(orgId, id);

    // Check if there are significant changes
    const hasSignificantChanges = 
      dto.base_price !== undefined ||
      dto.deposit_amount !== undefined ||
      dto.pricing_details !== undefined;

    let newVersion = existing.version;
    if (hasSignificantChanges) {
      newVersion = existing.version + 1;
    }

    // Build update data (only include defined fields)
    const updateData: any = {
      version: newVersion,
      updated_reason: dto.updated_reason,
    };

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.property_category !== undefined) updateData.property_category = dto.property_category;
    if (dto.rental_duration_type !== undefined) updateData.rental_duration_type = dto.rental_duration_type;
    if (dto.scope_province !== undefined) updateData.scope_province = dto.scope_province;
    if (dto.scope_district !== undefined) updateData.scope_district = dto.scope_district;
    if (dto.pricing_mode !== undefined) updateData.pricing_mode = dto.pricing_mode;
    if (dto.base_price !== undefined) updateData.base_price = dto.base_price;
    if (dto.price_unit !== undefined) updateData.price_unit = dto.price_unit;
    if (dto.min_rent_duration !== undefined) updateData.min_rent_duration = dto.min_rent_duration;
    if (dto.deposit_amount !== undefined) updateData.deposit_amount = dto.deposit_amount;
    if (dto.booking_hold_deposit !== undefined) updateData.booking_hold_deposit = dto.booking_hold_deposit;
    if (dto.service_fee !== undefined) updateData.service_fee = dto.service_fee;
    if (dto.building_management_fee !== undefined) updateData.building_management_fee = dto.building_management_fee;
    if (dto.electricity_billing !== undefined) updateData.electricity_billing = dto.electricity_billing;
    if (dto.water_billing !== undefined) updateData.water_billing = dto.water_billing;
    if (dto.pricing_details !== undefined) updateData.pricing_details = dto.pricing_details;
    if (dto.tiered_pricing !== undefined) updateData.tiered_pricing = dto.tiered_pricing;

    // Update policy
    const updated = await this.prisma.pricingPolicy.update({
      where: { id },
      data: updateData,
    });

    // Create version record if significant changes
    if (hasSignificantChanges) {
      await this.prisma.pricingPolicyVersion.create({
        data: {
          policy_id: updated.id,
          version: newVersion,
          policy_snapshot: updated as any,
          changed_by: userId,
          change_reason: dto.updated_reason || 'Policy updated',
          change_type: 'UPDATE',
          changed_fields: this.getChangedFields(existing, dto),
        },
      });

      // Apply to existing items if requested
      if (dto.apply_to_existing_items) {
        await this.applyToExistingItems(orgId, id, updated);
      }
    }

    return updated;
  }

  async delete(orgId: string, id: string) {
    const policy = await this.findOne(orgId, id);

    // Check if policy is in use
    const itemCount = await this.prisma.rentableItem.count({
      where: { pricing_policy_id: id },
    });

    if (itemCount > 0) {
      throw new BadRequestException(
        `Cannot delete policy. It is currently used by ${itemCount} rentable items. Archive it instead.`,
      );
    }

    await this.prisma.pricingPolicy.delete({ where: { id } });

    return { message: 'Pricing policy deleted successfully' };
  }

  async archive(orgId: string, id: string) {
    await this.findOne(orgId, id);

    const archived = await this.prisma.pricingPolicy.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });

    return archived;
  }

  async getVersionHistory(orgId: string, id: string) {
    await this.findOne(orgId, id);

    const versions = await this.prisma.pricingPolicyVersion.findMany({
      where: { policy_id: id },
      orderBy: { version: 'desc' },
    });

    return versions;
  }

  private async applyToExistingItems(orgId: string, policyId: string, policy: any) {
    // Update all items using this policy
    await this.prisma.rentableItem.updateMany({
      where: {
        org_id: orgId,
        pricing_policy_id: policyId,
      },
      data: {
        base_price: policy.base_price,
        price_unit: policy.price_unit,
        min_rent_duration: policy.min_rent_duration,
        deposit_amount: policy.deposit_amount,
        service_fee: policy.service_fee,
        building_mgmt_fee: policy.building_management_fee,
        electricity_billing: policy.electricity_billing,
        water_billing: policy.water_billing,
        pricing_policy_version: policy.version,
        pricing_snapshot_at: new Date(),
      },
    });
  }

  private getChangedFields(existing: any, dto: any): any {
    const changed: any = {};

    Object.keys(dto).forEach(key => {
      if (dto[key] !== undefined && dto[key] !== existing[key]) {
        changed[key] = {
          old: existing[key],
          new: dto[key],
        };
      }
    });

    return changed;
  }
}
