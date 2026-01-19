import { Controller, Get, Query, UseGuards, Req, SetMetadata } from '@nestjs/common';
import { JwtRbacGuard } from '../../common/guards/jwt-rbac.guard';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtRbacGuard)
@SetMetadata('roles', ['Landlord', 'PropertyManager', 'OrgAdmin'])
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('occupancy')
  async getOccupancy(
    @Req() req: any,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    return this.reportsService.getOccupancy(req.user.org_id, startDate, endDate);
  }

  @Get('revenue')
  async getRevenue(
    @Req() req: any,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    return this.reportsService.getRevenue(req.user.org_id, startDate, endDate);
  }

  @Get('tickets-summary')
  async getTicketsSummary(@Req() req: any) {
    return this.reportsService.getTicketsSummary(req.user.org_id);
  }
}
