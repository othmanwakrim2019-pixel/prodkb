import type { NextFunction, Request, Response } from 'express';
import { createResponse } from '../../../common/types/api.response';
import { analyticsService } from '../application/analytics.service';

const parseDays = (value: unknown) => {
    const parsed = Number.parseInt(String(value ?? ''), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 30;
};

export class AnalyticsController {
    static async getMTTR(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await analyticsService.getMTTRTrends(parseDays(req.query.days));
            res.json(createResponse(true, data));
        } catch (error) {
            next(error);
        }
    }

    static async getSLACompliance(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await analyticsService.getSLACompliance(parseDays(req.query.days));
            res.json(createResponse(true, data));
        } catch (error) {
            next(error);
        }
    }

    static async getTeamPerformance(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await analyticsService.getTeamPerformance(parseDays(req.query.days));
            res.json(createResponse(true, data));
        } catch (error) {
            next(error);
        }
    }

    static async getSeverityDistribution(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await analyticsService.getSeverityDistribution(parseDays(req.query.days));
            res.json(createResponse(true, data));
        } catch (error) {
            next(error);
        }
    }
}
