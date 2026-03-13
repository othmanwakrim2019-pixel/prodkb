
import { Router, Request, Response, NextFunction } from 'express';
import { analyticsService } from './analytics.service';
import { authenticate, requirePermission } from '../../common/middleware/auth.middleware';
import { createResponse } from '../../common/types/api.response';

const router = Router();

router.get('/mttr', authenticate, requirePermission('ANALYTICS_VIEW'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const days = parseInt(req.query.days as string) || 30;
        const data = await analyticsService.getMTTRTrends(days);
        res.json(createResponse(true, data));
    } catch (error) { next(error); }
});

router.get('/sla-compliance', authenticate, requirePermission('ANALYTICS_VIEW'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const days = parseInt(req.query.days as string) || 30;
        const data = await analyticsService.getSLACompliance(days);
        res.json(createResponse(true, data));
    } catch (error) { next(error); }
});

router.get('/team-performance', authenticate, requirePermission('ANALYTICS_VIEW'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const days = parseInt(req.query.days as string) || 30;
        const data = await analyticsService.getTeamPerformance(days);
        res.json(createResponse(true, data));
    } catch (error) { next(error); }
});

router.get('/severity', authenticate, requirePermission('ANALYTICS_VIEW'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const days = parseInt(req.query.days as string) || 30;
        const data = await analyticsService.getSeverityDistribution(days);
        res.json(createResponse(true, data));
    } catch (error) { next(error); }
});

export const analyticsRoutes = router;
