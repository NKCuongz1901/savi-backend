import { PrismaClient, TransactionType, Category } from "@prisma/client";


const prisma = new PrismaClient();

export async function seedCategories(userId: string) {

    const defaultCategories = [
        //Categories for income
        {name: 'Chứng khoán', type: TransactionType.INCOME},
        {name: 'Tiền freelance', type: TransactionType.INCOME},
       


        //Categories for expense
        {name: 'Đầu tư', type: TransactionType.EXPENSE},
        
    ]

    const createdCategories: Category[] = [];
    for(const category of defaultCategories){
        const createdCategory = await prisma.category.create({
            data:{
                ...category,
                isDefault: true,
                userId: userId
            }
        })
        createdCategories.push(createdCategory);
    }

    return createdCategories;
}