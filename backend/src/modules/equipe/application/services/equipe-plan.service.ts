import { IDailyPlan } from '../../../../types';
import { equipeRepository } from '../../infrastructure/prisma-equipe.repository';
import { NotFoundError, ConflictError } from '../../../../common/errors/app.error';
import { logger } from '../../../../common/utils/logger';

export class EquipePlanService {
    async listPlans(filters: { teamId?: string; startDate?: Date; endDate?: Date }): Promise<IDailyPlan[]> {
        const where: Record<string, unknown> = {};
        if (filters.teamId) where.teamId = filters.teamId;
        if (filters.startDate || filters.endDate) {
            where.date = {};
            if (filters.startDate) (where.date as Record<string, unknown>).gte = filters.startDate;
            if (filters.endDate) (where.date as Record<string, unknown>).lte = filters.endDate;
        }
        const results = await equipeRepository.findPlans(where);
        return results as unknown as IDailyPlan[];
    }

    async listWeekPlans(teamId: string, weekStart: Date): Promise<IDailyPlan[]> {
        const start = new Date(weekStart);
        start.setUTCHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        end.setUTCHours(23, 59, 59, 999);
        return this.listPlans({ teamId, startDate: start, endDate: end });
    }

    async getPlanById(id: string): Promise<IDailyPlan> {
        const result = await equipeRepository.findPlanById(id);
        if (!result) throw new NotFoundError('Daily plan not found');
        return result as unknown as IDailyPlan;
    }

    async getPlanForDay(teamId: string, date: Date): Promise<IDailyPlan | null> {
        const normalizedDate = new Date(date);
        normalizedDate.setUTCHours(0, 0, 0, 0);
        const result = await equipeRepository.findPlanByDate(teamId, normalizedDate);
        return result as unknown as IDailyPlan | null;
    }

    async createPlan(data: {
        date: Date;
        teamId: string;
        label?: string | null;
        isWeekend?: boolean;
    }, createdById: string): Promise<IDailyPlan> {
        const normalizedDate = new Date(data.date);
        normalizedDate.setUTCHours(0, 0, 0, 0);

        const existing = await equipeRepository.findPlanByDate(data.teamId, normalizedDate);
        if (existing) {
            throw new ConflictError(`A plan already exists for team ${data.teamId} on ${normalizedDate.toISOString().split('T')[0]}`);
        }

        const result = await equipeRepository.createPlan({ ...data, date: normalizedDate, createdById });
        logger.info('Daily plan created', { teamId: data.teamId, date: normalizedDate.toISOString() });
        return result as unknown as IDailyPlan;
    }

    async updatePlan(id: string, data: { label?: string | null; isWeekend?: boolean }): Promise<IDailyPlan> {
        await this.getPlanById(id);
        const result = await equipeRepository.updatePlan(id, data);
        logger.info('Daily plan updated', { id });
        return result as unknown as IDailyPlan;
    }

    async deletePlan(id: string): Promise<void> {
        await this.getPlanById(id);
        await equipeRepository.deletePlan(id);
        logger.info('Daily plan deleted', { id });
    }
}

export const equipePlanService = new EquipePlanService();
