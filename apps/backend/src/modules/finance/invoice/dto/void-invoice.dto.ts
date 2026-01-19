import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VoidInvoiceDto {
  @ApiProperty({ description: 'Lý do hủy', example: 'Hợp đồng bị hủy', required: false })
  @IsString()
  @IsOptional()
  reason?: string;
}
