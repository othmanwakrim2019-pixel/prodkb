
import { Router } from 'express';
import { ConfigController } from './config.controller';
import { authenticate, checkPermission } from '../../common/middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// System Config (SMTP & Generic)
router.get('/smtp', checkPermission('CONFIG_MANAGE'), ConfigController.getSmtpConfig);
router.put('/smtp', checkPermission('CONFIG_MANAGE'), ConfigController.updateSmtpConfig);
router.post('/smtp/test', checkPermission('CONFIG_MANAGE'), ConfigController.testSmtpConfig);
router.get('/params', checkPermission('CONFIG_MANAGE'), ConfigController.getConfigs);
router.put('/:key', checkPermission('CONFIG_MANAGE'), ConfigController.updateConfig);

export const configRoutes = router;
