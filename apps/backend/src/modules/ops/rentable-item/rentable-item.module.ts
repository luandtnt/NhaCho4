import { Module } from '@nestjs/common';
import { RentableItemController } from './rentable-item.controller';
import { RentableItemService } from './rentable-item.service';
import { PrismaModule } from '../../platform/prisma/prisma.module';
import { AuditModule } from '../../platform/audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [RentableItemController],
  providers: [RentableItemService],
  exports: [RentableItemService],
})
export class RentableItemModule {}
