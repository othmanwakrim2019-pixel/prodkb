
import { Router } from 'express';
import { incidentRoutes } from './incidents/incident.routes';
import { userRoutes } from './users/user.routes';
import { teamRoutes } from './teams/team.routes';
import { systemRoutes } from './systems/system.routes';
import { procedureRoutes } from './procedures/procedure.routes';
import { roleRoutes } from './roles/role.routes';
import { slaRoutes } from './slas/sla.routes';
import { configRoutes } from './config/config.routes';
import { emailTemplateRoutes } from './email-templates/email-template.routes';
import { auditRoutes } from './audit/audit.routes';
import { searchRoutes } from './search/search.routes';

const router = Router();

router.use('/incidents', incidentRoutes);
router.use('/users', userRoutes);
router.use('/teams', teamRoutes);
router.use('/systems', systemRoutes);
router.use('/procedures', procedureRoutes);
router.use('/roles', roleRoutes);
router.use('/slas', slaRoutes);
router.use('/config', configRoutes);
router.use('/email-templates', emailTemplateRoutes);
router.use('/audit-logs', auditRoutes);
router.use('/search', searchRoutes);

export default router;
