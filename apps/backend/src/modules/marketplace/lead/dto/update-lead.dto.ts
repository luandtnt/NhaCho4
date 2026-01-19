import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateLeadDto {
  @ApiProperty({ description: 'Lead status', required: false })
  @IsOptional()
  @IsEnum(['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST'])
  status?: string;

  @ApiProperty({ description: 'Message', required: false })
  @IsOptional()
  @IsString()
  message?: string;
}
