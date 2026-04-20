import type { Request, Response, NextFunction } from 'express';
import type { AuthRequest } from '../../../common/middleware/auth.middleware';
import { createResponse } from '../../../common/types/api.response';
import { equipePlanService } from '../services/equipe-plan.service';
import { equipeTaskService } from '../services/equipe-task.service';

export class EquipeQueryController {
    /** GET /api/v1/equipe/plans?date=...&teamId=...        → single day plan
     *  GET /api/v1/equipe/plans?weekStart=...&teamId=...  → week array */
    static async getPlans(req: Request, res: Response, next: NextFunction) {
        try {
            const teamId    = req.query.teamId    as string | undefined;
            const weekStart = req.query.weekStart as string | undefined;
            const date      = req.query.date      as string | undefined;

            if (weekStart) {
                const plans = await equipePlanService.listWeekPlans(teamId ?? '', new Date(weekStart));
                return res.json(createResponse(true, plans));
            }

            const dayDate = date ? new Date(date) : new Date();
            const plan    = teamId
                ? await equipePlanService.getPlanForDay(teamId, dayDate)
                : null;
            return res.json(createResponse(true, plan));
        } catch (error) {
            next(error);
        }
    }

    /** GET /api/v1/equipe/plans/:id */
    static async getPlanById(req: Request, res: Response, next: NextFunction) {
        try {
            const plan = await equipePlanService.getPlanById(req.params.id);
            res.json(createResponse(true, plan));
        } catch (error) {
            next(error);
        }
    }

    /** GET /api/v1/equipe/me/tasks/today */
    static async getMyTasksToday(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const tasks = await equipeTaskService.getMyTasksToday(req.user!.id);
            res.json(createResponse(true, tasks));
        } catch (error) {
            next(error);
        }
    }

    /** GET /api/v1/equipe/me/tasks/week */
    static async getMyTasksWeek(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const tasks = await equipeTaskService.getMyTasksThisWeek(req.user!.id);
            res.json(createResponse(true, tasks));
        } catch (error) {
            next(error);
        }
    }
}
