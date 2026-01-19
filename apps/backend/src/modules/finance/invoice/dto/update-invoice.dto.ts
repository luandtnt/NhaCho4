import { IsDateString, IsOptional, IsArray, ValidateNested, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { LineItemDto } from './line-item.dto';

export class UpdateInvoiceDto {
  @ApiProperty({
    description: 'Period start date',
    required: false,
    example: '2026-01-01',
  })
  @IsOptional()
  @IsDateString()
  period_start?: string;

  @ApiProperty({
    description: 'Period end date',
    required: false,
    example: '2026-01-31',
  })
  @IsOptional()
  @IsDateString()
  period_end?: string;

  @ApiProperty({
    description: 'Due date',
    required: false,
    example: '2026-02-05',
  })
  @IsOptional()
  @IsDateString()
  due_date?: string;

  @ApiProperty({
    description: 'Line items',
    type: [LineItemDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineItemDto)
  line_items?: LineItemDto[];

  @ApiProperty({
    description: 'Notes',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
