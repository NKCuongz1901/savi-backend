import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { generateRandomCode, getExpirationTime, hashPasswordHelper } from 'src/utils/helpers';
import { AccountType, UserStatus } from '@prisma/client';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService
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

    await this.mailService.sendVerificationEmail(fullName, verificationCode, email);

    return {
      message: 'User created successfully',
      data: user
    }

  }

  async verifyEmail(codeID: string){
    // Find user by codeID
    const user = await this.prisma.user.findFirst({
      where: {
        codeID: codeID,
        codeExpired: {
          gt: new Date() 
        }
      }
    });

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


}
