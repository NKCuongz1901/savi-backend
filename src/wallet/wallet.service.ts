import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateWalletDto } from './dto/update-wallet.dto';

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  async createWallet(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {id: userId},
    });
    if(!user){
      throw new NotFoundException('User not found');
    }

    const wallet = await this.prisma.wallet.create({
      data:{
        userId: userId,
      }
    });
    return {
      message: 'Wallet created successfully',
      data: wallet,
    }
  }

  async getWallet(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: {userId: userId},
    });
    if(!wallet){
      throw new NotFoundException('Wallet not found');
    }
    return {
      message: 'Wallet fetched successfully',
      data: wallet,
    }
  }

  async updateWallet(userId: string, updateWalletDto: UpdateWalletDto) {
    const wallet = await this.getWallet(userId);
    if(!wallet){
      throw new NotFoundException('Wallet not found');
    }
    const updateWallet = await this.prisma.wallet.update({
      where: {userId: userId},
      data:{
        totalExpense: updateWalletDto.totalExpense,
        totalIncome: updateWalletDto.totalIncome,
        totalBalance: updateWalletDto.totalBalance,
      }
    })
    return {
      message: 'Wallet updated successfully',
      data: updateWallet,
    }
  }
}
