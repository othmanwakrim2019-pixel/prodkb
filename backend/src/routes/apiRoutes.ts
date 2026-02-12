import { Router } from 'express';

import { systemRoutes } from '../modules/systems/system.routes';
import { authRoutes } from '../modules/auth/auth.routes';
import { userRoutes } from '../modules/users/user.routes';
import incidentRoutes from '../modules/incidents/incident.routes';
import { procedureRoutes } from '../modules/procedures/procedure.routes';

import { roleRoutes } from '../modules/roles/role.routes';

import { teamRoutes } from '../modules/teams/team.routes';
import { slaRoutes } from '../modules/slas/sla.routes';


const router = Router();

router.use('/auth', authRoutes);

// Systems & Jobs
router.use('/', systemRoutes);


// Teams
router.use('/teams', teamRoutes);

// SLAs
router.use('/slas', slaRoutes);

// Users
router.use('/users', userRoutes); // Was /users

// Incidents (Modularized)
router.use('/incidents', incidentRoutes);

// Procedures
router.use('/procedures', procedureRoutes);


// Role Management & Permissions
router.use('/', roleRoutes);




// ... existing imports ...

// System Config (SMTP & Generic)
import { configRoutes } from '../modules/config/config.routes';
router.use('/config', configRoutes);

// Audit Logs
import { auditRoutes } from '../modules/audit/audit.routes';
router.use('/audit-logs', auditRoutes);

// Search (Global)
import { searchRoutes } from '../modules/search/search.routes';
router.use('/search', searchRoutes);


// Email Templates
import { emailTemplateRoutes } from '../modules/email-templates/email-template.routes';
router.use('/email-templates', emailTemplateRoutes);

export default router;


