import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TestIntegrationDto {
  @ApiProperty({ example: 'email' })
  @IsString()
  type: string; // 'webhook', 'email', 'sms'

  @ApiProperty({ required: false, example: 'test@example.com' })
  @IsOptional()
  @IsString()
  target?: string;
}
