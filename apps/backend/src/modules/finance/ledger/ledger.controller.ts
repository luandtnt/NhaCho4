import { Controller, Get, Post, Query, UseGuards, Request, SetMetadata, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LedgerService } from './ledger.service';
import { JwtRbacGuard } from '../../../common/guards/jwt-rbac.guard';

@ApiTags('Finance - Ledger')
@ApiBearerAuth()
@Controller('ledger')
@UseGuards(JwtRbacGuard)
@SetMetadata('roles', ['Landlord', 'OrgAdmin', 'PlatformAdmin'])
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  @Get()
  @ApiOperation({ summary: 'Truy vấn sổ cái (append-only)' })
  findAll(
    @Request() req,
    @Query('page') page?: number,
    @Query('page_size') pageSize?: number,
    @Query('entry_type') entryType?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    return this.ledgerService.findAll(req.user.org_id, page, pageSize, entryType, startDate, endDate);
  }

  @Get('export')
  @ApiOperation({ summary: 'Xuất sổ cái (JSON/CSV)' })
  export(
    @Request() req,
    @Query('format') format?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    return this.ledgerService.export(req.user.org_id, format, startDate, endDate);
  }

  @Post('reconcile')
  @HttpCode(200)
  @ApiOperation({ summary: 'Đối soát sổ cái theo khoảng thời gian' })
  reconcile(
    @Request() req,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
  ) {
    return this.ledgerService.reconcile(req.user.org_id, startDate, endDate);
  }
}
