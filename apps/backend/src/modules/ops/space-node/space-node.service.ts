import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { CreateSpaceNodeDto } from './dto/create-space-node.dto';
import { UpdateSpaceNodeDto } from './dto/update-space-node.dto';
import { PartyHelper } from '../../../common/helpers/party.helper';

@Injectable()
export class SpaceNodeService {
  constructor(private prisma: PrismaService) {}

  async create(orgId: string, userId: string, dto: CreateSpaceNodeDto) {
    // Verify asset belongs to org
    const asset = await this.prisma.asset.findFirst({
      where: {
        id: dto.asset_id,
        org_id: orgId,
      },
    });

    if (!asset) {
      throw new BadRequestException({
        error_code: 'VALIDATION_ERROR',
        message: 'Asset not found or does not belong to your organization',
      });
    }

    // Check landlord ownership for asset
    const userRole = await this.getUserRole(userId, orgId);
    if (userRole === 'Landlord') {
      const landlordPartyId = await PartyHelper.getLandlordPartyId(this.prisma, userId, orgId);
      if (landlordPartyId && asset.landlord_party_id !== landlordPartyId) {
        throw new BadRequestException({
          error_code: 'FORBIDDEN',
          message: 'You can only create space nodes for your own assets',
        });
      }
    }

    // Verify parent node if provided
    let parentPath = '';
    if (dto.parent_id) {
      const parent = await this.prisma.spaceNode.findFirst({
        where: {
          id: dto.parent_id,
          org_id: orgId,
          asset_id: dto.asset_id,
        },
      });

      if (!parent) {
        throw new BadRequestException({
          error_code: 'VALIDATION_ERROR',
          message: 'Parent node not found or does not belong to the same asset',
        });
      }

      parentPath = parent.path;
    }

    // Generate path
    const nodeCode = dto.name.toLowerCase().replace(/\s+/g, '-').substring(0, 20);
    const path = parentPath ? `${parentPath}/${nodeCode}` : `/${nodeCode}`;

    const spaceNode = await this.prisma.spaceNode.create({
      data: {
        org_id: orgId,
        asset_id: dto.asset_id,
        landlord_party_id: asset.landlord_party_id,
        parent_id: dto.parent_id || null,
        node_type: dto.node_type,
        name: dto.name,
        path,
        attrs: dto.attrs || {},
      },
    });

    return spaceNode;
  }

  private async getUserRole(userId: string, orgId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    return user?.role || '';
  }

  async findAll(orgId: string, userId: string, userRole: string, assetId?: string, page: number = 1, pageSize: number = 50) {
    const pageNum = Number(page) || 1;
    const pageSizeNum = Number(pageSize) || 50;
    const skip = (pageNum - 1) * pageSizeNum;
    const where: any = { org_id: orgId };

    // Role-based isolation
    if (userRole === 'Landlord') {
      const landlordPartyId = await PartyHelper.getLandlordPartyId(this.prisma, userId, orgId);
      if (landlordPartyId) {
        where.landlord_party_id = landlordPartyId;
      }
    }

    if (assetId) {
      where.asset_id = assetId;
    }

    const [nodes, total] = await Promise.all([
      this.prisma.spaceNode.findMany({
        where,
        skip,
        take: pageSizeNum,
        orderBy: { path: 'asc' },
        include: {
          asset: {
            select: {
              id: true,
              name: true,
            },
          },
          rentable_items: {
            select: {
              id: true,
              code: true,
              allocation_type: true,
            },
          },
        },
      }),
      this.prisma.spaceNode.count({ where }),
    ]);

    return {
      data: nodes,
      meta: {
        page: pageNum,
        page_size: pageSizeNum,
        total,
        total_pages: Math.ceil(total / pageSizeNum),
      },
    };
  }

  async findOne(orgId: string, id: string) {
    const node = await this.prisma.spaceNode.findFirst({
      where: {
        id,
        org_id: orgId,
      },
      include: {
        asset: true,
        parent: true,
        children: true,
        rentable_items: true,
      },
    });

    if (!node) {
      throw new NotFoundException({
        error_code: 'NOT_FOUND',
        message: 'Space node not found',
      });
    }

    return node;
  }

  async getTree(orgId: string, id: string) {
    const node = await this.findOne(orgId, id);

    // Get all descendants
    const descendants = await this.prisma.spaceNode.findMany({
      where: {
        org_id: orgId,
        path: {
          startsWith: node.path,
        },
      },
      orderBy: { path: 'asc' },
      include: {
        rentable_items: {
          select: {
            id: true,
            code: true,
            allocation_type: true,
          },
        },
      },
    });

    return {
      root: node,
      descendants,
    };
  }

  async update(orgId: string, id: string, dto: UpdateSpaceNodeDto) {
    await this.findOne(orgId, id);

    const node = await this.prisma.spaceNode.update({
      where: { id },
      data: {
        name: dto.name,
        attrs: dto.attrs,
      },
    });

    return node;
  }

  async remove(orgId: string, id: string) {
    const node = await this.findOne(orgId, id);

    // Check if node has children
    const childCount = await this.prisma.spaceNode.count({
      where: {
        parent_id: id,
      },
    });

    if (childCount > 0) {
      throw new BadRequestException({
        error_code: 'VALIDATION_ERROR',
        message: 'Cannot delete node with children. Delete children first.',
      });
    }

    // Check if node has rentable items
    const itemCount = await this.prisma.rentableItem.count({
      where: {
        space_node_id: id,
        status: 'ACTIVE', // Only check active items
      },
    });

    if (itemCount > 0) {
      throw new BadRequestException({
        error_code: 'VALIDATION_ERROR',
        message: 'Cannot delete node with rentable items. Delete items first.',
      });
    }

    await this.prisma.spaceNode.delete({
      where: { id },
    });

    return { message: 'Space node deleted successfully' };
  }
}
