import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service';

@Injectable()
export class AmenityService {
  constructor(private prisma: PrismaService) {}

  async findAll(category?: string, propertyType?: string) {
    let amenities = await this.prisma.amenity.findMany({
      orderBy: { display_order: 'asc' },
    });

    // Filter by category
    if (category) {
      amenities = amenities.filter(a => a.category === category);
    }

    // Filter by property type (check if property type is in applicable_to array)
    if (propertyType) {
      amenities = amenities.filter(a => {
        const applicableTo = a.applicable_to as any;
        if (Array.isArray(applicableTo)) {
          return applicableTo.includes(propertyType);
        }
        return false;
      });
    }

    return {
      data: amenities,
      total: amenities.length,
    };
  }

  async findGroupedByCategory() {
    const amenities = await this.prisma.amenity.findMany({
      orderBy: { display_order: 'asc' },
    });

    const grouped: Record<string, any[]> = {};
    
    amenities.forEach(amenity => {
      const cat = amenity.category || 'OTHER';
      if (!grouped[cat]) {
        grouped[cat] = [];
      }
      grouped[cat].push(amenity);
    });

    return {
      data: grouped,
      total: amenities.length,
    };
  }

  async findByCodes(codes: string[]) {
    return this.prisma.amenity.findMany({
      where: {
        code: { in: codes },
      },
    });
  }
}
