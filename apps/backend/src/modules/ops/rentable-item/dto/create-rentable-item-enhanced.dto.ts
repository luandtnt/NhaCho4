/**
 * Enhanced Rentable Item DTOs with Full Validation
 * Supports all 21 property types with type-specific validation
 */

import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  Min,
  Max,
  ValidateNested,
  IsObject,
  Matches,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PriceUnit, Direction, FurnishingLevel, UtilityBilling } from '@prisma/client';
import { PropertyMetadata } from '../interfaces/property-metadata.interface';

// ============================================================================
// Base DTO - Common fields for all property types
// ============================================================================

export class CreateRentableItemBaseDto {
  @IsString()
  space_node_id: string;

  @IsString()
  code: string;

  @IsString()
  @IsEnum(['HOMESTAY', 'GUESTHOUSE', 'HOTEL', 'SERVICED_APARTMENT_SHORT', 'VILLA_RESORT', 
           'AIRBNB_ROOM', 'COLIVING_SHORT', 'PRIVATE_HOUSE', 'ROOM_RENTAL', 'APARTMENT',
           'SERVICED_APARTMENT_MEDIUM', 'WHOLE_HOUSE', 'RETAIL_SPACE_SMALL', 'WAREHOUSE_TEMP',
           'OFFICE', 'LAND_PLOT', 'FACTORY', 'COMMERCIAL_SPACE', 'LUXURY_APARTMENT', 
           'VILLA_LONG', 'SHOPHOUSE'])
  property_category: string;

  @IsString()
  @IsEnum(['SHORT_TERM', 'MEDIUM_TERM', 'LONG_TERM'])
  rental_duration_type: string;

  // Location (optional in draft, required when publishing)
  @IsOptional()
  @IsString()
  address_full?: string;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  ward?: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  geo_lat?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  geo_lng?: number;

  // Pricing
  @IsOptional()
  @IsString()
  pricing_policy_id?: string;

  @IsOptional()
  @IsInt()
  pricing_policy_version?: number;

  @IsNumber()
  @Min(0.01)
  base_price: number;

  @IsEnum(PriceUnit)
  price_unit: PriceUnit;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsInt()
  @Min(1)
  min_rent_duration: number;

  // Physical
  @IsNumber()
  @Min(0.01)
  area_sqm: number;

  @IsEnum(FurnishingLevel)
  furnishing_level: FurnishingLevel;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  // Metadata
  @IsObject()
  metadata: PropertyMetadata;
}


// ============================================================================
// SHORT_TERM DTO
// ============================================================================

export class CreateShortTermPropertyDto extends CreateRentableItemBaseDto {
  @IsEnum(['HOUR', 'NIGHT'])
  price_unit: 'HOUR' | 'NIGHT';

  @IsOptional()
  @IsNumber()
  @Min(0)
  booking_hold_deposit?: number;

  // Booking essentials
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'checkin_time must be in HH:mm format',
  })
  checkin_time: string;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'checkout_time must be in HH:mm format',
  })
  checkout_time: string;

  @IsInt()
  @Min(1)
  max_occupancy: number;

  // Physical (optional for SHORT_TERM)
  @IsOptional()
  @IsInt()
  @Min(0)
  bedrooms?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  bathrooms?: number;
}

// ============================================================================
// MID_TERM DTO
// ============================================================================

export class CreateMidTermPropertyDto extends CreateRentableItemBaseDto {
  @IsEnum(['MONTH'])
  price_unit: 'MONTH';

  @IsNumber()
  @Min(0)
  deposit_amount: number;

  @IsEnum(UtilityBilling)
  electricity_billing: UtilityBilling;

  @IsEnum(UtilityBilling)
  water_billing: UtilityBilling;

  // Physical (common for residential)
  @IsOptional()
  @IsInt()
  @Min(0)
  bedrooms?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  bathrooms?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  floors?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  apartment_floor?: number;

  @IsOptional()
  @IsEnum(Direction)
  direction?: Direction;

  @IsOptional()
  @IsBoolean()
  balcony?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  frontage_m?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  parking_slots?: number;
}

// ============================================================================
// LONG_TERM DTO
// ============================================================================

export class CreateLongTermPropertyDto extends CreateRentableItemBaseDto {
  @IsEnum(['MONTH'])
  price_unit: 'MONTH';

  @IsNumber()
  @Min(0)
  deposit_amount: number;

  @IsEnum(UtilityBilling)
  electricity_billing: UtilityBilling;

  @IsEnum(UtilityBilling)
  water_billing: UtilityBilling;

  // Physical (varies by type)
  @IsOptional()
  @IsInt()
  @Min(0)
  bedrooms?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  bathrooms?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  floors?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  apartment_floor?: number;

  @IsOptional()
  @IsEnum(Direction)
  direction?: Direction;

  @IsOptional()
  @IsBoolean()
  balcony?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  frontage_m?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  parking_slots?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  building_mgmt_fee?: number;
}

// ============================================================================
// Helper function to get appropriate DTO class
// ============================================================================

export function getRentableItemDtoClass(rentalDurationType: string) {
  if (rentalDurationType === 'SHORT_TERM') {
    return CreateShortTermPropertyDto;
  } else if (rentalDurationType === 'MEDIUM_TERM') {
    return CreateMidTermPropertyDto;
  } else {
    return CreateLongTermPropertyDto;
  }
}
