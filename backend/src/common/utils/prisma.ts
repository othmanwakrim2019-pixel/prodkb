
import { PrismaClient } from '@prisma/client';
import { dbQueryDuration, dbQueryTotal } from '../middleware/metrics.middleware';

const basePrisma = new PrismaClient();

// ── Prisma Query Instrumentation via $extends ──
// Tracks every DB query with Prometheus metrics for Grafana dashboards
export const prisma = basePrisma.$extends({
    query: {
        $allOperations({ model, operation, args, query }) {
            const modelName = model || 'unknown';
            const timer = dbQueryDuration.startTimer({ model: modelName, operation });
            return query(args).then((result) => {
                dbQueryTotal.inc({ model: modelName, operation });
                timer();
                return result;
            }).catch((error) => {
                dbQueryTotal.inc({ model: modelName, operation });
                timer();
                throw error;
            });
        },
    },
});
