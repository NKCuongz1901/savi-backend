import { PartialType } from '@nestjs/mapped-types';
import { CreateUserCategoryDto } from './create-user-category.dto';

export class UpdateUserCategoryDto extends PartialType(CreateUserCategoryDto) {}
