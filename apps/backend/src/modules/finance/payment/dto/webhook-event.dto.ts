import { IsString, IsNotEmpty, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class WebhookEventDto {
  @ApiProperty({ description: 'Provider event ID', example: 'evt_123456' })
  @IsString()
  @IsNotEmpty()
  event_id: string;

  @ApiProperty({ description: 'Event type', example: 'payment.succeeded' })
  @IsString()
  @IsNotEmpty()
  event_type: string;

  @ApiProperty({ description: 'Event data', example: { payment_id: 'uuid', status: 'succeeded' } })
  @IsObject()
  data: any;
}
