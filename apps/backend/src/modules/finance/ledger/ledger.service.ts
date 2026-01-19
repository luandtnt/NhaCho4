import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service';

@Injectable()
export class LedgerService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    orgId: string,
    page: number = 1,
    pageSize: number = 50,
    entryType?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const pageNum = Number(page) || 1;
    const pageSizeNum = Number(pageSize) || 50;
    const skip = (pageNum - 1) * pageSizeNum;

    const where: any = { org_id: orgId };

    if (entryType) {
      where.entry_type = entryType;
    }

    if (startDate || endDate) {
      where.occurred_at = {};
      if (startDate) {
        where.occurred_at.gte = new Date(startDate);
      }
      if (endDate) {
        where.occurred_at.lte = new Date(endDate);
      }
    }

    const [entries, total] = await Promise.all([
      this.prisma.ledgerEntry.findMany({
        where,
        skip,
        take: pageSizeNum,
        orderBy: { occurred_at: 'desc' },
      }),
      this.prisma.ledgerEntry.count({ where }),
    ]);

    return {
      data: entries.map(e => ({
        ...e,
        amount: Number(e.amount),
      })),
      meta: {
        page: pageNum,
        page_size: pageSizeNum,
        total,
        total_pages: Math.ceil(total / pageSizeNum),
      },
    };
  }

  async export(
    orgId: string,
    format: string = 'json',
    startDate?: string,
    endDate?: string,
  ) {
    const where: any = { org_id: orgId };

    if (startDate || endDate) {
      where.occurred_at = {};
      if (startDate) {
        where.occurred_at.gte = new Date(startDate);
      }
      if (endDate) {
        where.occurred_at.lte = new Date(endDate);
      }
    }

    const entries = await this.prisma.ledgerEntry.findMany({
      where,
      orderBy: { occurred_at: 'asc' },
    });

    const data = entries.map(e => ({
      ...e,
      amount: Number(e.amount),
    }));

    if (format === 'csv') {
      // Simple CSV conversion
      const headers = ['id', 'entry_type', 'ref_type', 'ref_id', 'amount', 'currency', 'direction', 'occurred_at'];
      const rows = data.map(e => 
        headers.map(h => JSON.stringify(e[h] || '')).join(',')
      );
      return {
        format: 'csv',
        content: [headers.join(','), ...rows].join('\n'),
      };
    }

    return {
      format: 'json',
      content: data,
    };
  }

  async reconcile(orgId: string, startDate: string, endDate: string) {
    const entries = await this.prisma.ledgerEntry.findMany({
      where: {
        org_id: orgId,
        occurred_at: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      orderBy: { occurred_at: 'asc' },
    });

    let totalDebit = BigInt(0);
    let totalCredit = BigInt(0);

    for (const entry of entries) {
      if (entry.direction === 'debit') {
        totalDebit += entry.amount;
      } else if (entry.direction === 'credit') {
        totalCredit += entry.amount;
      }
    }

    const balance = totalCredit - totalDebit;

    return {
      period: {
        start: startDate,
        end: endDate,
      },
      summary: {
        total_entries: entries.length,
        total_debit: Number(totalDebit),
        total_credit: Number(totalCredit),
        balance: Number(balance),
      },
      entries: entries.map(e => ({
        ...e,
        amount: Number(e.amount),
      })),
    };
  }

  // Enforce append-only: no update/delete methods exposed
  async attemptUpdate() {
    throw new ForbiddenException({
      error_code: 'FORBIDDEN',
      message: 'Ledger entries are append-only and cannot be updated',
    });
  }

  async attemptDelete() {
    throw new ForbiddenException({
      error_code: 'FORBIDDEN',
      message: 'Ledger entries are append-only and cannot be deleted',
    });
  }
}
