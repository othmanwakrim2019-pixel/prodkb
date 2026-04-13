import type { NextFunction, Request, Response } from 'express';
import { createResponse } from '../../../common/types/api.response';
import { healthScoreService } from '../health-score.service';

export class SystemHealthController {
    static async getHealthLeaderboard(_req: Request, res: Response, next: NextFunction) {
        try {
            const leaderboard = await healthScoreService.getLeaderboard();
            res.json(createResponse(true, leaderboard));
        } catch (error) {
            next(error);
        }
    }
}
