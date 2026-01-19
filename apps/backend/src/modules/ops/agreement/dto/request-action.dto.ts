import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsDateString, IsNumber, IsEnum, Min } from 'class-validator';

export enum RequestType {
  RENEW = 'RENEW',
  TERMINATE = 'TERMINATE',
}

export class RequestActionDto {
  @ApiProperty({ enum: RequestType, description: 'Loại yêu cầu' })
  @IsEnum(RequestType)
  @IsNotEmpty()
  request_type: RequestType;

  @ApiProperty({ description: 'Lý do yêu cầu' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiPropertyOptional({ description: 'Ngày mong muốn (cho terminate)', example: '2026-12-31T00:00:00Z' })
  @IsDateString()
  @IsOptional()
  desired_date?: string;

  @ApiPropertyOptional({ description: 'Thời gian gia hạn mong muốn (tháng)', example: 12 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  desired_extension_months?: number;

  @ApiPropertyOptional({ description: 'Giá mong muốn (VND)', example: 5200000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  desired_price?: number;

  @ApiPropertyOptional({ description: 'Ghi chú thêm' })
  @IsString()
  @IsOptional()
  notes?: string;
}
