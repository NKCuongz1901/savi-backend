import { AccountType, PrismaClient, Role, UserStatus } from "@prisma/client";
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();


export async function seedUser() {

    const testUser = await prisma.user.create({
      data:{
            email: 'savi.user@gmai.com',
            fullName: 'Savi User',
            password: await bcrypt.hash('123456789', 10),
            status: UserStatus.ACTIVE,
            accountType: AccountType.EMAIL,
            role: Role.USER
        }  
    })

    const testAdmin = await prisma.user.create({
        data:{
            email: 'savi.adminr@gmai.com',
            fullName: 'Savi admin',
            password: await bcrypt.hash('123456789', 10),
            status: UserStatus.ACTIVE,
            accountType: AccountType.EMAIL,
            role: Role.ADMIN
        }  
    })

    return{
        testUser,
        testAdmin
    }
}