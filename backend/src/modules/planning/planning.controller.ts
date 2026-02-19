
import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { planningInstanceService, planningJobService } from './planning.service';
import { AuthRequest } from '../../common/middleware/auth.middleware';
import { createResponse } from '../../common/types/api.response';
import { logAudit } from '../audit/audit.service';

// --- Validation Schemas ---

const periodEnum = z.enum(['monthly', 'quarterly', 'annual']);
const statusEnum = z.enum(['pending', 'running', 'done']);
const instanceStatusEnum = z.enum(['active', 'archived']);

const createInstanceSchema = z.object({
    name: z.string().min(2).max(200),
    description: z.string().max(500).optional(),
    period: periodEnum,
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
});

const createJobSchema = z.object({
    instanceId: z.string().uuid(),
    systemId: z.string().uuid(),
    jobId: z.string().uuid(),
    scheduledTime: z.string().datetime(),
    dependencies: z.array(z.string().uuid()).default([]),
    status: statusEnum.optional(),
});

const updateJobSchema = z.object({
    systemId: z.string().uuid().optional(),
    jobId: z.string().uuid().optional(),
    scheduledTime: z.string().datetime().optional(),
    dependencies: z.array(z.string().uuid()).optional(),
});

const updateStatusSchema = z.object({
    status: statusEnum,
});

const updatePositionSchema = z.object({
    positionX: z.number(),
    positionY: z.number(),
});

const batchPositionsSchema = z.object({
    positions: z.array(z.object({
        id: z.string().uuid(),
        positionX: z.number(),
        positionY: z.number(),
    })),
});

// --- Instance Controller ---

export class PlanningController {

    // -- Instances --

    static async getInstances(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const period = req.query.period ? periodEnum.parse(req.query.period) : undefined;
            const status = req.query.status ? instanceStatusEnum.parse(req.query.status) : undefined;
            const instances = await planningInstanceService.findAll({ period, status });
            res.json(createResponse(true, instances));
        } catch (error) {
            next(error);
        }
    }

    static async getInstance(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const instance = await planningInstanceService.findById(req.params.id);
            res.json(createResponse(true, instance));
        } catch (error) {
            next(error);
        }
    }

    static async createInstance(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const data = createInstanceSchema.parse(req.body);
            const instance = await planningInstanceService.create({
                ...data,
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                createdById: req.user!.id,
            });

            await logAudit({
                userId: req.user!.id,
                actionType: 'CREATE',
                entityType: 'PLANNING_JOB',
                entityId: instance.id,
                details: JSON.stringify({ name: data.name, period: data.period }),
                req,
            });

            res.status(201).json(createResponse(true, instance, 'Planning instance created'));
        } catch (error) {
            next(error);
        }
    }

    static async archiveInstance(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const instance = await planningInstanceService.archive(req.params.id);

            await logAudit({
                userId: req.user!.id,
                actionType: 'UPDATE',
                entityType: 'PLANNING_JOB',
                entityId: req.params.id,
                details: JSON.stringify({ action: 'ARCHIVE' }),
                req,
            });

            res.json(createResponse(true, instance, 'Instance archived'));
        } catch (error) {
            next(error);
        }
    }

    static async reactivateInstance(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const instance = await planningInstanceService.reactivate(req.params.id);
            res.json(createResponse(true, instance, 'Instance reactivated'));
        } catch (error) {
            next(error);
        }
    }

    // -- Jobs --

    static async getJobsByInstance(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const jobs = await planningJobService.findByInstance(req.params.id);
            res.json(createResponse(true, jobs));
        } catch (error) {
            next(error);
        }
    }

    static async createJob(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const data = createJobSchema.parse(req.body);
            const job = await planningJobService.create({
                ...data,
                scheduledTime: new Date(data.scheduledTime),
            });

            await logAudit({
                userId: req.user!.id,
                actionType: 'CREATE',
                entityType: 'PLANNING_JOB',
                entityId: job.id,
                details: JSON.stringify({ instanceId: data.instanceId, systemId: data.systemId, jobId: data.jobId }),
                req,
            });

            res.status(201).json(createResponse(true, job, 'Planning job created'));
        } catch (error) {
            next(error);
        }
    }

    static async updateJob(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const data = updateJobSchema.parse(req.body);

            const updateData: Record<string, unknown> = { ...data };
            if (data.scheduledTime) updateData.scheduledTime = new Date(data.scheduledTime);

            const updated = await planningJobService.update(id, updateData as Parameters<typeof planningJobService.update>[1]);

            await logAudit({
                userId: req.user!.id,
                actionType: 'UPDATE',
                entityType: 'PLANNING_JOB',
                entityId: id,
                details: JSON.stringify(data),
                req,
            });

            res.json(createResponse(true, updated, 'Planning job updated'));
        } catch (error) {
            next(error);
        }
    }

    static async deleteJob(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const job = await planningJobService.delete(id);

            await logAudit({
                userId: req.user!.id,
                actionType: 'DELETE',
                entityType: 'PLANNING_JOB',
                entityId: id,
                details: JSON.stringify({ jobId: job.jobId, systemId: job.systemId }),
                req,
            });

            res.json(createResponse(true, null, 'Planning job deleted'));
        } catch (error) {
            next(error);
        }
    }

    static async updateJobStatus(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { status } = updateStatusSchema.parse(req.body);
            const updated = await planningJobService.updateStatus(id, status, req.user!.id);

            await logAudit({
                userId: req.user!.id,
                actionType: 'UPDATE',
                entityType: 'PLANNING_JOB',
                entityId: id,
                details: JSON.stringify({ action: 'STATUS_CHANGE', newStatus: status }),
                req,
            });

            res.json(createResponse(true, updated, `Job status updated to ${status}`));
        } catch (error) {
            next(error);
        }
    }

    static async completeJob(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const completed = await planningJobService.complete(id, req.user!.id);

            await logAudit({
                userId: req.user!.id,
                actionType: 'UPDATE',
                entityType: 'PLANNING_JOB',
                entityId: id,
                details: JSON.stringify({ action: 'COMPLETE' }),
                req,
            });

            res.json(createResponse(true, completed, 'Job completed. Downstream jobs activated if ready.'));
        } catch (error) {
            next(error);
        }
    }

    static async updateJobPosition(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { positionX, positionY } = updatePositionSchema.parse(req.body);
            await planningJobService.updatePosition(id, positionX, positionY);
            res.json(createResponse(true, null, 'Position saved'));
        } catch (error) {
            next(error);
        }
    }

    static async batchUpdatePositions(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { positions } = batchPositionsSchema.parse(req.body);
            await planningJobService.updatePositions(positions);
            res.json(createResponse(true, null, `${positions.length} positions saved`));
        } catch (error) {
            next(error);
        }
    }
}
