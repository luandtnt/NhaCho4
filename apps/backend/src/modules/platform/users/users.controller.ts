import { Controller, Get, Post, Body, Query, UseGuards, Put, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { JwtRbacGuard } from '../../../common/guards/jwt-rbac.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtRbacGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles('Landlord', 'OrgAdmin', 'PlatformAdmin')
  @ApiOperation({ summary: 'Lấy danh sách users trong organization' })
  async getUsers(
    @CurrentUser() user: any,
    @Query('page') page: string = '1',
    @Query('page_size') pageSize: string = '20',
  ) {
    return this.usersService.getUsers(user.org_id, parseInt(page), parseInt(pageSize));
  }

  @Post('invite')
  @Roles('OrgAdmin', 'PlatformAdmin')
  @ApiOperation({ summary: 'Mời user mới vào organization' })
  async inviteUser(
    @CurrentUser() user: any,
    @Body() inviteDto: InviteUserDto,
  ) {
    return this.usersService.inviteUser(user.org_id, inviteDto);
  }

  @Get('roles')
  @Roles('Landlord', 'OrgAdmin', 'PlatformAdmin')
  @ApiOperation({ summary: 'Lấy danh sách roles có sẵn' })
  async getRoles() {
    return this.usersService.getRoles();
  }

  @Get('profile')
  @Roles('Tenant', 'Landlord', 'PropertyManager', 'OrgAdmin', 'PlatformAdmin')
  @ApiOperation({ summary: 'Lấy profile của user hiện tại' })
  async getProfile(@CurrentUser() user: any) {
    return this.usersService.getProfile(user.sub);
  }

  @Put('profile')
  @Roles('Tenant', 'Landlord', 'PropertyManager', 'OrgAdmin', 'PlatformAdmin')
  @ApiOperation({ summary: 'Cập nhật profile' })
  async updateProfile(
    @CurrentUser() user: any,
    @Body() updateDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.sub, updateDto);
  }

  @Post('change-password')
  @Roles('Tenant', 'Landlord', 'PropertyManager', 'OrgAdmin', 'PlatformAdmin')
  @ApiOperation({ summary: 'Đổi mật khẩu' })
  async changePassword(
    @CurrentUser() user: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(user.sub, changePasswordDto);
  }

  @Get('preferences')
  @Roles('Tenant', 'Landlord', 'PropertyManager', 'OrgAdmin', 'PlatformAdmin')
  @ApiOperation({ summary: 'Lấy preferences của user' })
  async getPreferences(@CurrentUser() user: any) {
    return this.usersService.getPreferences(user.sub);
  }

  @Patch('preferences')
  @Roles('Tenant', 'Landlord', 'PropertyManager', 'OrgAdmin', 'PlatformAdmin')
  @ApiOperation({ summary: 'Cập nhật preferences' })
  async updatePreferences(
    @CurrentUser() user: any,
    @Body() updateDto: UpdatePreferencesDto,
  ) {
    return this.usersService.updatePreferences(user.sub, updateDto);
  }
}
