import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';

@Injectable()
export class ListingService {
  constructor(private prisma: PrismaService) {}

  async create(orgId: string, dto: CreateListingDto) {
    // Validate pricing
    if (dto.pricing_display && dto.pricing_display.from_amount !== undefined) {
      if (dto.pricing_display.from_amount <= 0) {
        throw new BadRequestException({
          error_code: 'VALIDATION_ERROR',
          message: 'Price must be greater than 0',
        });
      }
    }

    // Validate media types
    if (dto.media && dto.media.length > 0) {
      const validTypes = ['image', 'video'];
      for (const item of dto.media) {
        if (item.type && !validTypes.includes(item.type)) {
          throw new BadRequestException({
            error_code: 'VALIDATION_ERROR',
            message: 'Media type must be "image" or "video"',
          });
        }
      }
    }

    // Verify rentable items belong to org (if provided)
    if (dto.rentable_item_ids && dto.rentable_item_ids.length > 0) {
      const items = await this.prisma.rentableItem.findMany({
        where: {
          id: { in: dto.rentable_item_ids },
          org_id: orgId,
        },
      });

      if (items.length !== dto.rentable_item_ids.length) {
        throw new BadRequestException({
          error_code: 'VALIDATION_ERROR',
          message: 'Some rentable items not found or do not belong to your organization',
        });
      }
    }

    // Create listing
    const listing = await this.prisma.listing.create({
      data: {
        org_id: orgId,
        title: dto.title,
        description: dto.description || null,
        media: dto.media || [],
        tags: dto.tags || [],
        pricing_display: dto.pricing_display || {},
        status: 'DRAFT',
        ...(dto.rentable_item_ids && dto.rentable_item_ids.length > 0 && {
          rentable_items: {
            create: dto.rentable_item_ids.map((itemId) => ({
              rentable_item: {
                connect: { id: itemId },
              },
            })),
          },
        }),
      },
      include: {
        rentable_items: {
          include: {
            rentable_item: true,
          },
        },
      },
    });

    return listing;
  }

  async findAll(orgId: string, page: number = 1, pageSize: number = 20, status?: string) {
    const pageNum = Number(page) || 1;
    const pageSizeNum = Number(pageSize) || 20;
    const skip = (pageNum - 1) * pageSizeNum;
    const where: any = { 
      org_id: orgId,
      status: { not: 'ARCHIVED' } // Filter out soft-deleted listings by default
    };
    
    if (status) {
      where.status = status;
    }

    const [listings, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        skip,
        take: pageSizeNum,
        orderBy: { created_at: 'desc' },
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
        page: pageNum,
        page_size: pageSizeNum,
        total,
        total_pages: Math.ceil(total / pageSizeNum),
      },
    };
  }

  async findOne(orgId: string, id: string) {
    const listing = await this.prisma.listing.findFirst({
      where: {
        id,
        org_id: orgId,
      },
      include: {
        rentable_items: {
          include: {
            rentable_item: true,
          },
        },
      },
    });

    if (!listing) {
      throw new NotFoundException({
        error_code: 'NOT_FOUND',
        message: 'Listing not found',
      });
    }

    return listing;
  }

  async update(orgId: string, id: string, dto: UpdateListingDto) {
    await this.findOne(orgId, id); // Check exists and belongs to org

    // Validate pricing if provided
    if (dto.pricing_display && dto.pricing_display.from_amount !== undefined) {
      if (dto.pricing_display.from_amount <= 0) {
        throw new BadRequestException({
          error_code: 'VALIDATION_ERROR',
          message: 'Price must be greater than 0',
        });
      }
    }

    // Validate media types if provided
    if (dto.media && dto.media.length > 0) {
      const validTypes = ['image', 'video'];
      for (const item of dto.media) {
        if (item.type && !validTypes.includes(item.type)) {
          throw new BadRequestException({
            error_code: 'VALIDATION_ERROR',
            message: 'Media type must be "image" or "video"',
          });
        }
      }
    }

    // If updating rentable items, verify they belong to org
    if (dto.rentable_item_ids) {
      const items = await this.prisma.rentableItem.findMany({
        where: {
          id: { in: dto.rentable_item_ids },
          org_id: orgId,
        },
      });

      if (items.length !== dto.rentable_item_ids.length) {
        throw new BadRequestException({
          error_code: 'VALIDATION_ERROR',
          message: 'Some rentable items not found or do not belong to your organization',
        });
      }

      // Delete existing relations and create new ones
      await this.prisma.listingRentableItem.deleteMany({
        where: { listing_id: id },
      });
    }

    const listing = await this.prisma.listing.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        media: dto.media,
        tags: dto.tags,
        pricing_display: dto.pricing_display,
        ...(dto.rentable_item_ids && {
          rentable_items: {
            create: dto.rentable_item_ids.map((itemId) => ({
              rentable_item: {
                connect: { id: itemId },
              },
            })),
          },
        }),
      },
      include: {
        rentable_items: {
          include: {
            rentable_item: true,
          },
        },
      },
    });

    return listing;
  }

  async remove(orgId: string, id: string) {
    await this.findOne(orgId, id); // Check exists and belongs to org

    // Soft delete
    await this.prisma.listing.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });

    return { message: 'Listing archived successfully' };
  }

  async publish(orgId: string, id: string) {
    const listing = await this.findOne(orgId, id);

    if (listing.status === 'ARCHIVED') {
      throw new BadRequestException({
        error_code: 'VALIDATION_ERROR',
        message: 'Cannot publish archived listing',
        statusCode: 409,
      });
    }

    if (listing.status === 'PUBLISHED') {
      throw new BadRequestException({
        error_code: 'VALIDATION_ERROR',
        message: 'Listing is already published',
      });
    }

    return this.prisma.listing.update({
      where: { id },
      data: { status: 'PUBLISHED' },
    });
  }

  async unpublish(orgId: string, id: string) {
    const listing = await this.findOne(orgId, id);

    if (listing.status !== 'PUBLISHED') {
      throw new BadRequestException({
        error_code: 'VALIDATION_ERROR',
        message: 'Listing is not published',
      });
    }

    return this.prisma.listing.update({
      where: { id },
      data: { status: 'DRAFT' },
    });
  }

  async addMedia(orgId: string, id: string, mediaUrls: any[]) {
    const listing = await this.findOne(orgId, id);

    const currentMedia = (listing.media as any[]) || [];
    const updatedMedia = [...currentMedia, ...mediaUrls];

    return this.prisma.listing.update({
      where: { id },
      data: { media: updatedMedia },
    });
  }

  // ============ PUBLIC MARKETPLACE METHODS ============

  async findPublicListings(page: number = 1, pageSize: number = 12, filters?: any) {
    const skip = (page - 1) * pageSize;
    const where: any = {
      status: 'PUBLISHED',
    };

    // Filter by property category
    if (filters?.property_category) {
      where.rentable_items = {
        some: {
          rentable_item: {
            property_category: filters.property_category,
          },
        },
      };
    }

    // Filter by rental duration type
    if (filters?.rental_duration_type) {
      where.rentable_items = {
        ...where.rentable_items,
        some: {
          ...where.rentable_items?.some,
          rentable_item: {
            ...where.rentable_items?.some?.rentable_item,
            rental_duration_type: filters.rental_duration_type,
          },
        },
      };
    }

    // Filter by instant booking
    if (filters?.instant_booking !== undefined) {
      where.rentable_items = {
        ...where.rentable_items,
        some: {
          ...where.rentable_items?.some,
          rentable_item: {
            ...where.rentable_items?.some?.rentable_item,
            instant_booking: filters.instant_booking === 'true' || filters.instant_booking === true,
          },
        },
      };
    }

    // Filter by bedrooms
    if (filters?.min_bedrooms) {
      where.rentable_items = {
        ...where.rentable_items,
        some: {
          ...where.rentable_items?.some,
          rentable_item: {
            ...where.rentable_items?.some?.rentable_item,
            bedrooms: { gte: parseInt(filters.min_bedrooms) },
          },
        },
      };
    }

    // Filter by bathrooms
    if (filters?.min_bathrooms) {
      where.rentable_items = {
        ...where.rentable_items,
        some: {
          ...where.rentable_items?.some,
          rentable_item: {
            ...where.rentable_items?.some?.rentable_item,
            bathrooms: { gte: parseInt(filters.min_bathrooms) },
          },
        },
      };
    }

    // Filter by area
    if (filters?.min_area || filters?.max_area) {
      const areaFilter: any = {};
      if (filters.min_area) areaFilter.gte = parseFloat(filters.min_area);
      if (filters.max_area) areaFilter.lte = parseFloat(filters.max_area);
      
      where.rentable_items = {
        ...where.rentable_items,
        some: {
          ...where.rentable_items?.some,
          rentable_item: {
            ...where.rentable_items?.some?.rentable_item,
            area_sqm: areaFilter,
          },
        },
      };
    }

    const [listings, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { created_at: 'desc' },
        include: {
          rentable_items: {
            include: {
              rentable_item: {
                include: {
                  space_node: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.listing.count({ where }),
    ]);

    return {
      data: listings,
      pagination: {
        page,
        page_size: pageSize,
        total,
        total_pages: Math.ceil(total / pageSize),
      },
    };
  }

  async searchListings(filters: any, page: number = 1, pageSize: number = 12) {
    const skip = (page - 1) * pageSize;
    const where: any = {
      status: 'PUBLISHED',
    };

    // Search query in title and description
    if (filters.query) {
      where.OR = [
        { title: { contains: filters.query, mode: 'insensitive' } },
        { description: { contains: filters.query, mode: 'insensitive' } },
      ];
    }

    // Filter by tags
    if (filters.tags && filters.tags.length > 0) {
      where.tags = {
        hasSome: filters.tags,
      };
    }

    // Filter by price range
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.pricing_display = {};
      if (filters.minPrice !== undefined) {
        where.pricing_display.path = ['from_amount'];
        where.pricing_display.gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        where.pricing_display.path = ['from_amount'];
        where.pricing_display.lte = filters.maxPrice;
      }
    }

    // Sorting
    let orderBy: any = { created_at: 'desc' }; // default: newest
    if (filters.sort === 'price_low') {
      orderBy = { pricing_display: { path: ['from_amount'], sort: 'asc' } };
    } else if (filters.sort === 'price_high') {
      orderBy = { pricing_display: { path: ['from_amount'], sort: 'desc' } };
    }

    const [listings, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          rentable_items: {
            include: {
              rentable_item: {
                include: {
                  space_node: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.listing.count({ where }),
    ]);

    return {
      data: listings,
      pagination: {
        page,
        page_size: pageSize,
        total,
        total_pages: Math.ceil(total / pageSize),
      },
      filters: filters,
    };
  }

  async findPublicListingById(id: string) {
    const listing = await this.prisma.listing.findFirst({
      where: {
        id,
        status: 'PUBLISHED',
      },
      include: {
        rentable_items: {
          include: {
            rentable_item: {
              include: {
                space_node: {
                  include: {
                    parent: true,
                  },
                },
              },
            },
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!listing) {
      throw new NotFoundException({
        error_code: 'NOT_FOUND',
        message: 'Listing not found or not published',
      });
    }

    return listing;
  }

  async getFeaturedListings(limit: number = 6) {
    const listings = await this.prisma.listing.findMany({
      where: {
        status: 'PUBLISHED',
        is_featured: true, // Only get featured listings
      },
      take: limit,
      orderBy: [
        { view_count: 'desc' }, // Most viewed first
        { created_at: 'desc' }, // Then newest
      ],
      include: {
        rentable_items: {
          include: {
            rentable_item: {
              include: {
                space_node: true,
              },
            },
          },
        },
      },
    });

    return {
      data: listings,
    };
  }

  /**
   * Get smart recommendations based on context
   */
  async getRecommendations(currentListingId?: string, limit: number = 6) {
    // Get current listing for context
    const currentListing = currentListingId 
      ? await this.findPublicListingById(currentListingId)
      : null;
    
    // Get all published listings
    const listings = await this.prisma.listing.findMany({
      where: { 
        status: 'PUBLISHED',
        id: currentListingId ? { not: currentListingId } : undefined, // Exclude current
      },
      take: limit * 3, // Get more to filter
      include: { 
        rentable_items: { 
          include: { 
            rentable_item: true 
          } 
        } 
      },
    });
    
    // Score each listing
    const scored = listings.map(listing => ({
      listing,
      score: this.calculateRecommendationScore(listing, currentListing),
    }));
    
    // Sort by score and return top N
    const topListings = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.listing);

    // Fetch full details for top listings
    const fullListings = await this.prisma.listing.findMany({
      where: {
        id: { in: topListings.map(l => l.id) },
      },
      include: {
        rentable_items: {
          include: {
            rentable_item: {
              include: {
                space_node: true,
              },
            },
          },
        },
      },
    });
    
    return {
      data: fullListings,
    };
  }

  /**
   * Calculate recommendation score for a listing
   */
  private calculateRecommendationScore(listing: any, context: any): number {
    let score = 0;
    
    // Factor 1: Same property type (40 points)
    if (context && this.hasSamePropertyType(listing, context)) {
      score += 40;
    }
    
    // Factor 2: Similar price range (30 points)
    if (context && this.hasSimilarPrice(listing, context)) {
      score += 30;
    }
    
    // Factor 3: High view count (20 points)
    score += Math.min(20, (listing.view_count || 0) / 10);
    
    // Factor 4: Recently added (10 points)
    const daysSinceCreated = (Date.now() - new Date(listing.created_at).getTime()) / (1000 * 60 * 60 * 24);
    score += Math.max(0, 10 - daysSinceCreated / 3);
    
    return score;
  }

  /**
   * Check if two listings have the same property type
   */
  private hasSamePropertyType(listing1: any, listing2: any): boolean {
    const type1 = listing1.rentable_items?.[0]?.rentable_item?.property_category;
    const type2 = listing2.rentable_items?.[0]?.rentable_item?.property_category;
    return type1 && type2 && type1 === type2;
  }

  /**
   * Check if two listings have similar price range (within 30%)
   */
  private hasSimilarPrice(listing1: any, listing2: any): boolean {
    const price1 = listing1.pricing_display?.from_amount;
    const price2 = listing2.pricing_display?.from_amount;
    
    if (!price1 || !price2) return false;
    
    const diff = Math.abs(price1 - price2);
    const avg = (price1 + price2) / 2;
    const diffPercent = (diff / avg) * 100;
    
    return diffPercent <= 30;
  }

  async getRelatedListings(listingId: string, limit: number = 6) {
    // Get the current listing to find its property category
    const currentListing = await this.prisma.listing.findFirst({
      where: {
        id: listingId,
        status: 'PUBLISHED',
      },
      include: {
        rentable_items: {
          include: {
            rentable_item: true,
          },
        },
      },
    });

    if (!currentListing || !currentListing.rentable_items.length) {
      return { data: [] };
    }

    // Get property category from first rentable item
    const propertyCategory = currentListing.rentable_items[0]?.rentable_item?.property_category;

    if (!propertyCategory) {
      return { data: [] };
    }

    // Find related listings with same property category
    const relatedListings = await this.prisma.listing.findMany({
      where: {
        status: 'PUBLISHED',
        id: { not: listingId }, // Exclude current listing
        rentable_items: {
          some: {
            rentable_item: {
              property_category: propertyCategory,
            },
          },
        },
      },
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        rentable_items: {
          include: {
            rentable_item: {
              include: {
                space_node: true,
              },
            },
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      data: relatedListings,
    };
  }

  /**
   * Toggle featured status for a listing
   */
  async toggleFeatured(orgId: string, id: string, isFeatured: boolean) {
    const listing = await this.prisma.listing.findFirst({
      where: {
        id,
        org_id: orgId,
      },
    });

    if (!listing) {
      throw new NotFoundException({
        error_code: 'NOT_FOUND',
        message: 'Listing not found',
      });
    }

    const updated = await this.prisma.listing.update({
      where: { id },
      data: { is_featured: isFeatured },
    });

    return updated;
  }

  /**
   * Increment view count when listing is viewed
   */
  async incrementViewCount(id: string) {
    await this.prisma.listing.update({
      where: { id },
      data: {
        view_count: {
          increment: 1,
        },
        last_viewed_at: new Date(),
      },
    });
  }
}
