import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IntegrationsService } from './integrations.service';
import { UpdateIntegrationDto } from './dto/update-integration.dto';
import { TestIntegrationDto } from './dto/test-integration.dto';
import { JwtRbacGuard } from '../../../common/guards/jwt-rbac.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('Integrations')
@Controller('integrations')
@UseGuards(JwtRbacGuard)
@ApiBearerAuth()
export class IntegrationsController {
  constructor(private integrationsService: IntegrationsService) {}

  @Get('payment-providers')
  @Roles('Landlord', 'OrgAdmin', 'PlatformAdmin')
  @ApiOperation({ summary: 'Lấy cấu hình payment providers' })
  async getPaymentProviders(@CurrentUser() user: any) {
    return this.integrationsService.getPaymentProviders(user.org_id);
  }

  @Put('payment-providers/:provider')
  @Roles('OrgAdmin', 'PlatformAdmin')
  @ApiOperation({ summary: 'Cập nhật cấu hình payment provider' })
  async updatePaymentProvider(
    @CurrentUser() user: any,
    @Param('provider') provider: string,
    @Body() updateDto: UpdateIntegrationDto,
  ) {
    return this.integrationsService.updatePaymentProvider(user.org_id, provider, updateDto);
  }

  @Get('webhooks')
  @Roles('Landlord', 'OrgAdmin', 'PlatformAdmin')
  @ApiOperation({ summary: 'Lấy cấu hình webhooks' })
  async getWebhooks(@CurrentUser() user: any) {
    return this.integrationsService.getWebhooks(user.org_id);
  }

  @Put('webhooks')
  @Roles('OrgAdmin', 'PlatformAdmin')
  @ApiOperation({ summary: 'Cập nhật cấu hình webhooks' })
  async updateWebhooks(
    @CurrentUser() user: any,
    @Body() updateDto: UpdateIntegrationDto,
  ) {
    return this.integrationsService.updateWebhooks(user.org_id, updateDto);
  }

  @Get('email')
  @Roles('Landlord', 'OrgAdmin', 'PlatformAdmin')
  @ApiOperation({ summary: 'Lấy cấu hình email' })
  async getEmailConfig(@CurrentUser() user: any) {
    return this.integrationsService.getEmailConfig(user.org_id);
  }

  @Put('email')
  @Roles('OrgAdmin', 'PlatformAdmin')
  @ApiOperation({ summary: 'Cập nhật cấu hình email' })
  async updateEmailConfig(
    @CurrentUser() user: any,
    @Body() updateDto: UpdateIntegrationDto,
  ) {
    return this.integrationsService.updateEmailConfig(user.org_id, updateDto);
  }

  @Get('sms')
  @Roles('Landlord', 'OrgAdmin', 'PlatformAdmin')
  @ApiOperation({ summary: 'Lấy cấu hình SMS' })
  async getSmsConfig(@CurrentUser() user: any) {
    return this.integrationsService.getSmsConfig(user.org_id);
  }

  @Put('sms')
  @Roles('OrgAdmin', 'PlatformAdmin')
  @ApiOperation({ summary: 'Cập nhật cấu hình SMS' })
  async updateSmsConfig(
    @CurrentUser() user: any,
    @Body() updateDto: UpdateIntegrationDto,
  ) {
    return this.integrationsService.updateSmsConfig(user.org_id, updateDto);
  }

  @Post('test')
  @Roles('OrgAdmin', 'PlatformAdmin')
  @ApiOperation({ summary: 'Test integration' })
  async testIntegration(
    @CurrentUser() user: any,
    @Body() testDto: TestIntegrationDto,
  ) {
    return this.integrationsService.testIntegration(user.org_id, testDto);
  }
}
