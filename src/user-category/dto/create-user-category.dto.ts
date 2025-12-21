import { IsString, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { TransactionType } from '@prisma/client';

export class CreateUserCategoryDto {
  @IsString()
  name: string;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
