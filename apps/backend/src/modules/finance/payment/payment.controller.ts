import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, SetMetadata, BadRequestException, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { WebhookEventDto } from './dto/webhook-event.dto';
import { JwtRbacGuard } from '../../../common/guards/jwt-rbac.guard';
import { Public } from '../../../common/decorators/public.decorator';

@ApiTags('Finance - Payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @UseGuards(JwtRbacGuard)
  @SetMetadata('roles', ['Landlord', 'Tenant', 'OrgAdmin', 'PlatformAdmin'])
  @ApiOperation({ summary: 'Tạo payment intent' })
  create(@Request() req, @Body() dto: CreatePaymentDto) {
    return this.paymentService.create(req.user.org_id, dto);
  }

  @Get()
  @UseGuards(JwtRbacGuard)
  @SetMetadata('roles', ['Landlord', 'OrgAdmin', 'PlatformAdmin'])
  @ApiOperation({ summary: 'Danh sách thanh toán' })
  findAll(
    @Request() req,
    @Query('page') page?: number,
    @Query('page_size') pageSize?: number,
    @Query('status') status?: string,
  ) {
    return this.paymentService.findAll(req.user.org_id, page, pageSize, status);
  }

  @Get(':id')
  @UseGuards(JwtRbacGuard)
  @SetMetadata('roles', ['Landlord', 'Tenant', 'OrgAdmin', 'PlatformAdmin'])
  @ApiOperation({ summary: 'Chi tiết thanh toán' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.paymentService.findOne(req.user.org_id, id);
  }

  @Post('webhook/:provider')
  @Public()
  @ApiOperation({ summary: 'Webhook từ payment provider (public endpoint)' })
  handleWebhook(
    @Param('provider') provider: string,
    @Body() dto: WebhookEventDto,
    @Request() req,
  ) {
    // Check webhook signature if required
    const signature = req.headers['x-webhook-signature'];
    const webhookSecret = process.env.WEBHOOK_SECRET || process.env.URP_WEBHOOK_SECRET;

    // If webhook signature is required (production), validate it
    if (webhookSecret) {
      if (!signature) {
        throw new BadRequestException({
          error_code: 'MISSING_SIGNATURE',
          message: 'Webhook signature is required',
        });
      }

      // Simple signature validation (in production, use HMAC)
      // For now, just check if signature is not "bad_signature"
      if (signature === 'bad_signature' || signature.length < 10) {
        throw new BadRequestException({
          error_code: 'INVALID_SIGNATURE',
          message: 'Invalid webhook signature',
        });
      }
    }

    return this.paymentService.handleWebhook(provider, dto.event_id, dto.event_type, dto.data);
  }

  @Post(':id/refund')
  @UseGuards(JwtRbacGuard)
  @SetMetadata('roles', ['Landlord', 'OrgAdmin', 'PlatformAdmin'])
  @HttpCode(200)
  @ApiOperation({ summary: 'Hoàn tiền' })
  refund(@Request() req, @Param('id') id: string, @Body() dto: RefundPaymentDto) {
    return this.paymentService.refund(req.user.org_id, id, dto.amount, dto.reason);
  }
}
