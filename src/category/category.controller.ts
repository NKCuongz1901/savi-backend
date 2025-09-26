import { Controller, Get, Query } from '@nestjs/common';
import { CategoryService } from './category.service';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get('default')
  getDefaultCategories(@Query('type') type?: 'INCOME' | 'EXPENSE'){
    return this.categoryService.getDefaultCategories(type);
  }
}
