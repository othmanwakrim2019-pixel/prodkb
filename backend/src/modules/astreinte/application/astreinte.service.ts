
import { IAstreinte } from '../../../types';
import { astreinteRepository } from '../infrastructure/prisma-astreinte.repository';
import { NotFoundError, ConflictError } from '../../../common/errors/app.error';
import { logger } from '../../../common/utils/logger';

export class AstreinteService {
    async list(filters: { teamId?: string; year?: number }): Promise<IAstreinte[]> {
        const where: Record<string, any> = {};
        if (filters.teamId) where.teamId = filters.teamId;
        if (filters.year) where.year = filters.year;

        const results = await astreinteRepository.findMany(where);
        return results as unknown as IAstreinte[];
    }

    async getById(id: string): Promise<IAstreinte> {
        const result = await astreinteRepository.findById(id);
        if (!result) throw new NotFoundError('Astreinte record not found');
        return result as unknown as IAstreinte;
    }

    async getCurrent(teamId: string): Promise<IAstreinte | null> {
        const result = await astreinteRepository.findCurrent(teamId);
        return result as unknown as IAstreinte | null;
    }

    /** Get current astreinte without a specific team filter */
    async getCurrentAny(): Promise<IAstreinte | null> {
        const result = await astreinteRepository.findCurrentAny();
        return result as unknown as IAstreinte | null;
    }

    async assign(data: {
        weekNumber: number;
        year: number;
        startDate: Date;
        endDate: Date;
        teamId: string;
        userId: string;
        phone?: string | null;
        notes?: string | null;
    }, createdById: string): Promise<IAstreinte> {
        // Check for existing assignment
        const existing = await astreinteRepository.findByWeek(data.teamId, data.weekNumber, data.year);
        if (existing) {
            throw new ConflictError(`Astreinte already assigned for team ${data.teamId} in week ${data.weekNumber}/${data.year}`);
        }

        const result = await astreinteRepository.create({
            ...data,
            createdById,
        });

        logger.info('Astreinte assigned', { teamId: data.teamId, week: data.weekNumber, userId: data.userId });
        return result as unknown as IAstreinte;
    }

    async update(id: string, data: {
        userId?: string;
        phone?: string | null;
        notes?: string | null;
    }): Promise<IAstreinte> {
        await this.getById(id);
        const result = await astreinteRepository.update(id, data);
        logger.info('Astreinte updated', { id, userId: data.userId });
        return result as unknown as IAstreinte;
    }

    async delete(id: string): Promise<void> {
        await this.getById(id);
        await astreinteRepository.delete(id);
        logger.info('Astreinte deleted', { id });
    }
}

export const astreinteService = new AstreinteService();
