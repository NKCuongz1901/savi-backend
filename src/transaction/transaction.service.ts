import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { editTransactionDto } from './dto/edit-transaction';
import { GeminiService } from 'src/gemini/gemini.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { WalletService } from 'src/wallet/wallet.service';
import { TransactionType } from '@prisma/client';

@Injectable()
export class TransactionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly geminiService: GeminiService,
    private readonly walletService: WalletService,
    private readonly cloudinaryService: CloudinaryService
  ) {}

  

  async createTransaction(createTransactionDto: CreateTransactionDto, userId: string) {
    const { type, amount, note, date, imageUrl, userCategoryId, defaultCategoryId, imageData } = createTransactionDto;

    const user = await this.prisma.user.findUnique({
      where:{
        id: userId
      }
    });
    if(!user){
      throw new NotFoundException('User not found');
    }

    if(userCategoryId && defaultCategoryId){
      throw new BadRequestException('Cannot use both userCategoryId and defaultCategoryId');
    }

    if(!userCategoryId && !defaultCategoryId){
      throw new BadRequestException('Must provide either userCategoryId or defaultCategoryId');
    }

    if (userCategoryId) {
      const category = await this.prisma.category.findFirst({
        where: { 
          id: userCategoryId,
          userId: userId
        }
      });

      if (!category) {
        throw new NotFoundException('User category not found or does not belong to user');
      }
    }

    
    if (defaultCategoryId) {
      const defaultCategory = await this.prisma.defaultCategory.findUnique({
        where: { id: defaultCategoryId }
      });

      if (!defaultCategory) {
        throw new NotFoundException('Default category not found');
      }
    }

     
     const transactionData: any = {
      type,
      amount,
      note,
      date: date || new Date(),
      user: {
        connect: { id: userId }
      }
    };


    // Prefer imageData (data URL), fallback to imageUrl
    if (imageData) {
      const uploadResult = await this.cloudinaryService.uploadImageFromData(imageData);
      transactionData.image = uploadResult.secure_url;
    } else if (imageUrl) {
      const uploadResult = await this.cloudinaryService.uploadImageFromUrl(imageUrl);
      transactionData.image = uploadResult.secure_url;
    }

    
    if (userCategoryId) {
      transactionData.category = {
        connect: { id: userCategoryId }
      };
    }

    if (defaultCategoryId) {
      transactionData.defaultCategory = {
        connect: { id: defaultCategoryId }
      };
    }


    const transaction = await this.prisma.transaction.create({
      data: transactionData,
      include: {
        category: true,
        defaultCategory: true
      }
        
    })

    const wallet = await this.walletService.getWallet(userId);
    if(!wallet){
      throw new NotFoundException('Wallet not found');
    }
    if(type === TransactionType.EXPENSE){
      await this.walletService.updateWallet(userId, {
        totalExpense: wallet.data.totalExpense.plus(amount).toNumber(),
        totalBalance: wallet.data.totalBalance.minus(amount).toNumber()
      })
    }else{
      await this.walletService.updateWallet(userId, {
        totalIncome: wallet.data.totalIncome.plus(amount).toNumber(),
        totalBalance: wallet.data.totalBalance.plus(amount).toNumber()
      })
    }

    if (type === TransactionType.EXPENSE) {
      // Lấy transaction date để tìm budget có date range chứa nó
      const transactionDate = transaction.date;
      
      // Tìm budget theo category VÀ date range chứa transaction date
      const budget = await this.prisma.categoryBudget.findFirst({
        where: {
          userId: userId,
          ...(transaction.categoryId
            ? { categoryId: transaction.categoryId }
            : { defaultCategoryId: transaction.defaultCategoryId }),
          // Thêm điều kiện date range: transaction date phải nằm trong khoảng startDate-endDate
          startDate: {
            lte: transactionDate, // startDate <= transactionDate
          },
          endDate: {
            gte: transactionDate, // endDate >= transactionDate
          },
        },
      });

      console.log('Found budget:', budget);

      // Nếu tìm thấy budget thì cập nhật usage (không cần kiểm tra date range nữa vì đã filter trong query)
      if (budget) {
        await this.prisma.categoryBudget.update({
          where: { id: budget.id },
          data: {
            usage: budget.usage.plus(amount)
          }
        });
        console.log('Budget usage updated:', {
          budgetId: budget.id,
          oldUsage: budget.usage.toString(),
          amountAdded: amount,
          newUsage: budget.usage.plus(amount).toString(),
        });
      } else {
        console.log('No budget found for this category and date range');
      }
    }

    

    return {
      message: 'Transaction created successfully',
      data: transaction
    }
  }

  async createTransactionFromAI(transcript: string, userId: string) {
    const user = await this.prisma.user.findUnique({where: {id: userId}});
    if(!user){
      throw new BadRequestException('User not found');
    }

    const geminiResponse = await this.geminiService.ConvertText(transcript);
    const convertedData = JSON.parse(geminiResponse ?? '');

    const defaultCategory = await this.prisma.defaultCategory.findFirst({
      where: {name: convertedData.category}
    })
    if(!defaultCategory){
      throw new BadRequestException('Default category not found');
    }

    const transactionData = {
      type: convertedData.type,
      amount: convertedData.amount,
      note: convertedData.note,
      date: new Date(),
      user: {
        connect: { id: userId }
      },
      defaultCategory: {
        connect: { id: defaultCategory.id }
      }
    };

    const transaction = await this.prisma.transaction.create({
      data: transactionData,
      include: {
        category: true,
        defaultCategory: true
      }
    });

    const wallet = await this.walletService.getWallet(userId);
    if(!wallet){
      throw new NotFoundException('Wallet not found');
    }
    if(convertedData.type === TransactionType.EXPENSE){
      await this.walletService.updateWallet(userId, {
        totalExpense: wallet.data.totalExpense.plus(convertedData.amount).toNumber(),
        totalBalance: wallet.data.totalBalance.minus(convertedData.amount).toNumber()
      })
    }else{
      await this.walletService.updateWallet(userId, {
        totalIncome: wallet.data.totalIncome.plus(convertedData.amount).toNumber(),
        totalBalance: wallet.data.totalBalance.plus(convertedData.amount).toNumber()
      })
    }

    if (convertedData.type === TransactionType.EXPENSE) {
      // Lấy transaction date để tìm budget có date range chứa nó
      const transactionDate = transaction.date;
      
      // Tìm budget theo category VÀ date range chứa transaction date
      const budget = await this.prisma.categoryBudget.findFirst({
        where: {
          userId: userId,
          defaultCategoryId: transaction.defaultCategoryId,
          // Thêm điều kiện date range: transaction date phải nằm trong khoảng startDate-endDate
          startDate: {
            lte: transactionDate, // startDate <= transactionDate
          },
          endDate: {
            gte: transactionDate, // endDate >= transactionDate
          },
        }
      });

      // Nếu tìm thấy budget thì cập nhật usage (không cần kiểm tra date range nữa vì đã filter trong query)
      if (budget) {
        await this.prisma.categoryBudget.update({
          where: { id: budget.id },
          data: {
            usage: budget.usage.plus(convertedData.amount),
          }
        });
        console.log('Budget usage updated:', {
          budgetId: budget.id,
          oldUsage: budget.usage.toString(),
          amountAdded: convertedData.amount,
          newUsage: budget.usage.plus(convertedData.amount).toString(),
        });
      } else {
        console.log('No budget found for this category and date range');
      }
    }

    

    return {
      message: 'Transaction created successfully',
      data: transaction
    }
  }

  async getAllTransactions(
    userId: string,
    filters?: {
      type?: 'INCOME' | 'EXPENSE';
      createdAtStart?: string;
      createdAtEnd?: string;
      categoryId?: string;          // user category
      defaultCategoryId?: string;   // default category
    }
  ) {
    const where: any = {
      userId: userId
    };

    if (filters?.type) {
      where.type = filters.type as TransactionType;
    }

    if (filters?.createdAtStart || filters?.createdAtEnd) {
      where.date = {};
      if (filters.createdAtStart) {
        // Parse date string thành UTC date
        // Nếu input là "2025-11-06", tạo UTC date cho 00:00:00
        let gte: Date;
        if (filters.createdAtStart.includes('T')) {
          // Nếu có T (ISO format), parse trực tiếp
          gte = new Date(filters.createdAtStart);
        } else {
          // Nếu chỉ có date (YYYY-MM-DD), tạo UTC date
          const [year, month, day] = filters.createdAtStart.split('-').map(Number);
          gte = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
        }
        if (isNaN(gte.getTime())) throw new BadRequestException('Invalid startDate');
        where.date.gte = gte;
      }
      if (filters.createdAtEnd) {
        // Parse date string thành UTC date
        // Nếu input là "2025-11-06", tạo UTC date cho 23:59:59.999
        let lte: Date;
        if (filters.createdAtEnd.includes('T')) {
          // Nếu có T (ISO format), parse trực tiếp
          lte = new Date(filters.createdAtEnd);
          lte.setUTCHours(23, 59, 59, 999); // Set về cuối ngày UTC
        } else {
          // Nếu chỉ có date (YYYY-MM-DD), tạo UTC date
          const [year, month, day] = filters.createdAtEnd.split('-').map(Number);
          lte = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
        }
        if (isNaN(lte.getTime())) throw new BadRequestException('Invalid endDate');
        where.date.lte = lte;
      }
    }

    // Category filters
    if (filters?.categoryId && filters?.defaultCategoryId) {
      throw new BadRequestException('Cannot filter by both categoryId and defaultCategoryId');
    }
    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }
    if (filters?.defaultCategoryId) {
      where.defaultCategoryId = filters.defaultCategoryId;
    }

    const transactions = await this.prisma.transaction.findMany({
      where,
      include:{
        category: true,
        defaultCategory: true
      },
      orderBy:{
        date: 'desc'
      }
    });

    return {
      message: 'Transactions fetched successfully',
      data: transactions
    };
  }

  async getTransactionById(transactionId: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId }
    });
    if(!transaction){
      throw new BadRequestException('Transaction not found');
    }
    return {
      message: 'Transaction fetched successfully',
      data: transaction
    }
  }

  async editTransaction(editTransactionDto: editTransactionDto, transactionId: string) {
    const { type, amount, note, date, userCategoryId, defaultCategoryId } = editTransactionDto;

    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
    });
    if (!transaction) {
      throw new BadRequestException('Transaction not found');
    }

    // Validate category inputs
    if (userCategoryId && defaultCategoryId) {
      throw new BadRequestException('Cannot use both userCategoryId and defaultCategoryId');
    }

    // Validate user category belongs to the same user
    if (userCategoryId) {
      const category = await this.prisma.category.findFirst({
        where: {
          id: userCategoryId,
          userId: transaction.userId,
        },
      });
      if (!category) {
        throw new BadRequestException('User category not found or does not belong to user');
      }
    }

    // Validate default category exists
    if (defaultCategoryId) {
      const defaultCategory = await this.prisma.defaultCategory.findUnique({
        where: { id: defaultCategoryId },
      });
      if (!defaultCategory) {
        throw new BadRequestException('Default category not found');
      }
    }

    // Compute wallet deltas if type or amount change
    const oldType = transaction.type;
    const oldAmount = Number(transaction.amount);
    const newType = (type ?? oldType) as TransactionType;
    const newAmount = Number(amount ?? oldAmount);

    // Only adjust wallet when (type or amount) is changed
    if (newType !== oldType || newAmount !== oldAmount) {
      const wallet = await this.walletService.getWallet(transaction.userId);
      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      const currentIncome = wallet.data.totalIncome.toNumber();
      const currentExpense = wallet.data.totalExpense.toNumber();
      const currentBalance = wallet.data.totalBalance.toNumber();

      // Remove old effect
      let updatedIncome = currentIncome;
      let updatedExpense = currentExpense;
      let updatedBalance = currentBalance;

      if (oldType === TransactionType.EXPENSE) {
        updatedExpense -= oldAmount;
        updatedBalance += oldAmount;
      } else {
        updatedIncome -= oldAmount;
        updatedBalance -= oldAmount;
      }

      // Apply new effect
      if (newType === TransactionType.EXPENSE) {
        updatedExpense += newAmount;
        updatedBalance -= newAmount;
      } else {
        updatedIncome += newAmount;
        updatedBalance += newAmount;
      }

      await this.walletService.updateWallet(transaction.userId, {
        totalIncome: updatedIncome,
        totalExpense: updatedExpense,
        totalBalance: updatedBalance,
      });
    }

    // Budget usage adjustments
const newDate = date ? new Date(date) : transaction.date;
const newUserCategoryId = userCategoryId ?? transaction.categoryId;
const newDefaultCategoryId =
  defaultCategoryId ?? transaction.defaultCategoryId;

// 1) Gỡ usage cũ nếu transaction cũ là EXPENSE và nằm trong budget
if (oldType === TransactionType.EXPENSE) {
  const oldBudget = await this.prisma.categoryBudget.findFirst({
    where: {
      userId: transaction.userId,
      ...(transaction.categoryId
        ? { categoryId: transaction.categoryId, defaultCategoryId: null }
        : { defaultCategoryId: transaction.defaultCategoryId, categoryId: null }),
      startDate: { lte: transaction.date },
      endDate: { gte: transaction.date },
    },
  });

  if (oldBudget) {
    await this.prisma.categoryBudget.update({
      where: { id: oldBudget.id },
      data: { usage: oldBudget.usage.minus(oldAmount) },
    });
  }
}

// 2) Cộng usage mới nếu transaction mới là EXPENSE và nằm trong budget
if (newType === TransactionType.EXPENSE) {
  const newBudget = await this.prisma.categoryBudget.findFirst({
    where: {
      userId: transaction.userId,
      ...(newUserCategoryId
        ? { categoryId: newUserCategoryId, defaultCategoryId: null }
        : { defaultCategoryId: newDefaultCategoryId, categoryId: null }),
      startDate: { lte: newDate },
      endDate: { gte: newDate },
    },
  });

  if (newBudget) {
    await this.prisma.categoryBudget.update({
      where: { id: newBudget.id },
      data: { usage: newBudget.usage.plus(newAmount) },
    });
  }
}

    const updatedTransaction = await this.prisma.transaction.update({
      where: { id: transactionId },
      data: {
        type,
        amount,
        note,
        date: date ?? undefined,
        ...(userCategoryId
          ? {
              category: { connect: { id: userCategoryId } },
              defaultCategory: { disconnect: true },
            }
          : defaultCategoryId
          ? {
              defaultCategory: { connect: { id: defaultCategoryId } },
              category: { disconnect: true },
            }
          : {}),
      },
    });



    return {
      message: 'Transaction updated successfully',
      data: updatedTransaction,
    };
  }

async deleteTransaction(transactionId: string) {
  
  const transaction = await this.prisma.transaction.findUnique({
    where: {id: transactionId}
  });
  if(!transaction){
    throw new BadRequestException('Transaction not found');
  }

  // Hoàn lại wallet trước khi xóa transaction
  const wallet = await this.walletService.getWallet(transaction.userId);
  if(!wallet){
    throw new NotFoundException('Wallet not found');
  }

  const amount = Number(transaction.amount);

  // Hoàn lại wallet (ngược lại với khi tạo transaction)
  if(transaction.type === TransactionType.EXPENSE){
    // Khi tạo: totalExpense += amount, totalBalance -= amount
    // Khi xóa: totalExpense -= amount, totalBalance += amount
    await this.walletService.updateWallet(transaction.userId, {
      totalExpense: wallet.data.totalExpense.minus(amount).toNumber(),
      totalBalance: wallet.data.totalBalance.plus(amount).toNumber()
    })
  }else{
    // Khi tạo: totalIncome += amount, totalBalance += amount
    // Khi xóa: totalIncome -= amount, totalBalance -= amount
    await this.walletService.updateWallet(transaction.userId, {
      totalIncome: wallet.data.totalIncome.minus(amount).toNumber(),
      totalBalance: wallet.data.totalBalance.minus(amount).toNumber()
    })
  }

  // Nếu transaction là EXPENSE và có budget, cần trừ usage của budget đi
  if (transaction.type === TransactionType.EXPENSE) {
    // Tìm budget theo category
    const budget = await this.prisma.categoryBudget.findFirst({
      where: {
        userId: transaction.userId,
        ...(transaction.categoryId
          ? { categoryId: transaction.categoryId }
          : { defaultCategoryId: transaction.defaultCategoryId }),
      }
    });

    // Nếu tìm thấy budget, kiểm tra transaction date có nằm trong khoảng startDate-endDate
    if (budget) {
      const transactionDate = transaction.date;
      const isInRange = 
        budget.startDate <= transactionDate && 
        budget.endDate >= transactionDate;

      // Nếu transaction date nằm trong khoảng thì trừ usage
      if (isInRange) {
        await this.prisma.categoryBudget.update({
          where: { id: budget.id },
          data: {
            usage: budget.usage.minus(amount)
          }
        });
      }
    }
  }

  // Xóa transaction
  const deletedTransaction = await this.prisma.transaction.delete({
    where: {id: transactionId}
  })

  return {
    message: 'Transaction deleted successfully',
    data: deletedTransaction
  }


}
  

    
  


}
