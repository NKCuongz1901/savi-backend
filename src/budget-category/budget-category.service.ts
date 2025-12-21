import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBudgetCategoryDto } from './dto/create-budget-category.dto';
import { UpdateBudgetCategoryDto } from './dto/update-budget-category.dto';
import { TransactionType } from '@prisma/client';

@Injectable()
export class BudgetCategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async createBudget(
    createBudgetCategoryDto: CreateBudgetCategoryDto,
    userId: string,
  ) {
    const { userCategoryId, defaultCategoryId, amount, startDate, endDate } =
      createBudgetCategoryDto;

    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (userCategoryId && defaultCategoryId) {
      throw new BadRequestException(
        'Cannot use both userCategoryId and defaultCategoryId',
      );
    }

    if (!userCategoryId && !defaultCategoryId) {
      throw new BadRequestException(
        'Must provide either userCategoryId or defaultCategoryId',
      );
    }

    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    if (startDate >= endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    if (userCategoryId) {
      const category = await this.prisma.category.findFirst({
        where: {
          id: userCategoryId,
          userId: userId,
        },
      });

      if (!category) {
        throw new NotFoundException(
          'User category not found or does not belong to user',
        );
      }
    }

    if (defaultCategoryId) {
      const defaultCategory = await this.prisma.defaultCategory.findUnique({
        where: { id: defaultCategoryId },
      });

      if (!defaultCategory) {
        throw new NotFoundException('Default category not found');
      }
    }

    const existingBudget = await this.prisma.categoryBudget.findFirst({
      where: {
        userId,
        ...(userCategoryId
          ? { categoryId: userCategoryId }
          : { defaultCategoryId: defaultCategoryId }),
        OR: [
          {
            AND: [
              { startDate: { lte: startDate } },
              { endDate: { gte: startDate } }
            ]
          },
          {
            AND: [
              { startDate: { lte: endDate } },
              { endDate: { gte: endDate } }
            ]
          },
          {
            AND: [
              { startDate: { gte: startDate } },
              { endDate: { lte: endDate } }
            ]
          }
        ]
      },
    });

    if (existingBudget) {
      throw new BadRequestException(
        'Budget already exists for this category and duration',
      );
    }

    const budget = await this.prisma.categoryBudget.create({
      data: {
        userId: userId,
        categoryId: userCategoryId,
        defaultCategoryId: defaultCategoryId,
        startDate: startDate,
        endDate: endDate,
        amount: amount,
      },
    });

    // Sau khi tạo budget, kiểm tra các transaction EXPENSE đã tồn tại trong khoảng thời gian này
    // để cập nhật usage ban đầu
    const where: any = {
      userId: userId,
      date: {
        gte: startDate, // transaction.date >= startDate
        lte: endDate,   // transaction.date <= endDate
      },
      type: TransactionType.EXPENSE,
    };

    // Thêm điều kiện category
    if (userCategoryId) {
      where.categoryId = userCategoryId;
      where.defaultCategoryId = null;
    } else if (defaultCategoryId) {
      where.defaultCategoryId = defaultCategoryId;
      where.categoryId = null;
    }

    // Lấy tất cả transaction EXPENSE trong khoảng thời gian của budget
    const existingTransactions = await this.prisma.transaction.findMany({
      where,
      select: {
        amount: true,
      },
    });

    // Tính tổng số tiền đã chi trong khoảng thời gian này
    let totalUsage = 0;
    existingTransactions.forEach((transaction) => {
      totalUsage += Number(transaction.amount);
    });

    // Cập nhật usage của budget nếu có transaction
    if (totalUsage > 0) {
      await this.prisma.categoryBudget.update({
        where: { id: budget.id },
        data: {
          usage: totalUsage,
        },
      });
      console.log('Budget usage initialized:', {
        budgetId: budget.id,
        initialUsage: totalUsage,
        transactionCount: existingTransactions.length,
      });
    }

    return {
      message: 'Budget created successfully',
      data: budget,
    };
  }

  async getUserBudgets(userId: string) {
    const budgets = await this.prisma.categoryBudget.findMany({
      where: {
        userId,
      },
      include: {
        category: true,
        defaultCategory: true,
      },
    });

    return {
      message: 'Budgets fetched successfully',
      data: budgets,
    }
  }

  async getTransactionsForBudget(budgetId: string, userId: string) {
    // Lấy budget và kiểm tra sở hữu
    const budget = await this.prisma.categoryBudget.findUnique({
      where: { id: budgetId },
      select: {
        id: true,
        userId: true,
        categoryId: true,
        defaultCategoryId: true,
        startDate: true,
        endDate: true,
        amount: true,
        usage: true,
      }
    });

    console.log('Budget:', budget);
  
    if (!budget) {
      throw new NotFoundException('Budget not found');
    }
  
    // Kiểm tra budget thuộc về user
    if (budget.userId !== userId) {
      throw new BadRequestException('Budget does not belong to user');
    }
  
    
    
    const where: any = {
      userId: userId,
      date: {
        gte: budget.startDate, // transaction.date >= startDate
        lte: budget.endDate,   // transaction.date <= endDate
      },
      type: TransactionType.EXPENSE, 
    };
  
    
    if (budget.categoryId) {
      where.categoryId = budget.categoryId;
      
      where.defaultCategoryId = null;
    } else if (budget.defaultCategoryId) {
      where.defaultCategoryId = budget.defaultCategoryId;
      
      where.categoryId = null;
    }
  
    // Lấy transactions
    const transactions = await this.prisma.transaction.findMany({
      where,
      include: {
        category: true,
        defaultCategory: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    console.log('Transactions:', transactions);
  
    return {
      message: 'Transactions fetched successfully',
      data: {
        budget: {
          id: budget.id,
          amount: budget.amount,
          usage: budget.usage,
          startDate: budget.startDate,
          endDate: budget.endDate,
        },
        transactions: transactions,
      },
    };
  }

  async updateBudget(budgetId: string, updateBudgetCategoryDto: UpdateBudgetCategoryDto) {
    const budget = await this.prisma.categoryBudget.findUnique({
      where:{
        id: budgetId,
      }
    })
    if (!budget) {
      throw new NotFoundException('Budget not found');
    }
    const updatedBudget = await this.prisma.categoryBudget.update({
      where: { id: budgetId },
      data: updateBudgetCategoryDto,
    });
    return {
      message: 'Budget updated successfully',
      data: updatedBudget,
    }
  }

  async deleteBudget(budgetId: string) {
    const budget = await this.prisma.categoryBudget.findUnique({
      where: { id: budgetId },
    });
    if (!budget) {
      throw new NotFoundException('Budget not found');
    }
    await this.prisma.categoryBudget.delete({ where: { id: budgetId } });
    return {
      message: 'Budget deleted successfully',
      data: budget,
    }
  }
}


