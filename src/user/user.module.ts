import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { MailService } from 'src/mail/mail.service';
import { WalletService } from 'src/wallet/wallet.service';

@Module({
  controllers: [UserController],
  providers: [UserService, PrismaService, MailService, WalletService],
  exports: [UserService]
})
export class UserModule {}
