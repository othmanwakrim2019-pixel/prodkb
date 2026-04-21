import { Router } from 'express';
import { authenticate, requirePermission } from '../../../common/middleware/auth.middleware';
import { AnalyticsController } from '../presentation/analytics.controller';

const router = Router();

router.get('/mttr', authenticate, requirePermission('ANALYTICS_VIEW'), AnalyticsController.getMTTR);
router.get('/sla-compliance', authenticate, requirePermission('ANALYTICS_VIEW'), AnalyticsController.getSLACompliance);
router.get('/team-performance', authenticate, requirePermission('ANALYTICS_VIEW'), AnalyticsController.getTeamPerformance);
router.get('/severity', authenticate, requirePermission('ANALYTICS_VIEW'), AnalyticsController.getSeverityDistribution);

export const analyticsRoutes = router;
