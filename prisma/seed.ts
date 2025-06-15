import { PrismaClient } from "@prisma/client";
import { seedUser } from "./seeds/seed-user";
import { seedCategories } from "./seeds/seed-category";
import { seedDefaultCategory } from "./seeds/seed-defaultCategory";

const prisma = new PrismaClient();
async function main(){
    try {
        // create a dummy user first
        const {testUser,testAdmin} = await seedUser();
        console.log('Seeding users successfully');

        // seed categories for each user
        await seedCategories(testUser.id);
        await seedCategories(testAdmin.id)
        console.log('Seeding categories successfully');

        //seed default categories
        await seedDefaultCategory();

        
    } catch (error) {
       console.error('Error seeding data:', error);
       throw error;
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
    