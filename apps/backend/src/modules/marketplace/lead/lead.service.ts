import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';

@Injectable()
export class LeadService {
  constructor(private prisma: PrismaService) {}

  async create(orgId: string, dto: CreateLeadDto, userId?: string) {
    // Verify listing exists (can be from any org for public marketplace)
    const listing = await this.prisma.listing.findFirst({
      where: {
        id: dto.listing_id,
        status: 'PUBLISHED', // Only allow inquiries for published listings
      },
    });

    if (!listing) {
      throw new BadRequestException({
        error_code: 'VALIDATION_ERROR',
        message: 'Listing not found or not available',
      });
    }

    const lead = await this.prisma.lead.create({
      data: {
        org_id: listing.org_id, // Use listing's org_id
        listing_id: dto.listing_id,
        name: dto.name,
        email: dto.email,
        phone: dto.phone || null,
        message: dto.message || null,
        status: 'NEW',
        metadata: {
          ...(dto.metadata || {}),
          created_by_user_id: userId, // Track which tenant created this
        },
      },
    });

    return lead;
  }

  async findByTenant(userId: string, page: number = 1, pageSize: number = 20, status?: string) {
    const pageNum = Number(page) || 1;
    const pageSizeNum = Number(pageSize) || 20;
    const skip = (pageNum - 1) * pageSizeNum;
    
    // Find leads created by this tenant
    const where: any = {
      metadata: {
        path: ['created_by_user_id'],
        equals: userId,
      },
    };
    
    if (status) {
      where.status = status;
    }

    const [leads, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        skip,
        take: pageSizeNum,
        orderBy: { created_at: 'desc' },
        include: {
          listing: {
            select: {
              id: true,
              title: true,
              media: true,
              pricing_display: true,
            },
          },
        },
      }),
      this.prisma.lead.count({ where }),
    ]);

    return {
      data: leads,
      pagination: {
        page: pageNum,
        page_size: pageSizeNum,
        total,
        total_pages: Math.ceil(total / pageSizeNum),
      },
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

    const [leads, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        skip,
        take: pageSizeNum,
        orderBy: { created_at: 'desc' },
        include: {
          listing: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      }),
      this.prisma.lead.count({ where }),
    ]);

    return {
      data: leads,
      meta: {
        page: pageNum,
        page_size: pageSizeNum,
        total,
        total_pages: Math.ceil(total / pageSizeNum),
      },
    };
  }

  async findOne(orgId: string, id: string) {
    const lead = await this.prisma.lead.findFirst({
      where: {
        id,
        org_id: orgId,
      },
      include: {
        listing: true,
      },
    });

    if (!lead) {
      throw new NotFoundException({
        error_code: 'NOT_FOUND',
        message: 'Lead not found',
      });
    }

    return lead;
  }

  async update(orgId: string, id: string, dto: UpdateLeadDto) {
    await this.findOne(orgId, id); // Check exists and belongs to org

    const lead = await this.prisma.lead.update({
      where: { id },
      data: {
        status: dto.status,
        message: dto.message,
      },
    });

    return lead;
  }

  async assign(orgId: string, id: string, assignedToUserId: string) {
    await this.findOne(orgId, id);

    // Verify user belongs to org
    const user = await this.prisma.user.findFirst({
      where: {
        id: assignedToUserId,
        org_id: orgId,
      },
    });

    if (!user) {
      throw new BadRequestException({
        error_code: 'VALIDATION_ERROR',
        message: 'User not found or does not belong to your organization',
      });
    }

    // For now, just return success message
    // In a real implementation, we would add assigned_to_user_id field to Lead model
    return {
      message: 'Lead assignment feature requires schema update - not yet implemented',
      lead_id: id,
      assigned_to_user_id: assignedToUserId,
    };
  }

  async convert(orgId: string, id: string) {
    const lead = await this.findOne(orgId, id);

    if (lead.status === 'CONVERTED') {
      throw new BadRequestException({
        error_code: 'VALIDATION_ERROR',
        message: 'Lead is already converted',
      });
    }

    // Update lead status to CONVERTED
    // In a real implementation, this would create a booking or agreement
    const updatedLead = await this.prisma.lead.update({
      where: { id },
      data: {
        status: 'CONVERTED',
      },
    });

    return {
      lead: updatedLead,
      message: 'Lead converted successfully. Booking/agreement creation not yet implemented.',
    };
  }

  async getNotes(orgId: string, leadId: string) {
    await this.findOne(orgId, leadId); // Verify lead exists

    // Get notes from audit logs
    const auditLogs = await this.prisma.auditLog.findMany({
      where: {
        org_id: orgId,
        resource_id: leadId,
        action: 'CREATE',
        metadata: {
          path: ['note_type'],
          equals: 'manual',
        },
      },
      orderBy: { created_at: 'desc' },
      include: {
        actor: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    const notes = auditLogs.map(log => ({
      id: log.id,
      content: (log.metadata as any)?.content || '',
      created_at: log.created_at,
      actor: log.actor?.email || 'System',
      metadata: log.metadata,
    }));

    return { data: notes };
  }

  async addNote(orgId: string, leadId: string, userId: string, content: string) {
    await this.findOne(orgId, leadId); // Verify lead exists

    // Create audit log as note
    const auditLog = await this.prisma.auditLog.create({
      data: {
        org_id: orgId,
        actor_id: userId,
        action: 'CREATE',
        resource_id: leadId,
        request_id: `note_${Date.now()}`,
        metadata: {
          lead_id: leadId,
          note_type: 'manual',
          content: content,
        },
      },
      include: {
        actor: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    return {
      id: auditLog.id,
      content: (auditLog.metadata as any)?.content || content,
      created_at: auditLog.created_at,
      actor: auditLog.actor?.email || 'System',
    };
  }
}
