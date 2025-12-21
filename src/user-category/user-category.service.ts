import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserCategoryDto } from './dto/create-user-category.dto';
import { UpdateUserCategoryDto } from './dto/update-user-category.dto';
import { TransactionType } from '@prisma/client';

@Injectable()
export class UserCategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, createUserCategoryDto: CreateUserCategoryDto) {
    const { name, type, isDefault = false } = createUserCategoryDto;

    // Kiểm tra xem category đã tồn tại chưa
    const existingCategory = await this.prisma.category.findFirst({
      where: {
        userId,
        name,
        type,
      },
    });

    if (existingCategory) {
      throw new BadRequestException('Category already exists');
    }

    const category = await this.prisma.category.create({
      data: {
        name,
        type,
        isDefault,
        userId,
      },
    });

    return {
      message: 'Category created successfully',
      data: category,
    };
  }

  async findAll(userId: string, type?: TransactionType) {
    const where: any = { userId };
    if (type) {
      where.type = type;
    }

    const categories = await this.prisma.category.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return {
      message: 'Categories fetched successfully',
      data: categories,
    };
  }

  async findOne(userId: string, id: string) {
    const category = await this.prisma.category.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return {
      message: 'Category fetched successfully',
      data: category,
    };
  }

  async update(userId: string, id: string, updateUserCategoryDto: UpdateUserCategoryDto) {
    const category = await this.prisma.category.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Kiểm tra xem tên mới có trùng với category khác không
    if (updateUserCategoryDto.name) {
      const existingCategory = await this.prisma.category.findFirst({
        where: {
          userId,
          name: updateUserCategoryDto.name,
          type: updateUserCategoryDto.type || category.type,
          NOT: { id },
        },
      });

      if (existingCategory) {
        throw new BadRequestException('Category name already exists');
      }
    }

    const updatedCategory = await this.prisma.category.update({
      where: { id },
      data: updateUserCategoryDto,
    });

    return {
      message: 'Category updated successfully',
      data: updatedCategory,
    };
  }

  async remove(userId: string, id: string) {
    const category = await this.prisma.category.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Kiểm tra xem category có đang được sử dụng trong transactions không
    const transactionCount = await this.prisma.transaction.count({
      where: {
        categoryId: id,
      },
    });

    if (transactionCount > 0) {
      throw new BadRequestException('Cannot delete category that is being used in transactions');
    }

    await this.prisma.category.delete({
      where: { id },
    });

    return {
      message: 'Category deleted successfully',
    };
  }
}
