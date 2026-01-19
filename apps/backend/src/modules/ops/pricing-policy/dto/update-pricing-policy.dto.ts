import { IsString, IsOptional, IsBoolean, IsNumber, IsInt, IsEnum, IsObject, Min } from 'class-validator';
import { PricingMode } from './create-pricing-policy.dto';

export class UpdatePricingPolicyDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  property_category?: string;

  @IsString()
  @IsOptional()
  rental_duration_type?: string;

  @IsString()
  @IsOptional()
  scope_province?: string;

  @IsString()
  @IsOptional()
  scope_district?: string;

  @IsEnum(PricingMode)
  @IsOptional()
  pricing_mode?: PricingMode;

  @IsNumber()
  @IsOptional()
  @Min(0)
  base_price?: number;

  @IsString()
  @IsOptional()
  price_unit?: string;

  @IsInt()
  @IsOptional()
  @Min(1)
  min_rent_duration?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  deposit_amount?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  booking_hold_deposit?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  service_fee?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  building_management_fee?: number;

  @IsString()
  @IsOptional()
  electricity_billing?: string;

  @IsString()
  @IsOptional()
  water_billing?: string;

  @IsObject()
  @IsOptional()
  pricing_details?: any;

  @IsObject()
  @IsOptional()
  tiered_pricing?: any;

  @IsString()
  @IsOptional()
  updated_reason?: string;

  @IsBoolean()
  @IsOptional()
  apply_to_existing_items?: boolean;
}
