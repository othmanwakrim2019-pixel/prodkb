
import { Router } from 'express';
import multer from 'multer';
import { PlanningController } from './planning.controller';
import { authenticate, requirePermission } from '../../common/middleware/auth.middleware';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB max

router.use(authenticate);

// --- Instances ---
router.get('/instances', requirePermission('PLANNING_VIEW'), PlanningController.getInstances);
router.get('/instances/:id', requirePermission('PLANNING_VIEW'), PlanningController.getInstance);
router.post('/instances', requirePermission('PLANNING_MANAGE'), PlanningController.createInstance);
router.post('/instances/:id/clone', requirePermission('PLANNING_MANAGE'), PlanningController.cloneInstance);
router.patch('/instances/:id/archive', requirePermission('PLANNING_MANAGE'), PlanningController.archiveInstance);
router.patch('/instances/:id/reactivate', requirePermission('PLANNING_MANAGE'), PlanningController.reactivateInstance);
router.delete('/instances/:id', requirePermission('PLANNING_MANAGE'), PlanningController.deleteInstance);

// --- CSV Import ---
router.post('/import', requirePermission('PLANNING_MANAGE'), upload.single('file'), PlanningController.importCsv);

// --- Jobs within instances ---
router.get('/instances/:id/jobs', requirePermission('PLANNING_VIEW'), PlanningController.getJobsByInstance);
// Batch route MUST come before parameterized /jobs/:id routes
router.patch('/jobs/positions/batch', requirePermission('PLANNING_MANAGE'), PlanningController.batchUpdatePositions);
router.post('/jobs', requirePermission('PLANNING_MANAGE'), PlanningController.createJob);
router.put('/jobs/:id', requirePermission('PLANNING_MANAGE'), PlanningController.updateJob);
router.delete('/jobs/:id', requirePermission('PLANNING_MANAGE'), PlanningController.deleteJob);
router.patch('/jobs/:id/status', requirePermission('PLANNING_MANAGE'), PlanningController.updateJobStatus);
router.patch('/jobs/:id/complete', requirePermission('PLANNING_MANAGE'), PlanningController.completeJob);
router.patch('/jobs/:id/position', requirePermission('PLANNING_MANAGE'), PlanningController.updateJobPosition);

export const planningRoutes = router;
