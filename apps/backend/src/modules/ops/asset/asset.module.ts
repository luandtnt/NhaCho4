import { Module } from '@nestjs/common';
import { AssetController } from './asset.controller';
import { AssetService } from './asset.service';
import { PrismaModule } from '../../platform/prisma/prisma.module';
import { AuditModule } from '../../platform/audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [AssetController],
  providers: [AssetService],
  exports: [AssetService],
})
export class AssetModule {}
