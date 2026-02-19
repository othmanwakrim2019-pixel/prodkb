
import { Router } from 'express';
import { PlanningController } from './planning.controller';
import { authenticate } from '../../common/middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// --- Instances ---
router.get('/instances', PlanningController.getInstances);
router.get('/instances/:id', PlanningController.getInstance);
router.post('/instances', PlanningController.createInstance);
router.patch('/instances/:id/archive', PlanningController.archiveInstance);
router.patch('/instances/:id/reactivate', PlanningController.reactivateInstance);

// --- Jobs within instances ---
router.get('/instances/:id/jobs', PlanningController.getJobsByInstance);
// Batch route MUST come before parameterized /jobs/:id routes
router.patch('/jobs/positions/batch', PlanningController.batchUpdatePositions);
router.post('/jobs', PlanningController.createJob);
router.put('/jobs/:id', PlanningController.updateJob);
router.delete('/jobs/:id', PlanningController.deleteJob);
router.patch('/jobs/:id/status', PlanningController.updateJobStatus);
router.patch('/jobs/:id/complete', PlanningController.completeJob);
router.patch('/jobs/:id/position', PlanningController.updateJobPosition);

export const planningRoutes = router;
