/**
 * Admin API Service — consolidated CRUD for users, systems, teams, SLAs, roles, config
 * Typed service layer that eliminates raw axios calls across admin pages.
 */
import { api } from '../lib/api';
import type { User, System, Team, Job, SLA, Role, Permission } from '../types';

// ── Typed input interfaces ──

export interface CreateUserInput {
    name: string;
    email: string;
    password: string;
    roleId?: string;
}

export interface UpdateUserInput {
    name?: string;
    email?: string;
    role?: string;
    isActive?: boolean;
}

export interface CreateSystemInput {
    name: string;
    description?: string;
}

export interface UpdateSystemInput {
    name?: string;
    description?: string | null;
}

export interface CreateJobInput {
    name: string;
    code: string;
    systemId: string;
    teamId?: string;
}

export interface UpdateJobInput {
    name?: string;
    code?: string;
    systemId?: string;
    teamId?: string | null;
}

export interface CreateTeamInput {
    name: string;
    description?: string;
    emailDistribution: string;
    sendEmail?: boolean;
}

export interface UpdateTeamInput {
    name?: string;
    description?: string | null;
    emailDistribution?: string;
    isActive?: boolean;
    sendEmail?: boolean;
}

export interface CreateSLAInput {
    name: string;
    description?: string;
    severity: string;
    acknowledgeTimeMinutes: number;
    resolveTimeMinutes: number;
}

export interface UpdateSLAInput {
    name?: string;
    description?: string | null;
    severity?: string;
    acknowledgeTimeMinutes?: number;
    resolveTimeMinutes?: number;
    isActive?: boolean;
}

export interface CreateRoleInput {
    name: string;
    description?: string;
    permissionIds: string[];
}

export interface UpdateRoleInput {
    name?: string;
    description?: string | null;
    permissionIds: string[];
}

// ── Users ──
export const userService = {
    getAll: (): Promise<User[]> =>
        api.get('/api/v1/users').then(r => r.data.data ?? r.data),

    create: (data: CreateUserInput): Promise<User> =>
        api.post('/auth/register', data).then(r => r.data),

    update: (id: string, data: UpdateUserInput): Promise<User> =>
        api.put(`/api/v1/users/${id}`, data).then(r => r.data),

    delete: (id: string): Promise<void> =>
        api.delete(`/api/v1/users/${id}`).then(() => undefined),

    changePassword: (data: { currentPassword: string; newPassword: string }): Promise<void> =>
        api.put('/api/v1/users/change-password', data).then(() => undefined),

    addToTeam: (teamId: string, userId: string, role: string): Promise<unknown> =>
        api.post(`/api/v1/teams/${teamId}/members`, { userId, role }).then(r => r.data),

    removeFromTeam: (teamId: string, userId: string): Promise<void> =>
        api.delete(`/api/v1/teams/${teamId}/members/${userId}`).then(() => undefined),
};

// ── Systems ──
export const systemService = {
    getAll: (): Promise<System[]> =>
        api.get('/api/v1/systems').then(r => r.data.data ?? r.data),

    create: (data: CreateSystemInput): Promise<System> =>
        api.post('/api/v1/systems', data).then(r => r.data),

    update: (id: string, data: UpdateSystemInput): Promise<System> =>
        api.put(`/api/v1/systems/${id}`, data).then(r => r.data),

    delete: (id: string): Promise<void> =>
        api.delete(`/api/v1/systems/${id}`).then(() => undefined),
};

// ── Jobs (sub-resource of systems) ──
export const jobService = {
    create: (data: CreateJobInput): Promise<Job> =>
        api.post('/api/v1/systems/jobs', data).then(r => r.data),

    update: (id: string, data: UpdateJobInput): Promise<Job> =>
        api.put(`/api/v1/systems/jobs/${id}`, data).then(r => r.data),

    delete: (id: string): Promise<void> =>
        api.delete(`/api/v1/systems/jobs/${id}`).then(() => undefined),
};

// ── Teams ──
export const teamService = {
    getAll: (): Promise<Team[]> =>
        api.get('/api/v1/teams').then(r => r.data.data ?? r.data),

    create: (data: CreateTeamInput): Promise<Team> =>
        api.post('/api/v1/teams', data).then(r => r.data),

    update: (id: string, data: UpdateTeamInput): Promise<Team> =>
        api.put(`/api/v1/teams/${id}`, data).then(r => r.data),

    delete: (id: string): Promise<void> =>
        api.delete(`/api/v1/teams/${id}`).then(() => undefined),

    addMember: (teamId: string, userId: string, role: string): Promise<unknown> =>
        api.post(`/api/v1/teams/${teamId}/members`, { userId, role }).then(r => r.data),

    removeMember: (teamId: string, userId: string): Promise<void> =>
        api.delete(`/api/v1/teams/${teamId}/members/${userId}`).then(() => undefined),
};

// ── SLAs ──
export const slaService = {
    getAll: (): Promise<SLA[]> =>
        api.get('/api/v1/slas').then(r => r.data.data ?? r.data),

    create: (data: CreateSLAInput): Promise<SLA> =>
        api.post('/api/v1/slas', data).then(r => r.data),

    update: (id: string, data: UpdateSLAInput): Promise<SLA> =>
        api.put(`/api/v1/slas/${id}`, data).then(r => r.data),

    delete: (id: string): Promise<void> =>
        api.delete(`/api/v1/slas/${id}`).then(() => undefined),
};

// ── Roles & Permissions ──
export const roleService = {
    getAll: (): Promise<Role[]> =>
        api.get('/api/v1/roles').then(r => r.data.data ?? r.data),

    create: (data: CreateRoleInput): Promise<Role> =>
        api.post('/api/v1/roles', data).then(r => r.data),

    update: (id: string, data: UpdateRoleInput): Promise<Role> =>
        api.put(`/api/v1/roles/${id}`, data).then(r => r.data),

    delete: (id: string): Promise<void> =>
        api.delete(`/api/v1/roles/${id}`).then(() => undefined),

    getPermissions: (): Promise<Permission[]> =>
        api.get('/api/v1/permissions').then(r => r.data.data ?? r.data),
};

// ── Audit ──
export interface AuditLog {
    id: string;
    userId: string;
    actionType: string;
    entityType: string;
    entityId: string;
    details: string;
    createdAt: string;
    user?: { name: string };
}

export const auditService = {
    getAll: (params?: Record<string, unknown>): Promise<AuditLog[]> =>
        api.get('/api/v1/audit-logs', { params }).then(r => r.data.data ?? r.data),
};

// ── Config / Settings ──
export interface ConfigParam {
    key: string;
    value: string;
    description?: string;
}

export interface SmtpConfig {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    password: string;
    from: string;
}

export const configService = {
    getParams: (keys: string[]): Promise<ConfigParam[]> =>
        api.get(`/api/v1/config/params?keys=${keys.join(',')}`).then(r => r.data),

    updateParam: (key: string, value: string): Promise<ConfigParam> =>
        api.put(`/api/v1/config/${key}`, { value }).then(r => r.data),

    getSmtp: (): Promise<SmtpConfig> =>
        api.get('/api/v1/config/smtp').then(r => r.data),

    updateSmtp: (data: Partial<SmtpConfig>): Promise<SmtpConfig> =>
        api.put('/api/v1/config/smtp', data).then(r => r.data),

    testSmtp: (email: string): Promise<{ success: boolean; message: string }> =>
        api.post('/api/v1/config/smtp/test', { email }).then(r => r.data),
};
