import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const roles = ['ADMIN', 'OPERATOR', 'EXPERT', 'VIEWER'];
    const users: Record<string, string> = {};

    for (const roleName of roles) {
        const user = await prisma.user.findFirst({
            where: {
                role: {
                    name: roleName
                },
                isActive: true
            },
            include: { role: { include: { permissions: true } } }
        });
        if (user) {
            console.log(`${roleName}=${user.email}`);
            console.log(`${roleName} Permissions: ${user.role?.permissions.map(p => p.code).join(', ')}`);
            users[roleName] = user.email;
        }
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
