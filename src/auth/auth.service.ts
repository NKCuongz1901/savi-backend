import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { comparePasswordHelper } from 'src/utils/helpers';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';


@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
 
  ) {}

  // async login(loginDto: LoginDto) {
  //   const {email, password} = loginDto;
  //   // Find user by email
  //   const user = await this.prisma.user.findUnique({
  //     where: {
  //       email: email,
  //       status: UserStatus.ACTIVE
  //     }
  //   })
  //   if(!user){
  //     throw new UnauthorizedException('Email or password is incorrect');
  //   }

  //   if(!user.password){
  //     throw new UnauthorizedException('Email or password is incorrect');
  //   }

  //   // compare password
  //   const isPasswordValid = await comparePasswordHelper(password, user.password);
  //   if(!isPasswordValid){
  //     throw new UnauthorizedException('Email or password is incorrect');
  //   }

  //   // Generate JWT token
  //   const payload = {
  //     sub: user.id,
  //     email: user.email
  //   }
  //   const accessToken = await this.jwtService.signAsync(payload);

  //   return{
  //     message: 'Login successfully',
  //     accessToken,
  //   }
  // }

  async login(user: any) {
    const payload = { username: user.fullName, sub: user.id , email: user.email};
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: {
        email: email,
        status: UserStatus.ACTIVE
      }
    })
    if(!user){
      throw new UnauthorizedException('Email or password is incorrect');
    }

    if(!user.password){
      throw new UnauthorizedException('Email or password is incorrect');
    }

    const isPasswordValid = await comparePasswordHelper(password, user.password);
    if(!isPasswordValid){
      throw new UnauthorizedException('Email or password is incorrect');
    }

    return user;
  }

 
}
