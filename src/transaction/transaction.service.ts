import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { editTransactionDto } from './dto/edit-transaction';
import { GeminiService } from 'src/gemini/gemini.service';

@Injectable()
export class TransactionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly geminiService: GeminiService
  ) {}

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

  async editTransaction(editTransactionDto: editTransactionDto, transactionId: string) {
    const { type, amount, note, date, userCategoryId, defaultCategoryId } = editTransactionDto;

    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId }
    });
    if(!transaction){
      throw new BadRequestException('Transaction not found');
    }

    const updatedTransaction = await this.prisma.transaction.update({
      where: {id: transactionId},
      data:{
        type,
        amount,
        note,
        date: date || new Date(),
        category: userCategoryId ? { connect: { id: userCategoryId } } : undefined,
        defaultCategory: defaultCategoryId ? { connect: { id: defaultCategoryId } } : undefined
      },
      include: {
        category: true,
        defaultCategory: true
      }
    })

    return {
      message: 'Transaction updated successfully',
      data: updatedTransaction
    }
  }

async deleteTransaction(transactionId: string) {
  
  const transaction = await this.prisma.transaction.findUnique({
    where: {id: transactionId}
  });
  if(!transaction){
    throw new BadRequestException('Transaction not found');
  }

  const deletedTransaction = await this.prisma.transaction.delete({
    where: {id: transactionId}
  })

  return {
    message: 'Transaction deleted successfully',
    data: deletedTransaction
  }


}
  

    
  


}
