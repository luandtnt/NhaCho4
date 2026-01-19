import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request, SetMetadata, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { IssueInvoiceDto } from './dto/issue-invoice.dto';
import { VoidInvoiceDto } from './dto/void-invoice.dto';
import { InvoiceQueryDto } from './dto/invoice-query.dto';
import { JwtRbacGuard } from '../../../common/guards/jwt-rbac.guard';

@ApiTags('Finance - Invoices')
@ApiBearerAuth()
@Controller('invoices')
@UseGuards(JwtRbacGuard)
@SetMetadata('roles', ['Landlord', 'OrgAdmin', 'PlatformAdmin'])
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo hóa đơn mới' })
  create(@Request() req, @Body() dto: CreateInvoiceDto) {
    return this.invoiceService.create(req.user.org_id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách hóa đơn với filters' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by invoice_code, tenant name, phone' })
  @ApiQuery({ name: 'tenant_id', required: false, description: 'Filter by tenant party ID' })
  @ApiQuery({ name: 'item_id', required: false, description: 'Filter by rentable item ID' })
  @ApiQuery({ name: 'agreement_id', required: false, description: 'Filter by agreement ID' })
  @ApiQuery({ name: 'state', required: false, description: 'Filter by state' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status (legacy)' })
  @ApiQuery({ name: 'month', required: false, description: 'Filter by month (YYYY-MM)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'page_size', required: false, description: 'Page size' })
  findAll(@Request() req, @Query() query: InvoiceQueryDto) {
    return this.invoiceService.findAll(req.user.org_id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết hóa đơn' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.invoiceService.findOne(req.user.org_id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật hóa đơn (chỉ DRAFT)' })
  update(@Request() req, @Param('id') id: string, @Body() dto: UpdateInvoiceDto) {
    return this.invoiceService.update(req.user.org_id, id, dto);
  }

  @Post(':id/issue')
  @HttpCode(200)
  @ApiOperation({ summary: 'Phát hành hóa đơn (DRAFT -> ISSUED)' })
  issue(@Request() req, @Param('id') id: string, @Body() dto: IssueInvoiceDto) {
    return this.invoiceService.issue(req.user.org_id, id, dto);
  }

  @Post(':id/void')
  @HttpCode(200)
  @ApiOperation({ summary: 'Hủy hóa đơn' })
  void(@Request() req, @Param('id') id: string, @Body() dto: VoidInvoiceDto) {
    return this.invoiceService.void(req.user.org_id, id, dto.reason);
  }

  @Post(':id/mark-overdue')
  @HttpCode(200)
  @ApiOperation({ summary: 'Đánh dấu hóa đơn quá hạn' })
  markOverdue(@Request() req, @Param('id') id: string) {
    return this.invoiceService.markOverdue(req.user.org_id, id);
  }
}
