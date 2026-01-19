import { IsString, IsDateString, IsOptional, IsBoolean, IsObject, ValidateNested, IsEmail, Matches } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { GuestInfoDto } from './calculate-price.dto';

export class ContactInfoDto {
  @ApiProperty({ description: 'Họ và tên', example: 'Nguyễn Văn A' })
  @IsString()
  full_name: string;

  @ApiProperty({ description: 'Số điện thoại', example: '0912345678' })
  @IsString()
  @Matches(/^(0[0-9]{9}|\+84[0-9]{9})$/, {
    message: 'Số điện thoại không đúng định dạng Việt Nam',
  })
  phone: string;

  @ApiProperty({ description: 'Email', required: false, example: 'user@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ description: 'Yêu cầu đặc biệt', required: false })
  @IsString()
  @IsOptional()
  special_requests?: string;
}

export class PricingInfoDto {
  @ApiProperty({ description: 'Tổng tiền' })
  @IsOptional()
  total?: number;

  @ApiProperty({ description: 'Chi tiết giá' })
  @IsObject()
  @IsOptional()
  breakdown?: any;
}

export class CreateBookingEnhancedDto {
  @ApiProperty({ description: 'ID của rentable item' })
  @IsString()
  rentable_item_id: string;

  @ApiProperty({ description: 'ID của listing', required: false })
  @IsString()
  @IsOptional()
  listing_id?: string;

  @ApiProperty({ description: 'Ngày bắt đầu (ISO format)' })
  @IsDateString()
  start_date: string;

  @ApiProperty({ description: 'Ngày kết thúc (ISO format)' })
  @IsDateString()
  end_date: string;

  @ApiProperty({ description: 'Thông tin khách', type: GuestInfoDto })
  @ValidateNested()
  @Type(() => GuestInfoDto)
  guests: GuestInfoDto;

  @ApiProperty({ description: 'Thông tin liên hệ', type: ContactInfoDto })
  @ValidateNested()
  @Type(() => ContactInfoDto)
  contact: ContactInfoDto;

  @ApiProperty({ description: 'Thông tin giá', type: PricingInfoDto })
  @ValidateNested()
  @Type(() => PricingInfoDto)
  pricing: PricingInfoDto;

  @ApiProperty({ description: 'Đã đồng ý chính sách' })
  @IsBoolean()
  policies_accepted: boolean;

  @ApiProperty({ description: 'Mã voucher', required: false })
  @IsString()
  @IsOptional()
  voucher_code?: string;
}
