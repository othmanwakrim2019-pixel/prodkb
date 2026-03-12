/**
 * 01 — Seed Roles & Permissions
 * Creates all permission codes and the 4 default roles (ADMIN, EXPERT, OPERATOR, VIEWER).
 * Uses upsert — safe to run multiple times.
 */

import { prisma, logSeed } from '../helpers/seed.utils';

/** All permission codes with descriptions */
const PERMISSIONS: Array<{ code: string; description: string }> = [
    // Core
    { code: 'DASHBOARD_VIEW', description: 'View dashboard and statistics' },
    { code: 'SEARCH_VIEW', description: 'Use global search functionality' },
    // Incidents
    { code: 'INCIDENT_VIEW', description: 'View incidents list and details' },
    { code: 'VIEW_ALL_INCIDENTS', description: 'View all incidents across all teams' },
    { code: 'INCIDENT_CREATE', description: 'Create new incidents' },
    { code: 'INCIDENT_EDIT', description: 'Edit incidents, update status, add logs' },
    { code: 'INCIDENT_DELETE', description: 'Delete incidents' },
    // Procedures
    { code: 'PROCEDURE_VIEW', description: 'View procedures list and details' },
    { code: 'PROCEDURE_CREATE', description: 'Create new procedures' },
    { code: 'PROCEDURE_EDIT', description: 'Edit existing procedures' },
    { code: 'PROCEDURE_DELETE', description: 'Delete procedures' },
    // Users & Roles
    { code: 'USER_VIEW', description: 'View users list' },
    { code: 'USER_MANAGE', description: 'Create, edit, and deactivate users' },
    { code: 'ROLE_MANAGE', description: 'Create, edit, and delete roles' },
    // Teams
    { code: 'TEAM_MANAGE', description: 'Create and edit teams, manage members' },
    { code: 'TEAM_DELETE', description: 'Delete teams' },
    // Systems & Jobs
    { code: 'SYSTEM_MANAGE', description: 'Create, edit, and delete systems' },
    { code: 'JOB_VIEW', description: 'View jobs list' },
    { code: 'JOB_MANAGE', description: 'Create, edit, and delete jobs' },
    // SLAs & Escalation
    { code: 'SLA_MANAGE', description: 'Create, edit, and delete SLA policies' },
    { code: 'ESCALATION_MANAGE', description: 'Create, edit, and delete escalation rules' },
    // Auto-Assignment
    { code: 'AUTO_ASSIGN_MANAGE', description: 'Create, edit, and delete auto-assignment rules' },
    // Planning
    { code: 'PLANNING_VIEW', description: 'View planning instances and jobs' },
    { code: 'PLANNING_MANAGE', description: 'Create, edit, archive planning instances and manage planning jobs' },
    // Analytics
    { code: 'ANALYTICS_VIEW', description: 'View analytics dashboards (MTTR, SLA compliance, team performance)' },
    // Webhooks
    { code: 'WEBHOOK_MANAGE', description: 'Create, edit, and delete webhooks' },
    // Configuration & Email
    { code: 'CONFIG_MANAGE', description: 'Manage SMTP and system configuration' },
    { code: 'EMAIL_TEMPLATE_MANAGE', description: 'Edit email notification templates' },
    // Maintenance Windows
    { code: 'MAINTENANCE_MANAGE', description: 'Create, edit, and delete maintenance windows' },
    // Audit
    { code: 'AUDIT_VIEW', description: 'View audit logs' },
];

/** Role definitions with the permissions each role receives */
const ROLES: Array<{ name: string; description: string; permissions: string[] }> = [
    {
        name: 'ADMIN',
        description: 'Full system access — all permissions',
        permissions: PERMISSIONS.map(p => p.code), // all permissions
    },
    {
        name: 'EXPERT',
        description: 'Can manage procedures, resolve incidents, view planning and analytics',
        permissions: [
            'DASHBOARD_VIEW', 'SEARCH_VIEW',
            'INCIDENT_VIEW', 'INCIDENT_EDIT',
            'PROCEDURE_VIEW', 'PROCEDURE_CREATE', 'PROCEDURE_EDIT',
            'PLANNING_VIEW', 'PLANNING_MANAGE',
            'ANALYTICS_VIEW',
            'JOB_VIEW',
        ],
    },
    {
        name: 'OPERATOR',
        description: 'Can create incidents, view planning and procedures',
        permissions: [
            'DASHBOARD_VIEW', 'SEARCH_VIEW',
            'INCIDENT_VIEW', 'INCIDENT_CREATE', 'INCIDENT_EDIT',
            'PROCEDURE_VIEW',
            'PLANNING_VIEW',
            'JOB_VIEW',
        ],
    },
    {
        name: 'VIEWER',
        description: 'Read-only access to incidents, procedures, and planning',
        permissions: [
            'DASHBOARD_VIEW',
            'INCIDENT_VIEW',
            'PROCEDURE_VIEW',
            'PLANNING_VIEW',
        ],
    },
];

export async function seedRoles(): Promise<void> {
    console.log('\nSeeding permissions and roles...');

    // Upsert all permissions and collect their IDs
    const permIdMap = new Map<string, string>();
    for (const perm of PERMISSIONS) {
        const result = await prisma.permission.upsert({
            where: { code: perm.code },
            update: { description: perm.description },
            create: { code: perm.code, description: perm.description },
        });
        permIdMap.set(perm.code, result.id);
        logSeed('Permission', perm.code, !result.updatedAt || result.createdAt.getTime() === result.updatedAt.getTime());
    }

    // Upsert all roles and connect their permissions
    for (const roleDef of ROLES) {
        const existing = await prisma.role.findUnique({ where: { name: roleDef.name } });
        if (existing) {
            await prisma.role.update({
                where: { name: roleDef.name },
                data: {
                    description: roleDef.description,
                    permissions: {
                        set: roleDef.permissions.map(code => ({ id: permIdMap.get(code)! })),
                    },
                },
            });
            logSeed('Role', roleDef.name, false);
        } else {
            await prisma.role.create({
                data: {
                    name: roleDef.name,
                    description: roleDef.description,
                    permissions: {
                        connect: roleDef.permissions.map(code => ({ id: permIdMap.get(code)! })),
                    },
                },
            });
            logSeed('Role', roleDef.name, true);
        }
    }
}
