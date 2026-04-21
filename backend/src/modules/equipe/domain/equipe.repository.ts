import { Prisma } from '@prisma/client';

export interface IEquipeRepository {
    findPlans(where: Record<string, unknown>): Promise<any[]>;
    findPlanById(id: string): Promise<any | null>;
    findPlanByDate(teamId: string, date: Date): Promise<any | null>;
    createPlan(data: Prisma.DailyPlanCreateArgs['data']): Promise<any>;
    updatePlan(id: string, data: Prisma.DailyPlanUpdateArgs['data']): Promise<any>;
    deletePlan(id: string): Promise<any>;

    findTasks(where: Record<string, unknown>): Promise<any[]>;
    findTaskById(id: string): Promise<any | null>;
    createTask(data: Prisma.OperationalTaskCreateArgs['data']): Promise<any>;
    updateTask(id: string, data: Prisma.OperationalTaskUpdateArgs['data']): Promise<any>;
    deleteTask(id: string): Promise<any>;
}
