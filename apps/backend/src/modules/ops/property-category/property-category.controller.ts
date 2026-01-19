import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { PropertyCategoryService } from './property-category.service';
import { JwtRbacGuard } from '../../../common/guards/jwt-rbac.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

@ApiTags('Property Categories')
@ApiBearerAuth()
@Controller('property-categories')
@UseGuards(JwtRbacGuard)
export class PropertyCategoryController {
  constructor(private readonly propertyCategoryService: PropertyCategoryService) {}

  @Get()
  @ApiOperation({ summary: 'Get all property categories' })
  @ApiQuery({ name: 'duration_type', required: false, enum: ['SHORT_TERM', 'MEDIUM_TERM', 'LONG_TERM'] })
  @Roles('Landlord', 'OrgAdmin', 'PlatformAdmin', 'PropertyManager', 'Tenant')
  async findAll(@Query('duration_type') durationType?: string) {
    return this.propertyCategoryService.findAll(durationType);
  }

  @Get('by-duration')
  @ApiOperation({ summary: 'Get property categories grouped by duration type' })
  @Roles('Landlord', 'OrgAdmin', 'PlatformAdmin', 'PropertyManager', 'Tenant')
  async findGroupedByDuration() {
    return this.propertyCategoryService.findGroupedByDuration();
  }
}
