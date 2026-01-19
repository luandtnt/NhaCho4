import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getUsers(orgId: string, page: number = 1, pageSize: number = 20) {
    const skip = (page - 1) * pageSize;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: { org_id: orgId },
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          scopes: true,
          assigned_asset_ids: true,
          created_at: true,
          updated_at: true,
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.user.count({
        where: { org_id: orgId },
      }),
    ]);

    return {
      data: users,
      pagination: {
        page,
        page_size: pageSize,
        total,
        total_pages: Math.ceil(total / pageSize),
      },
    };
  }

  async inviteUser(orgId: string, inviteDto: InviteUserDto) {
    // Check if user already exists
    const existing = await this.prisma.user.findUnique({
      where: {
        org_id_email: {
          org_id: orgId,
          email: inviteDto.email,
        },
      },
    });

    if (existing) {
      throw new Error('User với email này đã tồn tại trong organization');
    }

    // Create user with temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const user = await this.prisma.user.create({
      data: {
        org_id: orgId,
        email: inviteDto.email,
        password_hash: passwordHash,
        role: inviteDto.role,
        status: 'PENDING',
        scopes: inviteDto.scopes || [],
        assigned_asset_ids: inviteDto.assigned_asset_ids || [],
      },
    });

    // TODO: Send invitation email with temp password
    // For now, return temp password in response (not secure for production!)
    return {
      message: 'User đã được mời thành công',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
      },
      temp_password: tempPassword, // Remove this in production
    };
  }

  async getRoles() {
    return {
      data: [
        {
          name: 'PlatformAdmin',
          label: 'Platform Admin',
          description: 'Quản trị toàn hệ thống, có mọi quyền',
          permissions: ['*'],
          data_scope: 'platform',
        },
        {
          name: 'OrgAdmin',
          label: 'Org Admin',
          description: 'Quản trị tổ chức, quản lý users, config',
          permissions: ['manage_users', 'manage_config', 'view_all_data'],
          data_scope: 'org',
        },
        {
          name: 'Landlord',
          label: 'Landlord (Chủ nhà)',
          description: 'Quản lý tài sản, tin đăng, hợp đồng, thu tiền',
          permissions: [
            'manage_assets',
            'manage_listings',
            'manage_leads',
            'manage_agreements',
            'manage_invoices',
            'view_reports',
          ],
          data_scope: 'org',
        },
        {
          name: 'PropertyManager',
          label: 'Property Manager',
          description: 'Quản lý tài sản được gán, xử lý yêu cầu',
          permissions: [
            'view_assets',
            'manage_tickets',
            'view_agreements',
            'view_invoices',
          ],
          data_scope: 'assigned_assets',
        },
        {
          name: 'Tenant',
          label: 'Tenant (Người thuê)',
          description: 'Xem hợp đồng, hóa đơn, thanh toán của mình',
          permissions: [
            'view_own_agreements',
            'view_own_invoices',
            'make_payments',
            'create_tickets',
          ],
          data_scope: 'self',
        },
      ],
    };
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
        name: true,
        phone: true,
        emergency_contact: true,
        id_number: true,
        created_at: true,
        updated_at: true,
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get profile data from Party if exists (fallback)
    const party = await this.prisma.party.findFirst({
      where: {
        org_id: user.organization.id,
        email: user.email,
      },
    });

    return {
      ...user,
      org_id: user.organization.id,
      name: user.name || party?.name || '',
      phone: user.phone || party?.phone || '',
      emergency_contact: user.emergency_contact || (party?.metadata as any)?.emergency_contact || '',
      id_number: user.id_number || (party?.metadata as any)?.id_number || '',
      preferences: (user.scopes as any)?.preferences || {},
    };
  }

  async updateProfile(userId: string, updateDto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, org_id: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Update User table with profile fields
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: updateDto.name,
        phone: updateDto.phone,
        emergency_contact: updateDto.emergency_contact,
        id_number: updateDto.id_number,
      },
    });

    // Update or create Party
    const existingParty = await this.prisma.party.findFirst({
      where: {
        org_id: user.org_id,
        email: user.email,
      },
    });

    if (existingParty) {
      await this.prisma.party.update({
        where: { id: existingParty.id },
        data: {
          name: updateDto.name || existingParty.name,
          phone: updateDto.phone || existingParty.phone,
          metadata: {
            ...(existingParty.metadata as any),
            emergency_contact: updateDto.emergency_contact,
            id_number: updateDto.id_number,
          },
        },
      });
    } else {
      await this.prisma.party.create({
        data: {
          org_id: user.org_id,
          party_type: 'INDIVIDUAL',
          name: updateDto.name || '',
          email: user.email,
          phone: updateDto.phone || '',
          metadata: {
            emergency_contact: updateDto.emergency_contact,
            id_number: updateDto.id_number,
          },
        },
      });
    }

    return { message: 'Cập nhật profile thành công' };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { password_hash: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValid = await bcrypt.compare(
      changePasswordDto.current_password,
      user.password_hash,
    );

    if (!isValid) {
      throw new Error('Mật khẩu hiện tại không đúng');
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(changePasswordDto.new_password, 10);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { password_hash: newPasswordHash },
    });

    return { message: 'Đổi mật khẩu thành công' };
  }

  async getPreferences(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { scopes: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const preferences = (user.scopes as any)?.preferences || {
      notifications: {
        email_invoice: true,
        email_payment_reminder: true,
        email_ticket_update: true,
        email_promotions: false,
      },
      language: 'vi',
      timezone: 'Asia/Ho_Chi_Minh',
    };

    return { preferences };
  }

  async updatePreferences(userId: string, updateDto: UpdatePreferencesDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { scopes: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const currentScopes = (user.scopes as any) || {};
    const updatedScopes = {
      ...currentScopes,
      preferences: {
        ...(currentScopes.preferences || {}),
        ...updateDto.preferences,
      },
    };

    await this.prisma.user.update({
      where: { id: userId },
      data: { scopes: updatedScopes },
    });

    return { message: 'Cập nhật preferences thành công' };
  }
}
