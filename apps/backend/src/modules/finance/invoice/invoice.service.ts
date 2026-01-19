import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { IssueInvoiceDto } from './dto/issue-invoice.dto';
import { InvoiceQueryDto } from './dto/invoice-query.dto';
import { Prisma } from '@prisma/client';
import { PartyHelper } from '../../../common/helpers/party.helper';

@Injectable()
export class InvoiceService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate unique invoice code
   * Format: INV-YYYYMM-XXXX
   */
  private async generateInvoiceCode(orgId: string): Promise<string> {
    const now = new Date();
    const yearMonth = now.toISOString().slice(0, 7).replace('-', ''); // YYYYMM
    
    // Get last invoice code for this org and month
    const lastInvoice = await this.prisma.invoice.findFirst({
      where: {
        org_id: orgId,
        invoice_code: {
          startsWith: `INV-${yearMonth}-`,
        },
      },
      orderBy: {
        invoice_code: 'desc',
      },
    });

    let sequence = 1;
    if (lastInvoice && lastInvoice.invoice_code) {
      const lastSequence = parseInt(lastInvoice.invoice_code.split('-')[2]);
      if (!isNaN(lastSequence)) {
        sequence = lastSequence + 1;
      }
    }

    return `INV-${yearMonth}-${sequence.toString().padStart(4, '0')}`;
  }

  /**
   * Calculate invoice amounts
   */
  private calculateAmounts(lineItems: any[], taxEnabled: boolean, taxRate: number) {
    const subtotal = lineItems.reduce((sum, item) => {
      const amount = (item.unit_price || 0) * (item.qty || 1);
      return sum + amount;
    }, 0);

    const taxAmount = taxEnabled ? Math.round(subtotal * (taxRate / 100)) : 0;
    const total = subtotal + taxAmount;

    return {
      subtotal_amount: BigInt(subtotal),
      tax_amount: BigInt(taxAmount),
      total_amount: BigInt(total),
      balance_due: BigInt(total),
    };
  }

  /**
   * Create invoice
   */
  async create(orgId: string, dto: CreateInvoiceDto) {
    // Verify agreement exists and belongs to org
    const agreement = await this.prisma.agreement.findFirst({
      where: {
        id: dto.agreement_id,
        org_id: orgId,
      },
      include: {
        rentable_item: true,
      },
    });

    if (!agreement) {
      throw new NotFoundException({
        error_code: 'NOT_FOUND',
        message: 'Agreement not found',
      });
    }

    // Get tenant party separately
    const tenantParty = await this.prisma.party.findUnique({
      where: { id: agreement.tenant_party_id },
    });

    // Validate agreement state
    if (agreement.state !== 'ACTIVE') {
      throw new BadRequestException({
        error_code: 'INVALID_STATE',
        message: 'Can only create invoice for ACTIVE agreement',
      });
    }

    // Validate line items
    if (!dto.line_items || dto.line_items.length === 0) {
      throw new BadRequestException({
        error_code: 'VALIDATION_ERROR',
        message: 'At least one line item is required',
      });
    }

    // Calculate amounts
    const amounts = this.calculateAmounts(
      dto.line_items,
      dto.tax_enabled || false,
      dto.tax_rate || 0,
    );

    // Generate invoice code
    const invoiceCode = await this.generateInvoiceCode(orgId);

    // Calculate due date if not provided
    let dueDate: Date | null = null;
    if (dto.due_date) {
      dueDate = new Date(dto.due_date);
    } else if (agreement.payment_due_days) {
      const periodEnd = new Date(dto.period_end);
      dueDate = new Date(periodEnd.getTime() + agreement.payment_due_days * 86400000);
    }

    // Determine initial state
    const initialState = dto.auto_issue ? 'ISSUED' : 'DRAFT';
    const issuedAt = dto.auto_issue ? new Date() : null;

    // Create invoice with line items in transaction
    const invoice = await this.prisma.$transaction(async (tx) => {
      // Create invoice
      const inv = await tx.invoice.create({
        data: {
          org_id: orgId,
          agreement_id: dto.agreement_id,
          tenant_party_id: agreement.tenant_party_id,
          rentable_item_id: agreement.rentable_item_id,
          booking_id: dto.booking_id,
          invoice_code: invoiceCode,
          period_start: new Date(dto.period_start),
          period_end: new Date(dto.period_end),
          issued_at: issuedAt,
          due_at: dueDate,
          currency: dto.currency || 'VND',
          subtotal_amount: amounts.subtotal_amount,
          tax_enabled: dto.tax_enabled || false,
          tax_rate: dto.tax_rate || 0,
          tax_amount: amounts.tax_amount,
          total_amount: amounts.total_amount,
          balance_due: amounts.balance_due,
          state: initialState,
          status: initialState === 'ISSUED' ? 'ISSUED' : 'PENDING', // Legacy field
          notes: dto.notes,
          line_items: JSON.parse(JSON.stringify(dto.line_items)), // Keep for backward compatibility
        },
      });

      // Create line items
      for (const item of dto.line_items) {
        const amount = (item.unit_price || 0) * (item.qty || 1);
        await tx.invoiceLineItem.create({
          data: {
            invoice_id: inv.id,
            type: item.type,
            description: item.description,
            qty: item.qty || 1,
            unit_price: BigInt(item.unit_price),
            amount: BigInt(amount),
            metadata: item.metadata || {},
          },
        });
      }

      // Create ledger entry if issued
      if (initialState === 'ISSUED') {
        await tx.ledgerEntry.create({
          data: {
            org_id: orgId,
            entry_type: 'INVOICE_ISSUED',
            ref_type: 'Invoice',
            ref_id: inv.id,
            amount: amounts.total_amount,
            currency: dto.currency || 'VND',
            direction: 'debit',
            occurred_at: new Date(),
            metadata: {
              agreement_id: dto.agreement_id,
              invoice_code: invoiceCode,
              period_start: dto.period_start,
              period_end: dto.period_end,
            },
          },
        });
      }

      return inv;
    });

    return this.findOne(orgId, invoice.id);
  }

  /**
   * Find all invoices with filters
   */
  async findAll(orgId: string, userId: string, userRole: string, query: InvoiceQueryDto) {
    const page = query.page || 1;
    const pageSize = query.page_size || 20;
    const skip = (page - 1) * pageSize;

    // Build where clause
    const where: Prisma.InvoiceWhereInput = { org_id: orgId };

    // Role-based isolation
    if (userRole === 'Landlord') {
      const landlordPartyId = await PartyHelper.getLandlordPartyId(this.prisma, userId, orgId);
      if (landlordPartyId) {
        where.agreement = {
          landlord_party_id: landlordPartyId,
        };
      }
    } else if (userRole === 'Tenant') {
      const tenantPartyId = await PartyHelper.getTenantPartyId(this.prisma, userId, orgId);
      if (tenantPartyId) {
        where.tenant_party_id = tenantPartyId;
      }
    }

    // Filter by state
    if (query.state) {
      where.state = query.state;
    } else if (query.status) {
      // Legacy status support
      where.status = query.status;
    }

    // Filter by tenant
    if (query.tenant_id) {
      where.tenant_party_id = query.tenant_id;
    }

    // Filter by item
    if (query.item_id) {
      where.rentable_item_id = query.item_id;
    }

    // Filter by agreement
    if (query.agreement_id) {
      where.agreement_id = query.agreement_id;
    }

    // Filter by month
    if (query.month) {
      const [year, month] = query.month.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      where.period_start = {
        gte: startDate,
        lte: endDate,
      };
    }

    // Search by invoice_code, tenant name, or phone
    if (query.search) {
      where.OR = [
        { invoice_code: { contains: query.search, mode: 'insensitive' } },
        {
          tenant_party: {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { phone: { contains: query.search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { created_at: 'desc' },
        include: {
          agreement: {
            select: {
              id: true,
              contract_code: true,
              state: true,
            },
          },
          tenant_party: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
            },
          },
          rentable_item: {
            select: {
              id: true,
              code: true,
              address_full: true,
            },
          },
          payments: {
            select: {
              id: true,
              amount: true,
              status: true,
              created_at: true,
            },
          },
          line_items_table: true,
        },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      data: invoices.map((inv) => this.formatInvoice(inv)),
      meta: {
        page,
        page_size: pageSize,
        total,
        total_pages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Find one invoice
   */
  async findOne(orgId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id,
        org_id: orgId,
      },
      include: {
        agreement: {
          select: {
            id: true,
            contract_code: true,
            state: true,
            start_at: true,
            end_at: true,
            base_price: true,
          },
        },
        tenant_party: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        rentable_item: {
          select: {
            id: true,
            code: true,
            address_full: true,
            property_category: true,
          },
        },
        payments: {
          orderBy: { created_at: 'desc' },
        },
        line_items_table: {
          orderBy: { created_at: 'asc' },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException({
        error_code: 'NOT_FOUND',
        message: 'Invoice not found',
      });
    }

    return this.formatInvoice(invoice);
  }

  /**
   * Update invoice (DRAFT only)
   */
  async update(orgId: string, id: string, dto: UpdateInvoiceDto) {
    const invoice = await this.findOne(orgId, id);

    if (invoice.state !== 'DRAFT') {
      throw new ForbiddenException({
        error_code: 'INVALID_STATE',
        message: 'Can only update DRAFT invoices',
      });
    }

    // Update invoice
    const updateData: any = {};

    if (dto.period_start) {
      updateData.period_start = new Date(dto.period_start);
    }

    if (dto.period_end) {
      updateData.period_end = new Date(dto.period_end);
    }

    if (dto.due_date) {
      updateData.due_at = new Date(dto.due_date);
    }

    if (dto.notes !== undefined) {
      updateData.notes = dto.notes;
    }

    // Update line items if provided
    if (dto.line_items) {
      // Recalculate amounts
      const amounts = this.calculateAmounts(
        dto.line_items,
        invoice.tax_enabled,
        Number(invoice.tax_rate),
      );

      updateData.subtotal_amount = amounts.subtotal_amount;
      updateData.tax_amount = amounts.tax_amount;
      updateData.total_amount = amounts.total_amount;
      updateData.balance_due = amounts.balance_due;
      updateData.line_items = JSON.parse(JSON.stringify(dto.line_items)); // Legacy field

      // Update in transaction
      await this.prisma.$transaction(async (tx) => {
        // Delete old line items
        await tx.invoiceLineItem.deleteMany({
          where: { invoice_id: id },
        });

        // Create new line items
        for (const item of dto.line_items!) {
          const amount = (item.unit_price || 0) * (item.qty || 1);
          await tx.invoiceLineItem.create({
            data: {
              invoice_id: id,
              type: item.type,
              description: item.description,
              qty: item.qty || 1,
              unit_price: BigInt(item.unit_price),
              amount: BigInt(amount),
              metadata: item.metadata || {},
            },
          });
        }

        // Update invoice
        await tx.invoice.update({
          where: { id },
          data: updateData,
        });
      });
    } else {
      // Update invoice only
      await this.prisma.invoice.update({
        where: { id },
        data: updateData,
      });
    }

    return this.findOne(orgId, id);
  }

  /**
   * Issue invoice (DRAFT -> ISSUED)
   */
  async issue(orgId: string, id: string, dto: IssueInvoiceDto) {
    const invoice = await this.findOne(orgId, id);

    if (invoice.state !== 'DRAFT') {
      throw new ConflictException({
        error_code: 'INVALID_STATE',
        message: 'Can only issue DRAFT invoices',
      });
    }

    // Update invoice state
    const updated = await this.prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.update({
        where: { id },
        data: {
          state: 'ISSUED',
          status: 'ISSUED', // Legacy field
          issued_at: new Date(),
        },
      });

      // Create ledger entry
      await tx.ledgerEntry.create({
        data: {
          org_id: orgId,
          entry_type: 'INVOICE_ISSUED',
          ref_type: 'Invoice',
          ref_id: id,
          amount: inv.total_amount,
          currency: inv.currency,
          direction: 'debit',
          occurred_at: new Date(),
          metadata: {
            agreement_id: inv.agreement_id,
            invoice_code: inv.invoice_code,
          },
        },
      });

      return inv;
    });

    // TODO: Send notification if dto.send_notification === true

    return this.findOne(orgId, id);
  }

  /**
   * Void/Cancel invoice
   */
  async void(orgId: string, id: string, reason?: string) {
    const invoice = await this.findOne(orgId, id);

    if (invoice.state === 'CANCELLED') {
      throw new ConflictException({
        error_code: 'INVALID_STATE',
        message: 'Invoice is already cancelled',
      });
    }

    if (invoice.state === 'PAID') {
      throw new ConflictException({
        error_code: 'INVALID_STATE',
        message: 'Cannot cancel a paid invoice',
      });
    }

    // Check if has payments
    if (invoice.payments && invoice.payments.length > 0) {
      const successfulPayments = invoice.payments.filter((p: any) => p.status === 'SUCCEEDED');
      if (successfulPayments.length > 0) {
        throw new ConflictException({
          error_code: 'HAS_PAYMENTS',
          message: 'Cannot cancel invoice with successful payments',
        });
      }
    }

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: {
        state: 'CANCELLED',
        status: 'VOID', // Legacy field
        notes: reason ? `${invoice.notes || ''}\n\nCancelled: ${reason}` : invoice.notes,
      },
    });

    return this.formatInvoice(updated);
  }

  /**
   * Mark invoice as overdue
   */
  async markOverdue(orgId: string, id: string) {
    const invoice = await this.findOne(orgId, id);

    if (invoice.state !== 'ISSUED') {
      throw new ConflictException({
        error_code: 'INVALID_STATE',
        message: 'Only ISSUED invoices can be marked overdue',
      });
    }

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: {
        state: 'OVERDUE',
        status: 'OVERDUE', // Legacy field
      },
    });

    return this.formatInvoice(updated);
  }

  /**
   * Format invoice for response
   */
  private formatInvoice(invoice: any) {
    return {
      ...invoice,
      subtotal_amount: invoice.subtotal_amount ? Number(invoice.subtotal_amount) : 0,
      tax_amount: invoice.tax_amount ? Number(invoice.tax_amount) : 0,
      total_amount: invoice.total_amount ? Number(invoice.total_amount) : 0,
      balance_due: invoice.balance_due ? Number(invoice.balance_due) : 0,
      payments: invoice.payments?.map((p: any) => ({
        ...p,
        amount: Number(p.amount),
      })),
      line_items_table: invoice.line_items_table?.map((item: any) => ({
        ...item,
        qty: Number(item.qty),
        unit_price: Number(item.unit_price),
        amount: Number(item.amount),
      })),
    };
  }
}
