import { IsString, IsDateString, IsOptional, IsInt, Min } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  rentable_item_id: string;

  @IsDateString()
  start_at: string;

  @IsDateString()
  @IsOptional()
  end_at?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  quantity?: number;

  @IsString()
  @IsOptional()
  hold_id?: string;
}
