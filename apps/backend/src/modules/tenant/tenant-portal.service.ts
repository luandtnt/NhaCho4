import { Injectable } from '@nestjs/common';
import { PrismaService } from '../platform/prisma/prisma.service';

@Injectable()
export class TenantPortalService {
  constructor(private prisma: PrismaService) {}

  async getAgreements(orgId: string, userId: string, page: number = 1, pageSize: number = 20) {
    const pageNum = Number(page) || 1;
    const pageSizeNum = Number(pageSize) || 20;
    const skip = (pageNum - 1) * pageSizeNum;

    // Find tenant party by email matching user email
    const user = await this.prisma.user.findFirst({
      where: { id: userId, org_id: orgId },
    });

    if (!user) {
      return {
        data: [],
        meta: { page: pageNum, page_size: pageSizeNum, total: 0, total_pages: 0 },
      };
    }

    // Find party with matching email
    const party = await this.prisma.party.findFirst({
      where: {
        org_id: orgId,
        party_type: 'TENANT',
        email: user.email,
      },
    });

    if (!party) {
      return {
        data: [],
        meta: { page: pageNum, page_size: pageSizeNum, total: 0, total_pages: 0 },
      };
    }

    // Get agreements where this party is tenant
    const where: any = {
      org_id: orgId,
      tenant_party_id: party.id,
    };

    const [agreements, total] = await Promise.all([
      this.prisma.agreement.findMany({
        where,
        skip,
        take: pageSizeNum,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.agreement.count({ where }),
    ]);

    return {
      data: agreements,
      meta: {
        page: pageNum,
        page_size: pageSizeNum,
        total,
        total_pages: Math.ceil(total / pageSizeNum),
      },
    };
  }

  async getInvoices(orgId: string, userId: string, page: number = 1, pageSize: number = 20, status?: string) {
    const pageNum = Number(page) || 1;
    const pageSizeNum = Number(pageSize) || 20;
    const skip = (pageNum - 1) * pageSizeNum;

    // Get tenant's agreements first
    const agreementsResult = await this.getAgreements(orgId, userId, 1, 1000);
    const agreementIds = agreementsResult.data.map(a => a.id);

    if (agreementIds.length === 0) {
      return {
        data: [],
        meta: { page: pageNum, page_size: pageSizeNum, total: 0, total_pages: 0 },
      };
    }

    const where: any = {
      org_id: orgId,
      agreement_id: { in: agreementIds },
    };

    if (status) {
      where.status = status;
    }

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip,
        take: pageSizeNum,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      data: invoices.map(inv => ({
        ...inv,
        total_amount: Number(inv.total_amount),
      })),
      meta: {
        page: pageNum,
        page_size: pageSizeNum,
        total,
        total_pages: Math.ceil(total / pageSizeNum),
      },
    };
  }

  async getPayments(orgId: string, userId: string, page: number = 1, pageSize: number = 20) {
    const pageNum = Number(page) || 1;
    const pageSizeNum = Number(pageSize) || 20;
    const skip = (pageNum - 1) * pageSizeNum;

    // Get invoices for this tenant
    const invoicesResult = await this.getInvoices(orgId, userId, 1, 1000);
    const invoiceIds = invoicesResult.data.map(inv => inv.id);

    const where: any = {
      org_id: orgId,
      invoice_id: { in: invoiceIds },
    };

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

  async getTickets(orgId: string, userId: string, page: number = 1, pageSize: number = 20, status?: string) {
    const pageNum = Number(page) || 1;
    const pageSizeNum = Number(pageSize) || 20;
    const skip = (pageNum - 1) * pageSizeNum;

    const where: any = {
      org_id: orgId,
      reporter_id: userId,
    };

    if (status) {
      where.status = status;
    }

    const [tickets, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        skip,
        take: pageSizeNum,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return {
      data: tickets,
      meta: {
        page: pageNum,
        page_size: pageSizeNum,
        total,
        total_pages: Math.ceil(total / pageSizeNum),
      },
    };
  }

  async createPayment(orgId: string, userId: string, body: any) {
    // Verify invoice belongs to tenant
    const invoicesResult = await this.getInvoices(orgId, userId, 1, 1000);
    const invoiceIds = invoicesResult.data.map(inv => inv.id);

    if (!invoiceIds.includes(body.invoice_id)) {
      throw new Error('Invoice not found or not accessible');
    }

    // Check idempotency: if payment with same idempotency_key exists, return it
    if (body.idempotency_key) {
      const existing = await this.prisma.payment.findFirst({
        where: {
          org_id: orgId,
          invoice_id: body.invoice_id,
          idempotency_key: body.idempotency_key,
        },
      });

      if (existing) {
        return {
          ...existing,
          amount: Number(existing.amount),
        };
      }
    }

    // Create payment via payment service
    const payment = await this.prisma.payment.create({
      data: {
        org_id: orgId,
        invoice_id: body.invoice_id,
        provider: body.provider,
        amount: BigInt(body.amount),
        currency: body.currency || 'VND',
        status: 'PENDING',
        idempotency_key: body.idempotency_key,
        raw_json: {
          created_at: new Date().toISOString(),
          provider: body.provider,
        },
      },
    });

    return {
      ...payment,
      amount: Number(payment.amount),
    };
  }
}
