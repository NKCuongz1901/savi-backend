import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  getWallet(@Request() req:any) {
    const userId = req.user.userId;
    return this.walletService.getWallet(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  createWallet(@Request() req:any) {
    const userId = req.user.userId;
    return this.walletService.createWallet(userId);
  }

  
}
