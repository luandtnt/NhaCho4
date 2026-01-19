import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSpaceNodeDto {
  @ApiProperty({ description: 'Node name', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Custom attributes', required: false })
  @IsOptional()
  @IsObject()
  attrs?: any;
}
