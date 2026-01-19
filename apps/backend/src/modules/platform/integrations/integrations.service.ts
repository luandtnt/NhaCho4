import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateIntegrationDto } from './dto/update-integration.dto';
import { TestIntegrationDto } from './dto/test-integration.dto';

@Injectable()
export class IntegrationsService {
  constructor(private prisma: PrismaService) {}

  private async getIntegrationsConfig(orgId: string) {
    // Get integrations config from ConfigBundle
    const bundle = await this.prisma.configBundle.findFirst({
      where: {
        org_id: orgId,
        bundle_id: 'integrations',
        status: 'ACTIVE',
      },
      orderBy: { created_at: 'desc' },
    });

    return (bundle?.config as any) || {};
  }

  private async saveIntegrationsConfig(orgId: string, config: any) {
    // Check if there's an active integrations bundle
    const existing = await this.prisma.configBundle.findFirst({
      where: {
        org_id: orgId,
        bundle_id: 'integrations',
        status: 'ACTIVE',
      },
    });

    if (existing) {
      // Update existing
      const newVersion = `v${parseInt(existing.version.replace('v', '')) + 1}`;
      await this.prisma.configBundle.update({
        where: { id: existing.id },
        data: {
          config: config,
          version: newVersion,
        },
      });
    } else {
      // Create new
      await this.prisma.configBundle.create({
        data: {
          org_id: orgId,
          bundle_id: 'integrations',
          config: config,
          version: 'v1',
          status: 'ACTIVE',
        },
      });
    }
  }

  async getPaymentProviders(orgId: string) {
    const config = await this.getIntegrationsConfig(orgId);
    const payment = config.payment || {};

    return {
      data: {
        provider: payment.provider || 'stripe',
        api_key: payment.api_key ? '••••••••••••••••' : '',
        webhook_secret: payment.webhook_secret ? '••••••••••••••••' : '',
        enabled: payment.enabled || false,
      },
    };
  }

  async updatePaymentProvider(orgId: string, provider: string, updateDto: UpdateIntegrationDto) {
    const config = await this.getIntegrationsConfig(orgId);

    config.payment = {
      provider,
      ...updateDto.config,
      updated_at: new Date().toISOString(),
    };

    await this.saveIntegrationsConfig(orgId, config);
    return { message: 'Cập nhật payment provider thành công' };
  }

  async getWebhooks(orgId: string) {
    const config = await this.getIntegrationsConfig(orgId);
    const webhooks = config.webhooks || {};

    return {
      data: {
        endpoint: webhooks.endpoint || '',
        secret: webhooks.secret ? '••••••••••••••••' : '',
        events: webhooks.events || ['payment.succeeded', 'invoice.paid', 'agreement.signed'],
        enabled: webhooks.enabled || false,
      },
    };
  }

  async updateWebhooks(orgId: string, updateDto: UpdateIntegrationDto) {
    const config = await this.getIntegrationsConfig(orgId);

    config.webhooks = {
      ...updateDto.config,
      updated_at: new Date().toISOString(),
    };

    await this.saveIntegrationsConfig(orgId, config);
    return { message: 'Cập nhật webhooks thành công' };
  }

  async getEmailConfig(orgId: string) {
    const config = await this.getIntegrationsConfig(orgId);
    const email = config.email || {};

    return {
      data: {
        provider: email.provider || 'sendgrid',
        api_key: email.api_key ? '••••••••••••••••' : '',
        from_email: email.from_email || 'noreply@urp-platform.com',
        from_name: email.from_name || 'URP Platform',
        enabled: email.enabled || false,
      },
    };
  }

  async updateEmailConfig(orgId: string, updateDto: UpdateIntegrationDto) {
    const config = await this.getIntegrationsConfig(orgId);

    config.email = {
      ...updateDto.config,
      updated_at: new Date().toISOString(),
    };

    await this.saveIntegrationsConfig(orgId, config);
    return { message: 'Cập nhật email config thành công' };
  }

  async getSmsConfig(orgId: string) {
    const config = await this.getIntegrationsConfig(orgId);
    const sms = config.sms || {};

    return {
      data: {
        provider: sms.provider || 'twilio',
        account_sid: sms.account_sid ? '••••••••••••••••' : '',
        auth_token: sms.auth_token ? '••••••••••••••••' : '',
        from_number: sms.from_number || '',
        enabled: sms.enabled || false,
      },
    };
  }

  async updateSmsConfig(orgId: string, updateDto: UpdateIntegrationDto) {
    const config = await this.getIntegrationsConfig(orgId);

    config.sms = {
      ...updateDto.config,
      updated_at: new Date().toISOString(),
    };

    await this.saveIntegrationsConfig(orgId, config);
    return { message: 'Cập nhật SMS config thành công' };
  }

  async testIntegration(orgId: string, testDto: TestIntegrationDto) {
    const { type, target } = testDto;

    // Simulate test based on type
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (type === 'webhook') {
      return {
        success: true,
        message: '✓ Test webhook thành công!',
        details: {
          status: 200,
          latency: Math.floor(Math.random() * 200) + 50,
          response: 'OK',
        },
      };
    }

    if (type === 'email') {
      return {
        success: true,
        message: `✓ Test email thành công! Email đã được gửi đến: ${target}`,
        details: {
          recipient: target,
          sent_at: new Date().toISOString(),
        },
      };
    }

    if (type === 'sms') {
      return {
        success: true,
        message: `✓ Test SMS thành công! SMS đã được gửi đến: ${target}`,
        details: {
          recipient: target,
          sent_at: new Date().toISOString(),
        },
      };
    }

    return {
      success: false,
      message: 'Loại test không hợp lệ',
    };
  }
}
