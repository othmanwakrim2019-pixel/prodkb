/**
 * Equipe API Service — typed abstraction over all equipe endpoints
 * Follows the same pattern as incident.service.ts
 */
import api from '../../../utils/axios';
import { unwrapArray, unwrapObject } from '../../../utils/api-response';

// ── Types ────────────────────────────────────────────────────────────────────

export type TaskType     = 'MEP' | 'SUPERVISION' | 'TABLEAU_BORD' | 'REPRISE_INCIDENT' | 'CONTROLE_CHAINE' | 'RAPPORT' | 'CUSTOM';
export type TaskStatus   = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED';
export type TaskPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export interface TaskUser   { id: string; name: string; email: string; }
export interface TaskSystem { id: string; name: string; }
export interface PlanTeam   { id: string; name: string; }

export interface OperationalTask {
    id:           string;
    planId:       string;
    title:        string;
    description:  string | null;
    taskType:     TaskType;
    priority:     TaskPriority;
    status:       TaskStatus;
    startTime:    string | null;
    endTime:      string | null;
    systemId:     string | null;
    system:       TaskSystem | null;
    chainLabel:   string | null;
    assignedToId: string;
    assignedTo:   TaskUser;
    note:         string | null;
    startedAt:    string | null;
    completedAt:  string | null;
    createdAt:    string;
    updatedAt:    string;
    /** Present only on /me/tasks/* responses */
    plan?: { id: string; date: string; label: string | null; team: PlanTeam; };
}

export interface DailyPlan {
    id:        string;
    date:      string;
    label:     string | null;
    isWeekend: boolean;
    teamId:    string;
    team:      PlanTeam;
    tasks:     OperationalTask[];
    createdAt: string;
    updatedAt: string;
}

// ── DTOs ─────────────────────────────────────────────────────────────────────

export interface CreatePlanDto {
    teamId:     string;
    date:       string;  // ISO datetime
    label?:     string;
    isWeekend?: boolean;
}

export interface CreateTaskDto {
    title:        string;
    description?: string;
    taskType?:    TaskType;
    priority?:    TaskPriority;
    assignedToId: string;
    startTime?:   string;
    endTime?:     string;
    systemId?:    string;
    chainLabel?:  string;
}

export interface UpdateTaskDto {
    title?:        string;
    description?:  string | null;
    taskType?:     TaskType;
    priority?:     TaskPriority;
    assignedToId?: string;
    startTime?:    string | null;
    endTime?:      string | null;
    systemId?:     string | null;
    chainLabel?:   string | null;
}

export interface UpdateTaskStatusDto {
    status: TaskStatus;
    note?:  string;
}

// ── Service ───────────────────────────────────────────────────────────────────

export const equipeService = {
    getDayPlan: async (date: string, teamId: string): Promise<DailyPlan | null> => {
        const response = await api.get('/api/v1/equipe/plans', { params: { date, teamId } });
        return unwrapObject<DailyPlan>(response.data);
    },

    getWeekPlans: async (weekStart: string, teamId: string): Promise<DailyPlan[]> => {
        const response = await api.get('/api/v1/equipe/plans', { params: { weekStart, teamId } });
        return unwrapArray<DailyPlan>(response.data, ['data', 'items']);
    },

    getPlanById: async (id: string): Promise<DailyPlan> => {
        const response = await api.get(`/api/v1/equipe/plans/${id}`);
        return unwrapObject<DailyPlan>(response.data) as DailyPlan;
    },

    createPlan: async (dto: CreatePlanDto): Promise<DailyPlan> => {
        const response = await api.post('/api/v1/equipe/plans', dto);
        return unwrapObject<DailyPlan>(response.data) as DailyPlan;
    },

    createTask: async (planId: string, dto: CreateTaskDto): Promise<OperationalTask> => {
        const response = await api.post(`/api/v1/equipe/plans/${planId}/tasks`, dto);
        return unwrapObject<OperationalTask>(response.data) as OperationalTask;
    },

    updateTask: async (id: string, dto: UpdateTaskDto): Promise<OperationalTask> => {
        const response = await api.patch(`/api/v1/equipe/tasks/${id}`, dto);
        return unwrapObject<OperationalTask>(response.data) as OperationalTask;
    },

    deleteTask: async (id: string): Promise<void> => {
        await api.delete(`/api/v1/equipe/tasks/${id}`);
    },

    updateTaskStatus: async (id: string, dto: UpdateTaskStatusDto): Promise<OperationalTask> => {
        const response = await api.patch(`/api/v1/equipe/tasks/${id}/status`, dto);
        return unwrapObject<OperationalTask>(response.data) as OperationalTask;
    },

    getMyTasksToday: async (): Promise<OperationalTask[]> => {
        const response = await api.get('/api/v1/equipe/me/tasks/today');
        return unwrapArray<OperationalTask>(response.data, ['data', 'items']);
    },

    getMyTasksWeek: async (): Promise<OperationalTask[]> => {
        const response = await api.get('/api/v1/equipe/me/tasks/week');
        return unwrapArray<OperationalTask>(response.data, ['data', 'items']);
    },
};
