import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum, IsObject, Min, IsInt } from 'class-validator';

export enum PricingMode {
  FIXED = 'FIXED',
  TIERED = 'TIERED',
  DYNAMIC = 'DYNAMIC'
}

export class CreatePricingPolicyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  property_category: string;

  @IsString()
  @IsNotEmpty()
  rental_duration_type: string;

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
  @Min(0)
  base_price: number;

  @IsString()
  @IsNotEmpty()
  price_unit: string;

  @IsInt()
  @Min(1)
  min_rent_duration: number;

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
}
