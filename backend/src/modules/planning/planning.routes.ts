
import { Router } from 'express';
import { PlanningController } from './planning.controller';
import { authenticate } from '../../common/middleware/auth.middleware';

const router = Router();

// All planning routes require authentication
router.use(authenticate);

// GET  /api/planning/jobs?period=monthly|quarterly|annual
router.get('/jobs', PlanningController.getJobs);

// POST /api/planning/jobs
router.post('/jobs', PlanningController.createJob);

// PATCH /api/planning/jobs/:id/complete
router.patch('/jobs/:id/complete', PlanningController.completeJob);

// PUT /api/planning/jobs/:id
router.put('/jobs/:id', PlanningController.updateJob);

// DELETE /api/planning/jobs/:id
router.delete('/jobs/:id', PlanningController.deleteJob);

export const planningRoutes = router;
