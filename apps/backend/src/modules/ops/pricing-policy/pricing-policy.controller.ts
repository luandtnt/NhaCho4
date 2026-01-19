import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtRbacGuard } from '../../../common/guards/jwt-rbac.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { PricingPolicyService } from './pricing-policy.service';
import { CreatePricingPolicyDto } from './dto/create-pricing-policy.dto';
import { UpdatePricingPolicyDto } from './dto/update-pricing-policy.dto';
import { QueryPricingPolicyDto } from './dto/query-pricing-policy.dto';

@Controller('pricing-policies')
@UseGuards(JwtRbacGuard)
@Roles('Landlord', 'OrgAdmin', 'PlatformAdmin', 'PropertyManager')
export class PricingPolicyController {
  constructor(private readonly pricingPolicyService: PricingPolicyService) {}

  @Post()
  async create(@Request() req, @Body() dto: CreatePricingPolicyDto) {
    return this.pricingPolicyService.create(req.user.org_id, req.user.sub, dto);
  }

  @Get()
  async findAll(@Request() req, @Query() query: QueryPricingPolicyDto) {
    return this.pricingPolicyService.findAll(req.user.org_id, req.user.sub, req.user.role, query);
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    return this.pricingPolicyService.findOne(req.user.org_id, id);
  }

  @Patch(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdatePricingPolicyDto,
  ) {
    return this.pricingPolicyService.update(req.user.org_id, id, req.user.sub, dto);
  }

  @Delete(':id')
  async delete(@Request() req, @Param('id') id: string) {
    return this.pricingPolicyService.delete(req.user.org_id, id);
  }

  @Patch(':id/archive')
  async archive(@Request() req, @Param('id') id: string) {
    return this.pricingPolicyService.archive(req.user.org_id, id);
  }

  @Get(':id/versions')
  async getVersionHistory(@Request() req, @Param('id') id: string) {
    return this.pricingPolicyService.getVersionHistory(req.user.org_id, id);
  }
}
