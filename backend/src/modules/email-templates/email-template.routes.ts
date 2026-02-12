
import { Router } from 'express';
import { EmailTemplateController } from './email-template.controller';
import { authenticate, checkPermission } from '../../common/middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// All template routes require system manage permission usually, or specific template permission
// Legacy didn't specify strict permission on get, but let's assume SYSTEM_MANAGE for now or keep open if previously open.
// Looking at legacy: router.use('/email-templates', emailTemplateRoutes); which might have had middleware inside.
// Assuming SYSTEM_MANAGE is safe for editing.

router.get('/', checkPermission('SYSTEM_MANAGE'), EmailTemplateController.getAllTemplates);
router.post('/preview', checkPermission('SYSTEM_MANAGE'), EmailTemplateController.previewTemplate);
router.get('/:id', checkPermission('SYSTEM_MANAGE'), EmailTemplateController.getTemplate);
router.put('/:id', checkPermission('SYSTEM_MANAGE'), EmailTemplateController.updateTemplate);

export const emailTemplateRoutes = router;
