import { Router } from 'express';
import multer from 'multer';
import { authenticate, requirePermission } from '../../common/middleware/auth.middleware';
import { PlanningInstanceController } from './controllers/planning-instance.controller';
import { PlanningJobController } from './controllers/planning-job.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(authenticate);

router.get('/instances', requirePermission('PLANNING_VIEW'), PlanningInstanceController.getInstances);
router.get('/instances/:id', requirePermission('PLANNING_VIEW'), PlanningInstanceController.getInstance);
router.post('/instances', requirePermission('PLANNING_MANAGE'), PlanningInstanceController.createInstance);
router.post('/instances/:id/clone', requirePermission('PLANNING_MANAGE'), PlanningInstanceController.cloneInstance);
router.patch('/instances/:id/archive', requirePermission('PLANNING_MANAGE'), PlanningInstanceController.archiveInstance);
router.patch('/instances/:id/reactivate', requirePermission('PLANNING_MANAGE'), PlanningInstanceController.reactivateInstance);
router.delete('/instances/:id', requirePermission('PLANNING_MANAGE'), PlanningInstanceController.deleteInstance);

router.post('/import', requirePermission('PLANNING_MANAGE'), upload.single('file'), PlanningInstanceController.importCsv);

router.get('/instances/:id/jobs', requirePermission('PLANNING_VIEW'), PlanningJobController.getJobsByInstance);
router.patch('/jobs/positions/batch', requirePermission('PLANNING_MANAGE'), PlanningJobController.batchUpdatePositions);
router.post('/jobs', requirePermission('PLANNING_MANAGE'), PlanningJobController.createJob);
router.put('/jobs/:id', requirePermission('PLANNING_MANAGE'), PlanningJobController.updateJob);
router.delete('/jobs/:id', requirePermission('PLANNING_MANAGE'), PlanningJobController.deleteJob);
router.patch('/jobs/:id/status', requirePermission('PLANNING_MANAGE'), PlanningJobController.updateJobStatus);
router.patch('/jobs/:id/complete', requirePermission('PLANNING_MANAGE'), PlanningJobController.completeJob);
router.patch('/jobs/:id/position', requirePermission('PLANNING_MANAGE'), PlanningJobController.updateJobPosition);

export const planningRoutes = router;
