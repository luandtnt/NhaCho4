import { IsString, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum LineItemType {
  RENT = 'RENT',
  SERVICE_FEE = 'SERVICE_FEE',
  MGMT_FEE = 'MGMT_FEE',
  ELECTRICITY = 'ELECTRICITY',
  WATER = 'WATER',
  PARKING = 'PARKING',
  INTERNET = 'INTERNET',
  OTHER = 'OTHER',
}

export class LineItemDto {
  @ApiProperty({
    enum: LineItemType,
    description: 'Type of line item',
    example: 'RENT',
  })
  @IsEnum(LineItemType)
  type: LineItemType;

  @ApiProperty({
    description: 'Description of the line item',
    example: 'Tiền thuê tháng 1/2026',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Quantity',
    example: 1,
    default: 1,
  })
  @IsNumber()
  @Min(0)
  qty: number;

  @ApiProperty({
    description: 'Unit price in smallest currency unit (e.g., cents for USD, đồng for VND)',
    example: 5000000,
  })
  @IsNumber()
  @Min(0)
  unit_price: number;

  @ApiProperty({
    description: 'Additional metadata',
    required: false,
    example: { unit_type: 'month', meter_reading: { start: 100, end: 150 } },
  })
  @IsOptional()
  metadata?: any;
}
