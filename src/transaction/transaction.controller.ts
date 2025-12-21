import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { editTransactionDto } from './dto/edit-transaction';

@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  createTransaction(@Body() createTransactionDto: CreateTransactionDto, @Request() req) {
    const userId = req.user.userId;
    return this.transactionService.createTransaction(createTransactionDto, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('ai-create')
  createTransactionFromAI(@Body() body: {transcript: string}, @Request() req){
    const userId = req.user.userId;
    return this.transactionService.createTransactionFromAI(body.transcript, userId);
  }


  @UseGuards(JwtAuthGuard)
  @Get(':userId/transactions')
  getAllTransactions(
    @Request() req,
    @Query('type') type?: 'INCOME' | 'EXPENSE',
    @Query('createdAtStart') createdAtStart?: string,
    @Query('createdAtEnd') createdAtEnd?: string,
    @Query('categoryId') categoryId?: string,
    @Query('defaultCategoryId') defaultCategoryId?: string,
  ) {
    const userId = req.user.userId;
    return this.transactionService.getAllTransactions(userId, {
      type,
      createdAtStart,
      createdAtEnd,
      categoryId,
      defaultCategoryId,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get(':transactionId')
  getTransactionById(@Param('transactionId') transactionId: string) {
    return this.transactionService.getTransactionById(transactionId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':transactionId')
  editTransaction(@Body() editTransactionDto: editTransactionDto, @Param('transactionId') transactionId: string) {
    return this.transactionService.editTransaction(editTransactionDto, transactionId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':transactionId')
  deleteTransaction(@Param('transactionId') transactionId: string) {
    return this.transactionService.deleteTransaction(transactionId);
  }
}
