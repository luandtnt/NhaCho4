import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBundleDto } from './dto/create-bundle.dto';

@Injectable()
export class ConfigService {
  constructor(private prisma: PrismaService) {}

  async create(orgId: string, dto: CreateBundleDto) {
    // Check for duplicate bundle_id + version
    const existing = await this.prisma.configBundle.findFirst({
      where: {
        org_id: orgId,
        bundle_id: dto.bundle_id,
        version: dto.version,
      },
    });

    if (existing) {
      throw new BadRequestException({
        error_code: 'VALIDATION_ERROR',
        message: 'Config bundle with this bundle_id and version already exists',
      });
    }

    return this.prisma.configBundle.create({
      data: {
        org_id: orgId,
        bundle_id: dto.bundle_id,
        version: dto.version,
        status: dto.status || 'DRAFT',
        config: dto.config,
      },
    });
  }

  async list(orgId: string) {
    return this.prisma.configBundle.findMany({
      where: { org_id: orgId },
      orderBy: { created_at: 'desc' },
    });
  }

  async get(orgId: string, id: string) {
    const bundle = await this.prisma.configBundle.findFirst({
      where: {
        id,
        org_id: orgId,
      },
    });

    if (!bundle) {
      throw new NotFoundException({
        error_code: 'NOT_FOUND',
        message: 'Config bundle not found',
      });
    }

    return bundle;
  }

  async activate(orgId: string, id: string) {
    const bundle = await this.get(orgId, id);

    // Deactivate all other bundles
    await this.prisma.configBundle.updateMany({
      where: {
        org_id: orgId,
        status: 'ACTIVE',
      },
      data: {
        status: 'ARCHIVED',
      },
    });

    // Activate this bundle
    return this.prisma.configBundle.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });
  }

  async rollback(orgId: string, id: string) {
    // Find the bundle to rollback to
    const targetBundle = await this.get(orgId, id);

    if (targetBundle.status === 'ACTIVE') {
      throw new BadRequestException({
        error_code: 'VALIDATION_ERROR',
        message: 'This bundle is already active',
      });
    }

    // Deactivate current active bundle
    await this.prisma.configBundle.updateMany({
      where: {
        org_id: orgId,
        status: 'ACTIVE',
      },
      data: {
        status: 'ARCHIVED',
      },
    });

    // Activate target bundle
    return this.prisma.configBundle.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });
  }
}
