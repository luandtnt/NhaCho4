import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { Public, Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtRbacGuard } from '../../../common/guards/jwt-rbac.guard';

@ApiTags('Xác thực')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ 
    summary: 'Đăng nhập',
    description: 'Đăng nhập bằng email và mật khẩu. Trả về access token (15 phút) và refresh token (7 ngày).'
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ 
    summary: 'Làm mới token',
    description: 'Sử dụng refresh token để lấy access token mới khi token cũ hết hạn.'
  })
  async refresh(@Body() refreshDto: RefreshDto) {
    return this.authService.refresh(refreshDto);
  }

  @Post('logout')
  @UseGuards(JwtRbacGuard)
  @Roles('Tenant', 'Landlord', 'PropertyManager', 'OrgAdmin', 'PlatformAdmin')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Đăng xuất',
    description: 'Vô hiệu hóa refresh token hiện tại. Access token vẫn còn hiệu lực cho đến khi hết hạn.'
  })
  async logout(@CurrentUser() user: any) {
    return this.authService.logout(user.sub);
  }

  @Get('me')
  @UseGuards(JwtRbacGuard)
  @Roles('Tenant', 'Landlord', 'PropertyManager', 'OrgAdmin', 'PlatformAdmin')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Lấy thông tin người dùng',
    description: 'Lấy thông tin chi tiết của người dùng hiện tại bao gồm vai trò, quyền hạn và tổ chức.'
  })
  async me(@CurrentUser() user: any) {
    return this.authService.getProfile(user.sub);
  }
}
