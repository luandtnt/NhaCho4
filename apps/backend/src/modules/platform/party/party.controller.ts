import { Controller, Get, Query, UseGuards, Req, SetMetadata } from '@nestjs/common';
import { JwtRbacGuard } from '../../../common/guards/jwt-rbac.guard';
import { PartyService } from './party.service';

@Controller('parties')
@UseGuards(JwtRbacGuard)
@SetMetadata('roles', ['Landlord', 'PropertyManager', 'OrgAdmin'])
export class PartyController {
  constructor(private readonly partyService: PartyService) {}

  @Get()
  async findAll(
    @Req() req: any,
    @Query('type') type?: string,
    @Query('page') page?: number,
    @Query('page_size') pageSize?: number,
  ) {
    return this.partyService.findAll(req.user.org_id, type, page, pageSize);
  }
}
