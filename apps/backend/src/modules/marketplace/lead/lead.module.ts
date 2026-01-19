import { Module } from '@nestjs/common';
import { LeadController } from './lead.controller';
import { LeadService } from './lead.service';
import { PrismaModule } from '../../platform/prisma/prisma.module';
import { AuditModule } from '../../platform/audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [LeadController],
  providers: [LeadService],
  exports: [LeadService],
})
export class LeadModule {}
