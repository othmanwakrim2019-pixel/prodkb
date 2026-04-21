
/**
 * API v1 Routes — versioned API namespace
 * All module routes are mounted under /api/v1/*
 * @module modules/v1.routes
 */

import { Router } from 'express';
import { authRoutes } from './auth/presentation/auth.routes';
import { incidentRoutes } from './incidents/presentation/incident.routes';
import { userRoutes } from './users/presentation/user.routes';
import { teamRoutes } from './teams/presentation/team.routes';
import { systemRoutes } from './systems/presentation/system.routes';
import { procedureRoutes } from './procedures/presentation/procedure.routes';
import { roleRoutes } from './roles/presentation/role.routes';
import { slaRoutes } from './sla/presentation/sla.routes';
import { configRoutes } from './config/presentation/config.routes';
import { emailTemplateRoutes } from './email-templates/presentation/email-template.routes';
import { auditRoutes } from './audit/presentation/audit.routes';
import { searchRoutes } from './search/presentation/search.routes';
import { planningRoutes } from './planning/presentation/planning.routes';
import { escalationRoutes } from './escalation/presentation/escalation.routes';
import { autoAssignRoutes } from './auto-assign/presentation/auto-assign.routes';
import { webhookRoutes } from './webhooks/presentation/webhook.routes';
import { analyticsRoutes } from './analytics/presentation/analytics.routes';
import { notificationRoutes } from './notifications/presentation/notification.routes';
import { postMortemRoutes } from './postmortem/presentation/postmortem.routes';
import { maintenanceRoutes } from './maintenance/presentation/maintenance.routes';
import { warRoomRoutes } from './warroom/presentation/warroom.routes';
import { astreinteRoutes } from './astreinte/presentation/astreinte.routes';
import { eventRoutes } from './events/presentation/events.routes';
import { equipeRoutes } from './equipe/presentation/equipe.routes';

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
router.use('/events', eventRoutes);

// Team Management (Astreinte + Daily Plans)
router.use('/astreintes', astreinteRoutes);
router.use('/equipe', equipeRoutes);

// Phase 4 modules (Maintenance, War Room)
router.use('/maintenance', maintenanceRoutes);
router.use('/warroom', warRoomRoutes);

export default router;
