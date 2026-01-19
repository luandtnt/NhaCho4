import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface AuditLogData {
  actor_id: string;
  org_id: string | null;
  action: string;
  resource_id: string | null;
  request_id: string;
  metadata: any;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(data: AuditLogData) {
    return this.prisma.auditLog.create({
      data: {
        actor_id: data.actor_id,
        org_id: data.org_id,
        action: data.action,
        resource_id: data.resource_id,
        request_id: data.request_id,
        metadata: data.metadata,
      },
    });
  }

  async query(orgId: string, filters: any = {}) {
    return this.prisma.auditLog.findMany({
      where: {
        org_id: orgId,
        ...filters,
      },
      orderBy: { created_at: 'desc' },
      take: filters.limit || 100,
    });
  }
}
