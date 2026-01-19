import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsDateString, IsNumber, Min } from 'class-validator';

export class RenewAgreementDto {
  @ApiProperty({ description: 'Ngày bắt đầu mới', example: '2027-02-01T00:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  new_start_at: string;

  @ApiProperty({ description: 'Ngày kết thúc mới', example: '2028-02-01T00:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  new_end_at: string;

  @ApiPropertyOptional({ description: 'Giá thuê mới (VND/tháng)', example: 5500000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  new_base_price?: number;

  @ApiPropertyOptional({ description: 'Tiền cọc mới (VND)', example: 11000000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  new_deposit_amount?: number;

  @ApiPropertyOptional({ description: 'Phí dịch vụ mới (VND)', example: 550000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  new_service_fee?: number;

  @ApiPropertyOptional({ description: 'Điều khoản mới (JSON)' })
  @IsOptional()
  new_terms_json?: any;

  @ApiPropertyOptional({ description: 'Ghi chú gia hạn' })
  @IsString()
  @IsOptional()
  notes?: string;
}
