import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAssetDto {
  @ApiProperty({ description: 'Asset type (defined by ConfigBundle)', example: 'apartment_monthly' })
  @IsString()
  @IsNotEmpty()
  asset_type: string;

  @ApiProperty({ description: 'Asset name', example: 'Sunrise Building' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ 
    description: 'Address JSON', 
    example: { street: '123 Main St', city: 'Hanoi', district: 'Ba Dinh' },
    required: false 
  })
  @IsObject()
  @IsOptional()
  address_json?: any;

  @ApiProperty({ description: 'Custom attributes', example: { year_built: 2020 }, required: false })
  @IsObject()
  @IsOptional()
  attrs?: any;
}
