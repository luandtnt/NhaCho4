import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ListingService } from './listing/listing.service';
import { JwtRbacGuard } from '../../common/guards/jwt-rbac.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Marketplace - Public')
@Controller('marketplace')
export class MarketplacePublicController {
  constructor(private readonly listingService: ListingService) {}

  @Get('discover')
  @Public()
  @ApiOperation({ summary: 'Discover listings - Trang chủ marketplace (Public)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'page_size', required: false, type: Number })
  @ApiQuery({ name: 'property_category', required: false, type: String })
  @ApiQuery({ name: 'rental_duration_type', required: false, type: String })
  @ApiQuery({ name: 'instant_booking', required: false, type: Boolean })
  @ApiQuery({ name: 'min_bedrooms', required: false, type: Number })
  @ApiQuery({ name: 'min_bathrooms', required: false, type: Number })
  @ApiQuery({ name: 'min_area', required: false, type: Number })
  @ApiQuery({ name: 'max_area', required: false, type: Number })
  async discover(
    @Query('page') page: string = '1',
    @Query('page_size') pageSize: string = '12',
    @Query('property_category') propertyCategory?: string,
    @Query('rental_duration_type') rentalDurationType?: string,
    @Query('instant_booking') instantBooking?: string,
    @Query('min_bedrooms') minBedrooms?: string,
    @Query('min_bathrooms') minBathrooms?: string,
    @Query('min_area') minArea?: string,
    @Query('max_area') maxArea?: string,
  ) {
    const filters: any = {};
    if (propertyCategory) filters.property_category = propertyCategory;
    if (rentalDurationType) filters.rental_duration_type = rentalDurationType;
    if (instantBooking) filters.instant_booking = instantBooking;
    if (minBedrooms) filters.min_bedrooms = minBedrooms;
    if (minBathrooms) filters.min_bathrooms = minBathrooms;
    if (minArea) filters.min_area = minArea;
    if (maxArea) filters.max_area = maxArea;

    return this.listingService.findPublicListings(
      parseInt(page),
      parseInt(pageSize),
      filters,
    );
  }

  @Get('search')
  @Public()
  @ApiOperation({ summary: 'Search listings với filters (Public)' })
  @ApiQuery({ name: 'q', required: false, type: String, description: 'Search query' })
  @ApiQuery({ name: 'location', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, type: String })
  @ApiQuery({ name: 'min_price', required: false, type: Number })
  @ApiQuery({ name: 'max_price', required: false, type: Number })
  @ApiQuery({ name: 'bedrooms', required: false, type: Number })
  @ApiQuery({ name: 'bathrooms', required: false, type: Number })
  @ApiQuery({ name: 'tags', required: false, type: String, description: 'Comma-separated tags' })
  @ApiQuery({ name: 'sort', required: false, type: String, description: 'Sort by: newest, price_low, price_high, relevance' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'page_size', required: false, type: Number })
  async search(
    @Query('q') query?: string,
    @Query('location') location?: string,
    @Query('type') type?: string,
    @Query('min_price') minPrice?: string,
    @Query('max_price') maxPrice?: string,
    @Query('bedrooms') bedrooms?: string,
    @Query('bathrooms') bathrooms?: string,
    @Query('tags') tags?: string,
    @Query('sort') sort: string = 'newest',
    @Query('page') page: string = '1',
    @Query('page_size') pageSize: string = '12',
  ) {
    const filters = {
      query,
      location,
      type,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      bedrooms: bedrooms ? parseInt(bedrooms) : undefined,
      bathrooms: bathrooms ? parseInt(bathrooms) : undefined,
      tags: tags ? tags.split(',') : undefined,
      sort,
    };

    return this.listingService.searchListings(
      filters,
      parseInt(page),
      parseInt(pageSize),
    );
  }

  @Get('listings/:id')
  @Public()
  @ApiOperation({ summary: 'Xem chi tiết listing (Public)' })
  async getListingDetail(@Param('id') id: string) {
    // Increment view count
    await this.listingService.incrementViewCount(id);
    
    return this.listingService.findPublicListingById(id);
  }

  @Get('featured')
  @Public()
  @ApiOperation({ summary: 'Lấy featured listings (Public)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getFeatured(@Query('limit') limit: string = '6') {
    return this.listingService.getFeaturedListings(parseInt(limit));
  }

  @Get('recommended')
  @Public()
  @ApiOperation({ summary: 'Lấy recommended listings (Public)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'context_listing_id', required: false, type: String, description: 'Current listing ID for context-aware recommendations' })
  async getRecommended(
    @Query('limit') limit: string = '6',
    @Query('context_listing_id') contextListingId?: string,
  ) {
    return this.listingService.getRecommendations(contextListingId, parseInt(limit));
  }

  @Get('listings/:id/related')
  @Public()
  @ApiOperation({ summary: 'Lấy các listing liên quan (Public)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getRelatedListings(
    @Param('id') id: string,
    @Query('limit') limit: string = '6',
  ) {
    return this.listingService.getRelatedListings(id, parseInt(limit));
  }
}
