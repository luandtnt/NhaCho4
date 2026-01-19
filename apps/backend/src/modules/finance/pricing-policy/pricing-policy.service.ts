import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { CreatePricingPolicyDto } from './dto/create-pricing-policy.dto';
import { UpdatePricingPolicyDto } from './dto/update-pricing-policy.dto';

@Injectable()
export class PricingPolicyService {
  constructor(private prisma: PrismaService) {}

  async create(orgId: string, dto: CreatePricingPolicyDto) {
    // Validate config structure (basic)
    if (!dto.config.base_amount || dto.config.base_amount <= 0) {
      throw new BadRequestException({
        error_code: 'VALIDATION_ERROR',
        message: 'base_amount must be greater than 0',
      });
    }

    // Validate currency
    const validCurrencies = ['VND', 'USD', 'EUR'];
    if (dto.config.currency && !validCurrencies.includes(dto.config.currency)) {
      throw new BadRequestException({
        error_code: 'VALIDATION_ERROR',
        message: 'Invalid currency. Must be one of: VND, USD, EUR',
      });
    }

    // Create pricing policy (stored in config_bundles for now, or separate table)
    // For M4, we'll use a simple JSON approach in config_bundles
    const policy = await this.prisma.configBundle.create({
      data: {
        org_id: orgId,
        bundle_id: `pricing_${Date.now()}`,
        version: '1.0',
        status: 'DRAFT',
        config: {
          type: 'pricing_policy',
          name: dto.name,
          policy_type: dto.policy_type,
          config: dto.config,
          effective_from: dto.effective_from,
          effective_to: dto.effective_to,
        },
      },
    });

    return policy;
  }

  async findAll(orgId: string, page: number = 1, pageSize: number = 20) {
    const pageNum = Number(page) || 1;
    const pageSizeNum = Number(pageSize) || 20;
    const skip = (pageNum - 1) * pageSizeNum;

    const [policies, total] = await Promise.all([
      this.prisma.configBundle.findMany({
        where: {
          org_id: orgId,
          config: {
            path: ['type'],
            equals: 'pricing_policy',
          },
        },
        skip,
        take: pageSizeNum,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.configBundle.count({
        where: {
          org_id: orgId,
          config: {
            path: ['type'],
            equals: 'pricing_policy',
          },
        },
      }),
    ]);

    return {
      data: policies,
      meta: {
        page: pageNum,
        page_size: pageSizeNum,
        total,
        total_pages: Math.ceil(total / pageSizeNum),
      },
    };
  }

  async findOne(orgId: string, id: string) {
    const policy = await this.prisma.configBundle.findFirst({
      where: {
        id,
        org_id: orgId,
        config: {
          path: ['type'],
          equals: 'pricing_policy',
        },
      },
    });

    if (!policy) {
      throw new NotFoundException({
        error_code: 'NOT_FOUND',
        message: 'Pricing policy not found',
      });
    }

    return policy;
  }

  async update(orgId: string, id: string, dto: UpdatePricingPolicyDto) {
    const policy = await this.findOne(orgId, id);

    const currentConfig = policy.config as any;

    const updatedConfig = {
      ...currentConfig,
      ...(dto.name && { name: dto.name }),
      ...(dto.policy_type && { policy_type: dto.policy_type }),
      ...(dto.config && { config: { ...currentConfig.config, ...dto.config } }),
      ...(dto.effective_from && { effective_from: dto.effective_from }),
      ...(dto.effective_to && { effective_to: dto.effective_to }),
    };

    return this.prisma.configBundle.update({
      where: { id },
      data: { config: updatedConfig },
    });
  }

  async activate(orgId: string, id: string) {
    const policy = await this.findOne(orgId, id);

    // Archive all other ACTIVE pricing policies of the same type
    const currentConfig = policy.config as any;
    await this.prisma.configBundle.updateMany({
      where: {
        org_id: orgId,
        config: {
          path: ['type'],
          equals: 'pricing_policy',
        },
        status: 'ACTIVE',
      },
      data: { status: 'ARCHIVED' },
    });

    // Activate this policy
    return this.prisma.configBundle.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });
  }

  async deactivate(orgId: string, id: string) {
    const policy = await this.findOne(orgId, id);

    if (policy.status !== 'ACTIVE') {
      throw new BadRequestException({
        error_code: 'INVALID_STATUS',
        message: 'Only ACTIVE policies can be deactivated',
      });
    }

    // Deactivate to DRAFT
    return this.prisma.configBundle.update({
      where: { id },
      data: { status: 'DRAFT' },
    });
  }

  async archive(orgId: string, id: string) {
    const policy = await this.findOne(orgId, id);

    // Check if policy is being used in any active contracts/listings
    // For now, we'll allow archiving but in production you should check dependencies

    return this.prisma.configBundle.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });
  }

  async remove(orgId: string, id: string) {
    const policy = await this.findOne(orgId, id);

    // Validation: Cannot delete ACTIVE policies
    if (policy.status === 'ACTIVE') {
      throw new BadRequestException({
        error_code: 'INVALID_STATUS',
        message: 'Cannot delete ACTIVE policy. Please deactivate or archive it first.',
      });
    }

    // Check if policy is being used in any rentable items
    const usageCount = await this.checkPolicyUsage(orgId, id);
    if (usageCount > 0) {
      throw new BadRequestException({
        error_code: 'POLICY_IN_USE',
        message: `Cannot delete policy. It is being used in ${usageCount} rentable item(s). Please remove the policy from all items first.`,
        details: {
          usage_count: usageCount,
        },
      });
    }

    // Delete the policy
    await this.prisma.configBundle.delete({
      where: { id },
    });

    return {
      message: 'Pricing policy deleted successfully',
      id,
    };
  }

  /**
   * Check how many rentable items are using this pricing policy
   */
  private async checkPolicyUsage(orgId: string, policyId: string): Promise<number> {
    const count = await this.prisma.rentableItem.count({
      where: {
        org_id: orgId,
        pricing_policy_id: policyId,
        status: {
          not: 'INACTIVE', // Don't count inactive/deleted items
        },
      },
    });

    return count;
  }

  /**
   * Detect conflicts with other pricing policies
   */
  async detectConflicts(orgId: string, policyId: string) {
    const policy = await this.findOne(orgId, policyId);
    const config = policy.config as any;
    const policyType = config.policy_type;
    const rules = config.config || {};
    
    // Find potentially conflicting policies
    const otherPolicies = await this.prisma.configBundle.findMany({
      where: {
        org_id: orgId,
        id: { not: policyId },
        status: { in: ['ACTIVE', 'DRAFT'] },
        config: {
          path: ['type'],
          equals: 'pricing_policy',
        },
      },
    });
    
    const conflicts: any[] = [];
    
    for (const other of otherPolicies) {
      const otherConfig = other.config as any;
      const otherType = otherConfig.policy_type;
      const otherRules = otherConfig.config || {};
      
      // Check for date range overlap (seasonal policies)
      if (policyType === 'SEASONAL' && otherType === 'SEASONAL') {
        if (this.hasDateOverlap(rules, otherRules)) {
          conflicts.push({
            policy_id: other.id,
            policy_name: otherConfig.name,
            conflict_type: 'DATE_OVERLAP',
            severity: 'HIGH',
            description: 'Seasonal date ranges overlap',
          });
        }
      }
      
      // Check for same rentable items
      const sharedItems = await this.getSharedRentableItems(orgId, policyId, other.id);
      if (sharedItems.length > 0) {
        conflicts.push({
          policy_id: other.id,
          policy_name: otherConfig.name,
          conflict_type: 'SHARED_ITEMS',
          severity: 'MEDIUM',
          description: `${sharedItems.length} rentable items use both policies`,
          shared_items: sharedItems.slice(0, 5), // Show first 5
        });
      }
      
      // Check for conflicting promotional periods
      if (policyType === 'PROMOTIONAL' && otherType === 'PROMOTIONAL') {
        if (this.hasPromotionalConflict(config, otherConfig)) {
          conflicts.push({
            policy_id: other.id,
            policy_name: otherConfig.name,
            conflict_type: 'PROMOTIONAL_OVERLAP',
            severity: 'LOW',
            description: 'Multiple promotional policies active',
          });
        }
      }
    }
    
    return {
      has_conflicts: conflicts.length > 0,
      conflict_count: conflicts.length,
      conflicts,
    };
  }

  /**
   * Check if two seasonal policies have overlapping date ranges
   */
  private hasDateOverlap(rules1: any, rules2: any): boolean {
    const months1 = [...(rules1.high_season_months || []), ...(rules1.low_season_months || [])];
    const months2 = [...(rules2.high_season_months || []), ...(rules2.low_season_months || [])];
    
    return months1.some(m => months2.includes(m));
  }

  /**
   * Get rentable items that use both policies
   */
  private async getSharedRentableItems(orgId: string, policyId1: string, policyId2: string): Promise<string[]> {
    // This is a simplified check - in reality, items can only have one policy at a time
    // But we check if items were recently switched between policies
    const items1 = await this.prisma.rentableItem.findMany({
      where: {
        org_id: orgId,
        pricing_policy_id: policyId1,
      },
      select: { id: true, code: true },
    });
    
    const items2 = await this.prisma.rentableItem.findMany({
      where: {
        org_id: orgId,
        pricing_policy_id: policyId2,
      },
      select: { id: true, code: true },
    });
    
    // Check for items that might be affected by both policies
    // (This is a placeholder - real logic would be more complex)
    return [];
  }

  /**
   * Check if two promotional policies conflict
   */
  private hasPromotionalConflict(config1: any, config2: any): boolean {
    const from1 = config1.effective_from ? new Date(config1.effective_from) : null;
    const to1 = config1.effective_to ? new Date(config1.effective_to) : null;
    const from2 = config2.effective_from ? new Date(config2.effective_from) : null;
    const to2 = config2.effective_to ? new Date(config2.effective_to) : null;
    
    if (!from1 || !from2) return false;
    
    // Check if date ranges overlap
    if (to1 && to2) {
      return (from1 <= to2 && to1 >= from2);
    }
    
    return false;
  }
}
