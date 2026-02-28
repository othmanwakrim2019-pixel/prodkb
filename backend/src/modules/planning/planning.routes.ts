
import { Router } from 'express';
import { PlanningController } from './planning.controller';
import { authenticate, checkPermission } from '../../common/middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// --- Instances ---
router.get('/instances', checkPermission('PLANNING_VIEW'), PlanningController.getInstances);
router.get('/instances/:id', checkPermission('PLANNING_VIEW'), PlanningController.getInstance);
router.post('/instances', checkPermission('PLANNING_MANAGE'), PlanningController.createInstance);
router.post('/instances/:id/clone', checkPermission('PLANNING_MANAGE'), PlanningController.cloneInstance);
router.patch('/instances/:id/archive', checkPermission('PLANNING_MANAGE'), PlanningController.archiveInstance);
router.patch('/instances/:id/reactivate', checkPermission('PLANNING_MANAGE'), PlanningController.reactivateInstance);
router.delete('/instances/:id', checkPermission('PLANNING_MANAGE'), PlanningController.deleteInstance);

// --- Jobs within instances ---
router.get('/instances/:id/jobs', checkPermission('PLANNING_VIEW'), PlanningController.getJobsByInstance);
// Batch route MUST come before parameterized /jobs/:id routes
router.patch('/jobs/positions/batch', checkPermission('PLANNING_MANAGE'), PlanningController.batchUpdatePositions);
router.post('/jobs', checkPermission('PLANNING_MANAGE'), PlanningController.createJob);
router.put('/jobs/:id', checkPermission('PLANNING_MANAGE'), PlanningController.updateJob);
router.delete('/jobs/:id', checkPermission('PLANNING_MANAGE'), PlanningController.deleteJob);
router.patch('/jobs/:id/status', checkPermission('PLANNING_MANAGE'), PlanningController.updateJobStatus);
router.patch('/jobs/:id/complete', checkPermission('PLANNING_MANAGE'), PlanningController.completeJob);
router.patch('/jobs/:id/position', checkPermission('PLANNING_MANAGE'), PlanningController.updateJobPosition);

export const planningRoutes = router;

