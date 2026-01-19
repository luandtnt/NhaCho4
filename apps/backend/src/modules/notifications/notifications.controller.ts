import { Controller, Get, Post, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtRbacGuard } from '../../common/guards/jwt-rbac.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtRbacGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  @Roles('Tenant', 'Landlord', 'PropertyManager', 'OrgAdmin', 'PlatformAdmin')
  @ApiOperation({ summary: 'Lấy danh sách notifications của user' })
  async getNotifications(
    @CurrentUser() user: any,
    @Query('page') page: string = '1',
    @Query('page_size') pageSize: string = '20',
    @Query('unread_only') unreadOnly?: string,
  ) {
    return this.notificationsService.getNotifications(
      user.sub,
      parseInt(page),
      parseInt(pageSize),
      unreadOnly === 'true',
    );
  }

  @Patch(':id/read')
  @Roles('Tenant', 'Landlord', 'PropertyManager', 'OrgAdmin', 'PlatformAdmin')
  @ApiOperation({ summary: 'Đánh dấu notification đã đọc' })
  async markAsRead(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.notificationsService.markAsRead(user.sub, id);
  }

  @Post('mark-all-read')
  @Roles('Tenant', 'Landlord', 'PropertyManager', 'OrgAdmin', 'PlatformAdmin')
  @ApiOperation({ summary: 'Đánh dấu tất cả notifications đã đọc' })
  async markAllAsRead(@CurrentUser() user: any) {
    return this.notificationsService.markAllAsRead(user.sub);
  }

  @Get('unread-count')
  @Roles('Tenant', 'Landlord', 'PropertyManager', 'OrgAdmin', 'PlatformAdmin')
  @ApiOperation({ summary: 'Lấy số lượng notifications chưa đọc' })
  async getUnreadCount(@CurrentUser() user: any) {
    return this.notificationsService.getUnreadCount(user.sub);
  }
}
