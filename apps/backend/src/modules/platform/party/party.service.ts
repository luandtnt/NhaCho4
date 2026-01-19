import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PartyService {
  constructor(private prisma: PrismaService) {}

  async findAll(orgId: string, type?: string, page: number = 1, pageSize: number = 20) {
    const pageNum = Number(page) || 1;
    const pageSizeNum = Number(pageSize) || 20;
    const skip = (pageNum - 1) * pageSizeNum;

    const where: any = { org_id: orgId };
    if (type) {
      where.party_type = type;
    }

    const [parties, total] = await Promise.all([
      this.prisma.party.findMany({
        where,
        skip,
        take: pageSizeNum,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.party.count({ where }),
    ]);

    return {
      data: parties,
      meta: {
        page: pageNum,
        page_size: pageSizeNum,
        total,
        total_pages: Math.ceil(total / pageSizeNum),
      },
    };
  }
}
