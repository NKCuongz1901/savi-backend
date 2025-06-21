import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { PrismaService } from './prisma/prisma.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { MailModule } from './mail/mail.module';
import { TransactionModule } from './transaction/transaction.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env'
    }),
    UserModule, 
    AuthModule, 
    MailModule, 
    TransactionModule
  ],
  controllers: [AppController],
  providers: [PrismaService, AppService],
})
export class AppModule {}
