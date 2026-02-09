import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Adding missing permissions...');

    const newPermissions = [
        'PROCEDURE_DELETE',
        'TEAM_DELETE'
    ];

    for (const code of newPermissions) {
        const exists = await prisma.permission.findUnique({
            where: { code }
        });

        if (!exists) {
            await prisma.permission.create({
                data: {
                    code,
                    description: `Permission to ${code.toLowerCase().replace('_', ' ')}`
                }
            });
            console.log(`Created permission: ${code}`);
        } else {
            console.log(`Permission already exists: ${code}`);
        }
    }

    // Assign to ADMIN role automatically
    const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
    if (adminRole) {
        const perms = await prisma.permission.findMany({
            where: { code: { in: newPermissions } }
        });

        await prisma.role.update({
            where: { id: adminRole.id },
            data: {
                permissions: {
                    connect: perms.map(p => ({ id: p.id }))
                }
            }
        });
        console.log('Assigned new permissions to ADMIN role');
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
