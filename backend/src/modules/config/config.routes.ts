
import { Router } from 'express';
import { ConfigController } from './config.controller';
import { authenticate, checkPermission } from '../../common/middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// System Config (SMTP & Generic)
router.get('/smtp', checkPermission('SYSTEM_MANAGE'), ConfigController.getSmtpConfig);
router.put('/smtp', checkPermission('SYSTEM_MANAGE'), ConfigController.updateSmtpConfig);
router.post('/smtp/test', checkPermission('SYSTEM_MANAGE'), ConfigController.testSmtpConfig);
router.get('/params', checkPermission('SYSTEM_MANAGE'), ConfigController.getConfigs);
router.put('/:key', checkPermission('SYSTEM_MANAGE'), ConfigController.updateConfig);

export const configRoutes = router;
