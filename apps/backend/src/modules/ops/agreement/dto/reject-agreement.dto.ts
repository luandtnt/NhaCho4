import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RejectAgreementDto {
  @ApiProperty({ description: 'Lý do từ chối' })
  @IsString()
  @IsNotEmpty()
  rejection_reason: string;
}
