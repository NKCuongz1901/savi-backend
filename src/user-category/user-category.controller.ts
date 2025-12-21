import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { UserCategoryService } from './user-category.service';
import { CreateUserCategoryDto } from './dto/create-user-category.dto';
import { UpdateUserCategoryDto } from './dto/update-user-category.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { TransactionType } from '@prisma/client';

@Controller('user-category')
export class UserCategoryController {
  constructor(private readonly userCategoryService: UserCategoryService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createUserCategoryDto: CreateUserCategoryDto, @Request() req) {
    const userId = req.user.userId;
    return this.userCategoryService.create(userId, createUserCategoryDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Request() req, @Query('type') type?: TransactionType) {
    const userId = req.user.userId;
    return this.userCategoryService.findAll(userId, type);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    const userId = req.user.userId;
    return this.userCategoryService.findOne(userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() updateUserCategoryDto: UpdateUserCategoryDto) {
    const userId = req.user.userId;
    return this.userCategoryService.update(userId, id, updateUserCategoryDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    const userId = req.user.userId;
    return this.userCategoryService.remove(userId, id);
  }
}
