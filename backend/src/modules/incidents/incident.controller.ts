
import { Request, Response, NextFunction } from 'express';
import { incidentService } from './incident.service';
import type { CreateIncidentDTO, UpdateIncidentDTO } from '../../types';
import { fileUploadService } from '../../common/services/fileUploadService';
import { createIncidentSchema, updateIncidentSchema } from './incident.schema';
import { AppError, NotFoundError, ValidationError, ForbiddenError } from '../../common/errors/app.error';
import { createResponse } from '../../common/types/api.response';
import { logAudit, generateAuditDiff } from '../audit/audit.service';
import { logger } from '../../common/utils/logger';
import { UserRole } from '../../constants';
import { AuthRequest } from '../../common/middleware/auth.middleware';

export class IncidentController {
    static async getStats(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const filters = {
                startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
                endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
                systemId: req.query.systemId as string,
                teamId: req.query.teamId as string,
                userId: req.user?.id,
                userRole: req.user?.role,
                userTeamIds: req.user?.teamIds || [],
            };

            const stats = await incidentService.getStats(filters);
            res.json(createResponse(true, stats));
        } catch (error) {
            next(error);
        }
    }

    static async searchSimilar(req: Request, res: Response, next: NextFunction) {
        try {
            const { query } = req.query;
            if (!query) {
                res.json(createResponse(true, []));
                return;
            }

            const incidents = await incidentService.searchSimilar(query as string);
            res.json(createResponse(true, incidents));
        } catch (error) {
            next(error);
        }
    }

    static async getIncidents(req: Request, res: Response, next: NextFunction) {
        try {
            // Pagination is now handled by middleware, but we need to pass it
            const pagination = req.pagination || { page: 1, limit: 50, sortBy: 'createdAt', sortOrder: 'desc' };

            const filters: any = {
                status: req.query.status as string,
                severity: req.query.severity as string,
                systemId: req.query.systemId as string,
                search: req.query.search as string,
                startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
                endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
            };

            // Role-based visibility
            const user = (req as AuthRequest).user;
            const canViewAll = [UserRole.ADMIN, UserRole.OPERATOR, UserRole.EXPERT].includes(user?.role as any);

            if (user && !canViewAll) {
                if (user.teamIds && user.teamIds.length > 0) {
                    if (req.query.teamId) {
                        if (!user.teamIds.includes(req.query.teamId as string)) {
                            filters.teamId = 'NONE';
                        } else {
                            filters.teamId = req.query.teamId as string;
                        }
                    } else {
                        filters.teamId = user.teamIds;
                    }
                } else {
                    filters.teamId = 'NONE';
                }
            } else {
                if (req.query.teamId) filters.teamId = req.query.teamId as string;
            }

            const result = await incidentService.findAll(filters, pagination);

            res.json(createResponse(true, {
                items: result.data,
                meta: {
                    total: result.total,
                    page: result.page,
                    limit: result.limit,
                    totalPages: result.totalPages,
                }
            }));
        } catch (error) {
            next(error);
        }
    }

    static async getIncidentById(req: Request, res: Response, next: NextFunction) {
        try {
            const incident = await incidentService.findById(req.params.id);
            res.json(createResponse(true, incident));
        } catch (error) {
            next(error);
        }
    }

    static async createIncident(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id;
            if (!userId) throw new ValidationError('User not authenticated');

            const data = createIncidentSchema.parse(req.body);

            const incident = await incidentService.create(data as CreateIncidentDTO, userId);

            // Audit log
            await logAudit({
                userId,
                actionType: 'CREATE',
                entityType: 'INCIDENT',
                entityId: incident.id,
                details: `Created incident: ${incident.title}`,
                req
            });

            res.status(201).json(createResponse(true, incident, 'Incident created successfully'));
        } catch (error) {
            next(error);
        }
    }

    static async updateIncident(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id;
            if (!userId) throw new ValidationError('User not authenticated');

            const existingIncident = await incidentService.findById(req.params.id);
            const data = updateIncidentSchema.parse(req.body);

            // Role-based workflow restrictions
            if (data.status === 'Closed' && req.user?.role !== UserRole.ADMIN) {
                throw new ForbiddenError('Only Administrators can close incidents');
            }
            if (data.status === 'Resolved' && ![UserRole.ADMIN, UserRole.OPERATOR, UserRole.EXPERT].includes(req.user?.role as any)) {
                throw new ForbiddenError('Only Administrators, Experts or Operators can resolve incidents');
            }

            const incident = await incidentService.update(req.params.id, data as UpdateIncidentDTO, userId);

            // Audit log
            const changes = generateAuditDiff(existingIncident as unknown as Record<string, unknown>, incident as unknown as Record<string, unknown>);
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

            res.json(createResponse(true, incident));
        } catch (error) {
            next(error);
        }
    }

    static async addIncidentLog(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id;
            if (!userId) throw new ValidationError('User not authenticated');

            const { logType, errorCode, errorMessage, rawLog, metadata } = req.body;
            const log = await incidentService.addLog(req.params.id, {
                logType, errorCode, errorMessage, rawLog, metadata
            }, userId);
            res.status(201).json(createResponse(true, log));
        } catch (error) {
            next(error);
        }
    }

    static async uploadIncidentFile(req: AuthRequest, res: Response, next: NextFunction) {
        try {
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
            }, userId);

            res.status(201).json(createResponse(true, log));
        } catch (error) {
            next(error);
        }
    }

    static async downloadFile(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id;
            if (!userId) throw new ValidationError('User not authenticated');

            const { id, filename } = req.params;

            // ── Path traversal protection ──
            if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
                throw new ValidationError('Invalid filename: path traversal characters are not allowed');
            }

            const fileLog = await incidentService.getFileLog(id, filename);

            if (!fileLog.filePath) throw new NotFoundError('File path missing in log');

            const exists = await fileUploadService.fileExists(fileLog.filePath);
            if (!exists) throw new NotFoundError('File on disk');

            res.setHeader('Content-Disposition', `attachment; filename="${fileLog.fileName || 'download'}"`);
            res.setHeader('Content-Type', fileLog.mimeType || 'application/octet-stream');
            if (fileLog.fileSize) res.setHeader('Content-Length', fileLog.fileSize);

            const fileStream = await fileUploadService.getFileStream(fileLog.filePath);
            fileStream.on('error', (error) => {
                logger.error('Stream error', { error });
                if (!res.headersSent) res.status(500).send('Could not download file');
            });
            fileStream.pipe(res);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Preview a file inline (Content-Disposition: inline).
     * Browsers will render images, PDFs, text, and video inline.
     */
    static async previewFile(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id;
            if (!userId) throw new ValidationError('User not authenticated');

            const { id, filename } = req.params;

            if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
                throw new ValidationError('Invalid filename: path traversal characters are not allowed');
            }

            const fileLog = await incidentService.getFileLog(id, filename);

            if (!fileLog.filePath) throw new NotFoundError('File path missing in log');

            const exists = await fileUploadService.fileExists(fileLog.filePath);
            if (!exists) throw new NotFoundError('File on disk');

            // Inline disposition — browser will render supported types
            res.setHeader('Content-Disposition', `inline; filename="${fileLog.fileName || 'preview'}"`);
            res.setHeader('Content-Type', fileLog.mimeType || 'application/octet-stream');
            if (fileLog.fileSize) res.setHeader('Content-Length', fileLog.fileSize);

            const fileStream = await fileUploadService.getFileStream(fileLog.filePath);
            fileStream.on('error', (error) => {
                logger.error('Preview stream error', { error });
                if (!res.headersSent) res.status(500).send('Could not preview file');
            });
            fileStream.pipe(res);
        } catch (error) {
            next(error);
        }
    }

    static async linkProcedure(req: Request, res: Response, next: NextFunction) {
        try {
            const incident = await incidentService.linkProcedure(req.params.id, req.params.procedureId);
            res.json(createResponse(true, incident));
        } catch (error) {
            next(error);
        }
    }

    static async updateIncidentStatus(req: AuthRequest, res: Response, next: NextFunction) {
        req.body = { status: req.body.status };
        return IncidentController.updateIncident(req, res, next);
    }

    static async acknowledgeIncident(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id;
            if (!userId) throw new ValidationError('User not authenticated');
            const incident = await incidentService.acknowledge(req.params.id, userId);
            res.json(createResponse(true, incident, 'Incident acknowledged'));
        } catch (error) {
            next(error);
        }
    }

    static async deleteIncident(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id;
            if (!userId) throw new ValidationError('User not authenticated');

            if (req.user?.role !== UserRole.ADMIN) {
                throw new ForbiddenError('Only Administrators can delete incidents');
            }

            await incidentService.delete(req.params.id, userId);
            res.json(createResponse(true, null, 'Incident deleted successfully'));
        } catch (error) {
            next(error);
        }
    }
}
