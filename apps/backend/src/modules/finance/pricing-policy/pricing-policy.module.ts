import { Module } from '@nestjs/common';
import { PricingPolicyController } from './pricing-policy.controller';
import { PricingPolicyService } from './pricing-policy.service';
import { PrismaModule } from '../../platform/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PricingPolicyController],
  providers: [PricingPolicyService],
  exports: [PricingPolicyService],
})
export class PricingPolicyModule {}
