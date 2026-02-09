import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { getSystems, createSystem, updateSystem, deleteSystem, getJobs, createJob, updateJob, deleteJob } from '../controllers/systemController';
import { getAllUsers, deleteUser, updateUser } from '../controllers/userController';
import {
    getIncidents,
    getIncidentById,
    createIncident,
    updateIncident,
    updateIncidentStatus,
    addIncidentLog,
    linkProcedure,
    uploadIncidentFile,
    upload,
    getIncidentStats,
    searchSimilarIncidents,
    deleteIncident,
} from '../controllers/incidentController';
import { getProcedures, getProcedureById, createProcedure, updateProcedure, deleteProcedure } from '../controllers/procedureController';
import { globalSearch } from '../controllers/searchController';
import * as roleController from '../controllers/roleController';
import { checkPermission } from '../middleware/auth';
import teamRoutes from './teamRoutes';
import slaRoutes from './slaRoutes';
import { uploadLimiter } from '../middleware/rateLimiter';

const router = Router();

// Systems
router.get('/systems', authenticate, getSystems);
router.post('/systems', authenticate, checkPermission('SYSTEM_MANAGE'), createSystem);
router.put('/systems/:id', authenticate, checkPermission('SYSTEM_MANAGE'), updateSystem);
router.delete('/systems/:id', authenticate, checkPermission('SYSTEM_MANAGE'), deleteSystem);

// Jobs
router.get('/jobs', authenticate, getJobs);
router.post('/jobs', authenticate, checkPermission('SYSTEM_MANAGE'), createJob);
router.put('/jobs/:id', authenticate, checkPermission('SYSTEM_MANAGE'), updateJob);
router.delete('/jobs/:id', authenticate, checkPermission('SYSTEM_MANAGE'), deleteJob);

// Teams
router.use('/teams', teamRoutes);

// SLAs
router.use('/slas', slaRoutes);

// Users
router.get('/users', authenticate, getAllUsers);
router.delete('/users/:id', authenticate, checkPermission('USER_MANAGE'), deleteUser);
router.put('/users/:id', authenticate, checkPermission('USER_MANAGE'), updateUser);

// Incidents
router.get('/incidents', authenticate, getIncidents);
router.get('/incidents/stats', authenticate, checkPermission('DASHBOARD_VIEW'), getIncidentStats);
router.get('/incidents/search', authenticate, checkPermission('SEARCH_VIEW'), searchSimilarIncidents);
router.post('/incidents', authenticate, checkPermission('INCIDENT_CREATE'), createIncident);
router.get('/incidents/:id', authenticate, getIncidentById);
router.put('/incidents/:id', authenticate, checkPermission('INCIDENT_EDIT'), updateIncident);
// Status update should also require edit permission
router.put('/incidents/:id/status', authenticate, checkPermission('INCIDENT_EDIT'), updateIncidentStatus);
router.post('/incidents/:id/logs', authenticate, checkPermission('INCIDENT_EDIT'), addIncidentLog);
router.post('/incidents/:id/upload', authenticate, checkPermission('INCIDENT_EDIT'), uploadLimiter, upload.single('file'), uploadIncidentFile);
router.post('/incidents/:id/link-procedure/:procedureId', authenticate, checkPermission('INCIDENT_EDIT'), linkProcedure);
router.delete('/incidents/:id', authenticate, checkPermission('INCIDENT_DELETE'), deleteIncident);

// Procedures
router.get('/procedures', authenticate, getProcedures);
router.post('/procedures', authenticate, checkPermission('PROCEDURE_CREATE'), createProcedure);
router.get('/procedures/:id', authenticate, getProcedureById);
router.put('/procedures/:id', authenticate, checkPermission('PROCEDURE_EDIT'), updateProcedure);
router.delete('/procedures/:id', authenticate, checkPermission('PROCEDURE_DELETE'), deleteProcedure);
router.get('/search', authenticate, checkPermission('SEARCH_VIEW'), globalSearch);

// Role Management
router.get('/roles', authenticate, checkPermission('ROLE_MANAGE'), roleController.getAllRoles);
router.post('/roles', authenticate, checkPermission('ROLE_MANAGE'), roleController.createRole);
router.put('/roles/:id', authenticate, checkPermission('ROLE_MANAGE'), roleController.updateRole);
router.delete('/roles/:id', authenticate, checkPermission('ROLE_MANAGE'), roleController.deleteRole);

// Permissions
router.get('/permissions', authenticate, roleController.getAllPermissions);

import * as auditController from '../controllers/auditController';

import * as configController from '../controllers/systemConfigController';

// ... existing imports ...

// System Config (SMTP)
router.get('/config/smtp', authenticate, checkPermission('SYSTEM_MANAGE'), configController.getSmtpConfig);
router.put('/config/smtp', authenticate, checkPermission('SYSTEM_MANAGE'), configController.updateSmtpConfig);
router.post('/config/smtp/test', authenticate, checkPermission('SYSTEM_MANAGE'), configController.testSmtpConfig);

// Audit Logs
router.get('/audit-logs', authenticate, checkPermission('AUDIT_VIEW'), auditController.getAuditLogs);

// Email Templates
import emailTemplateRoutes from './emailTemplateRoutes';
router.use('/email-templates', emailTemplateRoutes);

export default router;

