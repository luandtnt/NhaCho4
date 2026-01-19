import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service';

@Injectable()
export class PropertyCategoryService {
  constructor(private prisma: PrismaService) {}

  async findAll(durationType?: string) {
    const where = durationType ? { duration_type: durationType } : {};
    
    const categories = await this.prisma.propertyCategory.findMany({
      where,
      orderBy: { display_order: 'asc' },
    });

    return {
      data: categories,
      total: categories.length,
    };
  }

  async findGroupedByDuration() {
    const categories = await this.prisma.propertyCategory.findMany({
      orderBy: { display_order: 'asc' },
    });

    const grouped = {
      SHORT_TERM: categories.filter(c => c.duration_type === 'SHORT_TERM'),
      MEDIUM_TERM: categories.filter(c => c.duration_type === 'MEDIUM_TERM'),
      LONG_TERM: categories.filter(c => c.duration_type === 'LONG_TERM'),
    };

    return {
      data: grouped,
      total: categories.length,
    };
  }

  async findByCode(code: string) {
    return this.prisma.propertyCategory.findUnique({
      where: { code },
    });
  }
}
