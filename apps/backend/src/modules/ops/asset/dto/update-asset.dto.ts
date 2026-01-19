import { IsString, IsOptional, IsObject, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAssetDto {
  @ApiProperty({ description: 'Asset name', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Address JSON', required: false })
  @IsOptional()
  @IsObject()
  address_json?: any;

  @ApiProperty({ description: 'Status', enum: ['ACTIVE', 'INACTIVE', 'ARCHIVED'], required: false })
  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE', 'ARCHIVED'])
  status?: string;

  @ApiProperty({ description: 'Custom attributes', required: false })
  @IsOptional()
  @IsObject()
  attrs?: any;
}
