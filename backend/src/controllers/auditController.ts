import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export const getAuditLogs = async (req: Request, res: Response) => {
    try {
        const { userId, action, entityType, startDate, endDate } = req.query;

        const where: any = {};

        if (userId) where.userId = String(userId);
        if (action) where.actionType = String(action);
        if (entityType) where.entityType = String(entityType);

        if (startDate || endDate) {
            where.timestamp = {};
            if (startDate) where.timestamp.gte = new Date(String(startDate));
            if (endDate) where.timestamp.lte = new Date(String(endDate));
        }

        const logs = await prisma.auditLog.findMany({
            where,
            include: {
                user: {
                    select: { id: true, name: true, email: true }
                }
            },
            orderBy: { timestamp: 'desc' },
            take: 100 // Limit to last 100 entries for now
        });

        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
};
