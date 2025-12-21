import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { comparePasswordHelper, generateRandomCode, getExpirationTime, hashPasswordHelper } from 'src/utils/helpers';
import { AccountType, UserStatus } from '@prisma/client';
import { MailService } from 'src/mail/mail.service';
import { WalletService } from 'src/wallet/wallet.service';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly walletService: WalletService
  ) {}

  async isEmailExist(email: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: email
      }
    })
    return !!user;
  }

  async createUser(createUserDto: CreateUserDto) {
    const {fullName, email, password} = createUserDto;
    const hashedPassword = await hashPasswordHelper(password);

    const existingUser = await this.isEmailExist(email);
    if(existingUser){
      throw new BadRequestException('Email already exists');
    }

    const verificationCode = generateRandomCode();
    const expirationTime = getExpirationTime(10);

    const user = await this.prisma.user.create({
      data: {
        fullName,
        email,
        password: hashedPassword,
        accountType: AccountType.EMAIL,
        codeID: verificationCode,
        codeExpired: expirationTime
      }
    })
    await this.walletService.createWallet(user.id);

    await this.mailService.sendVerificationEmail(fullName, verificationCode, email);

    return {
      message: 'User created successfully',
      data: user
    }

  }

  async verifyEmail(codeID: string, email: string){
    // Validate inputs
    if (!email || !codeID) {
      throw new BadRequestException('Email and verification code are required');
    }

    const trimmedEmail = email.trim();
    const trimmedCode = codeID.trim();

    if (!trimmedEmail || !trimmedCode) {
      throw new BadRequestException('Email and verification code cannot be empty');
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      throw new BadRequestException('Invalid email format');
    }

    // Find user by email AND codeID - đảm bảo codeID thuộc về email này
    const user = await this.prisma.user.findFirst({
      where: {
        email: trimmedEmail,
        codeID: trimmedCode,
        codeExpired: {
          gt: new Date() 
        },
        status: UserStatus.INACTIVE // Chỉ verify user chưa active
      }
    });

    console.log('Verifying email:', trimmedEmail, 'with code:', trimmedCode);
    console.log('Found user:', user);

    if(!user){
      throw new BadRequestException('Invalid or expired verification code');
    }

    // Update user status to active
    const updatedUser = await this.prisma.user.update({
      where:{id: user.id},
      data:{
        status: UserStatus.ACTIVE,
        codeID: null,
        codeExpired: null
      }
    })

    return {
      message: 'Email verified successfully',
      data: updatedUser
    }
  }

  async changePassword(userEmail: string, newPassword: string, oldPassword: string) {
    const user = await this.prisma.user.findUnique({
      where:{email: userEmail}
    })
    if(!user){
      throw new BadRequestException('User not found');
    }
  
    const isPasswordValid = await comparePasswordHelper(oldPassword, user?.password || '');
    if(!isPasswordValid){
      throw new BadRequestException('Old password is incorrect');
    }
    console.log(isPasswordValid);
  
    const hashedPassword = await hashPasswordHelper(newPassword);
    const updatedUser = await this.prisma.user.update({
      where:{id: user.id},
      data:{password: hashedPassword}
    })
    return {
      message: 'Password changed successfully',
      data: updatedUser
    }
  }

  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new BadRequestException('User not found');
  
    const code = generateRandomCode();
    const expires = getExpirationTime(10); // 10 phút
    await this.prisma.user.update({
      where: { id: user.id },
      data: { codeID: code, codeExpired: expires },
    });
  
    await this.mailService.sendVerificationEmail(user.fullName ?? '', code, email);
    return { message: 'Reset code sent to email' };
  }
  
  async resetPassword(email: string, code: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({
      where: { email, codeID: code, codeExpired: { gt: new Date() } },
    });
    if (!user) throw new BadRequestException('Invalid or expired code');
  
    const hashed = await hashPasswordHelper(newPassword);
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashed, codeID: null, codeExpired: null },
    });
  
    return { message: 'Password reset successfully', data: { id: updatedUser.id, email: updatedUser.email } };
  }

}
