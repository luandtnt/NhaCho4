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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtRbacGuard } from '../../../common/guards/jwt-rbac.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RentableItemService } from './rentable-item.service';
import { CreateRentableItemDto } from './dto/create-rentable-item.dto';
import { UpdateRentableItemDto } from './dto/update-rentable-item.dto';
import { QueryRentableItemDto } from './dto/query-rentable-item.dto';

@ApiTags('Ops - Assets & Space Graph')
@ApiBearerAuth()
@Controller('rentable-items')
@UseGuards(JwtRbacGuard)
@Roles('Landlord', 'OrgAdmin', 'PlatformAdmin', 'PropertyManager')
export class RentableItemController {
  constructor(private readonly rentableItemService: RentableItemService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo rentable item mới' })
  async create(@Req() req: any, @Body() dto: CreateRentableItemDto) {
    const orgId = req.org_id || req.user?.org_id;
    return this.rentableItemService.create(orgId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách rentable items với filters' })
  @Roles('Landlord', 'OrgAdmin', 'PlatformAdmin', 'PropertyManager', 'Tenant')
  async findAll(
    @Req() req: any,
    @Query() query: QueryRentableItemDto,
  ) {
    const orgId = req.org_id || req.user?.org_id;
    return this.rentableItemService.findAll(orgId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết rentable item' })
  @ApiParam({ name: 'id', type: String })
  @Roles('Landlord', 'OrgAdmin', 'PlatformAdmin', 'PropertyManager', 'Tenant')
  async findOne(@Req() req: any, @Param('id') id: string) {
    const orgId = req.org_id || req.user?.org_id;
    return this.rentableItemService.findOne(orgId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật rentable item' })
  @ApiParam({ name: 'id', type: String })
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateRentableItemDto,
  ) {
    const orgId = req.org_id || req.user?.org_id;
    return this.rentableItemService.update(orgId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa rentable item (deactivate)' })
  @ApiParam({ name: 'id', type: String })
  async remove(@Req() req: any, @Param('id') id: string) {
    const orgId = req.org_id || req.user?.org_id;
    return this.rentableItemService.remove(orgId, id);
  }
}
