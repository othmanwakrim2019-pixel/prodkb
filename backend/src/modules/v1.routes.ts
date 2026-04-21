
/**
 * API v1 Routes — versioned API namespace
 * All module routes are mounted under /api/v1/*
 * @module modules/v1.routes
 */

import { Router } from 'express';
import { incidentRoutes } from './incidents/presentation/incident.routes';
import { userRoutes } from './users/user.routes';
import { teamRoutes } from './teams/team.routes';
import { systemRoutes } from './systems/system.routes';
import { procedureRoutes } from './procedures/procedure.routes';
import { roleRoutes } from './roles/role.routes';
import { slaRoutes } from './sla/sla.routes';
import { configRoutes } from './config/config.routes';
import { emailTemplateRoutes } from './email-templates/email-template.routes';
import { auditRoutes } from './audit/audit.routes';
import { searchRoutes } from './search/search.routes';
import { planningRoutes } from './planning/presentation/planning.routes';
import { escalationRoutes } from './escalation/escalation.routes';
import { autoAssignRoutes } from './auto-assign/auto-assign.routes';
import { webhookRoutes } from './webhooks/webhook.routes';
import { analyticsRoutes } from './analytics/analytics.routes';
import { notificationRoutes } from './notifications/notification.routes';
import { postMortemRoutes } from './postmortem/postmortem.routes';
import { maintenanceRoutes } from './maintenance/maintenance.routes';
import { warRoomRoutes } from './warroom/warroom.routes';
import { astreinteRoutes } from './astreinte/astreinte.routes';
import { equipeRoutes } from './equipe/equipe.routes';

const router = Router();
console.log('Mounting v1 routes...');
router.get('/test-ok', (req, res) => res.json({ ok: true }));

// Core modules
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
router.use('/planning', planningRoutes);

// Phase 2-3 modules
router.use('/escalation-rules', escalationRoutes);
router.use('/auto-assign-rules', autoAssignRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/notifications', notificationRoutes);
router.use('/incidents', postMortemRoutes);

// Team Management (Astreinte + Daily Plans)
router.use('/astreintes', astreinteRoutes);
router.use('/equipe', equipeRoutes);

// Phase 4 modules (Maintenance, War Room)
router.use('/maintenance', maintenanceRoutes);
router.use('/warroom', warRoomRoutes);

export default router;
