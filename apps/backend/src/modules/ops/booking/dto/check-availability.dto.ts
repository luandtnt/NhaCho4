import { IsString, IsDateString, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckAvailabilityDto {
  @ApiProperty({ description: 'ID của rentable item' })
  @IsString()
  rentable_item_id: string;

  @ApiProperty({ description: 'Ngày bắt đầu (ISO format)', example: '2024-01-20T14:00:00Z' })
  @IsDateString()
  start_date: string;

  @ApiProperty({ description: 'Ngày kết thúc (ISO format)', example: '2024-01-23T12:00:00Z' })
  @IsDateString()
  end_date: string;

  @ApiProperty({ description: 'Số lượng cần đặt', required: false, default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  quantity?: number;
}

export class AvailabilityResponseDto {
  available: boolean;
  conflicting_bookings?: {
    id: string;
    start_date: string;
    end_date: string;
    status: string;
  }[];
  suggested_dates?: {
    start_date: string;
    end_date: string;
  }[];
  message?: string;
}
