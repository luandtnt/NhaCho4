import {
  Controller,
  Get,
  Post,
  Put,
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
import { LeadService } from './lead.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';

@ApiTags('Marketplace - Leads/Inquiry')
@ApiBearerAuth()
@Controller('leads')
@UseGuards(JwtRbacGuard)
export class LeadController {
  constructor(private readonly leadService: LeadService) {}

  @Post()
  @Roles('Tenant', 'Landlord', 'OrgAdmin', 'PlatformAdmin', 'PropertyManager')
  @ApiOperation({ summary: 'Tạo lead/inquiry mới (Tenant có thể tạo)' })
  async create(@Req() req: any, @Body() dto: CreateLeadDto) {
    const orgId = req.org_id || req.user?.org_id;
    const userId = req.user?.sub;
    return this.leadService.create(orgId, dto, userId);
  }

  @Get()
  @Roles('Tenant', 'Landlord', 'OrgAdmin', 'PlatformAdmin', 'PropertyManager')
  @ApiOperation({ summary: 'Lấy danh sách leads (Tenant xem leads của mình)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'page_size', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'my_inquiries', required: false, type: Boolean, description: 'Tenant: lấy inquiries của mình' })
  async findAll(
    @Req() req: any,
    @Query('page') page?: number,
    @Query('page_size') pageSize?: number,
    @Query('status') status?: string,
    @Query('my_inquiries') myInquiries?: string,
  ) {
    const orgId = req.org_id || req.user?.org_id;
    const userId = req.user?.sub;
    const userRole = req.user?.role;
    
    // If tenant requests their own inquiries
    if (userRole === 'Tenant' || myInquiries === 'true') {
      return this.leadService.findByTenant(userId, page, pageSize, status);
    }
    
    return this.leadService.findAll(orgId, page, pageSize, status);
  }

  @Get(':id')
  @Roles('Tenant', 'Landlord', 'OrgAdmin', 'PlatformAdmin', 'PropertyManager')
  @ApiOperation({ summary: 'Lấy chi tiết lead' })
  @ApiParam({ name: 'id', type: String })
  async findOne(@Req() req: any, @Param('id') id: string) {
    const orgId = req.org_id || req.user?.org_id;
    return this.leadService.findOne(orgId, id);
  }

  @Put(':id')
  @Roles('Landlord', 'OrgAdmin', 'PlatformAdmin', 'PropertyManager')
  @ApiOperation({ summary: 'Cập nhật trạng thái lead' })
  @ApiParam({ name: 'id', type: String })
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateLeadDto,
  ) {
    const orgId = req.org_id || req.user?.org_id;
    return this.leadService.update(orgId, id, dto);
  }

  @Post(':id/assign')
  @Roles('Landlord', 'OrgAdmin', 'PlatformAdmin', 'PropertyManager')
  @ApiOperation({ summary: 'Gán lead cho nhân viên/quản lý' })
  @ApiParam({ name: 'id', type: String })
  @HttpCode(200)
  async assign(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { assigned_to_user_id: string },
  ) {
    const orgId = req.org_id || req.user?.org_id;
    return this.leadService.assign(orgId, id, body.assigned_to_user_id);
  }

  @Post(':id/convert')
  @Roles('Landlord', 'OrgAdmin', 'PlatformAdmin', 'PropertyManager')
  @ApiOperation({ summary: 'Chuyển đổi lead thành booking/agreement' })
  @ApiParam({ name: 'id', type: String })
  @HttpCode(200)
  async convert(@Req() req: any, @Param('id') id: string) {
    const orgId = req.org_id || req.user?.org_id;
    return this.leadService.convert(orgId, id);
  }

  @Get(':id/notes')
  @Roles('Landlord', 'OrgAdmin', 'PlatformAdmin', 'PropertyManager')
  @ApiOperation({ summary: 'Lấy danh sách notes của lead' })
  @ApiParam({ name: 'id', type: String })
  async getNotes(@Req() req: any, @Param('id') id: string) {
    const orgId = req.org_id || req.user?.org_id;
    return this.leadService.getNotes(orgId, id);
  }

  @Post(':id/notes')
  @Roles('Landlord', 'OrgAdmin', 'PlatformAdmin', 'PropertyManager')
  @ApiOperation({ summary: 'Thêm note mới cho lead' })
  @ApiParam({ name: 'id', type: String })
  async addNote(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { content: string },
  ) {
    const orgId = req.org_id || req.user?.org_id;
    const userId = req.user?.sub;
    return this.leadService.addNote(orgId, id, userId, body.content);
  }
}
