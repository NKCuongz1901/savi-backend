import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { BudgetCategoryService } from './budget-category.service';
import { CreateBudgetCategoryDto } from './dto/create-budget-category.dto';
import { UpdateBudgetCategoryDto } from './dto/update-budget-category.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('budget-category')
export class BudgetCategoryController {
  constructor(private readonly budgetCategoryService: BudgetCategoryService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body() createBudgetCategoryDto: CreateBudgetCategoryDto,
    @Request() req: any,
  ) {
    const userId = req.user.userId;
    return this.budgetCategoryService.createBudget(
      createBudgetCategoryDto,
      userId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  getUserBudgets(@Request() req: any) {
    const userId = req.user.userId;
    return this.budgetCategoryService.getUserBudgets(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':budgetId/transactions')
  getTransactionsForBudget(
    @Param('budgetId') budgetId: string,
    @Request() req: any,
  ) {
    const userId = req.user.userId;
    return this.budgetCategoryService.getTransactionsForBudget(
      budgetId,
      userId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  updateBudget(
    @Param('id') id: string,
    @Body() updateBudgetCategoryDto: UpdateBudgetCategoryDto,
  ) {
    return this.budgetCategoryService.updateBudget(id, updateBudgetCategoryDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  deleteBudget(@Param('id') id: string) {
    return this.budgetCategoryService.deleteBudget(id);
  }
}
