
import { Router } from 'express';
import { IncidentController } from './incident.controller';
import { authenticate, checkPermission } from '../../common/middleware/auth.middleware';
import { uploadLimiter } from '../../common/middleware/rate-limiter.middleware';
import { paginationMiddleware } from '../../common/middleware/pagination.middleware';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Stats & Search (Must come before :id)
router.get('/stats', authenticate, checkPermission('DASHBOARD_VIEW'), IncidentController.getStats);
router.get('/search', authenticate, checkPermission('SEARCH_VIEW'), IncidentController.searchSimilar);

// CRUD
router.get('/', authenticate, checkPermission('INCIDENT_VIEW'), paginationMiddleware, IncidentController.getIncidents);
router.post('/', authenticate, checkPermission('INCIDENT_CREATE'), IncidentController.createIncident);
router.get('/:id', authenticate, checkPermission('INCIDENT_VIEW'), IncidentController.getIncidentById);
router.put('/:id', authenticate, checkPermission('INCIDENT_EDIT'), IncidentController.updateIncident);
router.delete('/:id', authenticate, checkPermission('INCIDENT_DELETE'), IncidentController.deleteIncident);

// Sub-resources
router.put('/:id/status', authenticate, checkPermission('INCIDENT_EDIT'), IncidentController.updateIncidentStatus);
router.post('/:id/logs', authenticate, checkPermission('INCIDENT_EDIT'), IncidentController.addIncidentLog);
router.post('/:id/upload', authenticate, checkPermission('INCIDENT_EDIT'), uploadLimiter, upload.single('file'), IncidentController.uploadIncidentFile);
router.get('/:id/files/:filename', authenticate, IncidentController.downloadFile);
router.post('/:id/link-procedure/:procedureId', authenticate, checkPermission('INCIDENT_EDIT'), IncidentController.linkProcedure);

export const incidentRoutes = router;
