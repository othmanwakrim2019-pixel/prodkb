import { Router } from 'express';
import { authenticate, requirePermission } from '../../common/middleware/auth.middleware';
import { SystemCommandController } from './controllers/system-command.controller';
import { SystemHealthController } from './controllers/system-health.controller';
import { SystemQueryController } from './controllers/system-query.controller';

const router = Router();

router.use(authenticate);

router.get('/health-leaderboard', SystemHealthController.getHealthLeaderboard);
router.get('/', SystemQueryController.getSystems);
router.post('/', requirePermission('SYSTEM_MANAGE'), SystemCommandController.createSystem);
router.put('/:id', requirePermission('SYSTEM_MANAGE'), SystemCommandController.updateSystem);
router.delete('/:id', requirePermission('SYSTEM_MANAGE'), SystemCommandController.deleteSystem);

router.get('/jobs', requirePermission('JOB_VIEW'), SystemQueryController.getJobs);
router.post('/jobs', requirePermission('JOB_MANAGE'), SystemCommandController.createJob);
router.put('/jobs/:id', requirePermission('JOB_MANAGE'), SystemCommandController.updateJob);
router.delete('/jobs/:id', requirePermission('JOB_MANAGE'), SystemCommandController.deleteJob);

export const systemRoutes = router;
