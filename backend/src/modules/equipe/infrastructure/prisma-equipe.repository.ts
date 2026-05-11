import { Prisma } from '@prisma/client';
import { prisma } from '../../../common/utils/prisma';
import { IEquipeRepository } from '../domain/equipe.repository';

export const operationalTaskInclude = Prisma.validator<Prisma.OperationalTaskInclude>()({
    plan: { select: { id: true, teamId: true, date: true } },
    assignedTo: { select: { id: true, name: true, email: true } },
    system: { select: { id: true, name: true } },
    createdBy: { select: { id: true, name: true } },
});

export const dailyPlanInclude = Prisma.validator<Prisma.DailyPlanInclude>()({
    tasks: {
        include: operationalTaskInclude,
    },
    team: true,
    createdBy: { select: { id: true, name: true } },
});

export class PrismaEquipeRepository implements IEquipeRepository {
    async findPlans(where: Record<string, unknown>) {
        return prisma.dailyPlan.findMany({
            where,
            include: dailyPlanInclude,
            orderBy: { date: 'desc' },
        });
    }

    async findPlanById(id: string) {
        return prisma.dailyPlan.findUnique({
            where: { id },
            include: dailyPlanInclude,
        });
    }

    async findPlanByDate(teamId: string, date: Date) {
        return prisma.dailyPlan.findUnique({
            where: {
                teamId_date: {
                    teamId,
                    date,
                },
            },
            include: dailyPlanInclude,
        });
    }

    async createPlan(data: Prisma.DailyPlanCreateArgs['data']) {
        return prisma.dailyPlan.create({
            data,
            include: dailyPlanInclude,
        });
    }

    async updatePlan(id: string, data: Prisma.DailyPlanUpdateArgs['data']) {
        return prisma.dailyPlan.update({
            where: { id },
            data,
            include: dailyPlanInclude,
        });
    }

    async deletePlan(id: string) {
        return prisma.dailyPlan.delete({
            where: { id },
        });
    }

    async findTasks(where: Record<string, unknown>) {
        return prisma.operationalTask.findMany({
            where,
            include: operationalTaskInclude,
            orderBy: { startTime: 'asc' },
        });
    }

    async findTaskById(id: string) {
        return prisma.operationalTask.findUnique({
            where: { id },
            include: operationalTaskInclude,
        });
    }

    async createTask(data: Prisma.OperationalTaskCreateArgs['data']) {
        return prisma.operationalTask.create({
            data,
            include: operationalTaskInclude,
        });
    }

    async updateTask(id: string, data: Prisma.OperationalTaskUpdateArgs['data']) {
        return prisma.operationalTask.update({
            where: { id },
            data,
            include: operationalTaskInclude,
        });
    }

    async deleteTask(id: string) {
        return prisma.operationalTask.delete({
            where: { id },
        });
    }
}

export const equipeRepository = new PrismaEquipeRepository();
