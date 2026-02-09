import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔧 Adding SEARCH_VIEW permission...');

    const searchPermCode = 'SEARCH_VIEW';

    // 1. Create permission
    const p = await prisma.permission.upsert({
        where: { code: searchPermCode },
        update: {},
        create: { code: searchPermCode, description: 'Permission to use global search' }
    });
    console.log(`- Upserted ${searchPermCode}`);

    // 2. Assign to standard roles
    const rolesToUpdate = ['ADMIN', 'EXPERT', 'OPERATOR', 'VIEWER'];

    for (const roleName of rolesToUpdate) {
        const role = await prisma.role.findUnique({ where: { name: roleName } });
        if (role) {
            await prisma.role.update({
                where: { id: role.id },
                data: {
                    permissions: {
                        connect: { code: searchPermCode }
                    }
                }
            });
            console.log(`- Assigned to ${roleName}`);
        }
    }

    console.log('✅ SEARCH_VIEW permission added and assigned to standard roles.');
}

main()
    .catch((e) => {
        console.error('❌ Fix failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
