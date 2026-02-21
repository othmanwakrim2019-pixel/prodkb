import { incidentCrudService } from './services/incident-crud.service';
import { incidentStatusService } from './services/incident-status.service';
import { incidentAnalyticsService } from './services/incident-analytics.service';
import { incidentFileService } from './services/incident-file.service';

export const incidentService = {
    findAll: incidentCrudService.findAll.bind(incidentCrudService),
    findById: incidentCrudService.findById.bind(incidentCrudService),
    searchSimilar: incidentCrudService.searchSimilar.bind(incidentCrudService),
    create: incidentCrudService.create.bind(incidentCrudService),
    update: incidentCrudService.update.bind(incidentCrudService),
    delete: incidentCrudService.delete.bind(incidentCrudService),
    linkProcedure: incidentCrudService.linkProcedure.bind(incidentCrudService),
    acknowledge: incidentStatusService.acknowledge.bind(incidentStatusService),
    getStats: incidentAnalyticsService.getStats.bind(incidentAnalyticsService),
    addLog: incidentFileService.addLog.bind(incidentFileService),
    getFileLog: incidentFileService.getFileLog.bind(incidentFileService),
    addFileLog: incidentFileService.addFileLog.bind(incidentFileService),
    deleteFileLog: incidentFileService.deleteFileLog.bind(incidentFileService),
};
