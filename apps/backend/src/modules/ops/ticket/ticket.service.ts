import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { AddCommentDto } from './dto/add-comment.dto';
import { AssignTicketDto } from './dto/assign-ticket.dto';

@Injectable()
export class TicketService {
  constructor(private prisma: PrismaService) {}

  async create(orgId: string, userId: string, dto: CreateTicketDto) {
    const ticket = await this.prisma.ticket.create({
      data: {
        org_id: orgId,
        title: dto.title,
        description: dto.description,
        category: dto.category || 'REQUEST',
        priority: dto.priority || 'MEDIUM',
        status: 'OPEN',
        reporter_id: userId,
        agreement_id: dto.agreement_id,
        asset_id: dto.asset_id,
        space_node_id: dto.space_node_id,
        metadata: {},
      },
    });

    return ticket;
  }

  async findAll(orgId: string, page: number = 1, pageSize: number = 20, status?: string, priority?: string) {
    const pageNum = Number(page) || 1;
    const pageSizeNum = Number(pageSize) || 20;
    const skip = (pageNum - 1) * pageSizeNum;

    const where: any = { org_id: orgId };
    if (status) {
      where.status = status;
    }
    if (priority) {
      where.priority = priority;
    }

    const [tickets, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        skip,
        take: pageSizeNum,
        orderBy: { created_at: 'desc' },
        include: {
          reporter: {
            select: { id: true, email: true },
          },
          assigned_user: {
            select: { id: true, email: true },
          },
        },
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

  async findOne(orgId: string, id: string) {
    const ticket = await this.prisma.ticket.findFirst({
      where: {
        id,
        org_id: orgId,
      },
      include: {
        reporter: {
          select: { id: true, email: true },
        },
        assigned_user: {
          select: { id: true, email: true },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException({
        error_code: 'NOT_FOUND',
        message: 'Ticket not found',
      });
    }

    return {
      ...ticket,
      assigned_to_user_id: ticket.assigned_to, // Add alias for compatibility
    };
  }

  async update(orgId: string, id: string, dto: UpdateTicketDto) {
    const ticket = await this.findOne(orgId, id);

    const updated = await this.prisma.ticket.update({
      where: { id },
      data: {
        title: dto.title ?? ticket.title,
        description: dto.description ?? ticket.description,
        priority: dto.priority ?? ticket.priority,
      },
    });

    return updated;
  }

  async addComment(orgId: string, userId: string, id: string, dto: AddCommentDto) {
    const ticket = await this.findOne(orgId, id);

    // Prevent comments on closed tickets
    if (ticket.status === 'CLOSED') {
      throw new ConflictException({
        error_code: 'INVALID_STATE',
        message: 'Cannot add comment to closed ticket',
      });
    }

    const metadata = ticket.metadata as any || {};
    const comments = metadata.comments || [];
    comments.push({
      user_id: userId,
      comment: dto.comment,
      created_at: new Date().toISOString(),
    });

    const updated = await this.prisma.ticket.update({
      where: { id },
      data: {
        metadata: {
          ...metadata,
          comments,
        },
      },
    });

    return updated;
  }

  async assign(orgId: string, id: string, dto: AssignTicketDto) {
    const ticket = await this.findOne(orgId, id);

    // Support both assigned_to and assigned_to_user_id
    const userId = dto.assigned_to || dto.assigned_to_user_id;

    if (!userId) {
      throw new BadRequestException({
        error_code: 'VALIDATION_ERROR',
        message: 'Either assigned_to or assigned_to_user_id is required',
      });
    }

    // Verify assigned user exists and belongs to org
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        org_id: orgId,
      },
    });

    if (!user) {
      throw new NotFoundException({
        error_code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    const updated = await this.prisma.ticket.update({
      where: { id },
      data: {
        assigned_to: userId,
        status: 'IN_PROGRESS',
      },
    });

    return {
      ...updated,
      assigned_to_user_id: updated.assigned_to, // Add alias for compatibility
    };
  }

  async close(orgId: string, id: string, resolution?: string) {
    const ticket = await this.findOne(orgId, id);

    const metadata = ticket.metadata as any || {};
    const updated = await this.prisma.ticket.update({
      where: { id },
      data: {
        status: 'CLOSED',
        metadata: {
          ...metadata,
          resolution,
          closed_at: new Date().toISOString(),
        },
      },
    });

    return updated;
  }

  async addAttachment(orgId: string, id: string, attachmentUrl: string, fileName: string) {
    const ticket = await this.findOne(orgId, id);

    const metadata = ticket.metadata as any || {};
    const attachments = metadata.attachments || [];
    attachments.push({
      url: attachmentUrl,
      file_name: fileName,
      uploaded_at: new Date().toISOString(),
    });

    const updated = await this.prisma.ticket.update({
      where: { id },
      data: {
        metadata: {
          ...metadata,
          attachments,
        },
      },
    });

    return updated;
  }
}
