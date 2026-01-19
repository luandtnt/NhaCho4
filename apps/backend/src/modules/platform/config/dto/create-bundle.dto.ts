import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsObject, IsOptional } from 'class-validator';

export class CreateBundleDto {
  @ApiProperty({ example: 'cfg_2026_01_04_001' })
  @IsString()
  bundle_id: string;

  @ApiProperty({ example: '1.0.0' })
  @IsString()
  version: string;

  @ApiProperty({ example: 'DRAFT', required: false })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({
    example: {
      asset_types: {
        apartment_monthly: {
          schema_ref: 'schemas/apartment.json',
        },
      },
    },
  })
  @IsObject()
  config: any;
}
