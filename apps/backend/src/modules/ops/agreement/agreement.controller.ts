import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AgreementService } from './agreement.service';
import { CreateAgreementDto } from './dto/create-agreement.dto';
import { UpdateAgreementDto } from './dto/update-agreement.dto';
import { QueryAgreementDto } from './dto/query-agreement.dto';
import { TerminateAgreementDto } from './dto/terminate-agreement.dto';
import { RenewAgreementDto } from './dto/renew-agreement.dto';
import { RequestActionDto } from './dto/request-action.dto';
import { RejectAgreementDto } from './dto/reject-agreement.dto';
import { JwtRbacGuard } from '../../../common/guards/jwt-rbac.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

@ApiTags('Ops - Agreements (Hợp Đồng)')
@ApiBearerAuth()
@Controller('agreements')
@UseGuards(JwtRbacGuard)
export class AgreementController {
  constructor(private readonly agreementService: AgreementService) {}

  @Post()
  @Roles('Landlord', 'OrgAdmin')
  @ApiOperation({ summary: '[Landlord] Tạo hợp đồng mới' })
  create(@Request() req, @Body() dto: CreateAgreementDto) {
    return this.agreementService.create(req.user.org_id, req.user.sub, dto);
  }

  @Get()
  @Roles('Landlord', 'Tenant', 'OrgAdmin')
  @ApiOperation({ summary: 'Danh sách hợp đồng' })
  findAll(@Request() req, @Query() query: QueryAgreementDto) {
    return this.agreementService.findAll(req.user.org_id, query, req.user.role, req.user.sub);
  }

  @Get(':id')
  @Roles('Landlord', 'Tenant', 'OrgAdmin')
  @ApiOperation({ summary: 'Chi tiết hợp đồng' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.agreementService.findOne(req.user.org_id, id);
  }

  @Get(':id/contract-data')
  @Roles('Landlord', 'Tenant', 'OrgAdmin')
  @ApiOperation({ summary: 'Lấy data đầy đủ để tạo hợp đồng (preview/print)' })
  getContractData(@Request() req, @Param('id') id: string) {
    return this.agreementService.getContractData(req.user.org_id, id);
  }

  @Put(':id')
  @Roles('Landlord', 'OrgAdmin')
  @ApiOperation({ summary: '[Landlord] Cập nhật hợp đồng (chỉ DRAFT)' })
  update(@Request() req, @Param('id') id: string, @Body() dto: UpdateAgreementDto) {
    return this.agreementService.update(req.user.org_id, id, dto);
  }

  @Post(':id/send')
  @HttpCode(200)
  @Roles('Landlord', 'OrgAdmin')
  @ApiOperation({ summary: '[Landlord] Gửi hợp đồng cho tenant' })
  send(@Request() req, @Param('id') id: string) {
    return this.agreementService.send(req.user.org_id, id);
  }

  @Post(':id/confirm')
  @HttpCode(200)
  @Roles('Tenant')
  @ApiOperation({ summary: '[Tenant] Xác nhận hợp đồng' })
  confirm(@Request() req, @Param('id') id: string) {
    return this.agreementService.confirm(req.user.org_id, id, req.user.sub);
  }

  @Post(':id/reject')
  @HttpCode(200)
  @Roles('Tenant')
  @ApiOperation({ summary: '[Tenant] Từ chối hợp đồng' })
  reject(@Request() req, @Param('id') id: string, @Body() dto: RejectAgreementDto) {
    return this.agreementService.reject(req.user.org_id, id, req.user.sub, dto);
  }

  @Post(':id/activate')
  @HttpCode(200)
  @Roles('Landlord', 'OrgAdmin')
  @ApiOperation({ summary: '[Landlord] Kích hoạt hợp đồng' })
  activate(@Request() req, @Param('id') id: string) {
    return this.agreementService.activate(req.user.org_id, id);
  }

  @Post(':id/terminate')
  @HttpCode(200)
  @Roles('Landlord', 'OrgAdmin')
  @ApiOperation({ summary: '[Landlord] Chấm dứt hợp đồng' })
  terminate(@Request() req, @Param('id') id: string, @Body() dto: TerminateAgreementDto) {
    return this.agreementService.terminate(req.user.org_id, id, dto);
  }

  @Post(':id/renew')
  @HttpCode(200)
  @Roles('Landlord', 'OrgAdmin')
  @ApiOperation({ summary: '[Landlord] Gia hạn hợp đồng (tạo HĐ mới)' })
  renew(@Request() req, @Param('id') id: string, @Body() dto: RenewAgreementDto) {
    return this.agreementService.renew(req.user.org_id, id, dto);
  }

  @Post(':id/request')
  @HttpCode(200)
  @Roles('Tenant')
  @ApiOperation({ summary: '[Tenant] Yêu cầu gia hạn/chấm dứt' })
  requestAction(@Request() req, @Param('id') id: string, @Body() dto: RequestActionDto) {
    return this.agreementService.requestAction(req.user.org_id, id, req.user.sub, dto);
  }

  @Delete(':id')
  @Roles('Landlord', 'OrgAdmin')
  @ApiOperation({ summary: '[Landlord] Xóa hợp đồng (chỉ DRAFT)' })
  remove(@Request() req, @Param('id') id: string) {
    return this.agreementService.remove(req.user.org_id, id);
  }

  @Post('check-expired')
  @HttpCode(200)
  @Roles('OrgAdmin', 'PlatformAdmin')
  @ApiOperation({ summary: '[Admin] Check và cập nhật hợp đồng hết hạn' })
  checkExpired(@Request() req) {
    return this.agreementService.checkExpired(req.user.org_id);
  }
}
