import { IsEmail, IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InviteUserDto {
  @ApiProperty({ example: 'newuser@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Landlord' })
  @IsString()
  role: string;

  @ApiProperty({ required: false, example: [] })
  @IsOptional()
  @IsArray()
  scopes?: string[];

  @ApiProperty({ required: false, example: [] })
  @IsOptional()
  @IsArray()
  assigned_asset_ids?: string[];
}
