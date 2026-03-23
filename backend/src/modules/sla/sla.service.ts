import { NotFoundError, ValidationError } from '../../common/errors/app.error';
import { slaRepository, type SLAPaginationParams } from './repositories/sla.repository';

export interface CreateSLADTO {
    name: string;
    description?: string;
    severity: string;
    acknowledgeTimeMinutes: number;
    resolveTimeMinutes: number;
}

export interface UpdateSLADTO {
    name?: string;
    description?: string | null;
    severity?: string;
    acknowledgeTimeMinutes?: number;
    resolveTimeMinutes?: number;
    isActive?: boolean;
}

export class SlaService {
    async findAllSLAs(pagination: SLAPaginationParams = {}) {
        return slaRepository.findSLAs(pagination);
    }

    async findSLAById(id: string) {
        const sla = await slaRepository.findSLAById(id);
        if (!sla) throw new NotFoundError('SLA not found');
        return sla;
    }

    async createSLA(data: CreateSLADTO) {
        return slaRepository.createSLA(data);
    }

    async updateSLA(id: string, data: UpdateSLADTO) {
        await this.findSLAById(id);
        return slaRepository.updateSLA(id, data);
    }

    async deleteSLA(id: string) {
        const sla = await slaRepository.findSLAWithUsage(id);
        if (!sla) throw new NotFoundError('SLA not found');

        if (sla._count.incidents > 0) {
            throw new ValidationError(
                `Impossible de supprimer la politique SLA "${sla.name}" car elle est liée à ${sla._count.incidents} incident(s). Veuillez d'abord retirer cette SLA des incidents concernés.`
            );
        }

        await slaRepository.deleteSLA(id);
        return sla;
    }
}

export const slaService = new SlaService();
