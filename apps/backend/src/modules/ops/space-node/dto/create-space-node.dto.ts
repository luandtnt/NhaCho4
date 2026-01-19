import { IsString, IsNotEmpty, IsOptional, IsUUID, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSpaceNodeDto {
  @ApiProperty({ description: 'Asset ID' })
  @IsUUID()
  asset_id: string;

  @ApiProperty({ description: 'Parent node ID (null for root)', required: false })
  @IsOptional()
  @IsUUID()
  parent_id?: string;

  @ApiProperty({ description: 'Node type', example: 'building' })
  @IsString()
  @IsNotEmpty()
  node_type: string;

  @ApiProperty({ description: 'Node name', example: 'Building A' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Custom attributes', required: false })
  @IsOptional()
  @IsObject()
  attrs?: any;
}
