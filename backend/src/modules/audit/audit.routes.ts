
import { Router } from 'express';
import { AuditController } from './audit.controller';
import { authenticate, requirePermission } from '../../common/middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('AUDIT_VIEW'), AuditController.getAuditLogs);

export const auditRoutes = router;
