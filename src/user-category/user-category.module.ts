import { Module } from '@nestjs/common';
import { UserCategoryService } from './user-category.service';
import { UserCategoryController } from './user-category.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [UserCategoryController],
  providers: [UserCategoryService, PrismaService],
})
export class UserCategoryModule {}
