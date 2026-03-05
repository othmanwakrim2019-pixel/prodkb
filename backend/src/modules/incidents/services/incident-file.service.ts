import { prisma } from '../../../common/utils/prisma';
import { logger } from '../../../common/utils/logger';
import { NotFoundError, ValidationError } from '../../../common/errors/app.error';
import { fileUploadService } from '../../../common/services/file-upload.service';
import type { IIncidentLog } from '../../../types';
import { incidentCrudService } from './incident-crud.service';
import { defaultInclude, sendNoteNotification } from './incident-shared';

export interface CreateLogData {
    logType: string;
    rawLog?: string;
    errorCode?: string;
    errorMessage?: string;
    metadata?: string;
}

export interface FileLogData {
    filePath: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
}

export class IncidentFileService {
    async addLog(incidentId: string, data: CreateLogData, userId: string): Promise<IIncidentLog> {
        await incidentCrudService.findById(incidentId);

        const log = await prisma.incidentLog.create({
            data: {
                incidentId,
                createdById: userId,
                logType: data.logType,
                rawLog: data.rawLog,
                errorCode: data.errorCode,
                errorMessage: data.errorMessage,
                metadata: data.metadata
            }
        });

        // Notify the assigned team about the new note
        const incident = await prisma.incident.findUnique({ where: { id: incidentId }, include: defaultInclude });
        if (incident) {
            sendNoteNotification(incident, 'note_added').catch(() => { });
        }

        return log as unknown as IIncidentLog;
    }

    async getFileLog(incidentId: string, fileName: string): Promise<IIncidentLog> {
        const log = await prisma.incidentLog.findFirst({
            where: { incidentId, fileName, logType: 'file' }
        });
        if (!log) throw new NotFoundError('File log not found');
        return log as unknown as IIncidentLog;
    }

    async addFileLog(incidentId: string, fileData: FileLogData, userId: string): Promise<IIncidentLog> {
        await incidentCrudService.findById(incidentId);

        const log = await prisma.incidentLog.create({
            data: {
                incidentId,
                createdById: userId,
                logType: 'file',
                filePath: fileData.filePath,
                fileName: fileData.fileName,
                fileSize: fileData.fileSize,
                mimeType: fileData.mimeType
            }
        });

        // Notify the assigned team about the uploaded file
        const incident = await prisma.incident.findUnique({ where: { id: incidentId }, include: defaultInclude });
        if (incident) {
            sendNoteNotification(incident, 'file_uploaded').catch(() => { });
        }

        return log as unknown as IIncidentLog;
    }

    async deleteFileLog(incidentId: string, fileName: string, userId: string, userRole: string): Promise<void> {
        const log = await prisma.incidentLog.findFirst({
            where: { incidentId, fileName, logType: 'file' },
        });

        if (!log) throw new NotFoundError('File log not found');

        if (log.createdById !== userId && userRole !== 'ADMIN') {
            throw new ValidationError('You can only delete files that you uploaded');
        }

        if (log.filePath) {
            try {
                await fileUploadService.deleteFile(log.filePath);
            } catch (err) {
                logger.warn('Could not delete file from storage', { filePath: log.filePath, error: err });
            }
        }

        await prisma.incidentLog.delete({ where: { id: log.id } });
        logger.info('File deleted', { incidentId, fileName, deletedBy: userId });
    }
}

export const incidentFileService = new IncidentFileService();
