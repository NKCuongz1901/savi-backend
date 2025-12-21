import { Transform, Type } from "class-transformer";
import { IsDate, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateBudgetCategoryDto {


    @IsOptional()
    @IsString()
    userCategoryId?: string; 
    
    @IsOptional()
    @IsString()
    defaultCategoryId?: string; 

    @IsNotEmpty()
    @IsNumber()
    @Transform(({ value }) => parseFloat(value))
    amount: number;

    
    @IsNotEmpty()
    @IsDate()
    @Type(() => Date)
    startDate: Date;

    @IsNotEmpty()
    @IsDate()
    @Type(() => Date)
    endDate: Date;
}
