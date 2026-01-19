import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        email: loginDto.email,
        status: 'ACTIVE',
      },
      include: {
        organization: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException({
        error_code: 'UNAUTHORIZED',
        message: 'Invalid credentials',
      });
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException({
        error_code: 'UNAUTHORIZED',
        message: 'Invalid credentials',
      });
    }

    const payload = {
      sub: user.id,
      email: user.email,
      org_id: user.org_id,
      role: user.role,
      scopes: user.scopes || [],
      assigned_asset_ids: user.assigned_asset_ids || [],
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
    });

    // Store refresh token
    await this.prisma.refreshToken.create({
      data: {
        user_id: user.id,
        token: refreshToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: 900, // 15 minutes
      user: {
        id: user.id,
        email: user.email,
        org_id: user.org_id,
        role: user.role,
        scopes: user.scopes || [],
        assigned_asset_ids: user.assigned_asset_ids || [],
      },
    };
  }

  async refresh(refreshDto: RefreshDto) {
    try {
      const payload = this.jwtService.verify(refreshDto.refresh_token);

      const storedToken = await this.prisma.refreshToken.findFirst({
        where: {
          token: refreshDto.refresh_token,
          user_id: payload.sub,
          revoked: false,
          expires_at: {
            gt: new Date(),
          },
        },
      });

      if (!storedToken) {
        throw new UnauthorizedException({
          error_code: 'UNAUTHORIZED',
          message: 'Invalid refresh token',
        });
      }

      const newPayload = {
        sub: payload.sub,
        email: payload.email,
        org_id: payload.org_id,
        role: payload.role,
        scopes: payload.scopes,
        assigned_asset_ids: payload.assigned_asset_ids,
      };

      const accessToken = this.jwtService.sign(newPayload);

      return {
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: 900,
      };
    } catch (error) {
      throw new UnauthorizedException({
        error_code: 'UNAUTHORIZED',
        message: 'Invalid refresh token',
      });
    }
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: {
        user_id: userId,
        revoked: false,
      },
      data: {
        revoked: true,
      },
    });

    return { message: 'Logged out successfully' };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        scopes: true,
        assigned_asset_ids: true,
        org_id: true,
        organization: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        created_at: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException({
        error_code: 'UNAUTHORIZED',
        message: 'User not found',
      });
    }

    return user;
  }
}
