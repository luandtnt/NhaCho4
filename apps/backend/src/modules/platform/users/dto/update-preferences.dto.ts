import { IsObject, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePreferencesDto {
  @ApiProperty({ 
    required: false,
    example: {
      notifications: {
        email_invoice: true,
        email_payment_reminder: true,
        email_ticket_update: true,
        email_promotions: false,
      },
      language: 'vi',
      timezone: 'Asia/Ho_Chi_Minh',
    }
  })
  @IsOptional()
  @IsObject()
  preferences?: Record<string, any>;
}
