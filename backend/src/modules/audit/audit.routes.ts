
import { Router } from 'express';
import { AuditController } from './audit.controller';
import { authenticate, checkPermission } from '../../common/middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', checkPermission('AUDIT_VIEW'), AuditController.getAuditLogs);

export const auditRoutes = router;
