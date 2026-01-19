import { IsString, IsNotEmpty, IsUUID, IsOptional, IsEnum, IsInt, IsObject, Min, IsNumber, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRentableItemDto {
  @ApiProperty({ description: 'Space node ID' })
  @IsUUID()
  space_node_id: string;

  @ApiProperty({ description: 'Item code', example: 'UNIT-101' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: 'Allocation type', enum: ['exclusive', 'capacity', 'slot'] })
  @IsEnum(['exclusive', 'capacity', 'slot'])
  allocation_type: string;

  @ApiProperty({ description: 'Capacity (for capacity type)', required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @ApiProperty({ description: 'Slot configuration (for slot type)', required: false })
  @IsOptional()
  @IsObject()
  slot_config?: any;

  // NEW: Property classification
  @ApiProperty({ description: 'Property category code', required: false, example: 'HOMESTAY' })
  @IsOptional()
  @IsString()
  property_category?: string;

  @ApiProperty({ description: 'Rental duration type', required: false, enum: ['SHORT_TERM', 'MEDIUM_TERM', 'LONG_TERM'] })
  @IsOptional()
  @IsEnum(['SHORT_TERM', 'MEDIUM_TERM', 'LONG_TERM'])
  rental_duration_type?: string;

  @ApiProperty({ description: 'Minimum rental days', required: false, example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  min_rental_days?: number;

  @ApiProperty({ description: 'Maximum rental days', required: false })
  @IsOptional()
  @IsInt()
  max_rental_days?: number;

  @ApiProperty({ description: 'Pricing unit', required: false, enum: ['PER_NIGHT', 'PER_WEEK', 'PER_MONTH', 'PER_QUARTER', 'PER_YEAR', 'PER_SQM_MONTH'] })
  @IsOptional()
  @IsEnum(['PER_NIGHT', 'PER_WEEK', 'PER_MONTH', 'PER_QUARTER', 'PER_YEAR', 'PER_SQM_MONTH'])
  pricing_unit?: string;

  // NEW: Property details
  @ApiProperty({ description: 'Area in square meters', required: false })
  @IsOptional()
  @IsNumber()
  area_sqm?: number;

  @ApiProperty({ description: 'Number of bedrooms', required: false })
  @IsOptional()
  @IsInt()
  bedrooms?: number;

  @ApiProperty({ description: 'Number of bathrooms', required: false })
  @IsOptional()
  @IsInt()
  bathrooms?: number;

  @ApiProperty({ description: 'Floor number', required: false })
  @IsOptional()
  @IsInt()
  floor_number?: number;

  // NEW: Amenities & Rules
  @ApiProperty({ description: 'Array of amenity codes', required: false, type: [String], example: ['wifi', 'ac', 'kitchen'] })
  @IsOptional()
  @IsArray()
  amenities?: string[];

  @ApiProperty({ description: 'Array of house rules', required: false, type: [String], example: ['no_smoking', 'no_pets'] })
  @IsOptional()
  @IsArray()
  house_rules?: string[];

  // NEW: Booking settings
  @ApiProperty({ description: 'Enable instant booking', required: false, default: false })
  @IsOptional()
  @IsBoolean()
  instant_booking?: boolean;

  @ApiProperty({ description: 'Advance booking days required', required: false, default: 1 })
  @IsOptional()
  @IsInt()
  advance_booking_days?: number;

  @ApiProperty({ description: 'Cancellation policy', required: false, enum: ['FLEXIBLE', 'MODERATE', 'STRICT'], default: 'MODERATE' })
  @IsOptional()
  @IsEnum(['FLEXIBLE', 'MODERATE', 'STRICT'])
  cancellation_policy?: string;

  @ApiProperty({ description: 'Custom attributes', required: false })
  @IsOptional()
  @IsObject()
  attrs?: any;
}
