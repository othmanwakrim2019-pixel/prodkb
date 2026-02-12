
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Creating VIEWER role...');

    // 1. Get Permissions
    const permissions = ['DASHBOARD_VIEW', 'INCIDENT_VIEW', 'PROCEDURE_VIEW'];
    const perms = await prisma.permission.findMany({
        where: { code: { in: permissions } }
    });

    // 2. Create Role
    const viewerRole = await prisma.role.upsert({
        where: { name: 'VIEWER' },
        update: {},
        create: {
            name: 'VIEWER',
            description: 'Read-only access to assigned team incidents',
            permissions: {
                connect: perms.map(p => ({ id: p.id }))
            }
        }
    });
    console.log('VIEWER role created:', viewerRole.id);

    // 3. Create Viewer User
    const hashedPassword = await bcrypt.hash('password123', 10);
    const viewerUser = await prisma.user.upsert({
        where: { email: 'viewer@prodkb.com' },
        update: { roleId: viewerRole.id }, // Ensure role is correct
        create: {
            name: 'Viewer User',
            email: 'viewer@prodkb.com',
            password: hashedPassword,
            roleId: viewerRole.id,
            isActive: true
        }
    });
    console.log('Viewer user created:', viewerUser.email);

    // 4. Assign to a Team (so they can see SOMETHING)
    const team = await prisma.team.findFirst();
    if (team) {
        // Check if member exists
        const member = await prisma.teamMember.findUnique({
            where: { teamId_userId: { teamId: team.id, userId: viewerUser.id } }
        });
        if (!member) {
            await prisma.teamMember.create({
                data: {
                    teamId: team.id,
                    userId: viewerUser.id,
                    role: 'MEMBER'
                }
            });
            console.log(`Assigned viewer to team: ${team.name}`);
        } else {
            console.log(`Viewer already in team: ${team.name}`);
        }
    }

    console.log('Done.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
