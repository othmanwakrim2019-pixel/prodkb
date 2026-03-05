import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔧 Fixing permissions...');

    const missingPermissions = [
        'TEAM_MANAGE',
        'SLA_MANAGE'
    ];

    console.log('Adding missing permissions:', missingPermissions);

    const permsMap = new Map();

    // 1. Create missing permissions
    for (const code of missingPermissions) {
        const p = await prisma.permission.upsert({
            where: { code },
            update: {},
            create: { code, description: `Permission to ${code.toLowerCase().replace('_', ' ')}` }
        });
        console.log(`- Upserted ${code}`);
        permsMap.set(code, p.id);
    }

    // 2. Assign to ADMIN role
    const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
    if (adminRole) {
        console.log('Assigning new permissions to ADMIN role...');
        // We need to fetch existing permissions first to keep them?
        // No, 'connect' appends in Prisma generally, but explicit connect is safer.

        await prisma.role.update({
            where: { id: adminRole.id },
            data: {
                permissions: {
                    connect: missingPermissions.map(code => ({ code }))
                }
            }
        });
        console.log(' ADMIN role updated.');
    } else {
        console.warn(' ADMIN role not found.');
    }

    // 3. Assign to 'SuperUser' or custom roles if needed?
    // User mentioned "i gave all the roles" implies they have a custom role. 
    // We can't auto-update custom roles easily as we don't know which one they mean.
    // But now that the permissions EXIST, the user will be able to Select Them in the UI.

    console.log('✅ Permissions fix completed!');
}

main()
    .catch((e) => {
        console.error('❌ Fix failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
