
import { Router } from 'express';
import { ConfigController } from '../presentation/config.controller';
import { authenticate, requirePermission } from '../../../common/middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// System Config (SMTP & Generic)
router.get('/smtp', requirePermission('CONFIG_MANAGE'), ConfigController.getSmtpConfig);
router.put('/smtp', requirePermission('CONFIG_MANAGE'), ConfigController.updateSmtpConfig);
router.post('/smtp/test', requirePermission('CONFIG_MANAGE'), ConfigController.testSmtpConfig);
router.get('/params', requirePermission('CONFIG_MANAGE'), ConfigController.getConfigs);
router.put('/:key', requirePermission('CONFIG_MANAGE'), ConfigController.updateConfig);

export const configRoutes = router;
