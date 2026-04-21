
import { Router } from 'express';
import { EmailTemplateController } from '../presentation/email-template.controller';
import { authenticate, requirePermission } from '../../../common/middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// All template routes require system manage permission usually, or specific template permission
// Legacy didn't specify strict permission on get, but let's assume SYSTEM_MANAGE for now or keep open if previously open.
// Looking at legacy: router.use('/email-templates', emailTemplateRoutes); which might have had middleware inside.
// Assuming SYSTEM_MANAGE is safe for editing.

router.get('/', requirePermission('EMAIL_TEMPLATE_MANAGE'), EmailTemplateController.getAllTemplates);
router.post('/preview', requirePermission('EMAIL_TEMPLATE_MANAGE'), EmailTemplateController.previewTemplate);
router.get('/:id', requirePermission('EMAIL_TEMPLATE_MANAGE'), EmailTemplateController.getTemplate);
router.put('/:id', requirePermission('EMAIL_TEMPLATE_MANAGE'), EmailTemplateController.updateTemplate);

export const emailTemplateRoutes = router;
