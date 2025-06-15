import { DefaultCategory, PrismaClient, TransactionType } from "@prisma/client";

const prisma = new PrismaClient();
export async function seedDefaultCategory() {

    const defaultCategories = [
        //Categories for income
        {name: 'Lương', type: TransactionType.INCOME},
        {name: 'Tiền phụ cấp', type: TransactionType.INCOME},
        {name: 'Tiền thưởng', type: TransactionType.INCOME},
        {name: 'Thu nhập phụ', type: TransactionType.INCOME},
        {name: 'Đầu tư', type: TransactionType.INCOME},
        {name: 'Thu nhập khác', type: TransactionType.INCOME},


        //Categories for expense
        {name: 'Ăn uống', type: TransactionType.EXPENSE},
        {name: 'Đi lại', type: TransactionType.EXPENSE},
        {name: 'Mua sắm', type: TransactionType.EXPENSE},
        {name: 'Gia đình', type: TransactionType.EXPENSE},
        {name: 'Giải trí', type: TransactionType.EXPENSE},
        {name: 'Tiền nhà', type: TransactionType.EXPENSE},
        {name: 'Điện nước', type: TransactionType.EXPENSE},
        {name: 'Giáo dục', type: TransactionType.EXPENSE},
        {name: 'Sức khỏe', type: TransactionType.EXPENSE},
        {name: 'Làm đẹp', type: TransactionType.EXPENSE},
        {name: 'Thể thao', type: TransactionType.EXPENSE},
        {name: 'Chi tiêu hàng tháng', type: TransactionType.EXPENSE},
    ]

    const createdDefaultCategories: DefaultCategory[] = [];
    for(const category of defaultCategories){
        const createdDefaultCategory = await prisma.defaultCategory.create({
            data: category
        });
        createdDefaultCategories.push(createdDefaultCategory);
    }

    return createdDefaultCategories;
}