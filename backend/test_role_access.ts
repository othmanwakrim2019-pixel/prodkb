import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking available models on prisma instance...');
    // @ts-ignore
    const roleModel = prisma.role;
    // @ts-ignore
    const userModel = prisma.user;

    console.log('prisma.role exists:', !!roleModel);
    console.log('prisma.user exists:', !!userModel);

    if (roleModel) {
        const roles = await prisma.role.findMany();
        console.log('Successfully fetched roles:', roles.length);
        console.log('Sample role:', roles[0]);
    } else {
        console.error('CRITICAL: prisma.role is UNDEFINED');
        process.exit(1);
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
