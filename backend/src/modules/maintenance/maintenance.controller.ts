import { Request, Response, NextFunction } from 'express';
import { maintenanceService } from './maintenance.service';
import { AuthRequest } from '../../common/middleware/auth.middleware';
import { createResponse } from '../../common/types/api.response';

export class MaintenanceController {
    static async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const systemId = req.query.systemId as string | undefined;
            const data = await maintenanceService.findAll(systemId);
            res.json(createResponse(true, data));
        } catch (error) { next(error); }
    }

    static async getActive(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await maintenanceService.findActive();
            res.json(createResponse(true, data));
        } catch (error) { next(error); }
    }

    static async create(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const data = await maintenanceService.create(req.body, userId);
            res.status(201).json(createResponse(true, data));
        } catch (error) { next(error); }
    }

    static async update(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await maintenanceService.update(req.params.id, req.body);
            res.json(createResponse(true, data));
        } catch (error) { next(error); }
    }

    static async remove(req: Request, res: Response, next: NextFunction) {
        try {
            await maintenanceService.delete(req.params.id);
            res.json(createResponse(true, null, 'Maintenance window deleted'));
        } catch (error) { next(error); }
    }
}
