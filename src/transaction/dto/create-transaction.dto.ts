import { TransactionType } from "@prisma/client";
import { Transform } from "class-transformer";
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateTransactionDto {
    
    @IsNotEmpty()
    @IsEnum(TransactionType)
    type: TransactionType;

    @IsNotEmpty()
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
