import { logger } from '../../../../common/utils/logger';
import { NotFoundError, ValidationError } from '../../../../common/errors/app.error';
import { fileUploadService } from '../../../../common/services/file-upload.service';
import type { IIncidentLog } from '../../../../types';
import { incidentCrudService } from './incident-crud.service';
import { sendNoteNotification } from './incident-shared';
import { incidentRepository } from '../../infrastructure/prisma-incident.repository';

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

        const log = await incidentRepository.createIncidentLog({
            incidentId,
            createdById: userId,
            logType: data.logType,
            rawLog: data.rawLog,
            errorCode: data.errorCode,
            errorMessage: data.errorMessage,
            metadata: data.metadata,
        });

        // Notify the assigned team about the new note
        const incident = await incidentRepository.findIncidentById(incidentId);
        if (incident) {
            sendNoteNotification(incident, 'note_added').catch(() => { });
        }

        // Auto-log activity entry
        await incidentRepository.createIncidentLog({
            incidentId,
            logType: 'activity',
            rawLog: `Note added (type: **${data.logType}**)`,
            createdById: userId,
        });

        return log as unknown as IIncidentLog;
    }

    async getFileLog(incidentId: string, fileName: string): Promise<IIncidentLog> {
        const log = await incidentRepository.findFileLog(incidentId, fileName);
        if (!log) throw new NotFoundError('File log not found');
        return log as unknown as IIncidentLog;
    }

    async addFileLog(incidentId: string, fileData: FileLogData, userId: string): Promise<IIncidentLog> {
        await incidentCrudService.findById(incidentId);

        const log = await incidentRepository.createIncidentLog({
            incidentId,
            createdById: userId,
            logType: 'file',
            filePath: fileData.filePath,
            fileName: fileData.fileName,
            fileSize: fileData.fileSize,
            mimeType: fileData.mimeType,
        });

        // Notify the assigned team about the uploaded file
        const incident = await incidentRepository.findIncidentById(incidentId);
        if (incident) {
            sendNoteNotification(incident, 'file_uploaded').catch(() => { });
        }

        // Auto-log file upload activity
        await incidentRepository.createIncidentLog({
            incidentId,
            logType: 'activity',
            rawLog: `File uploaded: **${fileData.fileName}**`,
            createdById: userId,
        });

        return log as unknown as IIncidentLog;
    }

    async deleteFileLog(incidentId: string, fileName: string, userId: string, userRole: string): Promise<void> {
        const log = await incidentRepository.findFileLog(incidentId, fileName);

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

        await incidentRepository.deleteIncidentLog(log.id);
        logger.info('File deleted', { incidentId, fileName, deletedBy: userId });
    }
}

export const incidentFileService = new IncidentFileService();
