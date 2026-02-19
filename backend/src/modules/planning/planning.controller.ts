
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { planningService } from './planning.service';
import { AuthRequest } from '../../common/middleware/auth.middleware';
import { createResponse } from '../../common/types/api.response';
import { logAudit } from '../audit/audit.service';
import { PlanningPeriod } from '@prisma/client';

// --- Validation Schemas ---

const periodEnum = z.enum(['monthly', 'quarterly', 'annual']);

const createPlanningJobSchema = z.object({
    name: z.string().min(2).max(200),
    application: z.string().min(1).max(100),
    scheduledTime: z.string().datetime({ message: 'scheduledTime must be a valid ISO 8601 datetime' }),
    period: periodEnum,
    dependencies: z.array(z.string().uuid()).default([]),
    status: z.enum(['pending', 'running', 'done']).optional(),
});

const updatePlanningJobSchema = z.object({
    name: z.string().min(2).max(200).optional(),
    application: z.string().min(1).max(100).optional(),
    scheduledTime: z.string().datetime().optional(),
    period: periodEnum.optional(),
    dependencies: z.array(z.string().uuid()).optional(),
    status: z.enum(['pending', 'running', 'done']).optional(),
});

// --- Controller ---

export class PlanningController {

    static async getJobs(req: Request, res: Response, next: NextFunction) {
        try {
            const period = periodEnum.parse(req.query.period);
            const jobs = await planningService.findByPeriod(period as PlanningPeriod);
            res.json(createResponse(true, jobs));
        } catch (error) {
            next(error);
        }
    }

    static async createJob(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const data = createPlanningJobSchema.parse(req.body);
            const job = await planningService.create({
                ...data,
                scheduledTime: new Date(data.scheduledTime),
                period: data.period as PlanningPeriod,
            });

            await logAudit({
                userId: req.user?.id || 'unknown',
                actionType: 'CREATE',
                entityType: 'PLANNING_JOB',
                entityId: job.id,
                details: JSON.stringify({ name: data.name, application: data.application, period: data.period }),
                req,
            });

            res.status(201).json(createResponse(true, job, 'Planning job created successfully'));
        } catch (error) {
            next(error);
        }
    }

    static async updateJob(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const data = updatePlanningJobSchema.parse(req.body);

            const updateData: Record<string, unknown> = { ...data };
            if (data.scheduledTime) {
                updateData.scheduledTime = new Date(data.scheduledTime);
            }

            const updated = await planningService.update(id, updateData as Parameters<typeof planningService.update>[1]);

            await logAudit({
                userId: req.user?.id || 'unknown',
                actionType: 'UPDATE',
                entityType: 'PLANNING_JOB',
                entityId: id,
                details: JSON.stringify(data),
                req,
            });

            res.json(createResponse(true, updated, 'Planning job updated successfully'));
        } catch (error) {
            next(error);
        }
    }

    static async completeJob(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const completed = await planningService.complete(id);

            await logAudit({
                userId: req.user?.id || 'unknown',
                actionType: 'UPDATE',
                entityType: 'PLANNING_JOB',
                entityId: id,
                details: JSON.stringify({ action: 'COMPLETE', previousStatus: 'running', newStatus: 'done' }),
                req,
            });

            res.json(createResponse(true, completed, 'Job marked as done. Downstream jobs activated if ready.'));
        } catch (error) {
            next(error);
        }
    }

    static async deleteJob(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const job = await planningService.delete(id);

            await logAudit({
                userId: req.user?.id || 'unknown',
                actionType: 'DELETE',
                entityType: 'PLANNING_JOB',
                entityId: id,
                details: JSON.stringify({ name: job.name, application: job.application }),
                req,
            });

            res.json(createResponse(true, null, 'Planning job deleted successfully'));
        } catch (error) {
            next(error);
        }
    }
}
