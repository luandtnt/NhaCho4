import { IsString, IsInt, IsOptional, Min, Max, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class QuickCheckinDto {
  @IsString()
  @IsNotEmpty()
  rentable_item_id: string;

  @IsInt()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  guests: number;

  @IsInt()
  @Min(1)
  @Max(720) // Max 30 days in hours
  @Type(() => Number)
  estimated_duration_hours: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class CheckoutDto {
  @IsString()
  @IsNotEmpty()
  booking_id: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class ExtendBookingDto {
  @IsString()
  @IsNotEmpty()
  booking_id: string;

  @IsInt()
  @Min(1)
  @Max(24)
  @Type(() => Number)
  additional_hours: number;
}
