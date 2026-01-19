import { IsString, IsDateString, IsOptional } from 'class-validator';

export class CreateHoldDto {
  @IsString()
  rentable_item_id: string;

  @IsDateString()
  start_at: string;

  @IsDateString()
  end_at: string;

  @IsString()
  @IsOptional()
  reason?: string;
}
