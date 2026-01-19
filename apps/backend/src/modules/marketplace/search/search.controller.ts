import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Public } from '../../../common/decorators/roles.decorator';
import { SearchService } from './search.service';

@ApiTags('Marketplace - Search & Discovery')
@Controller('search')
@Public()
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('listings')
  @ApiOperation({ summary: 'Tìm kiếm listings với bộ lọc' })
  @ApiQuery({ name: 'q', required: false, type: String, description: 'Search query' })
  @ApiQuery({ name: 'price_min', required: false, type: Number })
  @ApiQuery({ name: 'price_max', required: false, type: Number })
  @ApiQuery({ name: 'tags', required: false, type: String, description: 'Comma-separated tags' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'page_size', required: false, type: Number })
  @ApiQuery({ name: 'sort', required: false, type: String })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'] })
  async searchListings(
    @Query('q') q?: string,
    @Query('price_min') priceMin?: string,
    @Query('price_max') priceMax?: string,
    @Query('tags') tags?: string,
    @Query('page') page?: string,
    @Query('page_size') pageSize?: string,
    @Query('sort') sort?: string,
    @Query('order') order?: 'asc' | 'desc',
  ) {
    return this.searchService.searchListings({
      q,
      price_min: priceMin ? parseInt(priceMin) : undefined,
      price_max: priceMax ? parseInt(priceMax) : undefined,
      tags: tags ? tags.split(',') : undefined,
      page: page ? parseInt(page) : undefined,
      page_size: pageSize ? parseInt(pageSize) : undefined,
      sort,
      order,
    });
  }

  @Get('suggest')
  @ApiOperation({ summary: 'Gợi ý tự động hoàn thành' })
  @ApiQuery({ name: 'q', required: true, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async suggest(
    @Query('q') q: string,
    @Query('limit') limit?: string,
  ) {
    return this.searchService.suggest(q, limit ? parseInt(limit) : undefined);
  }

  @Get('geo')
  @ApiOperation({ summary: 'Tìm kiếm theo vị trí địa lý' })
  @ApiQuery({ name: 'lat', required: true, type: Number })
  @ApiQuery({ name: 'lng', required: true, type: Number })
  @ApiQuery({ name: 'radius_km', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'page_size', required: false, type: Number })
  async geoSearch(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius_km') radiusKm?: string,
    @Query('page') page?: string,
    @Query('page_size') pageSize?: string,
  ) {
    return this.searchService.geoSearch({
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      radius_km: radiusKm ? parseFloat(radiusKm) : undefined,
      page: page ? parseInt(page) : undefined,
      page_size: pageSize ? parseInt(pageSize) : undefined,
    });
  }
}
