import { IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class IssueInvoiceDto {
  @ApiProperty({
    description: 'Send notification to tenant',
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  send_notification?: boolean;
}
