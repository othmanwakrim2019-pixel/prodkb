import type { Request, Response, NextFunction } from 'express';
import { createResponse } from '../../../../common/types/api.response';
import { astreinteService } from '../../application/astreinte.service';

export class AstreinteQueryController {
    /** GET /api/v1/astreintes?teamId=...&year=... */
    static async list(req: Request, res: Response, next: NextFunction) {
        try {
            const { teamId, year } = req.query;
            const results = await astreinteService.list({
                teamId: teamId as string | undefined,
                year:   year   ? parseInt(year as string) : undefined,
            });
            res.json(createResponse(true, results));
        } catch (error) {
            next(error);
        }
    }

    /** GET /api/v1/astreintes/current  (no teamId — returns any current astreinte) */
    static async getAny(req: Request, res: Response, next: NextFunction) {
        try {
            const current = await astreinteService.getCurrentAny();
            res.json(createResponse(true, current));
        } catch (error) {
            next(error);
        }
    }

    /** GET /api/v1/astreintes/current/:teamId */
    static async getCurrent(req: Request, res: Response, next: NextFunction) {
        try {
            const current = await astreinteService.getCurrent(req.params.teamId);
            res.json(createResponse(true, current));
        } catch (error) {
            next(error);
        }
    }
}
