import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsDateString, IsNumber, IsEnum, Min } from 'class-validator';

export enum TerminationType {
  EARLY = 'EARLY', // Chấm dứt trước hạn
  NATURAL = 'NATURAL', // Hết hạn tự nhiên
  CANCELLED = 'CANCELLED', // Hủy trước khi active
}

export class TerminateAgreementDto {
  @ApiProperty({ description: 'Lý do chấm dứt' })
  @IsString()
  @IsNotEmpty()
  termination_reason: string;

  @ApiProperty({ enum: TerminationType, description: 'Loại chấm dứt' })
  @IsEnum(TerminationType)
  @IsNotEmpty()
  termination_type: TerminationType;

  @ApiPropertyOptional({ description: 'Ngày chấm dứt thực tế', example: '2026-06-15T00:00:00Z' })
  @IsDateString()
  @IsOptional()
  terminated_at?: string;

  @ApiPropertyOptional({ description: 'Phí phạt (VND)', example: 1000000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  termination_penalty?: number;

  @ApiPropertyOptional({ description: 'Số tiền hoàn cọc (VND)', example: 9000000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  deposit_refund_amount?: number;

  @ApiPropertyOptional({ description: 'Ghi chú thêm' })
  @IsString()
  @IsOptional()
  notes?: string;
}
