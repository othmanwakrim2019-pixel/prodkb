
import { Response, NextFunction } from 'express';
import { planningInstanceService, planningJobService } from './planning.service';
import { AuthRequest } from '../../common/middleware/auth.middleware';
import { createResponse } from '../../common/types/api.response';
import { logAudit } from '../audit/audit.service';
import {
    periodEnum, instanceStatusEnum,
    createInstanceSchema, createPlanningJobSchema, updatePlanningJobSchema,
    updateStatusSchema, updatePositionSchema, batchPositionsSchema,
} from './planning.schema';
import { TaskType } from '@prisma/client';

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
                entityType: 'PLANNING_INSTANCE',
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
                entityType: 'PLANNING_INSTANCE',
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

    /** Clone a planning instance for the next month */
    static async cloneInstance(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const cloned = await planningInstanceService.cloneForNextMonth(req.params.id, req.user!.id);

            await logAudit({
                userId: req.user!.id,
                actionType: 'CREATE',
                entityType: 'PLANNING_INSTANCE',
                entityId: cloned!.id,
                details: JSON.stringify({ action: 'CLONE', sourceInstanceId: req.params.id }),
                req,
            });

            res.status(201).json(createResponse(true, cloned, 'Instance cloned for next month'));
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
            const data = createPlanningJobSchema.parse(req.body);
            const job = await planningJobService.create({
                ...data,
                scheduledTime: new Date(data.scheduledTime),
                taskType: data.taskType as TaskType | undefined,
            });

            await logAudit({
                userId: req.user!.id,
                actionType: 'CREATE',
                entityType: 'PLANNING_JOB',
                entityId: job.id,
                details: JSON.stringify({ instanceId: data.instanceId, jobId: data.jobId, taskType: data.taskType }),
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
            const data = updatePlanningJobSchema.parse(req.body);

            const updateData: Parameters<typeof planningJobService.update>[1] = {
                ...(data.systemId !== undefined && { systemId: data.systemId }),
                ...(data.jobId !== undefined && { jobId: data.jobId }),
                ...(data.scheduledTime !== undefined && { scheduledTime: new Date(data.scheduledTime) }),
                ...(data.dependencies !== undefined && { dependencies: data.dependencies }),
                ...(data.taskType !== undefined && { taskType: data.taskType as TaskType }),
                ...(data.supportContact !== undefined && { supportContact: data.supportContact }),
                ...(data.notes !== undefined && { notes: data.notes }),
            };

            const updated = await planningJobService.update(id, updateData);

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
            const { status, notes } = updateStatusSchema.parse(req.body);
            const updated = await planningJobService.updateStatus(id, status, req.user!.id, notes);

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
            const { notes } = req.body;
            const completed = await planningJobService.complete(id, req.user!.id, notes);

            await logAudit({
                userId: req.user!.id,
                actionType: 'UPDATE',
                entityType: 'PLANNING_JOB',
                entityId: id,
                details: JSON.stringify({ action: 'COMPLETE', notes }),
                req,
            });

            res.json(createResponse(true, completed, 'Job completed. Downstream jobs unblocked if ready.'));
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
