
import { Request, Response, NextFunction } from 'express';
import { auditService } from './audit.service';
import { createResponse } from '../../common/types/api.response';

export class AuditController {
    static async getAuditLogs(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId, action, entityType, startDate, endDate } = req.query;

            const logs = await auditService.getAuditLogs({
                userId: userId ? String(userId) : undefined,
                action: action ? String(action) : undefined,
                entityType: entityType ? String(entityType) : undefined,
                startDate: startDate ? String(startDate) : undefined,
                endDate: endDate ? String(endDate) : undefined
            });

            res.json(logs); // Legacy format (array), or switch to createResponse? Legacy was direct array.
        } catch (error) {
            next(error);
        }
    }
}
