import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { GeminiService } from 'src/gemini/gemini.service';
import { WalletService } from 'src/wallet/wallet.service';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

@Module({
  imports: [CloudinaryModule],
  controllers: [TransactionController],
  providers: [TransactionService, PrismaService, GeminiService, WalletService],
  exports: [TransactionService],
})
export class TransactionModule {}
