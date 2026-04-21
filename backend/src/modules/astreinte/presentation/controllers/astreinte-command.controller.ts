import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../../../../common/middleware/auth.middleware';
import { createResponse } from '../../../../common/types/api.response';
import { logAudit } from '../../../audit/application/audit.service';
import { validateRequest } from '../../../../common/middleware/zod-setup';
import { createAstreinteSchema, updateAstreinteSchema } from '../astreinte.schema';
import { astreinteService } from '../../application/astreinte.service';

// Re-export validators for use in route file
export { validateRequest, createAstreinteSchema, updateAstreinteSchema };

export class AstreinteCommandController {
    /** POST /api/v1/astreintes */
    static async assign(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const result = await astreinteService.assign(
                {
                    ...req.body,
                    startDate: new Date(req.body.startDate),
                    endDate:   new Date(req.body.endDate),
                },
                userId
            );

            await logAudit({
                userId,
                actionType: 'CREATE',
                entityType: 'ASTREINTE',
                entityId:   result.id,
                details:    `Assigned astreinte S${result.weekNumber}/${result.year} to user ${result.userId}`,
                req,
            });

            res.status(201).json(createResponse(true, result, 'Astreinte assigned successfully'));
        } catch (error) {
            next(error);
        }
    }

    /** PATCH /api/v1/astreintes/:id */
    static async update(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const result = await astreinteService.update(req.params.id, req.body);

            await logAudit({
                userId,
                actionType: 'UPDATE',
                entityType: 'ASTREINTE',
                entityId:   req.params.id,
                details:    `Updated astreinte — new user: ${result.userId}`,
                req,
            });

            res.json(createResponse(true, result, 'Astreinte updated successfully'));
        } catch (error) {
            next(error);
        }
    }

    /** DELETE /api/v1/astreintes/:id */
    static async delete(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            await astreinteService.delete(req.params.id);

            await logAudit({
                userId,
                actionType: 'DELETE',
                entityType: 'ASTREINTE',
                entityId:   req.params.id,
                details:    `Deleted astreinte`,
                req,
            });

            res.json(createResponse(true, null, 'Astreinte deleted successfully'));
        } catch (error) {
            next(error);
        }
    }
}
