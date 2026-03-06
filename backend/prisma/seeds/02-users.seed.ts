/**
 * 02 — Seed Users
 * Creates the default admin and viewer users.
 * Uses upsert — safe to run multiple times.
 */

import { prisma, getHashedPassword, logSeed } from '../helpers/seed.utils';

const DEFAULT_USERS = [
    { name: 'Admin User', email: 'admin@prodkb.com', roleName: 'ADMIN' },
    { name: 'Viewer User', email: 'viewer@prodkb.com', roleName: 'VIEWER' },
];

export async function seedUsers(): Promise<void> {
    console.log('\nSeeding default users...');

    const hashedPassword = await getHashedPassword();

    for (const userDef of DEFAULT_USERS) {
        const role = await prisma.role.findUnique({ where: { name: userDef.roleName } });
        if (!role) {
            console.warn(`  ⚠️ Role ${userDef.roleName} not found — skipping user ${userDef.email}`);
            continue;
        }

        const result = await prisma.user.upsert({
            where: { email: userDef.email },
            update: { name: userDef.name, roleId: role.id, isActive: true },
            create: {
                name: userDef.name,
                email: userDef.email,
                password: hashedPassword,
                roleId: role.id,
                isActive: true,
            },
        });
        const created = result.createdAt.getTime() === result.updatedAt.getTime();
        logSeed('User', `${userDef.name} (${userDef.email})`, created);
    }

    console.log('  Default password: password123');
}
