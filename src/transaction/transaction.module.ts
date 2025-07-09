import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { GeminiService } from 'src/gemini/gemini.service';

@Module({
  controllers: [TransactionController],
  providers: [TransactionService, PrismaService, GeminiService],
})
export class TransactionModule {}
