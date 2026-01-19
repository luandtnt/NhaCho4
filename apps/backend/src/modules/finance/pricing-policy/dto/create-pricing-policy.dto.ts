import { IsString, IsNotEmpty, IsObject, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePricingPolicyDto {
  @ApiProperty({ description: 'Tên chính sách giá', example: 'Giá thuê căn hộ 2PN - Q1' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Loại chính sách', example: 'monthly_rent' })
  @IsString()
  @IsNotEmpty()
  policy_type: string;

  @ApiProperty({ 
    description: 'Cấu hình giá (config-driven)', 
    example: { 
      base_amount: 12000000, 
      currency: 'VND', 
      unit: 'month',
      proration_rule: 'daily',
      late_fee_percent: 5,
      seasonal_overrides: []
    } 
  })
  @IsObject()
  config: any;

  @ApiProperty({ description: 'Ngày bắt đầu hiệu lực', example: '2026-01-01', required: false })
  @IsDateString()
  @IsOptional()
  effective_from?: string;

  @ApiProperty({ description: 'Ngày kết thúc hiệu lực', example: '2026-12-31', required: false })
  @IsDateString()
  @IsOptional()
  effective_to?: string;
}
