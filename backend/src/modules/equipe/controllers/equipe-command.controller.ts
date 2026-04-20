import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../../../common/middleware/auth.middleware';
import { createResponse } from '../../../common/types/api.response';
import { logAudit } from '../../audit/audit.service';
import {
    createDailyPlanSchema,
    createOperationalTaskSchema,
    updateOperationalTaskSchema,
    updateTaskStatusSchema,
} from '../equipe.schema';
import { equipePlanService } from '../services/equipe-plan.service';
import { equipeTaskService } from '../services/equipe-task.service';

export class EquipeCommandController {
    /** POST /api/v1/equipe/plans */
    static async createPlan(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const data   = createDailyPlanSchema.parse(req.body);
            const plan   = await equipePlanService.createPlan(
                { ...data, date: new Date(data.date) },
                userId
            );

            await logAudit({
                userId,
                actionType: 'CREATE',
                entityType: 'DAILY_PLAN',
                entityId:   plan.id,
                details:    `Created daily plan for ${new Date(plan.date).toISOString().split('T')[0]}`,
                req,
            });

            res.status(201).json(createResponse(true, plan, 'Daily plan created successfully'));
        } catch (error) {
            next(error);
        }
    }

    /** POST /api/v1/equipe/plans/:planId/tasks */
    static async createTask(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const data   = createOperationalTaskSchema.parse(req.body);
            const task   = await equipeTaskService.createTask(
                {
                    planId:       req.params.planId,
                    ...data,
                    startTime:  data.startTime  ? new Date(data.startTime)  : null,
                    endTime:    data.endTime    ? new Date(data.endTime)    : null,
                },
                userId
            );

            await logAudit({
                userId,
                actionType: 'CREATE',
                entityType: 'OPERATIONAL_TASK',
                entityId:   task.id,
                details:    `Assigned task "${task.title}" to ${(task as unknown as { assignedTo: { name: string } }).assignedTo?.name ?? task.assignedToId}`,
                req,
            });

            res.status(201).json(createResponse(true, task, 'Task assigned successfully'));
        } catch (error) {
            next(error);
        }
    }

    /** PATCH /api/v1/equipe/tasks/:id */
    static async updateTask(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const data   = updateOperationalTaskSchema.parse(req.body);
            const task   = await equipeTaskService.updateTask(req.params.id, {
                ...data,
                startTime: data.startTime ? new Date(data.startTime) : data.startTime === null ? null : undefined,
                endTime:   data.endTime   ? new Date(data.endTime)   : data.endTime   === null ? null : undefined,
            });

            await logAudit({
                userId,
                actionType: 'UPDATE',
                entityType: 'OPERATIONAL_TASK',
                entityId:   req.params.id,
                details:    `Updated task "${task.title}"`,
                req,
            });

            res.json(createResponse(true, task, 'Task updated successfully'));
        } catch (error) {
            next(error);
        }
    }

    /** PATCH /api/v1/equipe/tasks/:id/status — operator updates own task status */
    static async updateTaskStatus(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const data   = updateTaskStatusSchema.parse(req.body);
            const task   = await equipeTaskService.updateTaskStatus(req.params.id, data, userId);

            await logAudit({
                userId,
                actionType: 'UPDATE',
                entityType: 'OPERATIONAL_TASK',
                entityId:   req.params.id,
                details:    `Status changed to ${data.status}${data.note ? ` — "${data.note}"` : ''}`,
                req,
            });

            res.json(createResponse(true, task, `Task status updated to ${data.status}`));
        } catch (error) {
            next(error);
        }
    }

    /** DELETE /api/v1/equipe/tasks/:id */
    static async deleteTask(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const task   = await equipeTaskService.deleteTask(req.params.id);

            await logAudit({
                userId,
                actionType: 'DELETE',
                entityType: 'OPERATIONAL_TASK',
                entityId:   req.params.id,
                details:    `Deleted task "${task.title}"`,
                req,
            });

            res.json(createResponse(true, null, 'Task deleted successfully'));
        } catch (error) {
            next(error);
        }
    }
}
