import { Injectable } from '@nestjs/common';
import { PrismaService } from '../platform/prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async getNotifications(
    userId: string,
    page: number = 1,
    pageSize: number = 20,
    unreadOnly: boolean = false,
  ) {
    const skip = (page - 1) * pageSize;
    const where: any = { user_id: userId };

    if (unreadOnly) {
      where.status = 'UNREAD';
    }

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.notification.count({ where }),
    ]);

    // Transform notifications to include link from metadata
    const transformedNotifications = notifications.map(n => ({
      ...n,
      link: (n.metadata as any)?.link || null,
      read: n.status === 'READ',
    }));

    return {
      data: transformedNotifications,
      pagination: {
        page,
        page_size: pageSize,
        total,
        total_pages: Math.ceil(total / pageSize),
      },
    };
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        user_id: userId,
      },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { status: 'READ' },
    });

    return { message: 'Đã đánh dấu notification đã đọc' };
  }

  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: {
        user_id: userId,
        status: 'UNREAD',
      },
      data: {
        status: 'READ',
      },
    });

    return {
      message: 'Đã đánh dấu tất cả notifications đã đọc',
      count: result.count,
    };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: {
        user_id: userId,
        status: 'UNREAD',
      },
    });

    return { unread_count: count };
  }

  // Helper method to create notification (used by other services)
  async createNotification(data: {
    user_id: string;
    org_id: string;
    type: string;
    title: string;
    message: string;
    link?: string;
    metadata?: any;
  }) {
    return this.prisma.notification.create({
      data: {
        user_id: data.user_id,
        org_id: data.org_id,
        type: data.type,
        title: data.title,
        message: data.message,
        status: 'UNREAD',
        metadata: {
          ...(data.metadata || {}),
          link: data.link || null,
        },
      },
    });
  }
}
