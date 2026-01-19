import { IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateIntegrationDto {
  @ApiProperty({ example: { api_key: 'sk_test_...', enabled: true } })
  @IsObject()
  config: Record<string, any>;
}
