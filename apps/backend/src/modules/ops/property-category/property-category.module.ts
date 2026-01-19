import { Module } from '@nestjs/common';
import { PropertyCategoryController } from './property-category.controller';
import { PropertyCategoryService } from './property-category.service';
import { PrismaModule } from '../../platform/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PropertyCategoryController],
  providers: [PropertyCategoryService],
  exports: [PropertyCategoryService],
})
export class PropertyCategoryModule {}
