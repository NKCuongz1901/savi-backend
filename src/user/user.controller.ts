import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('create')
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto);
  }

  @Post('verify')
  verifyEmail(@Body() body: { email: string; code: string }) {
    return this.userService.verifyEmail(body.code, body.email);
  }

  @Post('change-password')
  changePassword(
    @Body()
    body: {
      userEmail: string;
      oldPassword: string;
      newPassword: string;
    },
  ) {
    return this.userService.changePassword(
      body.userEmail,
      body.newPassword,
      body.oldPassword,
    );
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: { email: string }) {
    return this.userService.requestPasswordReset(body.email);
  }

  @Post('reset-password')
  async resetPassword(
    @Body() body: { email: string; code: string; newPassword: string },
  ) {
    return this.userService.resetPassword(
      body.email,
      body.code,
      body.newPassword,
    );
  }
}
