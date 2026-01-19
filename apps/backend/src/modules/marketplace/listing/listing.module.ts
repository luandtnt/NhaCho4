import { Module } from '@nestjs/common';
import { ListingController } from './listing.controller';
import { ListingService } from './listing.service';
import { PrismaModule } from '../../platform/prisma/prisma.module';
import { AuditModule } from '../../platform/audit/audit.module';
import { MarketplacePublicController } from '../marketplace-public.controller';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [ListingController, MarketplacePublicController],
  providers: [ListingService],
  exports: [ListingService],
})
export class ListingModule {}
