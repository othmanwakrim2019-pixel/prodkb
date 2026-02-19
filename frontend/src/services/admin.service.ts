/**
 * Admin API Service — consolidated CRUD for users, systems, teams, SLAs, roles
 * Eliminates 30+ raw axios calls across admin pages
 */
import { api } from '../lib/api';
import type { User, System, Team, Job, SLA, Role, Permission } from '../types';

// ── Users ──
export const userService = {
    getAll: (): Promise<User[]> =>
        api.get('/api/v1/users').then(r => r.data),

    create: (data: Record<string, unknown>): Promise<User> =>
        api.post('/auth/v1/register', data).then(r => r.data),

    update: (id: string, data: Record<string, unknown>): Promise<User> =>
        api.put(`/api/v1/users/${id}`, data).then(r => r.data),

    delete: (id: string): Promise<void> =>
        api.delete(`/api/v1/users/${id}`),

    changePassword: (data: { currentPassword: string; newPassword: string }): Promise<unknown> =>
        api.put('/api/v1/users/change-password', data).then(r => r.data),

    addToTeam: (teamId: string, userId: string, role: string): Promise<unknown> =>
        api.post(`/api/v1/teams/${teamId}/members`, { userId, role }).then(r => r.data),

    removeFromTeam: (teamId: string, userId: string): Promise<void> =>
        api.delete(`/api/v1/teams/${teamId}/members/${userId}`),
};

// ── Systems ──
export const systemService = {
    getAll: (): Promise<System[]> =>
        api.get('/api/v1/systems').then(r => r.data),

    create: (data: Record<string, unknown>): Promise<System> =>
        api.post('/api/v1/systems', data).then(r => r.data),

    update: (id: string, data: Record<string, unknown>): Promise<System> =>
        api.put(`/api/v1/systems/${id}`, data).then(r => r.data),

    delete: (id: string): Promise<void> =>
        api.delete(`/api/v1/systems/${id}`),
};

// ── Jobs ──
export const jobService = {
    create: (data: Record<string, unknown>): Promise<Job> =>
        api.post('/api/v1/jobs', data).then(r => r.data),

    update: (id: string, data: Record<string, unknown>): Promise<Job> =>
        api.put(`/api/v1/jobs/${id}`, data).then(r => r.data),

    delete: (id: string): Promise<void> =>
        api.delete(`/api/v1/jobs/${id}`),
};

// ── Teams ──
export const teamService = {
    getAll: (): Promise<Team[]> =>
        api.get('/api/v1/teams').then(r => r.data),

    create: (data: Record<string, unknown>): Promise<Team> =>
        api.post('/api/v1/teams', data).then(r => r.data),

    update: (id: string, data: Record<string, unknown>): Promise<Team> =>
        api.put(`/api/v1/teams/${id}`, data).then(r => r.data),

    delete: (id: string): Promise<void> =>
        api.delete(`/api/v1/teams/${id}`),

    addMember: (teamId: string, userId: string, role: string): Promise<unknown> =>
        api.post(`/api/v1/teams/${teamId}/members`, { userId, role }).then(r => r.data),

    removeMember: (teamId: string, userId: string): Promise<void> =>
        api.delete(`/api/v1/teams/${teamId}/members/${userId}`),
};

// ── SLAs ──
export const slaService = {
    getAll: (): Promise<SLA[]> =>
        api.get('/api/v1/slas').then(r => r.data),

    create: (data: Record<string, unknown>): Promise<SLA> =>
        api.post('/api/v1/slas', data).then(r => r.data),

    update: (id: string, data: Record<string, unknown>): Promise<SLA> =>
        api.put(`/api/v1/slas/${id}`, data).then(r => r.data),

    delete: (id: string): Promise<void> =>
        api.delete(`/api/v1/slas/${id}`),
};

// ── Roles & Permissions ──
export const roleService = {
    getAll: (): Promise<Role[]> =>
        api.get('/api/v1/roles').then(r => r.data),

    create: (data: Record<string, unknown>): Promise<Role> =>
        api.post('/api/v1/roles', data).then(r => r.data),

    update: (id: string, data: Record<string, unknown>): Promise<Role> =>
        api.put(`/api/v1/roles/${id}`, data).then(r => r.data),

    delete: (id: string): Promise<void> =>
        api.delete(`/api/v1/roles/${id}`),

    getPermissions: (): Promise<Permission[]> =>
        api.get('/api/v1/permissions').then(r => r.data),
};

// ── Audit ──
export const auditService = {
    getAll: (params?: Record<string, unknown>): Promise<unknown> =>
        api.get('/api/v1/audit-logs', { params }).then(r => r.data),
};

// ── Settings ──
export const settingsService = {
    getSmtp: (): Promise<unknown> =>
        api.get('/api/v1/settings/smtp').then(r => r.data),

    updateSmtp: (data: Record<string, unknown>): Promise<unknown> =>
        api.put('/api/v1/settings/smtp', data).then(r => r.data),

    testSmtp: (data: Record<string, unknown>): Promise<unknown> =>
        api.post('/api/v1/settings/smtp/test', data).then(r => r.data),

    getEmailTemplates: (): Promise<unknown> =>
        api.get('/api/v1/settings/email-templates').then(r => r.data),

    updateEmailTemplate: (id: string, data: Record<string, unknown>): Promise<unknown> =>
        api.put(`/api/v1/settings/email-templates/${id}`, data).then(r => r.data),
};
