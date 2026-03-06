/**
 * 06 — Seed Default Configuration
 * Creates default runtime configuration entries.
 * Uses upsert — safe to run multiple times.
 */

import { prisma, logSeed } from '../helpers/seed.utils';

const CONFIG_ENTRIES: Array<{ key: string; value: string }> = [
    { key: 'app.name', value: 'ProdKB' },
    { key: 'app.timezone', value: 'Africa/Casablanca' },
    { key: 'incident.auto_close_days', value: '30' },
    { key: 'notification.digest_enabled', value: 'true' },
    { key: 'notification.digest_hour', value: '8' },
    { key: 'sla.check_interval_minutes', value: '5' },
];

export async function seedConfig(): Promise<void> {
    console.log('\nSeeding default configuration...');

    for (const entry of CONFIG_ENTRIES) {
        const existing = await prisma.systemConfig.findUnique({ where: { key: entry.key } });
        if (existing) {
            logSeed('Config', entry.key, false);
        } else {
            await prisma.systemConfig.create({ data: entry });
            logSeed('Config', `${entry.key} = ${entry.value}`, true);
        }
    }
}
