import type { NextFunction, Response } from 'express';
import { ForbiddenError, NotFoundError, ValidationError } from '../../../../common/errors/app.error';
import type { AuthRequest } from '../../../../common/middleware/auth.middleware';
import { fileUploadService } from '../../../../common/services/file-upload.service';
import { createResponse } from '../../../../common/types/api.response';
import { logger } from '../../../../common/utils/logger';
import { incidentCrudService } from '../../application/services/incident-crud.service';
import { incidentFileService } from '../../application/services/incident-file.service';
import { canAccessIncidentTeam } from '../../application/services/incident-visibility.service';
import { requireAuthenticatedUserId, validateSafeFilename } from './incident-controller.shared';

export class IncidentFileController {
    static async uploadIncidentFile(req: AuthRequest, res: Response, next: NextFunction) {
        let tempPath: string | undefined;

        try {
            const userId = requireAuthenticatedUserId(req);
            if (!req.file) {
                throw new ValidationError('No file uploaded');
            }

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
                mimeType: uploadedFile.mimeType,
            }, userId);

            res.status(201).json(createResponse(true, log));
        } catch (error) {
            next(error);
        } finally {
            if (tempPath) {
                const fs = await import('fs');
                fs.unlink(tempPath, () => { });
            }
        }
    }

    static async downloadFile(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            requireAuthenticatedUserId(req);

            const { id, filename } = req.params;
            const incident = await incidentCrudService.findById(id);

            if (!canAccessIncidentTeam(req.user, incident.assignedTeamId)) {
                throw new ForbiddenError('You do not have access to this incident');
            }

            validateSafeFilename(filename);

            const fileLog = await incidentFileService.getFileLog(id, filename);
            if (!fileLog.filePath) {
                throw new NotFoundError('File path missing in log');
            }

            const exists = await fileUploadService.fileExists(fileLog.filePath);
            if (!exists) {
                throw new NotFoundError('File on disk');
            }

            res.setHeader('Content-Disposition', `attachment; filename="${fileLog.fileName || 'download'}"`);
            res.setHeader('Content-Type', fileLog.mimeType || 'application/octet-stream');
            if (fileLog.fileSize) {
                res.setHeader('Content-Length', fileLog.fileSize);
            }

            const fileStream = await fileUploadService.getFileStream(fileLog.filePath);
            fileStream.on('error', (error) => {
                logger.error('Stream error', { error });
                if (!res.headersSent) {
                    res.status(500).send('Could not download file');
                }
            });
            fileStream.pipe(res);
        } catch (error) {
            next(error);
        }
    }

    static async previewFile(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            requireAuthenticatedUserId(req);

            const { id, filename } = req.params;
            const incident = await incidentCrudService.findById(id);

            if (!canAccessIncidentTeam(req.user, incident.assignedTeamId)) {
                throw new ForbiddenError('You do not have access to this incident');
            }

            validateSafeFilename(filename);

            const fileLog = await incidentFileService.getFileLog(id, filename);
            if (!fileLog.filePath) {
                throw new NotFoundError('File path missing in log');
            }

            const exists = await fileUploadService.fileExists(fileLog.filePath);
            if (!exists) {
                throw new NotFoundError('File on disk');
            }

            res.setHeader('Content-Disposition', `inline; filename="${fileLog.fileName || 'preview'}"`);
            res.setHeader('Content-Type', fileLog.mimeType || 'application/octet-stream');
            if (fileLog.fileSize) {
                res.setHeader('Content-Length', fileLog.fileSize);
            }

            const fileStream = await fileUploadService.getFileStream(fileLog.filePath);
            fileStream.on('error', (error) => {
                logger.error('Preview stream error', { error });
                if (!res.headersSent) {
                    res.status(500).send('Could not preview file');
                }
            });
            fileStream.pipe(res);
        } catch (error) {
            next(error);
        }
    }

    static async deleteFile(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = requireAuthenticatedUserId(req);
            const userRole = req.user?.role || '';
            const { id, filename } = req.params;

            validateSafeFilename(filename);
            await incidentFileService.deleteFileLog(id, filename, userId, userRole);
            res.json(createResponse(true, null, 'File deleted successfully'));
        } catch (error) {
            next(error);
        }
    }
}
