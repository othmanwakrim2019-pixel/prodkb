import fs from 'fs';
import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { incidentService } from '../services/IncidentService';
import { fileUploadService } from '../services/fileUploadService';
import { z } from 'zod';
import multer from 'multer';
import { NotFoundError, ValidationError } from '../errors/AppError';
import { logAudit, generateAuditDiff } from '../services/auditService';

// Configure multer for file uploads
const storage = multer.memoryStorage();
export const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
});

// Validation schemas (kept in controller for now, could be moved to DTOs/middleware)
const createIncidentSchema = z.object({
    title: z.string().min(3).max(200),
    description: z.string().min(10),
    environment: z.enum(['PROD', 'PREPROD', 'RECETTE']),
    severity: z.enum(['Critical', 'High', 'Medium', 'Low']),
    impact: z.string().optional(),
    detectionSource: z.string().optional(),
    systemId: z.string().uuid(),
    jobId: z.string().uuid().optional(),
    slaId: z.string().uuid().optional(),
    assignedTeamId: z.string().uuid().optional(),
    logs: z.array(z.object({
        logType: z.string().optional(),
        rawLog: z.string().optional(),
        errorMessage: z.string().optional(),
    })).optional(),
});

/**
 * Get aggregated incident statistics
 */
export const getIncidentStats = async (req: AuthRequest, res: Response) => {
    const filters = {
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        systemId: req.query.systemId as string,
        teamId: req.query.teamId as string,
        userId: req.user?.id
    };

    const stats = await incidentService.getStats(filters);
    res.json(stats);
};

/**
 * Search similar incidents
 */
export const searchSimilarIncidents = async (req: Request, res: Response) => {
    const { query } = req.query;
    if (!query) {
        return res.json([]);
    }

    const incidents = await incidentService.searchSimilar(query as string);
    res.json(incidents);
};

/**
 * Get incidents with pagination and filtering
 */
export const getIncidents = async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const filters = {
        status: req.query.status as string,
        severity: req.query.severity as string,
        systemId: req.query.systemId as string,
        teamId: req.query.teamId as string,
        search: req.query.search as string,
    };

    const result = await incidentService.findAll(filters, { page, limit });

    // Transform for frontend format
    res.json({
        data: result.data,
        meta: {
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages,
        }
    });
};

/**
 * Get incident by ID
 */
export const getIncidentById = async (req: Request, res: Response) => {
    const incident = await incidentService.findById(req.params.id);
    res.json(incident);
};

/**
 * Create a new incident
 */
export const createIncident = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new ValidationError('User not authenticated'); // Should be handled by Auth middleware ideally, but satisfying flow
    }

    const data = createIncidentSchema.parse(req.body);

    // Map DTO to service DTO
    const serviceData: any = {
        ...data,
        environment: data.environment as any,
        severity: data.severity as any,
    };

    const incident = await incidentService.create(serviceData, userId);

    // Audit log
    await logAudit({
        userId,
        actionType: 'CREATE',
        entityType: 'INCIDENT',
        entityId: incident.id,
        details: `Created incident: ${incident.title}`,
        req
    });

    res.status(201).json(incident);
};

/**
 * Update an incident
 */
export const updateIncident = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new ValidationError('User not authenticated');
    }

    const existingIncident = await incidentService.findById(req.params.id);
    const incident = await incidentService.update(req.params.id, req.body, userId);

    // Audit log
    const changes = generateAuditDiff(existingIncident, incident);
    if (changes !== 'No changes detected') {
        await logAudit({
            userId,
            actionType: 'UPDATE',
            entityType: 'INCIDENT',
            entityId: req.params.id,
            details: changes,
            req
        });
    }

    res.json(incident);
};

/**
 * Add a log to an incident
 */
export const addIncidentLog = async (req: Request, res: Response) => {
    const { logType, errorCode, errorMessage, rawLog, metadata } = req.body;
    const log = await incidentService.addLog(req.params.id, {
        logType, errorCode, errorMessage, rawLog, metadata
    });
    res.status(201).json(log);
};

/**
 * Upload a file to an incident
 */
export const uploadIncidentFile = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw new ValidationError('User not authenticated');
    if (!req.file) throw new ValidationError('No file uploaded');

    const uploadedFile = await fileUploadService.saveFile(
        req.params.id,
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
    );

    const log = await incidentService.addFileLog(req.params.id, {
        filePath: uploadedFile.filePath,
        fileName: uploadedFile.fileName,
        fileSize: uploadedFile.fileSize,
        mimeType: uploadedFile.mimeType
    });

    res.status(201).json(log);
};

/**
 * Download a file attached to an incident
 */
export const downloadFile = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) throw new ValidationError('User not authenticated');

        const { id, filename } = req.params;
        console.log(`[DEBUG] downloadFile called for incidentId=${id}, filename=${filename}`);

        const fileLog = await incidentService.getFileLog(id, filename);
        console.log(`[DEBUG] fileLog found:`, fileLog);

        if (!fileLog.filePath) {
            console.error('[DEBUG] fileLog has no filePath');
            throw new NotFoundError('File path missing in log');
        }

        // Check if file exists on disk
        const exists = fileUploadService.fileExists(fileLog.filePath);
        console.log(`[DEBUG] file exists check: ${exists} for path ${fileLog.filePath}`);

        if (!exists) {
            console.error(`[DEBUG] File not found on disk: ${fileLog.filePath}`);
            throw new NotFoundError('File on disk');
        }

        const absolutePath = fileUploadService.getAbsolutePath(fileLog.filePath);
        console.log(`[DEBUG] Serving file from: ${absolutePath}`);

        // Use streams to avoid Express/Send path resolution issues on Windows
        res.setHeader('Content-Disposition', `attachment; filename="${fileLog.fileName || 'download'}"`);
        res.setHeader('Content-Type', fileLog.mimeType || 'application/octet-stream');

        if (fileLog.fileSize) {
            res.setHeader('Content-Length', fileLog.fileSize);
        }

        const fileStream = fs.createReadStream(absolutePath);

        fileStream.on('error', (error) => {
            console.error(`[DEBUG] Stream error:`, error);
            if (!res.headersSent) {
                res.status(500).send('Could not download file');
            }
        });

        fileStream.pipe(res);
    } catch (error) {
        console.error(`[DEBUG] Caught error in downloadFile:`, error);
        // Pass to error handler if headers not sent
        if (!res.headersSent) {
            throw error;
        }
    }
};

/**
 * Link a procedure to an incident
 */
export const linkProcedure = async (req: Request, res: Response) => {
    const incident = await incidentService.linkProcedure(req.params.id, req.params.procedureId);
    res.json(incident);
};

/**
 * Update incident status (legacy wrapper)
 */
export const updateIncidentStatus = async (req: AuthRequest, res: Response) => {
    req.body = { status: req.body.status };
    return updateIncident(req, res);
};

/**
 * Delete an incident
 */
export const deleteIncident = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw new ValidationError('User not authenticated');

    await incidentService.delete(req.params.id, userId);
    res.json({ message: 'Incident deleted successfully' });
};
