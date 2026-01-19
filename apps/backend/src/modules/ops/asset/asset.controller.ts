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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { JwtRbacGuard } from '../../../common/guards/jwt-rbac.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AssetService } from './asset.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';

@ApiTags('Ops - Assets & Space Graph')
@ApiBearerAuth()
@Controller('assets')
@UseGuards(JwtRbacGuard)
@Roles('Landlord', 'OrgAdmin', 'PlatformAdmin')
export class AssetController {
  constructor(private readonly assetService: AssetService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo asset mới' })
  async create(@Req() req: any, @Body() dto: CreateAssetDto) {
    const orgId = req.org_id || req.user?.org_id;
    return this.assetService.create(orgId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách assets' })
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
    return this.assetService.findAll(orgId, page, pageSize, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết asset' })
  @ApiParam({ name: 'id', type: String })
  async findOne(@Req() req: any, @Param('id') id: string) {
    const orgId = req.org_id || req.user?.org_id;
    return this.assetService.findOne(orgId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật asset' })
  @ApiParam({ name: 'id', type: String })
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateAssetDto,
  ) {
    const orgId = req.org_id || req.user?.org_id;
    return this.assetService.update(orgId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa asset (soft delete)' })
  @ApiParam({ name: 'id', type: String })
  async remove(@Req() req: any, @Param('id') id: string) {
    const orgId = req.org_id || req.user?.org_id;
    return this.assetService.remove(orgId, id);
  }
}
