import { PrismaClient } from '@prisma/client';
import { subDays } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding recent incidents for dashboard stats...');

    // Get a system and team to assign to
    const system = await prisma.system.findFirst();
    const team = await prisma.team.findFirst();
    const user = await prisma.user.findFirst();

    if (!system || !team || !user) {
        console.error('❌ Missing base data (System, Team, or User). Run default seed first.');
        return;
    }

    const statuses = ['Open', 'In Progress', 'Resolved', 'Closed'];
    const severities = ['Low', 'Medium', 'High', 'Critical'];

    // Generate incidents for the last 7 days
    for (let i = 0; i < 7; i++) {
        const date = subDays(new Date(), i);
        const count = Math.floor(Math.random() * 5) + 1; // 1-5 incidents per day

        console.log(`Creating ${count} incidents for ${date.toISOString().split('T')[0]}...`);

        for (let j = 0; j < count; j++) {
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const severity = severities[Math.floor(Math.random() * severities.length)];
            const isResolved = status === 'Resolved' || status === 'Closed';

            await prisma.incident.create({
                data: {
                    title: `Test Incident ${i}-${j}`,
                    description: `Auto-generated test incident for dashboard verification.`,
                    environment: 'PROD',
                    severity: severity,
                    status: status,
                    systemId: system.id,
                    assignedTeamId: team.id,
                    createdById: user.id,
                    createdAt: date,
                    startDatetime: date,
                    ...(isResolved && {
                        resolvedAt: new Date(date.getTime() + 1000 * 60 * 60 * 2), // Resolved 2 hours later
                        resolvedById: user.id,
                        endDatetime: new Date(date.getTime() + 1000 * 60 * 60 * 2)
                    })
                }
            });
        }
    }

    console.log('✅ Dashboard data seeded successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
