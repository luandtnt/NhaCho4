import { IsString, IsDateString, IsInt, Min, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class GuestInfoDto {
  @ApiProperty({ description: 'Số người lớn', example: 2 })
  @IsInt()
  @Min(1)
  adults: number;

  @ApiProperty({ description: 'Số trẻ em', required: false, example: 1 })
  @IsInt()
  @Min(0)
  @IsOptional()
  children?: number;

  @ApiProperty({ description: 'Số em bé', required: false, example: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  infants?: number;
}

export class CalculatePriceDto {
  @ApiProperty({ description: 'ID của rentable item' })
  @IsString()
  rentable_item_id: string;

  @ApiProperty({ description: 'Ngày bắt đầu (ISO format)', example: '2024-01-20T14:00:00Z' })
  @IsDateString()
  start_date: string;

  @ApiProperty({ description: 'Ngày kết thúc (ISO format)', example: '2024-01-23T12:00:00Z' })
  @IsDateString()
  end_date: string;

  @ApiProperty({ description: 'Thông tin khách', type: GuestInfoDto })
  @ValidateNested()
  @Type(() => GuestInfoDto)
  guests: GuestInfoDto;

  @ApiProperty({ description: 'Mã voucher', required: false })
  @IsString()
  @IsOptional()
  voucher_code?: string;
}

export class PriceBreakdownItemDto {
  label: string;
  amount: number;
  description?: string;
}

export class PriceCalculationResponseDto {
  base_price: number;
  nights: number;
  hours?: number;
  subtotal: number;
  fees: {
    cleaning_fee?: number;
    extra_guest_fee?: number;
    weekend_surcharge?: number;
    service_fee?: number;
    internet_fee?: number;
  };
  discounts: {
    voucher?: number;
    long_stay?: number;
  };
  booking_hold_deposit?: number;
  total: number;
  breakdown: PriceBreakdownItemDto[];
}
