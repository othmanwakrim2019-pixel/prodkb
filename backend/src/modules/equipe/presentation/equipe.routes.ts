import { Router } from 'express';
import { authenticate, requirePermission } from '../../../common/middleware/auth.middleware';
import { EquipeQueryController } from './controllers/equipe-query.controller';
import { EquipeCommandController } from './controllers/equipe-command.controller';

const router = Router();

router.use(authenticate);

// ── Daily Plans ──────────────────────────────────────────────────────────────
// GET ?date=...&teamId=... → single day plan
// GET ?weekStart=...&teamId=... → week plans array
router.get('/plans',        requirePermission('EQUIPE_VIEW'),   EquipeQueryController.getPlans);
router.get('/plans/:id',    requirePermission('EQUIPE_VIEW'),   EquipeQueryController.getPlanById);
router.post('/plans',       requirePermission('EQUIPE_MANAGE'), EquipeCommandController.createPlan);

// ── Operational Tasks — manager ─────────────────────────────────────────────
router.post('/plans/:planId/tasks', requirePermission('EQUIPE_MANAGE'), EquipeCommandController.createTask);
router.patch('/tasks/:id',          requirePermission('EQUIPE_MANAGE'), EquipeCommandController.updateTask);
router.delete('/tasks/:id',         requirePermission('EQUIPE_MANAGE'), EquipeCommandController.deleteTask);

// ── Task status — operator updates their own task status ────────────────────
router.patch('/tasks/:id/status', requirePermission('MES_TACHES_VIEW'), EquipeCommandController.updateTaskStatus);

// ── Personal task board (Mes Tâches) ─────────────────────────────────────────
router.get('/me/tasks/today', requirePermission('MES_TACHES_VIEW'), EquipeQueryController.getMyTasksToday);
router.get('/me/tasks/week',  requirePermission('MES_TACHES_VIEW'), EquipeQueryController.getMyTasksWeek);

export const equipeRoutes = router;
