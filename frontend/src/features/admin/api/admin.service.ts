/**
 * Admin API Service — consolidated CRUD for users, systems, teams, SLAs, roles, config
 * Typed service layer that eliminates raw axios calls across admin pages.
 */
import api from '../../../utils/axios';
import { unwrapArray, unwrapObject } from '../../../utils/api-response';
import type { User, System, Team, Job, SLA, Role, Permission } from '../../../types';

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
        api.get('/api/v1/users').then(r => unwrapArray<User>(r.data, ['data', 'items', 'users'])),

    create: (data: CreateUserInput): Promise<User> =>
        api.post('/auth/register', data).then(r => r.data),

    update: (id: string, data: UpdateUserInput): Promise<User> =>
        api.put(`/api/v1/users/${id}`, data).then(r => r.data),

    delete: (id: string): Promise<void> =>
        api.delete(`/api/v1/users/${id}`).then(() => undefined),

    changePassword: (data: { currentPassword: string; newPassword: string }): Promise<void> =>
        api.put('/api/v1/users/me/password', data).then(() => undefined),

    addToTeam: (teamId: string, userId: string, role: string): Promise<unknown> =>
        api.post(`/api/v1/teams/${teamId}/members`, { userId, role }).then(r => r.data),

    removeFromTeam: (teamId: string, userId: string): Promise<void> =>
        api.delete(`/api/v1/teams/${teamId}/members/${userId}`).then(() => undefined),

    resetPassword: (userId: string, newPassword: string): Promise<void> =>
        api.put(`/api/v1/users/${userId}/reset-password`, { newPassword }).then(() => undefined),

    unlockAccount: (email: string): Promise<void> =>
        api.post('/auth/v1/unlock-account', { email }).then(() => undefined),
};

// ── Systems ──
export const systemService = {
    getAll: (): Promise<System[]> =>
        api.get('/api/v1/systems').then(r => unwrapArray<System>(r.data, ['data', 'items', 'systems'])),

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
        api.get('/api/v1/teams').then(r => unwrapArray<Team>(r.data, ['data', 'items', 'teams'])),

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
        api.get('/api/v1/slas').then(r => unwrapArray<SLA>(r.data, ['data', 'items', 'slas'])),

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
        api.get('/api/v1/roles').then(r => unwrapArray<Role>(r.data, ['data', 'items', 'roles'])),

    getById: (id: string): Promise<Role> =>
        api.get(`/api/v1/roles/${id}`).then(r => unwrapObject<Role>(r.data) as Role),

    create: (data: CreateRoleInput): Promise<Role> =>
        api.post('/api/v1/roles', data).then(r => r.data),

    update: (id: string, data: UpdateRoleInput): Promise<Role> =>
        api.put(`/api/v1/roles/${id}`, data).then(r => r.data),

    delete: (id: string): Promise<void> =>
        api.delete(`/api/v1/roles/${id}`).then(() => undefined),

    replacePermissions: (id: string, permissionIds: string[]): Promise<Role> =>
        api.put(`/api/v1/roles/${id}/permissions`, permissionIds).then(r => r.data),

    getPermissions: (): Promise<Permission[]> =>
        api.get('/api/v1/roles/permissions').then(r => unwrapArray<Permission>(r.data, ['data', 'items', 'permissions'])),
};

// ── Audit ──
export interface AuditLog {
    id: string;
    userId: string;
    actionType: string;
    entityType: string;
    entityId: string;
    details: string;
    timestamp: string;
    createdAt: string;
    user?: { name: string };
}

export const auditService = {
    getAll: (params?: Record<string, unknown>): Promise<AuditLog[]> =>
        api.get('/api/v1/audit-logs', { params }).then(r => unwrapArray<AuditLog>(r.data, ['data', 'items', 'logs'])),
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
        api.get(`/api/v1/config/params?keys=${keys.join(',')}`).then(r => unwrapArray<ConfigParam>(r.data, ['data', 'items', 'params'])),

    updateParam: (key: string, value: string): Promise<ConfigParam> =>
        api.put(`/api/v1/config/${key}`, { value }).then(r => r.data),

    getSmtp: (): Promise<SmtpConfig> =>
        api.get('/api/v1/config/smtp').then(r => r.data),

    updateSmtp: (data: Partial<SmtpConfig>): Promise<SmtpConfig> =>
        api.put('/api/v1/config/smtp', data).then(r => r.data),

    testSmtp: (email: string): Promise<{ success: boolean; message: string }> =>
        api.post('/api/v1/config/smtp/test', { email }).then(r => r.data),
};

export interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
    body: string;
    variables: string;
    enabled: boolean;
    cc: string | null;
    updatedAt: string;
}

export const emailTemplateService = {
    getAll: (): Promise<EmailTemplate[]> =>
        api.get('/api/v1/email-templates').then(r => unwrapArray<EmailTemplate>(r.data, ['data', 'items', 'templates'])),

    update: (id: string, data: { subject: string; body: string; enabled: boolean; cc: string | null }): Promise<EmailTemplate> =>
        api.put(`/api/v1/email-templates/${id}`, data).then(r => r.data),

    preview: (data: { subject: string; body: string; enabled: boolean; cc: string }): Promise<{ subject: string; body: string }> =>
        api.post('/api/v1/email-templates/preview', data).then(r => r.data),
};

export interface AdminSelectOption {
    id: string;
    name: string;
}

export interface EscalationRule {
    id: string;
    name: string;
    systemId: string | null;
    severity: string | null;
    level: number;
    teamId: string;
    delayMinutes: number;
    isActive: boolean;
    system?: { id: string; name: string } | null;
    team?: { id: string; name: string } | null;
}

export const escalationRuleService = {
    getAll: (): Promise<EscalationRule[]> =>
        api.get('/api/v1/escalation-rules').then(r => unwrapArray<EscalationRule>(r.data, ['data', 'items', 'rules'])),

    create: (data: Omit<EscalationRule, 'id' | 'system' | 'team'>): Promise<EscalationRule> =>
        api.post('/api/v1/escalation-rules', data).then(r => r.data),

    update: (id: string, data: Partial<Omit<EscalationRule, 'id' | 'system' | 'team'>>): Promise<EscalationRule> =>
        api.put(`/api/v1/escalation-rules/${id}`, data).then(r => r.data),

    delete: (id: string): Promise<void> =>
        api.delete(`/api/v1/escalation-rules/${id}`).then(() => undefined),
};

export interface AutoAssignRule {
    id: string;
    name: string;
    systemId: string | null;
    severity: string | null;
    teamId: string;
    priority: number;
    isActive: boolean;
    system?: { id: string; name: string } | null;
    team?: { id: string; name: string } | null;
}

export const autoAssignRuleService = {
    getAll: (): Promise<AutoAssignRule[]> =>
        api.get('/api/v1/auto-assign-rules').then(r => unwrapArray<AutoAssignRule>(r.data, ['data', 'items', 'rules'])),

    create: (data: Omit<AutoAssignRule, 'id' | 'system' | 'team'>): Promise<AutoAssignRule> =>
        api.post('/api/v1/auto-assign-rules', data).then(r => r.data),

    update: (id: string, data: Partial<Omit<AutoAssignRule, 'id' | 'system' | 'team'>>): Promise<AutoAssignRule> =>
        api.put(`/api/v1/auto-assign-rules/${id}`, data).then(r => r.data),

    delete: (id: string): Promise<void> =>
        api.delete(`/api/v1/auto-assign-rules/${id}`).then(() => undefined),
};

export interface Webhook {
    id: string;
    name: string;
    url: string;
    secret: string;
    events: string;
    isActive: boolean;
    createdAt: string;
    _count?: { deliveries: number };
}

export interface WebhookDelivery {
    id: string;
    event: string;
    statusCode: number | null;
    success: boolean;
    attemptCount: number;
    error: string | null;
    createdAt: string;
}

export const webhookService = {
    getAll: (): Promise<Webhook[]> =>
        api.get('/api/v1/webhooks').then(r => unwrapArray<Webhook>(r.data, ['data', 'items', 'webhooks'])),

    create: (data: { name: string; url: string; secret: string; events: string; isActive: boolean }): Promise<Webhook> =>
        api.post('/api/v1/webhooks', data).then(r => r.data),

    update: (id: string, data: { name?: string; url?: string; secret?: string; events?: string; isActive?: boolean }): Promise<Webhook> =>
        api.put(`/api/v1/webhooks/${id}`, data).then(r => r.data),

    delete: (id: string): Promise<void> =>
        api.delete(`/api/v1/webhooks/${id}`).then(() => undefined),

    getDeliveries: (id: string): Promise<WebhookDelivery[]> =>
        api.get(`/api/v1/webhooks/${id}/deliveries`).then(r => unwrapArray<WebhookDelivery>(r.data, ['data', 'items', 'deliveries'])),
};

export interface MaintenanceWindow {
    id: string;
    title: string;
    description?: string;
    scheduledAt: string;
    endsAt: string;
    status: string;
    system: { id: string; name: string };
    createdBy: { id: string; name: string };
}

export const maintenanceService = {
    getAll: (): Promise<MaintenanceWindow[]> =>
        api.get('/api/v1/maintenance').then(r => unwrapArray<MaintenanceWindow>(r.data, ['data', 'items', 'maintenance', 'windows'])),

    create: (data: { systemId: string; title: string; description?: string; scheduledAt: string; endsAt: string }): Promise<MaintenanceWindow> =>
        api.post('/api/v1/maintenance', data).then(r => r.data),

    update: (id: string, data: { systemId: string; title: string; description?: string; scheduledAt: string; endsAt: string }): Promise<MaintenanceWindow> =>
        api.put(`/api/v1/maintenance/${id}`, data).then(r => r.data),

    delete: (id: string): Promise<void> =>
        api.delete(`/api/v1/maintenance/${id}`).then(() => undefined),
};

