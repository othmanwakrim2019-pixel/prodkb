
import { Request, Response } from 'express';
import { prisma } from '../../common/utils/prisma';
import { createResponse } from '../../common/types/api.response';

export class HealthController {
    static async check(req: Request, res: Response) {
        try {
            // Check DB connection
            await prisma.$queryRaw`SELECT 1`;

            res.status(200).json(createResponse(true, {
                status: 'healthy',
                database: 'connected',
                uptime: process.uptime()
            }));
        } catch (error) {
            res.status(503).json(createResponse(false, null, 'Service Unavailable', {
                code: 'HEALTH_CHECK_FAILED',
                details: error instanceof Error ? error.message : 'Unknown error'
            }));
        }
    }
}
