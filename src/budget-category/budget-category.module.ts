import { Module } from '@nestjs/common';
import { BudgetCategoryService } from './budget-category.service';
import { BudgetCategoryController } from './budget-category.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [BudgetCategoryController],
  providers: [BudgetCategoryService, PrismaService],
})
export class BudgetCategoryModule {}
