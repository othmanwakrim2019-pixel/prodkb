import type { NextFunction, Request, Response } from 'express';
import { createResponse } from '../../../../common/types/api.response';
import { systemService } from '../../application/system.service';

export class SystemQueryController {
    static async getSystems(req: Request, res: Response, next: NextFunction) {
        try {
            const systems = await systemService.findAllSystems();
            res.json(createResponse(true, systems));
        } catch (error) {
            next(error);
        }
    }

    static async getJobs(req: Request, res: Response, next: NextFunction) {
        try {
            const jobs = await systemService.findAllJobs();
            res.json(createResponse(true, jobs));
        } catch (error) {
            next(error);
        }
    }
}
