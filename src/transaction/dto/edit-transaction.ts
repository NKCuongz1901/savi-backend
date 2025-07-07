import { TransactionType } from "@prisma/client";
import { Transform } from "class-transformer";
import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";

export class editTransactionDto {
    
    @IsOptional()
    @IsEnum(TransactionType)
    type: TransactionType;

    @IsOptional()
    @IsNumber()
    @Transform(({ value }) => parseFloat(value))
    amount: number;

    @IsOptional()
    note?: string;

    @IsOptional()
    date?: Date;

   
    @IsOptional()
    @IsString()
    userCategoryId?: string; 
    
    @IsOptional()
    @IsString()
    defaultCategoryId?: string; 
}