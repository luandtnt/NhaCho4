import { IsString, IsDateString, IsNumber, IsOptional, IsArray, ValidateNested, IsBoolean, Min, Max, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { LineItemDto } from './line-item.dto';

export class CreateInvoiceDto {
  @ApiProperty({
    description: 'Agreement ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  agreement_id: string;

  @ApiProperty({
    description: 'Booking ID (optional, for short-term rentals)',
    required: false,
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsOptional()
  @IsString()
  booking_id?: string;

  @ApiProperty({
    description: 'Period start date',
    example: '2026-01-01',
  })
  @IsDateString()
  period_start: string;

  @ApiProperty({
    description: 'Period end date',
    example: '2026-01-31',
  })
  @IsDateString()
  period_end: string;

  @ApiProperty({
    description: 'Due date (optional, will auto-calculate from agreement if not provided)',
    required: false,
    example: '2026-02-05',
  })
  @IsOptional()
  @IsDateString()
  due_date?: string;

  @ApiProperty({
    description: 'Currency code',
    default: 'VND',
    example: 'VND',
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({
    description: 'Line items',
    type: [LineItemDto],
    example: [
      {
        type: 'RENT',
        description: 'Tiền thuê tháng 1/2026',
        qty: 1,
        unit_price: 5000000,
      },
      {
        type: 'SERVICE_FEE',
        description: 'Phí dịch vụ',
        qty: 1,
        unit_price: 500000,
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineItemDto)
  line_items: LineItemDto[];

  @ApiProperty({
    description: 'Enable tax/VAT calculation',
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  tax_enabled?: boolean;

  @ApiProperty({
    description: 'Tax rate in percentage (e.g., 10 for 10%)',
    default: 0,
    required: false,
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  tax_rate?: number;

  @ApiProperty({
    description: 'Notes',
    required: false,
    example: 'Hóa đơn tháng 1/2026',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description: 'Auto issue invoice (true = ISSUED, false = DRAFT)',
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  auto_issue?: boolean;
}
