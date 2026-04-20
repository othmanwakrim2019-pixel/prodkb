import axios from 'axios';

const API = '/api/v1/equipe';

// ── Types ──────────────────────────────────────────────────────────

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
    // Present on "my tasks" queries
    plan?: {
        id:    string;
        date:  string;
        label: string | null;
        team:  PlanTeam;
    };
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

// ── DTOs ──────────────────────────────────────────────────────────

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

// ── API calls ──────────────────────────────────────────────────────

export const getDayPlan = async (date: string, teamId: string): Promise<DailyPlan | null> => {
    const { data } = await axios.get(`${API}/plans`, { params: { date, teamId } });
    return data.data;
};

export const getWeekPlans = async (weekStart: string, teamId: string): Promise<DailyPlan[]> => {
    const { data } = await axios.get(`${API}/plans`, { params: { weekStart, teamId } });
    return data.data ?? [];
};

export const getPlanById = async (id: string): Promise<DailyPlan> => {
    const { data } = await axios.get(`${API}/plans/${id}`);
    return data.data;
};

export const createPlan = async (dto: CreatePlanDto): Promise<DailyPlan> => {
    const { data } = await axios.post(`${API}/plans`, dto);
    return data.data;
};

export const createTask = async (planId: string, dto: CreateTaskDto): Promise<OperationalTask> => {
    const { data } = await axios.post(`${API}/plans/${planId}/tasks`, dto);
    return data.data;
};

export const updateTask = async (id: string, dto: UpdateTaskDto): Promise<OperationalTask> => {
    const { data } = await axios.patch(`${API}/tasks/${id}`, dto);
    return data.data;
};

export const deleteTask = async (id: string): Promise<void> => {
    await axios.delete(`${API}/tasks/${id}`);
};

export const updateTaskStatus = async (id: string, dto: UpdateTaskStatusDto): Promise<OperationalTask> => {
    const { data } = await axios.patch(`${API}/tasks/${id}/status`, dto);
    return data.data;
};

export const getMyTasksToday = async (): Promise<OperationalTask[]> => {
    const { data } = await axios.get(`${API}/me/tasks/today`);
    return data.data ?? [];
};

export const getMyTasksWeek = async (): Promise<OperationalTask[]> => {
    const { data } = await axios.get(`${API}/me/tasks/week`);
    return data.data ?? [];
};
