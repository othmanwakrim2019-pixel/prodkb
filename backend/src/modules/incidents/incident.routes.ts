
import { Router } from 'express';
import { IncidentController } from './incident.controller';
import { authenticate, checkPermission } from '../../common/middleware/auth.middleware';
import { uploadLimiter } from '../../common/middleware/rate-limiter.middleware';
import { paginationMiddleware } from '../../common/middleware/pagination.middleware';
import multer from 'multer';
import os from 'os';
import path from 'path';
import crypto from 'crypto';

const router = Router();

// ── File upload security ──
const ALLOWED_MIME_TYPES = [
    'text/plain', 'text/csv', 'text/html',
    'application/json', 'application/xml',
    'application/pdf',
    'image/png', 'image/jpeg', 'image/gif', 'image/webp',
    'application/zip', 'application/gzip',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
];

// Use diskStorage instead of memoryStorage to prevent RAM exhaustion from large uploads
const upload = multer({
    storage: multer.diskStorage({
        destination: os.tmpdir(),
        filename: (_req, file, cb) => {
            const uniqueSuffix = crypto.randomBytes(8).toString('hex');
            cb(null, `upload-${uniqueSuffix}${path.extname(file.originalname)}`);
        },
    }),
    limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`File type '${file.mimetype}' is not allowed. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`));
        }
    },
});

// Stats & Search (Must come before :id)
router.get('/stats', authenticate, checkPermission('DASHBOARD_VIEW'), IncidentController.getStats);
router.get('/search', authenticate, checkPermission('SEARCH_VIEW'), IncidentController.searchSimilar);
router.get('/suggest-procedures', authenticate, checkPermission('INCIDENT_VIEW'), IncidentController.suggestProcedures);

// CRUD
router.get('/', authenticate, checkPermission('INCIDENT_VIEW'), paginationMiddleware, IncidentController.getIncidents);
router.post('/', authenticate, checkPermission('INCIDENT_CREATE'), IncidentController.createIncident);
router.get('/:id', authenticate, checkPermission('INCIDENT_VIEW'), IncidentController.getIncidentById);
router.put('/:id', authenticate, checkPermission('INCIDENT_EDIT'), IncidentController.updateIncident);
router.delete('/:id', authenticate, checkPermission('INCIDENT_DELETE'), IncidentController.deleteIncident);

// Sub-resources
router.put('/:id/status', authenticate, checkPermission('INCIDENT_EDIT'), IncidentController.updateIncidentStatus);
router.post('/:id/acknowledge', authenticate, checkPermission('INCIDENT_EDIT'), IncidentController.acknowledgeIncident);
router.post('/:id/logs', authenticate, checkPermission('INCIDENT_EDIT'), IncidentController.addIncidentLog);
router.post('/:id/upload', authenticate, checkPermission('INCIDENT_EDIT'), uploadLimiter, upload.single('file'), IncidentController.uploadIncidentFile);
router.get('/:id/files/:filename', authenticate, IncidentController.downloadFile);
router.get('/:id/files/:filename/preview', authenticate, IncidentController.previewFile);
router.delete('/:id/files/:filename', authenticate, checkPermission('INCIDENT_EDIT'), IncidentController.deleteFile);
router.post('/:id/link-procedure/:procedureId', authenticate, checkPermission('INCIDENT_EDIT'), IncidentController.linkProcedure);

export const incidentRoutes = router;
