import { IsNumber } from "class-validator";


export class UpdateWalletDto  {
    @IsNumber()
    totalExpense?: number;

    @IsNumber()
    totalIncome?: number;

    @IsNumber()
    totalBalance?: number;
}
