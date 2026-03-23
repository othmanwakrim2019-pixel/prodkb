import { NotFoundError, ValidationError } from '../../common/errors/app.error';
import { procedureRepository, type ProcedurePaginationParams } from './repositories/procedure.repository';

export interface CreateProcedureDTO {
    title: string;
    description: string;
    resolutionSteps: string;
    systemId: string;
    jobId?: string;
    rootCause?: string;
    workaround?: string;
    commands?: string;
    errorCode?: string;
    tags?: string;
}

export interface UpdateProcedureDTO {
    title?: string;
    description?: string;
    resolutionSteps?: string;
    systemId?: string;
    jobId?: string | null;
    rootCause?: string | null;
    workaround?: string | null;
    commands?: string | null;
    errorCode?: string | null;
    tags?: string | null;
}

export class ProcedureService {
    async findAll(search?: string, pagination: ProcedurePaginationParams = {}) {
        return procedureRepository.findProcedures(search, pagination);
    }

    async findById(id: string) {
        const procedure = await procedureRepository.findProcedureById(id);
        if (!procedure) throw new NotFoundError('Procedure not found');
        return procedure;
    }

    async create(data: CreateProcedureDTO, userId: string) {
        return procedureRepository.createProcedure({
            ...data,
            createdById: userId,
        });
    }

    async update(id: string, data: UpdateProcedureDTO, userId: string) {
        const procedure = await procedureRepository.findProcedureRecord(id);
        if (!procedure) throw new NotFoundError('Procedure not found');

        return procedureRepository.updateProcedure(id, {
            ...data,
            updatedById: userId,
        });
    }

    async delete(id: string) {
        const procedure = await procedureRepository.findProcedureWithUsage(id);
        if (!procedure) throw new NotFoundError('Procedure not found');

        if (procedure._count.incidents > 0) {
            throw new ValidationError(
                `Impossible de supprimer la procédure "${procedure.title}" car elle est liée à ${procedure._count.incidents} incident(s). Veuillez d'abord retirer cette procédure des incidents concernés.`
            );
        }

        await procedureRepository.deleteProcedure(id);
        return procedure;
    }

    async getEffectivenessStats(id: string) {
        const procedure = await procedureRepository.findProcedureRecord(id);
        if (!procedure) throw new NotFoundError('Procedure not found');

        const withProcedure = await procedureRepository.aggregateIncidentsWithProcedure(id);
        const withoutProcedure = await procedureRepository.aggregateIncidentsWithoutProcedure(procedure.systemId);

        const avgMttrWith = Math.round(withProcedure._avg.timeToResolve ?? 0);
        const avgMttrWithout = Math.round(withoutProcedure._avg.timeToResolve ?? 0);
        const improvementPercent = avgMttrWithout > 0
            ? Math.round(((avgMttrWithout - avgMttrWith) / avgMttrWithout) * 100)
            : 0;

        return {
            procedureId: id,
            procedureTitle: procedure.title,
            linkedIncidentCount: withProcedure._count.id,
            avgMttrWithProcedure: avgMttrWith,
            unlinkedIncidentCount: withoutProcedure._count.id,
            avgMttrWithoutProcedure: avgMttrWithout,
            improvementPercent,
        };
    }
}

export const procedureService = new ProcedureService();
