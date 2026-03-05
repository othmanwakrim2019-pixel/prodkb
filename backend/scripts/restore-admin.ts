import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function restoreAdmin() {
    console.log('🔄 Restoring ADMIN role permissions...');

    try {
        const adminRole = await prisma.role.findFirst({
            where: { name: 'ADMIN' }
        });

        if (!adminRole) {
            console.error('❌ ADMIN role not found!');
            return;
        }

        // Get all permissions
        const allPermissions = await prisma.permission.findMany();
        console.log(`Found ${allPermissions.length} total permissions.`);

        // Update Admin role with ALL permissions
        await prisma.role.update({
            where: { id: adminRole.id },
            data: {
                permissions: {
                    set: [], // Clear existing
                    connect: allPermissions.map(p => ({ id: p.id }))
                }
            }
        });

        console.log('✅ ADMIN role permissions restored successfully!');
        console.log(`Assigned ${allPermissions.length} permissions to role: ${adminRole.name}`);

    } catch (error) {
        console.error('❌ Failed to restore admin permissions:', error);
    } finally {
        await prisma.$disconnect();
    }
}

restoreAdmin();
