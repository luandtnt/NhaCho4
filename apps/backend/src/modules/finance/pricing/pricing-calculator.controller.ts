import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus, SetMetadata } from '@nestjs/common';
import { JwtRbacGuard } from '../../../common/guards/jwt-rbac.guard';
import { PricingCalculatorService } from './pricing-calculator.service';
import { PrismaService } from '../../platform/prisma/prisma.service';

class CalculatePriceDto {
  rentable_item_id: string;
  pricing_policy_id: string;
  start_date: string;
  end_date?: string;
  months?: number;
  years?: number;
  guests?: number;
}

@Controller('pricing')
@UseGuards(JwtRbacGuard)
@SetMetadata('roles', ['Landlord', 'Tenant', 'PropertyManager', 'OrgAdmin'])
export class PricingCalculatorController {
  constructor(
    private readonly calculatorService: PricingCalculatorService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('calculate')
  @HttpCode(HttpStatus.OK)
  async calculatePrice(@Body() dto: CalculatePriceDto) {
    // Fetch rentable item
    const rentableItem = await this.prisma.rentableItem.findUnique({
      where: { id: dto.rentable_item_id },
    });

    if (!rentableItem) {
      return {
        error_code: 'NOT_FOUND',
        message: 'Rentable item not found',
      };
    }

    // Fetch pricing policy (stored in config_bundles)
    const pricingPolicy = await this.prisma.configBundle.findFirst({
      where: {
        id: dto.pricing_policy_id,
        config: {
          path: ['type'],
          equals: 'pricing_policy',
        },
      },
    });

    if (!pricingPolicy) {
      return {
        error_code: 'NOT_FOUND',
        message: 'Pricing policy not found',
      };
    }

    const startDate = new Date(dto.start_date);

    // Determine calculation type based on rental duration type
    const durationType = rentableItem.rental_duration_type;

    let result;

    if (durationType === 'SHORT_TERM' && dto.end_date) {
      // Short-term: calculate by nights
      const endDate = new Date(dto.end_date);
      result = this.calculatorService.calculateShortTermPrice({
        rentableItem,
        pricingPolicy,
        startDate,
        endDate,
        guests: dto.guests,
      });
    } else if (durationType === 'MEDIUM_TERM' && dto.months) {
      // Medium-term: calculate by months
      result = this.calculatorService.calculateMediumTermPrice({
        rentableItem,
        pricingPolicy,
        startDate,
        months: dto.months,
      });
    } else if (durationType === 'LONG_TERM' && dto.years) {
      // Long-term: calculate by years
      result = this.calculatorService.calculateLongTermPrice({
        rentableItem,
        pricingPolicy,
        startDate,
        years: dto.years,
      });
    } else {
      // Default: treat as short-term if end_date provided
      if (dto.end_date) {
        const endDate = new Date(dto.end_date);
        result = this.calculatorService.calculateShortTermPrice({
          rentableItem,
          pricingPolicy,
          startDate,
          endDate,
          guests: dto.guests,
        });
      } else {
        return {
          error_code: 'VALIDATION_ERROR',
          message: 'Missing required parameters for price calculation',
        };
      }
    }

    return {
      rentable_item: {
        id: rentableItem.id,
        code: rentableItem.code,
        property_category: rentableItem.property_category,
        rental_duration_type: rentableItem.rental_duration_type,
      },
      pricing_policy: {
        id: pricingPolicy.id,
        name: (pricingPolicy.config as any)?.name,
      },
      calculation: result,
    };
  }
}
