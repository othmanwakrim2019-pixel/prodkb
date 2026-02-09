import { Router } from 'express';
import { emailTemplateController } from '../controllers/emailTemplateController';
import { authenticate, authorize, checkPermission } from '../middleware/auth';

const router = Router();

// All routes require authentication and SYSTEM_MANAGE permission
router.use(authenticate);
router.use(checkPermission('SYSTEM_MANAGE'));

router.get('/', emailTemplateController.getAllTemplates);
router.get('/:id', emailTemplateController.getTemplate);
router.put('/:id', emailTemplateController.updateTemplate);
router.post('/preview', emailTemplateController.previewTemplate);

export default router;
