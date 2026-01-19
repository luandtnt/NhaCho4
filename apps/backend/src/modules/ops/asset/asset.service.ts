import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';

@Injectable()
export class AssetService {
  constructor(private prisma: PrismaService) {}

  async create(orgId: string, dto: CreateAssetDto) {
    // Reject obviously invalid asset_types (starting with __)
    if (dto.asset_type.startsWith('__')) {
      throw new BadRequestException({
        error_code: 'VALIDATION_ERROR',
        message: `Invalid asset_type: ${dto.asset_type}. Asset type cannot start with '__'`,
      });
    }

    // Validate asset_type against active ConfigBundle (if exists)
    const activeConfig = await this.prisma.configBundle.findFirst({
      where: {
        org_id: orgId,
        status: 'ACTIVE',
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    if (activeConfig) {
      const config = activeConfig.config as any;
      const assetTypes = config?.asset_types || {};
      
      // Validate asset_type if config has asset_types defined
      if (Object.keys(assetTypes).length > 0 && !assetTypes[dto.asset_type]) {
        throw new BadRequestException({
          error_code: 'VALIDATION_ERROR',
          message: `Invalid asset_type: ${dto.asset_type}. Must be one of: ${Object.keys(assetTypes).join(', ')}`,
        });
      }
    }

    const asset = await this.prisma.asset.create({
      data: {
        org_id: orgId,
        asset_type: dto.asset_type,
        name: dto.name,
        address_json: dto.address_json || {},
        attrs: dto.attrs || {},
        status: 'ACTIVE',
      },
    });

    return asset;
  }

  async findAll(orgId: string, page: number = 1, pageSize: number = 20, status?: string) {
    const pageNum = Number(page) || 1;
    const pageSizeNum = Number(pageSize) || 20;
    const skip = (pageNum - 1) * pageSizeNum;
    const where: any = { org_id: orgId };

    // By default, exclude ARCHIVED assets unless explicitly requested
    if (status) {
      where.status = status;
    } else {
      // Default: only show active assets (not ARCHIVED/soft deleted)
      where.status = {
        not: 'ARCHIVED',
      };
    }

    const [assets, total] = await Promise.all([
      this.prisma.asset.findMany({
        where,
        skip,
        take: pageSizeNum,
        orderBy: { created_at: 'desc' },
        include: {
          space_nodes: {
            where: { parent_id: null }, // Only root nodes
            select: {
              id: true,
              node_type: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.asset.count({ where }),
    ]);

    return {
      data: assets,
      meta: {
        page: pageNum,
        page_size: pageSizeNum,
        total,
        total_pages: Math.ceil(total / pageSizeNum),
      },
    };
  }

  async findOne(orgId: string, id: string) {
    const asset = await this.prisma.asset.findFirst({
      where: {
        id,
        org_id: orgId,
      },
      include: {
        space_nodes: {
          where: { parent_id: null },
        },
      },
    });

    if (!asset) {
      throw new NotFoundException({
        error_code: 'NOT_FOUND',
        message: 'Asset not found',
      });
    }

    return asset;
  }

  async update(orgId: string, id: string, dto: UpdateAssetDto) {
    await this.findOne(orgId, id);

    const asset = await this.prisma.asset.update({
      where: { id },
      data: {
        name: dto.name,
        address_json: dto.address_json,
        status: dto.status,
        attrs: dto.attrs,
      },
    });

    return asset;
  }

  async remove(orgId: string, id: string) {
    await this.findOne(orgId, id);

    await this.prisma.asset.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });

    return { message: 'Asset archived successfully' };
  }
}
