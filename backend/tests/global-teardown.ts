import { slaQueue } from '../src/modules/sla/application/sla.queue';
import { webhookQueue } from '../src/modules/webhooks/webhook.queue';
import { redis } from '../src/common/utils/redis';
import { prisma } from '../src/common/utils/prisma';

export default async function globalTeardown() {
    await Promise.allSettled([
        slaQueue.close(),
        webhookQueue.close(),
        redis.quit(),
        prisma.$disconnect(),
    ]);
}
