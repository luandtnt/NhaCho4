import { IsOptional, IsString, IsInt, IsEnum, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class QueryRentableItemDto {
  @ApiProperty({ required: false, description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, description: 'Page size', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page_size?: number = 20;

  @ApiProperty({ required: false, description: 'Filter by property category' })
  @IsOptional()
  @IsString()
  property_category?: string;

  @ApiProperty({ required: false, description: 'Filter by rental duration type', enum: ['SHORT_TERM', 'MEDIUM_TERM', 'LONG_TERM'] })
  @IsOptional()
  @IsEnum(['SHORT_TERM', 'MEDIUM_TERM', 'LONG_TERM'])
  rental_duration_type?: string;

  @ApiProperty({ required: false, description: 'Filter by status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ required: false, description: 'Filter by space node ID' })
  @IsOptional()
  @IsString()
  space_node_id?: string;

  @ApiProperty({ required: false, description: 'Filter by asset ID' })
  @IsOptional()
  @IsString()
  asset_id?: string;

  @ApiProperty({ required: false, description: 'Minimum bedrooms' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  min_bedrooms?: number;

  @ApiProperty({ required: false, description: 'Minimum bathrooms' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  min_bathrooms?: number;

  @ApiProperty({ required: false, description: 'Minimum area (sqm)' })
  @IsOptional()
  @Type(() => Number)
  min_area?: number;

  @ApiProperty({ required: false, description: 'Maximum area (sqm)' })
  @IsOptional()
  @Type(() => Number)
  max_area?: number;

  @ApiProperty({ required: false, description: 'Filter by amenities (comma-separated)', example: 'wifi,ac,pool' })
  @IsOptional()
  @IsString()
  amenities?: string;

  @ApiProperty({ required: false, description: 'Instant booking only', type: Boolean })
  @IsOptional()
  instant_booking?: boolean;
}
