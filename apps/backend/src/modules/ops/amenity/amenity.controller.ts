import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { AmenityService } from './amenity.service';
import { JwtRbacGuard } from '../../../common/guards/jwt-rbac.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

@ApiTags('Amenities')
@ApiBearerAuth()
@Controller('amenities')
@UseGuards(JwtRbacGuard)
export class AmenityController {
  constructor(private readonly amenityService: AmenityService) {}

  @Get()
  @ApiOperation({ summary: 'Get all amenities' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'property_type', required: false, description: 'Filter by applicable property type' })
  @Roles('Landlord', 'OrgAdmin', 'PlatformAdmin', 'PropertyManager', 'Tenant')
  async findAll(
    @Query('category') category?: string,
    @Query('property_type') propertyType?: string,
  ) {
    return this.amenityService.findAll(category, propertyType);
  }

  @Get('by-category')
  @ApiOperation({ summary: 'Get amenities grouped by category' })
  @Roles('Landlord', 'OrgAdmin', 'PlatformAdmin', 'PropertyManager', 'Tenant')
  async findGroupedByCategory() {
    return this.amenityService.findGroupedByCategory();
  }
}
