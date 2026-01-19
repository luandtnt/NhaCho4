import { IsString, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty({ description: 'ID hóa đơn', example: 'uuid' })
  @IsString()
  @IsNotEmpty()
  invoice_id: string;

  @ApiProperty({ description: 'Nhà cung cấp thanh toán', example: 'vnpay', enum: ['vnpay', 'momo', 'stripe'] })
  @IsString()
  @IsNotEmpty()
  provider: string;

  @ApiProperty({ description: 'Số tiền', example: 12000000 })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ description: 'Đơn vị tiền tệ', example: 'VND', required: false })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({ description: 'Idempotency key (để tránh duplicate)', example: 'pay_20260105_123456' })
  @IsString()
  @IsNotEmpty()
  idempotency_key: string;
}
