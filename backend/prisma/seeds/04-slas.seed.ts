/**
 * 04 — Seed SLA Definitions
 * Creates the 4 default SLA policies (one per severity level).
 * Uses upsert — safe to run multiple times.
 */

import { prisma, logSeed } from '../helpers/seed.utils';

const SLAS = [
    { name: 'Critical SLA', severity: 'Critical', acknowledgeTimeMinutes: 15, resolveTimeMinutes: 60, description: 'Critical severity — immediate response required' },
    { name: 'High SLA', severity: 'High', acknowledgeTimeMinutes: 30, resolveTimeMinutes: 240, description: 'High severity — respond within 30 minutes' },
    { name: 'Medium SLA', severity: 'Medium', acknowledgeTimeMinutes: 60, resolveTimeMinutes: 480, description: 'Medium severity — respond within 1 hour' },
    { name: 'Low SLA', severity: 'Low', acknowledgeTimeMinutes: 120, resolveTimeMinutes: 1440, description: 'Low severity — respond within 2 hours' },
];

export async function seedSLAs(): Promise<void> {
    console.log('\n⏱️  Seeding SLA definitions...');

    for (const sla of SLAS) {
        const result = await prisma.sLA.upsert({
            where: { name: sla.name },
            update: {
                severity: sla.severity,
                acknowledgeTimeMinutes: sla.acknowledgeTimeMinutes,
                resolveTimeMinutes: sla.resolveTimeMinutes,
                description: sla.description,
            },
            create: sla,
        });
        const created = result.createdAt.getTime() === result.updatedAt.getTime();
        logSeed('SLA', `${sla.name} (${sla.severity})`, created);
    }
}
