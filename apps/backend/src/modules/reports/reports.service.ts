import { Injectable } from '@nestjs/common';
import { PrismaService } from '../platform/prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getOccupancy(orgId: string, startDate?: string, endDate?: string) {
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();

    // Count total rentable items
    const totalItems = await this.prisma.rentableItem.count({
      where: { org_id: orgId },
    });

    // Count active agreements (using state field instead of status)
    const activeAgreements = await this.prisma.agreement.count({
      where: {
        org_id: orgId,
        state: 'ACTIVE',
        start_at: { lte: end },
        OR: [
          { end_at: { gte: start } },
          { end_at: null },
        ],
      },
    });

    const occupancyRate = totalItems > 0 ? (activeAgreements / totalItems) * 100 : 0;

    return {
      period: {
        start_date: start.toISOString(),
        end_date: end.toISOString(),
      },
      total_rentable_items: totalItems,
      occupied_items: activeAgreements,
      occupancy_rate: Math.round(occupancyRate * 100) / 100,
    };
  }

  async getRevenue(orgId: string, startDate?: string, endDate?: string) {
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();

    // Get all invoices in period
    const invoices = await this.prisma.invoice.findMany({
      where: {
        org_id: orgId,
        created_at: {
          gte: start,
          lte: end,
        },
      },
    });

    const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0);
    const paidInvoices = invoices.filter(inv => inv.status === 'PAID');
    const totalPaid = paidInvoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0);
    const overdueInvoices = invoices.filter(inv => inv.status === 'OVERDUE');
    const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0);

    return {
      period: {
        start_date: start.toISOString(),
        end_date: end.toISOString(),
      },
      total_invoiced: totalInvoiced,
      total_paid: totalPaid,
      total_overdue: totalOverdue,
      invoice_count: invoices.length,
      paid_count: paidInvoices.length,
      overdue_count: overdueInvoices.length,
    };
  }

  async getTicketsSummary(orgId: string) {
    const tickets = await this.prisma.ticket.findMany({
      where: { org_id: orgId },
    });

    const byStatus = tickets.reduce((acc, ticket) => {
      acc[ticket.status] = (acc[ticket.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byPriority = tickets.reduce((acc, ticket) => {
      acc[ticket.priority] = (acc[ticket.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byCategory = tickets.reduce((acc, ticket) => {
      acc[ticket.category] = (acc[ticket.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: tickets.length,
      by_status: byStatus,
      by_priority: byPriority,
      by_category: byCategory,
    };
  }
}
