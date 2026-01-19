import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Req, HttpCode, SetMetadata } from '@nestjs/common';
import { JwtRbacGuard } from '../../../common/guards/jwt-rbac.guard';
import { TicketService } from './ticket.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { AddCommentDto } from './dto/add-comment.dto';
import { AssignTicketDto } from './dto/assign-ticket.dto';

@Controller('tickets')
@UseGuards(JwtRbacGuard)
@SetMetadata('roles', ['Landlord', 'PropertyManager', 'Tenant', 'OrgAdmin'])
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Post()
  @HttpCode(201)
  async create(@Req() req: any, @Body() dto: CreateTicketDto) {
    return this.ticketService.create(req.user.org_id, req.user.sub, dto);
  }

  @Get()
  async findAll(
    @Req() req: any,
    @Query('page') page?: number,
    @Query('page_size') pageSize?: number,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
  ) {
    return this.ticketService.findAll(req.user.org_id, page, pageSize, status, priority);
  }

  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    return this.ticketService.findOne(req.user.org_id, id);
  }

  @Put(':id')
  @HttpCode(200)
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateTicketDto) {
    return this.ticketService.update(req.user.org_id, id, dto);
  }

  @Post(':id/comment')
  @HttpCode(200)
  async addComment(@Req() req: any, @Param('id') id: string, @Body() dto: AddCommentDto) {
    return this.ticketService.addComment(req.user.org_id, req.user.sub, id, dto);
  }

  @Post(':id/assign')
  @HttpCode(200)
  @SetMetadata('roles', ['Landlord', 'PropertyManager', 'OrgAdmin'])
  async assign(@Req() req: any, @Param('id') id: string, @Body() dto: AssignTicketDto) {
    return this.ticketService.assign(req.user.org_id, id, dto);
  }

  @Post(':id/close')
  @HttpCode(200)
  @SetMetadata('roles', ['Landlord', 'PropertyManager', 'OrgAdmin'])
  async close(@Req() req: any, @Param('id') id: string, @Body() body?: { resolution?: string }) {
    return this.ticketService.close(req.user.org_id, id, body?.resolution);
  }

  @Post(':id/attachments')
  @HttpCode(200)
  async addAttachment(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { url: string; file_name: string },
  ) {
    return this.ticketService.addAttachment(req.user.org_id, id, body.url, body.file_name);
  }
}
