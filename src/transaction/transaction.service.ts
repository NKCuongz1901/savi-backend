import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TransactionService {
  constructor(private readonly prisma: PrismaService) {}

  async createTransaction(createTransactionDto: CreateTransactionDto, userId: string) {
    const { type, amount, note, date, userCategoryId, defaultCategoryId } = createTransactionDto;

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

    return {
      message: 'Transaction created successfully',
      data: transaction
    }
  }

  async getAllTransactions(userId:string){
    const transactions = await this.prisma.transaction.findMany({
      where:{
        userId: userId
      },
      include:{
        category: true,
        defaultCategory: true
      },
      orderBy:{
        date: 'desc'
      }
    })

    return {
      message: 'Transactions fetched successfully',
      data: transactions
    }
  }
    

    
  


}
