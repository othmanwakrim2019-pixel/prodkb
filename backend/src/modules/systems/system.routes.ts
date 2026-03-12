
import { Router } from 'express';
import { SystemController } from './system.controller';
import { authenticate, requirePermission } from '../../common/middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// Systems
router.get('/health-leaderboard', SystemController.getHealthLeaderboard);
router.get('/', SystemController.getSystems);
router.post('/', requirePermission('SYSTEM_MANAGE'), SystemController.createSystem);
router.put('/:id', requirePermission('SYSTEM_MANAGE'), SystemController.updateSystem);
router.delete('/:id', requirePermission('SYSTEM_MANAGE'), SystemController.deleteSystem);

// Jobs
router.get('/jobs', requirePermission('JOB_VIEW'), SystemController.getJobs);
router.post('/jobs', requirePermission('JOB_MANAGE'), SystemController.createJob);
router.put('/jobs/:id', requirePermission('JOB_MANAGE'), SystemController.updateJob);
router.delete('/jobs/:id', requirePermission('JOB_MANAGE'), SystemController.deleteJob);

export const systemRoutes = router;
