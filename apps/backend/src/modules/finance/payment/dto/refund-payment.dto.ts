import { IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefundPaymentDto {
  @ApiProperty({ description: 'Số tiền hoàn (nếu không có sẽ hoàn toàn bộ)', example: 5000000, required: false })
  @IsNumber()
  @Min(1)
  @IsOptional()
  amount?: number;

  @ApiProperty({ description: 'Lý do hoàn tiền', example: 'Khách hàng yêu cầu', required: false })
  @IsString()
  @IsOptional()
  reason?: string;
}
