const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const roles = ['ADMIN', 'OPERATOR', 'EXPERT', 'VIEWER'];
    const users = {};

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
            // console.log(`${roleName} Permissions: ${user.role?.permissions.map(p => p.code).join(', ')}`);
        } else {
            console.log(`${roleName}=NOT_FOUND`);
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
