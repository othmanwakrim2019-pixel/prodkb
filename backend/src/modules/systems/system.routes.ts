
import { Router } from 'express';
import { SystemController } from './system.controller';
import { authenticate, checkPermission } from '../../common/middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// Systems
router.get('/', SystemController.getSystems);
router.post('/', checkPermission('SYSTEM_MANAGE'), SystemController.createSystem);
router.put('/:id', checkPermission('SYSTEM_MANAGE'), SystemController.updateSystem);
router.delete('/:id', checkPermission('SYSTEM_MANAGE'), SystemController.deleteSystem);

// Jobs
router.get('/jobs', SystemController.getJobs);
router.post('/jobs', checkPermission('SYSTEM_MANAGE'), SystemController.createJob);
router.put('/jobs/:id', checkPermission('SYSTEM_MANAGE'), SystemController.updateJob);
router.delete('/jobs/:id', checkPermission('SYSTEM_MANAGE'), SystemController.deleteJob);

export const systemRoutes = router;
