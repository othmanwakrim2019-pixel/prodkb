import crypto from 'crypto';
import os from 'os';
import path from 'path';
import { Router } from 'express';
import multer from 'multer';
import { authenticate, requirePermission } from '../../../common/middleware/auth.middleware';
import { paginationMiddleware } from '../../../common/middleware/pagination.middleware';
import { uploadLimiter } from '../../../common/middleware/rate-limiter.middleware';
import { IncidentCommandController } from './controllers/incident-command.controller';
import { IncidentFileController } from './controllers/incident-file.controller';
import { IncidentQueryController } from './controllers/incident-query.controller';

const router = Router();

const ALLOWED_MIME_TYPES = [
    'text/plain', 'text/csv', 'text/html',
    'application/json', 'application/xml',
    'application/pdf',
    'image/png', 'image/jpeg', 'image/gif', 'image/webp',
    'application/zip', 'application/gzip',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const upload = multer({
    storage: multer.diskStorage({
        destination: os.tmpdir(),
        filename: (_req, file, cb) => {
            const uniqueSuffix = crypto.randomBytes(8).toString('hex');
            cb(null, `upload-${uniqueSuffix}${path.extname(file.originalname)}`);
        },
    }),
    limits: { fileSize: 25 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`File type '${file.mimetype}' is not allowed. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`));
        }
    },
});

router.get('/stats', authenticate, requirePermission('DASHBOARD_VIEW'), IncidentQueryController.getStats);
router.get('/search', authenticate, requirePermission('SEARCH_VIEW'), IncidentQueryController.searchSimilar);
router.get('/suggest-procedures', authenticate, requirePermission('INCIDENT_VIEW'), IncidentQueryController.suggestProcedures);

router.get('/', authenticate, requirePermission('INCIDENT_VIEW'), paginationMiddleware, IncidentQueryController.getIncidents);
router.post('/', authenticate, requirePermission('INCIDENT_CREATE'), IncidentCommandController.createIncident);
router.get('/:id', authenticate, requirePermission('INCIDENT_VIEW'), IncidentQueryController.getIncidentById);
router.get('/:id/activity', authenticate, requirePermission('INCIDENT_VIEW'), IncidentQueryController.getActivity);
router.put('/:id', authenticate, requirePermission('INCIDENT_EDIT'), IncidentCommandController.updateIncident);
router.delete('/:id', authenticate, requirePermission('INCIDENT_DELETE'), IncidentCommandController.deleteIncident);

router.put('/:id/status', authenticate, requirePermission('INCIDENT_EDIT'), IncidentCommandController.updateIncidentStatus);
router.post('/:id/acknowledge', authenticate, requirePermission('INCIDENT_EDIT'), IncidentCommandController.acknowledgeIncident);
router.post('/:id/logs', authenticate, requirePermission('INCIDENT_EDIT'), IncidentCommandController.addIncidentLog);
router.post('/:id/upload', authenticate, requirePermission('INCIDENT_EDIT'), uploadLimiter, upload.single('file'), IncidentFileController.uploadIncidentFile);
router.get('/:id/files/:filename', authenticate, requirePermission('INCIDENT_VIEW'), IncidentFileController.downloadFile);
router.get('/:id/files/:filename/preview', authenticate, requirePermission('INCIDENT_VIEW'), IncidentFileController.previewFile);
router.delete('/:id/files/:filename', authenticate, requirePermission('INCIDENT_EDIT'), IncidentFileController.deleteFile);
router.post('/:id/link-procedure/:procedureId', authenticate, requirePermission('INCIDENT_EDIT'), IncidentCommandController.linkProcedure);

export const incidentRoutes = router;
