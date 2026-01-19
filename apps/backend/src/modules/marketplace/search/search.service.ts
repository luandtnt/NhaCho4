import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async searchListings(query: {
    q?: string;
    price_min?: number;
    price_max?: number;
    tags?: string[];
    page?: number;
    page_size?: number;
    sort?: string;
    order?: 'asc' | 'desc';
  }) {
    const {
      q,
      price_min,
      price_max,
      tags,
      page = 1,
      page_size = 20,
      sort = 'created_at',
      order = 'desc',
    } = query;

    const skip = (page - 1) * page_size;
    const where: any = {
      status: 'PUBLISHED', // Only published listings for public search
    };

    // Full-text search on title and description
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    // Tag filtering
    if (tags && tags.length > 0) {
      where.tags = {
        array_contains: tags,
      };
    }

    // Price filtering (using pricing_display.from_amount)
    if (price_min !== undefined || price_max !== undefined) {
      where.AND = where.AND || [];
      if (price_min !== undefined) {
        where.AND.push({
          pricing_display: {
            path: ['from_amount'],
            gte: price_min,
          },
        });
      }
      if (price_max !== undefined) {
        where.AND.push({
          pricing_display: {
            path: ['from_amount'],
            lte: price_max,
          },
        });
      }
    }

    const orderBy: any = {};
    orderBy[sort] = order;

    const [listings, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        skip,
        take: page_size,
        orderBy,
        include: {
          rentable_items: {
            include: {
              rentable_item: true,
            },
          },
        },
      }),
      this.prisma.listing.count({ where }),
    ]);

    return {
      data: listings,
      meta: {
        page,
        page_size,
        total,
        total_pages: Math.ceil(total / page_size),
      },
    };
  }

  async suggest(q: string, limit: number = 10) {
    if (!q || q.length < 2) {
      return { suggestions: [] };
    }

    const listings = await this.prisma.listing.findMany({
      where: {
        status: 'PUBLISHED',
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: limit,
      select: {
        id: true,
        title: true,
        tags: true,
      },
    });

    return {
      suggestions: listings.map((l) => ({
        id: l.id,
        title: l.title,
        tags: l.tags,
      })),
    };
  }

  async geoSearch(query: {
    lat: number;
    lng: number;
    radius_km?: number;
    page?: number;
    page_size?: number;
  }) {
    const { lat, lng, radius_km = 10, page = 1, page_size = 20 } = query;

    // Note: This requires PostGIS extension and geo column on assets table
    // For now, return empty results with a note
    // TODO: Implement PostGIS geo search when PostGIS is enabled

    return {
      data: [],
      meta: {
        page,
        page_size,
        total: 0,
        total_pages: 0,
        note: 'Geo search requires PostGIS extension - not yet implemented',
      },
    };
  }
}
