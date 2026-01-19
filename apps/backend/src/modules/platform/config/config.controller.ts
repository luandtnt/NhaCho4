import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigService } from './config.service';
import { CreateBundleDto } from './dto/create-bundle.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtRbacGuard } from '../../../common/guards/jwt-rbac.guard';

@ApiTags('Quản lý cấu hình')
@Controller('configs/bundles')
@UseGuards(JwtRbacGuard)
@ApiBearerAuth()
export class ConfigController {
  constructor(private configService: ConfigService) {}

  @Post()
  @Roles('OrgAdmin', 'PlatformAdmin')
  @ApiOperation({ 
    summary: 'Tạo gói cấu hình mới',
    description: 'Tạo gói cấu hình mới cho tổ chức. Gói cấu hình định nghĩa các loại tài sản, quy tắc giá, và quy trình nghiệp vụ. Chỉ OrgAdmin và PlatformAdmin mới có quyền tạo.'
  })
  async create(@Body() dto: CreateBundleDto, @Req() req: any) {
    const orgId = req.org_id || req.user?.org_id;
    return this.configService.create(orgId, dto);
  }

  @Get()
  @Roles('Landlord', 'OrgAdmin', 'PlatformAdmin')
  @ApiOperation({ 
    summary: 'Danh sách gói cấu hình',
    description: 'Lấy danh sách tất cả gói cấu hình của tổ chức, bao gồm cả gói đang hoạt động và đã lưu trữ.'
  })
  async list(@Req() req: any) {
    const orgId = req.org_id || req.user?.org_id;
    return this.configService.list(orgId);
  }

  @Get(':id')
  @Roles('Landlord', 'OrgAdmin', 'PlatformAdmin')
  @ApiOperation({ 
    summary: 'Chi tiết gói cấu hình',
    description: 'Xem chi tiết một gói cấu hình cụ thể bao gồm tất cả các định nghĩa schema, quy tắc và workflow.'
  })
  async get(@Param('id') id: string, @Req() req: any) {
    const orgId = req.org_id || req.user?.org_id;
    return this.configService.get(orgId, id);
  }

  @Post(':id/activate')
  @Roles('OrgAdmin', 'PlatformAdmin')
  @ApiOperation({ 
    summary: 'Kích hoạt gói cấu hình',
    description: 'Kích hoạt một gói cấu hình. Gói đang hoạt động hiện tại sẽ tự động chuyển sang trạng thái lưu trữ. Chỉ có một gói được phép hoạt động tại một thời điểm.'
  })
  async activate(@Param('id') id: string, @Req() req: any) {
    const orgId = req.org_id || req.user?.org_id;
    return this.configService.activate(orgId, id);
  }

  @Post(':id/rollback')
  @Roles('OrgAdmin', 'PlatformAdmin')
  @ApiOperation({ 
    summary: 'Khôi phục gói cấu hình trước đó',
    description: 'Khôi phục lại gói cấu hình đã lưu trữ trước đó. Gói hiện tại sẽ bị vô hiệu hóa.'
  })
  async rollback(@Param('id') id: string, @Req() req: any) {
    const orgId = req.org_id || req.user?.org_id;
    return this.configService.rollback(orgId, id);
  }
}
