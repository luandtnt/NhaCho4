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
import { SpaceNodeService } from './space-node.service';
import { CreateSpaceNodeDto } from './dto/create-space-node.dto';
import { UpdateSpaceNodeDto } from './dto/update-space-node.dto';

@ApiTags('Ops - Assets & Space Graph')
@ApiBearerAuth()
@Controller('space-nodes')
@UseGuards(JwtRbacGuard)
@Roles('Landlord', 'OrgAdmin', 'PlatformAdmin', 'PropertyManager')
export class SpaceNodeController {
  constructor(private readonly spaceNodeService: SpaceNodeService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo space node mới' })
  async create(@Req() req: any, @Body() dto: CreateSpaceNodeDto) {
    const orgId = req.org_id || req.user?.org_id;
    return this.spaceNodeService.create(orgId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách space nodes' })
  @ApiQuery({ name: 'asset_id', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'page_size', required: false, type: Number })
  async findAll(
    @Req() req: any,
    @Query('asset_id') assetId?: string,
    @Query('page') page?: number,
    @Query('page_size') pageSize?: number,
  ) {
    const orgId = req.org_id || req.user?.org_id;
    return this.spaceNodeService.findAll(orgId, assetId, page, pageSize);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết space node' })
  @ApiParam({ name: 'id', type: String })
  async findOne(@Req() req: any, @Param('id') id: string) {
    const orgId = req.org_id || req.user?.org_id;
    return this.spaceNodeService.findOne(orgId, id);
  }

  @Get(':id/tree')
  @ApiOperation({ summary: 'Lấy cây phân cấp space node' })
  @ApiParam({ name: 'id', type: String })
  async getTree(@Req() req: any, @Param('id') id: string) {
    const orgId = req.org_id || req.user?.org_id;
    return this.spaceNodeService.getTree(orgId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật space node' })
  @ApiParam({ name: 'id', type: String })
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateSpaceNodeDto,
  ) {
    const orgId = req.org_id || req.user?.org_id;
    return this.spaceNodeService.update(orgId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa space node' })
  @ApiParam({ name: 'id', type: String })
  async remove(@Req() req: any, @Param('id') id: string) {
    const orgId = req.org_id || req.user?.org_id;
    return this.spaceNodeService.remove(orgId, id);
  }
}
