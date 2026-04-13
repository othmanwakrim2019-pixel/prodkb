import { Router } from 'express';
import { authenticate, requirePermission } from '../../common/middleware/auth.middleware';
import { EscalationController } from './escalation.controller';

const router = Router();

router.get('/', authenticate, requirePermission('ESCALATION_MANAGE'), EscalationController.getAll);
router.post('/', authenticate, requirePermission('ESCALATION_MANAGE'), EscalationController.create);
router.put('/:id', authenticate, requirePermission('ESCALATION_MANAGE'), EscalationController.update);
router.delete('/:id', authenticate, requirePermission('ESCALATION_MANAGE'), EscalationController.delete);

export const escalationRoutes = router;
