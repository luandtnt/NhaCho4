import { IsOptional, IsString, IsNumber, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum InvoiceState {
  DRAFT = 'DRAFT',
  ISSUED = 'ISSUED',
  PAID = 'PAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

export class InvoiceQueryDto {
  @ApiProperty({
    description: 'Search by invoice_code, tenant name, or phone',
    required: false,
    example: 'INV-202601',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Filter by tenant party ID',
    required: false,
  })
  @IsOptional()
  @IsString()
  tenant_id?: string;

  @ApiProperty({
    description: 'Filter by rentable item ID',
    required: false,
  })
  @IsOptional()
  @IsString()
  item_id?: string;

  @ApiProperty({
    description: 'Filter by agreement ID',
    required: false,
  })
  @IsOptional()
  @IsString()
  agreement_id?: string;

  @ApiProperty({
    description: 'Filter by state',
    enum: InvoiceState,
    required: false,
    example: 'ISSUED',
  })
  @IsOptional()
  @IsEnum(InvoiceState)
  state?: InvoiceState;

  @ApiProperty({
    description: 'Filter by status (legacy)',
    required: false,
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({
    description: 'Filter by month (YYYY-MM)',
    required: false,
    example: '2026-01',
  })
  @IsOptional()
  @IsString()
  month?: string;

  @ApiProperty({
    description: 'Page number',
    default: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiProperty({
    description: 'Page size',
    default: 20,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page_size?: number;
}
