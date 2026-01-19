import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { JwtRbacGuard } from '../../../common/guards/jwt-rbac.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { ListingService } from './listing.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';

@ApiTags('Marketplace - Listings')
@ApiBearerAuth()
@Controller('listings')
@UseGuards(JwtRbacGuard)
@Roles('Landlord', 'OrgAdmin', 'PlatformAdmin')
export class ListingController {
  constructor(private readonly listingService: ListingService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo listing mới' })
  async create(@Req() req: any, @Body() dto: CreateListingDto) {
    const orgId = req.org_id || req.user?.org_id;
    const userId = req.user?.sub;
    return this.listingService.create(orgId, userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách listings' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'page_size', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  async findAll(
    @Req() req: any,
    @Query('page') page?: number,
    @Query('page_size') pageSize?: number,
    @Query('status') status?: string,
  ) {
    const orgId = req.org_id || req.user?.org_id;
    const userId = req.user?.sub;
    const userRole = req.user?.role;
    return this.listingService.findAll(orgId, userId, userRole, page, pageSize, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết listing' })
  @ApiParam({ name: 'id', type: String })
  async findOne(@Req() req: any, @Param('id') id: string) {
    const orgId = req.org_id || req.user?.org_id;
    const userId = req.user?.sub;
    const userRole = req.user?.role;
    return this.listingService.findOne(orgId, userId, userRole, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật listing' })
  @ApiParam({ name: 'id', type: String })
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateListingDto,
  ) {
    const orgId = req.org_id || req.user?.org_id;
    const userId = req.user?.sub;
    const userRole = req.user?.role;
    return this.listingService.update(orgId, userId, userRole, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa listing (soft delete)' })
  @ApiParam({ name: 'id', type: String })
  async remove(@Req() req: any, @Param('id') id: string) {
    const orgId = req.org_id || req.user?.org_id;
    const userId = req.user?.sub;
    const userRole = req.user?.role;
    return this.listingService.remove(orgId, userId, userRole, id);
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Xuất bản listing' })
  @ApiParam({ name: 'id', type: String })
  @HttpCode(200)
  async publish(@Req() req: any, @Param('id') id: string) {
    const orgId = req.org_id || req.user?.org_id;
    return this.listingService.publish(orgId, id);
  }

  @Post(':id/unpublish')
  @ApiOperation({ summary: 'Hủy xuất bản listing' })
  @ApiParam({ name: 'id', type: String })
  @HttpCode(200)
  async unpublish(@Req() req: any, @Param('id') id: string) {
    const orgId = req.org_id || req.user?.org_id;
    return this.listingService.unpublish(orgId, id);
  }

  @Post(':id/media')
  @ApiOperation({ summary: 'Thêm media vào listing' })
  @ApiParam({ name: 'id', type: String })
  @HttpCode(200)
  async addMedia(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { media: any[] },
  ) {
    const orgId = req.org_id || req.user?.org_id;
    return this.listingService.addMedia(orgId, id, body.media);
  }

  @Post(':id/toggle-featured')
  @ApiOperation({ summary: 'Toggle featured status' })
  @ApiParam({ name: 'id', type: String })
  @HttpCode(200)
  async toggleFeatured(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { is_featured: boolean },
  ) {
    const orgId = req.org_id || req.user?.org_id;
    return this.listingService.toggleFeatured(orgId, id, body.is_featured);
  }
}
