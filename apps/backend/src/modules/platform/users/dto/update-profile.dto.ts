import { IsString, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({ required: false, example: 'Nguyễn Văn A' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false, example: '0912345678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false, example: '0987654321' })
  @IsOptional()
  @IsString()
  emergency_contact?: string;

  @ApiProperty({ required: false, example: '001234567890', description: 'Số CCCD/Passport (cho Landlord)' })
  @IsOptional()
  @IsString()
  id_number?: string;
}
