import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { TransactionType } from '@prisma/client';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async getDefaultCategories(type?: 'INCOME' | 'EXPENSE') {
    const where: any = {};
    if (type) {
      if (type !== 'INCOME' && type !== 'EXPENSE') {
        throw new BadRequestException('Invalid type');
      }
      where.type = type as TransactionType;
    }

    const categories = await this.prisma.defaultCategory.findMany({
      where,
      orderBy: { name: 'asc' }
    });

    return {
      message: 'Default categories fetched successfully',
      data: categories
    };
  }
}
