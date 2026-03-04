import { Response, NextFunction } from 'express';
import { maintenanceService } from './maintenance.service';
import { AuthRequest } from '../../common/middleware/auth.middleware';
import { createResponse } from '../../common/types/api.response';
import { logger } from '../../common/utils/logger';

export class MaintenanceController {
    static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const systemId = req.query.systemId as string | undefined;
            const data = await maintenanceService.findAll(systemId);
            res.json(createResponse(true, data));
        } catch (error) { next(error); }
    }

    static async getActive(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const data = await maintenanceService.findActive();
            res.json(createResponse(true, data));
        } catch (error) { next(error); }
    }

    static async create(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            logger.info('Creating maintenance window', { systemId: (req.body as Record<string, unknown>).systemId, title: (req.body as Record<string, unknown>).title });
            const data = await maintenanceService.create(req.body, userId);
            logger.info('Maintenance window created', { id: data.id });
            res.status(201).json(createResponse(true, data, 'Maintenance window created'));
        } catch (error) { 
            logger.error('Failed to create maintenance window', { error });
            next(error); 
        }
    }

    static async update(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            logger.info('Updating maintenance window', { id: req.params.id });
            const data = await maintenanceService.update(req.params.id, req.body);
            logger.info('Maintenance window updated', { id: data.id });
            res.json(createResponse(true, data, 'Maintenance window updated'));
        } catch (error) { 
            logger.error('Failed to update maintenance window', { error });
            next(error); 
        }
    }

    static async remove(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            logger.info('Deleting maintenance window', { id: req.params.id });
            await maintenanceService.delete(req.params.id);
            res.json(createResponse(true, null, 'Maintenance window deleted'));
        } catch (error) { 
            logger.error('Failed to delete maintenance window', { error });
            next(error); 
        }
    }
}
