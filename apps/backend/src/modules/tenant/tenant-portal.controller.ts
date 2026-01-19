import { Controller, Get, Post, Body, Param, Query, UseGuards, Req, HttpCode, SetMetadata } from '@nestjs/common';
import { JwtRbacGuard } from '../../common/guards/jwt-rbac.guard';
import { TenantPortalService } from './tenant-portal.service';

@Controller('tenant')
@UseGuards(JwtRbacGuard)
@SetMetadata('roles', ['Tenant'])
export class TenantPortalController {
  constructor(private readonly tenantPortalService: TenantPortalService) {}

  @Get('agreements')
  async getAgreements(
    @Req() req: any,
    @Query('page') page?: number,
    @Query('page_size') pageSize?: number,
  ) {
    return this.tenantPortalService.getAgreements(req.user.org_id, req.user.sub, page, pageSize);
  }

  @Get('invoices')
  async getInvoices(
    @Req() req: any,
    @Query('page') page?: number,
    @Query('page_size') pageSize?: number,
    @Query('status') status?: string,
  ) {
    return this.tenantPortalService.getInvoices(req.user.org_id, req.user.sub, page, pageSize, status);
  }

  @Get('payments')
  async getPayments(
    @Req() req: any,
    @Query('page') page?: number,
    @Query('page_size') pageSize?: number,
  ) {
    return this.tenantPortalService.getPayments(req.user.org_id, req.user.sub, page, pageSize);
  }

  @Get('tickets')
  async getTickets(
    @Req() req: any,
    @Query('page') page?: number,
    @Query('page_size') pageSize?: number,
    @Query('status') status?: string,
  ) {
    return this.tenantPortalService.getTickets(req.user.org_id, req.user.sub, page, pageSize, status);
  }

  @Post('payments')
  @HttpCode(201)
  async createPayment(@Req() req: any, @Body() body: any) {
    return this.tenantPortalService.createPayment(req.user.org_id, req.user.sub, body);
  }
}
