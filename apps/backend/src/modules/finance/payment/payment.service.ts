import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentService {
  constructor(private prisma: PrismaService) {}

  async create(orgId: string, dto: CreatePaymentDto) {
    // Verify invoice exists and belongs to org
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id: dto.invoice_id,
        org_id: orgId,
      },
    });

    if (!invoice) {
      throw new NotFoundException({
        error_code: 'NOT_FOUND',
        message: 'Invoice not found',
      });
    }

    // Reject payment for VOID invoices
    if (invoice.status === 'VOID') {
      throw new ConflictException({
        error_code: 'INVALID_STATE',
        message: 'Cannot create payment for VOID invoice',
      });
    }

    // Check idempotency: if payment with same idempotency_key exists, return it
    const existing = await this.prisma.payment.findFirst({
      where: {
        org_id: orgId,
        invoice_id: dto.invoice_id,
        idempotency_key: dto.idempotency_key,
      },
    });

    if (existing) {
      // Check if amount matches
      if (Number(existing.amount) !== dto.amount) {
        throw new ConflictException({
          error_code: 'IDEMPOTENCY_MISMATCH',
          message: 'Payment with same idempotency_key exists but amount differs',
        });
      }

      return {
        ...existing,
        amount: Number(existing.amount),
        message: 'Payment already exists (idempotency)',
      };
    }

    // Create payment intent
    const payment = await this.prisma.payment.create({
      data: {
        org_id: orgId,
        invoice_id: dto.invoice_id,
        provider: dto.provider,
        amount: BigInt(dto.amount),
        currency: dto.currency || 'VND',
        status: 'PENDING',
        idempotency_key: dto.idempotency_key,
        raw_json: {
          created_at: new Date().toISOString(),
          provider: dto.provider,
        },
      },
    });

    return {
      ...payment,
      amount: Number(payment.amount),
    };
  }

  async findAll(orgId: string, page: number = 1, pageSize: number = 20, status?: string) {
    const pageNum = Number(page) || 1;
    const pageSizeNum = Number(pageSize) || 20;
    const skip = (pageNum - 1) * pageSizeNum;

    const where: any = { org_id: orgId };
    if (status) {
      where.status = status;
    }

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: pageSizeNum,
        orderBy: { created_at: 'desc' },
        include: {
          invoice: true,
        },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      data: payments.map(p => ({
        ...p,
        amount: Number(p.amount),
        invoice: p.invoice ? {
          ...p.invoice,
          total_amount: Number(p.invoice.total_amount),
        } : null,
      })),
      meta: {
        page: pageNum,
        page_size: pageSizeNum,
        total,
        total_pages: Math.ceil(total / pageSizeNum),
      },
    };
  }

  async findOne(orgId: string, id: string) {
    const payment = await this.prisma.payment.findFirst({
      where: {
        id,
        org_id: orgId,
      },
      include: {
        invoice: true,
      },
    });

    if (!payment) {
      throw new NotFoundException({
        error_code: 'NOT_FOUND',
        message: 'Payment not found',
      });
    }

    // Extract refunded_amount from raw_json if exists
    const rawJson = payment.raw_json as any;
    const refundedAmount = rawJson?.refund?.amount || null;

    return {
      ...payment,
      amount: Number(payment.amount),
      refunded_amount: refundedAmount,
      invoice: payment.invoice ? {
        ...payment.invoice,
        total_amount: Number(payment.invoice.total_amount),
      } : null,
    };
  }

  async handleWebhook(provider: string, eventId: string, eventType: string, data: any) {
    // Check replay protection: if event already processed, skip
    const existing = await this.prisma.payment.findFirst({
      where: {
        provider_event_id: eventId,
      },
    });

    if (existing) {
      return {
        message: 'Event already processed (replay protection)',
        payment_id: existing.id,
      };
    }

    // Find payment by provider-specific ID (mock logic)
    const paymentId = data.payment_id;
    if (!paymentId) {
      throw new BadRequestException({
        error_code: 'INVALID_WEBHOOK',
        message: 'Missing payment_id in webhook data',
      });
    }

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { invoice: true },
    });

    if (!payment) {
      throw new NotFoundException({
        error_code: 'NOT_FOUND',
        message: 'Payment not found',
      });
    }

    // Update payment status based on event type
    let newStatus = payment.status;
    if (eventType === 'payment.succeeded') {
      newStatus = 'SUCCEEDED';
    } else if (eventType === 'payment.failed') {
      newStatus = 'FAILED';
    }

    // Update payment with event ID (idempotency)
    const paymentRawJson = payment.raw_json as any;
    const updated = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: newStatus,
        provider_event_id: eventId,
        raw_json: {
          ...paymentRawJson,
          webhook_event: {
            event_id: eventId,
            event_type: eventType,
            received_at: new Date().toISOString(),
          },
        },
      },
    });

    // If succeeded, create ledger entry and update invoice
    if (newStatus === 'SUCCEEDED') {
      await this.prisma.ledgerEntry.create({
        data: {
          org_id: payment.org_id,
          entry_type: 'PAYMENT_SUCCEEDED',
          ref_type: 'Payment',
          ref_id: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          direction: 'credit',
          occurred_at: new Date(),
          metadata: {
            invoice_id: payment.invoice_id,
            provider: payment.provider,
            event_id: eventId,
          },
        },
      });

      // Update invoice status to PAID
      await this.prisma.invoice.update({
        where: { id: payment.invoice_id },
        data: { status: 'PAID' },
      });
    }

    return {
      message: 'Webhook processed successfully',
      payment_id: updated.id,
      status: updated.status,
    };
  }

  async refund(orgId: string, id: string, amount?: number, reason?: string) {
    const payment = await this.findOne(orgId, id);

    if (payment.status !== 'SUCCEEDED') {
      throw new ConflictException({
        error_code: 'INVALID_STATE',
        message: 'Only succeeded payments can be refunded',
      });
    }

    const refundAmount = amount || Number(payment.amount);

    // Update payment status
    const paymentRawJson = payment.raw_json as any;
    const updated = await this.prisma.payment.update({
      where: { id },
      data: {
        status: 'REFUNDED',
        raw_json: {
          ...paymentRawJson,
          refund: {
            amount: refundAmount,
            reason,
            refunded_at: new Date().toISOString(),
          },
        },
      },
    });

    // Create ledger entry for refund
    await this.prisma.ledgerEntry.create({
      data: {
        org_id: orgId,
        entry_type: 'REFUND',
        ref_type: 'Payment',
        ref_id: id,
        amount: BigInt(refundAmount),
        currency: payment.currency,
        direction: 'debit',
        occurred_at: new Date(),
        metadata: {
          invoice_id: payment.invoice_id,
          reason,
        },
      },
    });

    return {
      ...updated,
      amount: Number(updated.amount),
      refunded_amount: refundAmount,
    };
  }
}
