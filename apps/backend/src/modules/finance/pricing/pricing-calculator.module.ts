import { Module } from '@nestjs/common';
import { PricingCalculatorService } from './pricing-calculator.service';
import { PricingCalculatorController } from './pricing-calculator.controller';
import { PrismaModule } from '../../platform/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PricingCalculatorController],
  providers: [PricingCalculatorService],
  exports: [PricingCalculatorService],
})
export class PricingCalculatorModule {}
