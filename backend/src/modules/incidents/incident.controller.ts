
import { Request, Response, NextFunction } from 'express';
import { incidentCrudService, FindAllFilters } from './services/incident-crud.service';
import { incidentStatusService } from './services/incident-status.service';
import { incidentAnalyticsService } from './services/incident-analytics.service';
import { incidentFileService } from './services/incident-file.service';
import { incidentSuggestionService } from './services/suggestion.service';
import type { CreateIncidentDTO, UpdateIncidentDTO } from '../../types';
import { fileUploadService } from '../../common/services/fileUploadService';
import { createIncidentSchema, updateIncidentSchema, addIncidentLogSchema } from './incident.schema';
import { AppError, NotFoundError, ValidationError, ForbiddenError } from '../../common/errors/app.error';
import { sanitizeObject } from '../../common/utils/sanitize';
import { createResponse } from '../../common/types/api.response';
import { logAudit, generateAuditDiff } from '../audit/audit.service';
import { logger } from '../../common/utils/logger';
import { UserRole, UserRoleType } from '../../constants';
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

            const stats = await incidentAnalyticsService.getStats(filters);
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

            const incidents = await incidentCrudService.searchSimilar(query as string);
            res.json(createResponse(true, incidents));
        } catch (error) {
            next(error);
        }
    }

    static async suggestProcedures(req: Request, res: Response, next: NextFunction) {
        try {
            const systemId = req.query.systemId as string;
            if (!systemId) {
                res.json(createResponse(true, []));
                return;
            }
            const jobId = req.query.jobId as string | undefined;
            const severity = req.query.severity as string | undefined;

            const suggestions = await incidentSuggestionService.suggestProcedures(systemId, jobId, severity);
            res.json(createResponse(true, suggestions));
        } catch (error) {
            next(error);
        }
    }

    static async getIncidents(req: Request, res: Response, next: NextFunction) {
        try {
            // Pagination is now handled by middleware, but we need to pass it
            const pagination = req.pagination || { page: 1, limit: 50, sortBy: 'createdAt', sortOrder: 'desc' };

            const filters: FindAllFilters = {
                status: req.query.status as string,
                severity: req.query.severity as string,
                systemId: req.query.systemId as string,
                search: req.query.search as string,
                startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
                endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
            };

            // Role-based visibility
            const user = (req as AuthRequest).user;
            const canViewAll = ([UserRole.ADMIN, UserRole.OPERATOR, UserRole.EXPERT] as readonly string[]).includes(user?.role ?? '');

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

            const result = await incidentCrudService.findAll(filters, pagination);

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
            const authReq = req as AuthRequest;
            const incident = await incidentCrudService.findById(req.params.id);

            // IDOR protection: non-ADMIN users can only view incidents assigned to their team
            if (authReq.user?.role !== UserRole.ADMIN) {
                const userTeamIds = authReq.user?.teamIds || [];
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const incidentTeamId = (incident as any).assignedTeamId;
                if (incidentTeamId && !userTeamIds.includes(incidentTeamId)) {
                    throw new ForbiddenError('You do not have access to this incident');
                }
            }

            res.json(createResponse(true, incident));
        } catch (error) {
            next(error);
        }
    }

    static async createIncident(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id;
            if (!userId) throw new ValidationError('User not authenticated');

            const data = sanitizeObject(createIncidentSchema.parse(req.body), ['description']);

            const incident = await incidentCrudService.create(data as CreateIncidentDTO, userId);

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

            const existingIncident = await incidentCrudService.findById(req.params.id);
            const data = sanitizeObject(updateIncidentSchema.parse(req.body), ['description']);

            // Role-based workflow restrictions
            if (data.status === 'Closed' && req.user?.role !== UserRole.ADMIN) {
                throw new ForbiddenError('Only Administrators can close incidents');
            }
            if (data.status === 'Resolved' && !([UserRole.ADMIN, UserRole.OPERATOR, UserRole.EXPERT] as readonly string[]).includes(req.user?.role ?? '')) {
                throw new ForbiddenError('Only Administrators, Experts or Operators can resolve incidents');
            }

            const incident = await incidentCrudService.update(req.params.id, data as UpdateIncidentDTO, userId);

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

            const data = addIncidentLogSchema.parse(req.body);
            const log = await incidentFileService.addLog(req.params.id, data, userId);
            res.status(201).json(createResponse(true, log));
        } catch (error) {
            next(error);
        }
    }

    static async uploadIncidentFile(req: AuthRequest, res: Response, next: NextFunction) {
        let tempPath: string | undefined;
        try {
            const userId = req.user?.id;
            if (!userId) throw new ValidationError('User not authenticated');
            if (!req.file) throw new ValidationError('No file uploaded');

            // diskStorage gives us req.file.path instead of req.file.buffer
            tempPath = req.file.path;
            const fs = await import('fs');
            const fileBuffer = fs.readFileSync(tempPath);

            const uploadedFile = await fileUploadService.saveFile(
                req.params.id,
                fileBuffer,
                req.file.originalname,
                req.file.mimetype
            );

            const log = await incidentFileService.addFileLog(req.params.id, {
                filePath: uploadedFile.filePath,
                fileName: uploadedFile.fileName,
                fileSize: uploadedFile.fileSize,
                mimeType: uploadedFile.mimeType
            }, userId);

            res.status(201).json(createResponse(true, log));
        } catch (error) {
            next(error);
        } finally {
            // Always clean up temp file
            if (tempPath) {
                const fs = await import('fs');
                fs.unlink(tempPath, () => { }); // fire-and-forget cleanup
            }
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

            const fileLog = await incidentFileService.getFileLog(id, filename);

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

            const fileLog = await incidentFileService.getFileLog(id, filename);

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

    /**
     * Delete an uploaded file. Only the uploader or ADMIN can delete.
     */
    static async deleteFile(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id;
            const userRole = req.user?.role || '';
            if (!userId) throw new ValidationError('User not authenticated');

            const { id, filename } = req.params;

            if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
                throw new ValidationError('Invalid filename: path traversal characters are not allowed');
            }

            await incidentFileService.deleteFileLog(id, filename, userId, userRole);
            res.json(createResponse(true, null, 'File deleted successfully'));
        } catch (error) {
            next(error);
        }
    }

    static async linkProcedure(req: Request, res: Response, next: NextFunction) {
        try {
            const incident = await incidentCrudService.linkProcedure(req.params.id, req.params.procedureId);
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
            const incident = await incidentStatusService.acknowledge(req.params.id, userId);
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

            await incidentCrudService.delete(req.params.id, userId);
            res.json(createResponse(true, null, 'Incident deleted successfully'));
        } catch (error) {
            next(error);
        }
    }
}
