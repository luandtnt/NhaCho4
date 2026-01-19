import { Module } from '@nestjs/common';
import { SpaceNodeController } from './space-node.controller';
import { SpaceNodeService } from './space-node.service';
import { PrismaModule } from '../../platform/prisma/prisma.module';
import { AuditModule } from '../../platform/audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [SpaceNodeController],
  providers: [SpaceNodeService],
  exports: [SpaceNodeService],
})
export class SpaceNodeModule {}
