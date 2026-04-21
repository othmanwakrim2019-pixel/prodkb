import type { NextFunction, Response } from 'express';
import type { TaskType } from '@prisma/client';
import type { AuthRequest } from '../../../../common/middleware/auth.middleware';
import { createResponse } from '../../../../common/types/api.response';
import { logAudit } from '../../../audit/application/audit.service';
import {
    batchPositionsSchema,
    createPlanningJobSchema,
    updatePlanningJobSchema,
    updatePositionSchema,
    updateStatusSchema,
} from '../planning.schema';
import { planningJobService } from '../../application/planning-job.service';
import { requirePlanningUserId } from './planning-controller.shared';

export class PlanningJobController {
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
            const userId = requirePlanningUserId(req);
            const data = createPlanningJobSchema.parse(req.body);
            const job = await planningJobService.create({
                ...data,
                scheduledTime: new Date(data.scheduledTime),
                taskType: data.taskType as TaskType | undefined,
            });

            await logAudit({
                userId,
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
            const userId = requirePlanningUserId(req);
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
                userId,
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
            const userId = requirePlanningUserId(req);
            const { id } = req.params;
            const job = await planningJobService.delete(id);

            await logAudit({
                userId,
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
            const userId = requirePlanningUserId(req);
            const { id } = req.params;
            const { status, notes } = updateStatusSchema.parse(req.body);
            const updated = await planningJobService.updateStatus(id, status, userId, notes);

            await logAudit({
                userId,
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
            const userId = requirePlanningUserId(req);
            const { id } = req.params;
            const { notes } = req.body;
            const completed = await planningJobService.complete(id, userId, notes);

            await logAudit({
                userId,
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
