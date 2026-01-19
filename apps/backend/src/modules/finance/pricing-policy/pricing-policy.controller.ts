import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, SetMetadata, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PricingPolicyService } from './pricing-policy.service';
import { CreatePricingPolicyDto } from './dto/create-pricing-policy.dto';
import { UpdatePricingPolicyDto } from './dto/update-pricing-policy.dto';
import { JwtRbacGuard } from '../../../common/guards/jwt-rbac.guard';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';

@ApiTags('Finance - Pricing Policies')
@ApiBearerAuth()
@Controller('pricing-policies')
@UseGuards(JwtRbacGuard)
@SetMetadata('roles', ['Landlord', 'OrgAdmin', 'PlatformAdmin'])
export class PricingPolicyController {
  constructor(private readonly pricingPolicyService: PricingPolicyService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo chính sách giá mới' })
  create(@Request() req, @Body() dto: CreatePricingPolicyDto) {
    return this.pricingPolicyService.create(req.user.org_id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách chính sách giá' })
  findAll(
    @Request() req,
    @Query('page') page?: number,
    @Query('page_size') pageSize?: number,
  ) {
    return this.pricingPolicyService.findAll(req.user.org_id, page, pageSize);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết chính sách giá' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.pricingPolicyService.findOne(req.user.org_id, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật chính sách giá' })
  update(@Request() req, @Param('id') id: string, @Body() dto: UpdatePricingPolicyDto) {
    return this.pricingPolicyService.update(req.user.org_id, id, dto);
  }

  @Post(':id/activate')
  @HttpCode(200)
  @ApiOperation({ summary: 'Kích hoạt chính sách giá' })
  activate(@Request() req, @Param('id') id: string) {
    return this.pricingPolicyService.activate(req.user.org_id, id);
  }

  @Post(':id/deactivate')
  @HttpCode(200)
  @ApiOperation({ summary: 'Vô hiệu hóa chính sách giá' })
  deactivate(@Request() req, @Param('id') id: string) {
    return this.pricingPolicyService.deactivate(req.user.org_id, id);
  }

  @Post(':id/archive')
  @HttpCode(200)
  @ApiOperation({ summary: 'Lưu trữ chính sách giá' })
  archive(@Request() req, @Param('id') id: string) {
    return this.pricingPolicyService.archive(req.user.org_id, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa chính sách giá' })
  remove(@Request() req, @Param('id') id: string) {
    return this.pricingPolicyService.remove(req.user.org_id, id);
  }

  @Get(':id/conflicts')
  @ApiOperation({ summary: 'Kiểm tra xung đột chính sách giá' })
  checkConflicts(@Request() req, @Param('id') id: string) {
    return this.pricingPolicyService.detectConflicts(req.user.org_id, id);
  }
}
