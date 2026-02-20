import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // Clean existing data
    console.log('Cleaning existing data...');
    // Use raw SQL with TRUNCATE CASCADE to handle all FK constraints automatically
    // This handles tables like PlanningJob that may exist in DB but not in Prisma schema
    await prisma.$executeRawUnsafe(`
        DO $$ DECLARE
            r RECORD;
        BEGIN
            FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != '_prisma_migrations') LOOP
                EXECUTE 'TRUNCATE TABLE "public"."' || r.tablename || '" CASCADE';
            END LOOP;
        END $$;
    `);

    // Create Permissions & Roles
    console.log('Creating permissions and roles...');
    const permissions = [
        // Core
        'DASHBOARD_VIEW',
        'SEARCH_VIEW',
        // Incidents
        'INCIDENT_VIEW', 'INCIDENT_CREATE', 'INCIDENT_EDIT', 'INCIDENT_DELETE',
        // Procedures
        'PROCEDURE_VIEW', 'PROCEDURE_CREATE', 'PROCEDURE_EDIT', 'PROCEDURE_DELETE',
        // Users & Roles
        'USER_VIEW', 'USER_MANAGE',
        'ROLE_MANAGE',
        // Teams
        'TEAM_MANAGE', 'TEAM_DELETE',
        // Systems & Jobs
        'SYSTEM_MANAGE',
        'JOB_VIEW', 'JOB_MANAGE',
        // SLAs & Escalation
        'SLA_MANAGE',
        'ESCALATION_MANAGE',
        // Auto-Assignment
        'AUTO_ASSIGN_MANAGE',
        // Planning
        'PLANNING_VIEW', 'PLANNING_MANAGE',
        // Analytics
        'ANALYTICS_VIEW',
        // Webhooks
        'WEBHOOK_MANAGE',
        // Configuration & Email
        'CONFIG_MANAGE',
        'EMAIL_TEMPLATE_MANAGE',
        // Audit
        'AUDIT_VIEW',
    ];

    const permDescriptions: Record<string, string> = {
        'DASHBOARD_VIEW': 'View dashboard and statistics',
        'SEARCH_VIEW': 'Use global search functionality',
        'INCIDENT_VIEW': 'View incidents list and details',
        'INCIDENT_CREATE': 'Create new incidents',
        'INCIDENT_EDIT': 'Edit incidents, update status, add logs',
        'INCIDENT_DELETE': 'Delete incidents',
        'PROCEDURE_VIEW': 'View procedures list and details',
        'PROCEDURE_CREATE': 'Create new procedures',
        'PROCEDURE_EDIT': 'Edit existing procedures',
        'PROCEDURE_DELETE': 'Delete procedures',
        'USER_VIEW': 'View users list',
        'USER_MANAGE': 'Create, edit, and deactivate users',
        'ROLE_MANAGE': 'Create, edit, and delete roles',
        'TEAM_MANAGE': 'Create and edit teams, manage members',
        'TEAM_DELETE': 'Delete teams',
        'SYSTEM_MANAGE': 'Create, edit, and delete systems',
        'JOB_VIEW': 'View jobs list',
        'JOB_MANAGE': 'Create, edit, and delete jobs',
        'SLA_MANAGE': 'Create, edit, and delete SLA policies',
        'ESCALATION_MANAGE': 'Create, edit, and delete escalation rules',
        'AUTO_ASSIGN_MANAGE': 'Create, edit, and delete auto-assignment rules',
        'PLANNING_VIEW': 'View planning instances and jobs',
        'PLANNING_MANAGE': 'Create, edit, archive planning instances and manage planning jobs',
        'ANALYTICS_VIEW': 'View analytics dashboards (MTTR, SLA compliance, team performance)',
        'WEBHOOK_MANAGE': 'Create, edit, and delete webhooks',
        'CONFIG_MANAGE': 'Manage SMTP and system configuration',
        'EMAIL_TEMPLATE_MANAGE': 'Edit email notification templates',
        'AUDIT_VIEW': 'View audit logs',
    };

    const permsMap = new Map();
    for (const code of permissions) {
        const p = await prisma.permission.create({
            data: { code, description: permDescriptions[code] || `Permission to ${code.toLowerCase().replace('_', ' ')}` }
        });
        permsMap.set(code, p.id);
    }

    const adminRole = await prisma.role.create({
        data: {
            name: 'ADMIN',
            description: 'Full system access — all permissions',
            permissions: { connect: permissions.map(code => ({ id: permsMap.get(code) })) }
        }
    });

    const expertRole = await prisma.role.create({
        data: {
            name: 'EXPERT',
            description: 'Can manage procedures, resolve incidents, view planning and analytics',
            permissions: {
                connect: [
                    'DASHBOARD_VIEW', 'SEARCH_VIEW',
                    'INCIDENT_VIEW', 'INCIDENT_EDIT',
                    'PROCEDURE_VIEW', 'PROCEDURE_CREATE', 'PROCEDURE_EDIT',
                    'PLANNING_VIEW', 'PLANNING_MANAGE',
                    'ANALYTICS_VIEW',
                    'JOB_VIEW',
                ].map(code => ({ id: permsMap.get(code) }))
            }
        }
    });

    const operatorRole = await prisma.role.create({
        data: {
            name: 'OPERATOR',
            description: 'Can create incidents, view planning and procedures',
            permissions: {
                connect: [
                    'DASHBOARD_VIEW', 'SEARCH_VIEW',
                    'INCIDENT_VIEW', 'INCIDENT_CREATE', 'INCIDENT_EDIT',
                    'PROCEDURE_VIEW',
                    'PLANNING_VIEW',
                    'JOB_VIEW',
                ].map(code => ({ id: permsMap.get(code) }))
            }
        }
    });

    const viewerRole = await prisma.role.create({
        data: {
            name: 'VIEWER',
            description: 'Read-only access to incidents, procedures, and planning',
            permissions: {
                connect: [
                    'DASHBOARD_VIEW',
                    'INCIDENT_VIEW',
                    'PROCEDURE_VIEW',
                    'PLANNING_VIEW',
                ].map(code => ({ id: permsMap.get(code) }))
            }
        }
    });

    const roles = [adminRole, expertRole, operatorRole, viewerRole];

    // Create Users (Admin + Random Users)
    console.log('Creating users...');
    const hashedPassword = await bcrypt.hash('password123', 10);
    const users = [];

    // Core Users
    const admin = await prisma.user.create({
        data: { name: 'Admin User', email: 'admin@prodkb.com', password: hashedPassword, roleId: adminRole.id, isActive: true }
    });
    users.push(admin);

    const viewerUser = await prisma.user.create({
        data: { name: 'Viewer User', email: 'viewer@prodkb.com', password: hashedPassword, roleId: viewerRole.id, isActive: true }
    });
    users.push(viewerUser);

    // Create 50 Random Users
    for (let i = 0; i < 50; i++) {
        const role = faker.helpers.arrayElement(roles);
        const user = await prisma.user.create({
            data: {
                name: faker.person.fullName(),
                email: faker.internet.email(),
                password: hashedPassword,
                roleId: role.id,
                isActive: true
            }
        });
        users.push(user);
    }
    const experts = users.filter(u => u.roleId === expertRole.id);
    const operators = users.filter(u => u.roleId === operatorRole.id);

    // Create Teams (20 Teams)
    console.log('Creating 20 teams...');
    const teams = [];
    for (let i = 0; i < 20; i++) {
        const teamName = faker.company.name() + ' Team';

        const team = await prisma.team.create({
            data: {
                name: teamName,
                description: faker.company.catchPhrase(),
                emailDistribution: faker.internet.email(),
            }
        });
        teams.push(team);

        // Add random members to team
        const members = faker.helpers.arrayElements(users, 3);
        // Ensure Viewer is in the first team (Bode LLC or similar, ensuring they have access to something)
        if (i === 0) {
            members.push(viewerUser);
        }

        const memberData = members.map(u => ({ teamId: team.id, userId: u.id, role: 'MEMBER' }));
        // Ensure at least one distinct userId to avoid duplicates in createMany if faker picks same
        // But createMany skipDuplicates not supported in sqlite easily? 
        // Just loop insert
        for (const m of memberData) {
            // check if exists
            const exists = await prisma.teamMember.findUnique({
                where: { teamId_userId: { teamId: m.teamId, userId: m.userId } }
            });
            if (!exists) {
                await prisma.teamMember.create({ data: m }); // One by one to be safe
            }
        }
    }

    // Create Systems
    console.log('Creating systems...');
    const systems = [];
    const systemNames = ['Core Banking', 'Payment Gateway', 'CRM', 'Reporting', 'HR System', 'Mobile App', 'ATM Network', 'Loan Processing', 'Fraud Detection', 'Data Warehouse'];
    for (const name of systemNames) {
        const system = await prisma.system.create({
            data: { name, description: faker.lorem.sentence() }
        });
        systems.push(system);
    }

    // Create SLAs
    console.log('Creating SLAs...');
    const slas = [];
    slas.push(await prisma.sLA.create({ data: { name: 'Critical SLA', severity: 'Critical', acknowledgeTimeMinutes: 15, resolveTimeMinutes: 60, description: 'Critical' } }));
    slas.push(await prisma.sLA.create({ data: { name: 'High SLA', severity: 'High', acknowledgeTimeMinutes: 30, resolveTimeMinutes: 240, description: 'High' } }));
    slas.push(await prisma.sLA.create({ data: { name: 'Medium SLA', severity: 'Medium', acknowledgeTimeMinutes: 60, resolveTimeMinutes: 480, description: 'Medium' } }));
    slas.push(await prisma.sLA.create({ data: { name: 'Low SLA', severity: 'Low', acknowledgeTimeMinutes: 120, resolveTimeMinutes: 1440, description: 'Low' } }));

    // Create Jobs (5 per system = 50 jobs)
    console.log('Creating jobs...');
    const jobs = [];
    for (const system of systems) {
        for (let i = 0; i < 5; i++) {
            const job = await prisma.job.create({
                data: {
                    name: `${system.name} - Job ${i + 1}`,
                    code: `${system.name.substring(0, 3).toUpperCase()}_JOB_${faker.string.alphanumeric(4).toUpperCase()}`,
                    systemId: system.id,
                    teamId: faker.helpers.arrayElement(teams).id
                }
            });
            jobs.push(job);
        }
    }

    // Create 55 Procedures
    console.log('Creating 55 procedures...');
    const procedures = [];
    for (let i = 0; i < 55; i++) {
        const system = faker.helpers.arrayElement(systems);
        const job = faker.helpers.arrayElement(jobs.filter(j => j.systemId === system.id));

        const proc = await prisma.procedure.create({
            data: {
                title: `Resolution for ${faker.hacker.adjective()} issue in ${system.name}`,
                description: faker.lorem.paragraph(),
                resolutionSteps: `# Steps\n\n1. ${faker.hacker.verb()} the ${faker.hacker.noun()}\n2. Check logs\n3. Restart service`,
                systemId: system.id,
                jobId: job?.id,
                createdById: faker.helpers.arrayElement(experts).id
            }
        });
        procedures.push(proc);
    }

    // Create 120 Incidents
    console.log('Creating 120 incidents...');
    const statuses = ['Open', 'In Progress', 'Resolved', 'Closed'];
    const severities = ['Critical', 'High', 'Medium', 'Low'];

    for (let i = 0; i < 120; i++) {
        const severity = faker.helpers.arrayElement(severities);
        const status = faker.helpers.arrayElement(statuses);
        const system = faker.helpers.arrayElement(systems);
        const job = faker.helpers.arrayElement(jobs.filter(j => j.systemId === system.id));
        const sla = slas.find(s => s.severity === severity);
        const creator = faker.helpers.arrayElement(operators);

        // Random date in last 3 months
        const createdAt = faker.date.recent({ days: 90 });

        let resolvedAt = null;
        let resolvedBy = null;
        if (status === 'Resolved' || status === 'Closed') {
            resolvedAt = new Date(createdAt.getTime() + Math.random() * 86400000); // + up to 24h
            resolvedBy = faker.helpers.arrayElement(experts).id;
        }

        const incident = await prisma.incident.create({
            data: {
                title: `${system.name}: ${faker.hacker.phrase()}`,
                description: faker.lorem.paragraph(),
                severity,
                status,
                environment: 'Production',
                impact: faker.lorem.sentence(),
                detectionSource: faker.helpers.arrayElement(['Monitoring', 'User Report', 'Support Ticket']),
                systemId: system.id,
                jobId: job?.id,
                slaId: sla?.id,
                assignedTeamId: faker.helpers.arrayElement(teams).id,
                createdById: creator.id,
                createdAt: createdAt,
                resolvedById: resolvedBy,
                resolvedAt: resolvedAt,
                // Link random procedure 30% of the time
                linkedProcedureId: Math.random() > 0.7 ? faker.helpers.arrayElement(procedures).id : null
            }
        });

        // Add 1-5 logs per incident
        const logCount = faker.number.int({ min: 1, max: 5 });
        for (let j = 0; j < logCount; j++) {
            await prisma.incidentLog.create({
                data: {
                    incidentId: incident.id,
                    logType: faker.helpers.arrayElement(['investigation', 'update', 'resolution']),
                    rawLog: faker.lorem.sentence(),
                    createdAt: new Date(createdAt.getTime() + Math.random() * 3600000)
                }
            });
        }
    }


    // Create Email Templates
    console.log('Creating email templates...');
    const availableVars = '{{incident.id}}, {{incident.title}}, {{incident.severity}}, {{incident.status}}, {{incident.description}}, {{incident.environment}}, {{incident.createdAt}}, {{incident.createdBy.name}}, {{incident.createdBy.email}}, {{incident.assignedTeam.name}}, {{incident.system.name}}, {{incident.job.code}}, {{incident.job.name}}, {{incident.sla.name}}, {{incident.resolvedBy.name}}, {{incident.resolvedAt}}';
    const emailTemplates = [
        {
            name: 'incident_created',
            subject: '[{{incident.severity}}] New Incident: {{incident.title}} - {{incident.system.name}}',
            body: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
<div style="background:#d32f2f;color:#fff;padding:20px;border-radius:8px 8px 0 0">
  <h2 style="margin:0">🚨 New Incident Created</h2>
</div>
<div style="padding:20px;border:1px solid #e0e0e0;border-top:none">
  <table style="width:100%;border-collapse:collapse">
    <tr><td style="padding:8px;font-weight:bold;color:#666;width:140px">ID:</td><td style="padding:8px">{{incident.id}}</td></tr>
    <tr><td style="padding:8px;font-weight:bold;color:#666">Title:</td><td style="padding:8px">{{incident.title}}</td></tr>
    <tr><td style="padding:8px;font-weight:bold;color:#666">Severity:</td><td style="padding:8px">{{incident.severity}}</td></tr>
    <tr><td style="padding:8px;font-weight:bold;color:#666">Environment:</td><td style="padding:8px">{{incident.environment}}</td></tr>
    <tr><td style="padding:8px;font-weight:bold;color:#666">System:</td><td style="padding:8px">{{incident.system.name}}</td></tr>
    <tr><td style="padding:8px;font-weight:bold;color:#666">Job:</td><td style="padding:8px">{{incident.job.code}} - {{incident.job.name}}</td></tr>
    <tr><td style="padding:8px;font-weight:bold;color:#666">Team:</td><td style="padding:8px">{{incident.assignedTeam.name}}</td></tr>
    <tr><td style="padding:8px;font-weight:bold;color:#666">Created By:</td><td style="padding:8px">{{incident.createdBy.name}}</td></tr>
  </table>
  <div style="margin-top:16px;padding:12px;background:#f5f5f5;border-radius:4px">
    <strong>Description:</strong><br/>{{incident.description}}
  </div>
</div>
<div style="background:#f5f5f5;padding:12px;text-align:center;font-size:12px;color:#666;border-radius:0 0 8px 8px;border:1px solid #e0e0e0;border-top:none">
  ProdKB — Incident Management System
</div>
</div>`,
            variables: availableVars
        },
        {
            name: 'incident_updated',
            subject: '[Update] Incident: {{incident.title}} — Status: {{incident.status}}',
            body: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
<div style="background:#1976d2;color:#fff;padding:20px;border-radius:8px 8px 0 0">
  <h2 style="margin:0">📝 Incident Updated</h2>
</div>
<div style="padding:20px;border:1px solid #e0e0e0;border-top:none">
  <table style="width:100%;border-collapse:collapse">
    <tr><td style="padding:8px;font-weight:bold;color:#666;width:140px">ID:</td><td style="padding:8px">{{incident.id}}</td></tr>
    <tr><td style="padding:8px;font-weight:bold;color:#666">Title:</td><td style="padding:8px">{{incident.title}}</td></tr>
    <tr><td style="padding:8px;font-weight:bold;color:#666">Status:</td><td style="padding:8px">{{incident.status}}</td></tr>
    <tr><td style="padding:8px;font-weight:bold;color:#666">Severity:</td><td style="padding:8px">{{incident.severity}}</td></tr>
    <tr><td style="padding:8px;font-weight:bold;color:#666">System:</td><td style="padding:8px">{{incident.system.name}}</td></tr>
    <tr><td style="padding:8px;font-weight:bold;color:#666">Team:</td><td style="padding:8px">{{incident.assignedTeam.name}}</td></tr>
  </table>
</div>
<div style="background:#f5f5f5;padding:12px;text-align:center;font-size:12px;color:#666;border-radius:0 0 8px 8px;border:1px solid #e0e0e0;border-top:none">
  ProdKB — Incident Management System
</div>
</div>`,
            variables: availableVars
        },
        {
            name: 'incident_resolved',
            subject: '[Resolved] Incident: {{incident.title}}',
            body: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
<div style="background:#2e7d32;color:#fff;padding:20px;border-radius:8px 8px 0 0">
  <h2 style="margin:0">✅ Incident Resolved</h2>
</div>
<div style="padding:20px;border:1px solid #e0e0e0;border-top:none">
  <table style="width:100%;border-collapse:collapse">
    <tr><td style="padding:8px;font-weight:bold;color:#666;width:140px">ID:</td><td style="padding:8px">{{incident.id}}</td></tr>
    <tr><td style="padding:8px;font-weight:bold;color:#666">Title:</td><td style="padding:8px">{{incident.title}}</td></tr>
    <tr><td style="padding:8px;font-weight:bold;color:#666">Resolved By:</td><td style="padding:8px">{{incident.resolvedBy.name}}</td></tr>
    <tr><td style="padding:8px;font-weight:bold;color:#666">Resolved At:</td><td style="padding:8px">{{incident.resolvedAt}}</td></tr>
    <tr><td style="padding:8px;font-weight:bold;color:#666">System:</td><td style="padding:8px">{{incident.system.name}}</td></tr>
    <tr><td style="padding:8px;font-weight:bold;color:#666">Environment:</td><td style="padding:8px">{{incident.environment}}</td></tr>
  </table>
</div>
<div style="background:#f5f5f5;padding:12px;text-align:center;font-size:12px;color:#666;border-radius:0 0 8px 8px;border:1px solid #e0e0e0;border-top:none">
  ProdKB — Incident Management System
</div>
</div>`,
            variables: availableVars
        },
        {
            name: 'user_welcome',
            subject: 'Welcome to ProdKB, {{name}}!',
            body: '<h2>Welcome, {{name}}!</h2><p>Your account has been created successfully. You can now login to the ProdKB portal.</p>',
            variables: '{{name}}, {{email}}'
        }
    ];

    for (const t of emailTemplates) {
        await prisma.emailTemplate.create({ data: t });
    }

    // ── Escalation Rules (15 rules — 3 levels for 5 system/severity combos) ──
    console.log('Creating escalation rules...');
    const escalationConfigs = [
        // Core Banking — Critical: 3-level escalation chain
        { name: 'Core Banking Critical L1', systemId: systems[0].id, severity: 'Critical', level: 1, teamIdx: 0, delay: 15 },
        { name: 'Core Banking Critical L2', systemId: systems[0].id, severity: 'Critical', level: 2, teamIdx: 1, delay: 30 },
        { name: 'Core Banking Critical L3', systemId: systems[0].id, severity: 'Critical', level: 3, teamIdx: 2, delay: 60 },
        // Payment Gateway — Critical
        { name: 'Payment Critical L1', systemId: systems[1].id, severity: 'Critical', level: 1, teamIdx: 3, delay: 10 },
        { name: 'Payment Critical L2', systemId: systems[1].id, severity: 'Critical', level: 2, teamIdx: 4, delay: 20 },
        { name: 'Payment Critical L3', systemId: systems[1].id, severity: 'Critical', level: 3, teamIdx: 5, delay: 45 },
        // ATM Network — High
        { name: 'ATM High L1', systemId: systems[6].id, severity: 'High', level: 1, teamIdx: 6, delay: 30 },
        { name: 'ATM High L2', systemId: systems[6].id, severity: 'High', level: 2, teamIdx: 7, delay: 60 },
        // Fraud Detection — Critical
        { name: 'Fraud Critical L1', systemId: systems[8].id, severity: 'Critical', level: 1, teamIdx: 8, delay: 5 },
        { name: 'Fraud Critical L2', systemId: systems[8].id, severity: 'Critical', level: 2, teamIdx: 9, delay: 15 },
        { name: 'Fraud Critical L3', systemId: systems[8].id, severity: 'Critical', level: 3, teamIdx: 10, delay: 30 },
        // Wildcard — any system, any severity (catch-all)
        { name: 'Default Catch-All L1', systemId: null, severity: null, level: 1, teamIdx: 11, delay: 60 },
        { name: 'Default Catch-All L2', systemId: null, severity: null, level: 2, teamIdx: 12, delay: 120 },
        // CRM — Medium (inactive example)
        { name: 'CRM Medium L1 (Disabled)', systemId: systems[2].id, severity: 'Medium', level: 1, teamIdx: 13, delay: 120, inactive: true },
        { name: 'CRM Medium L2 (Disabled)', systemId: systems[2].id, severity: 'Medium', level: 2, teamIdx: 14, delay: 240, inactive: true },
    ];

    for (const cfg of escalationConfigs) {
        await prisma.escalationRule.create({
            data: {
                name: cfg.name,
                systemId: cfg.systemId,
                severity: cfg.severity,
                level: cfg.level,
                teamId: teams[cfg.teamIdx % teams.length].id,
                delayMinutes: cfg.delay,
                isActive: cfg.inactive ? false : true,
            }
        });
    }

    // ── Auto-Assignment Rules (12 rules with priority ordering) ──
    console.log('Creating auto-assignment rules...');
    const autoAssignConfigs = [
        // Most specific rules (highest priority)
        { name: 'Core Banking + Critical → DB Ops', systemId: systems[0].id, severity: 'Critical', teamIdx: 0, priority: 100 },
        { name: 'Payment + Critical → Payment Ops', systemId: systems[1].id, severity: 'Critical', teamIdx: 1, priority: 100 },
        { name: 'Fraud + Critical → Security Team', systemId: systems[8].id, severity: 'Critical', teamIdx: 2, priority: 100 },
        { name: 'ATM + High → ATM Support', systemId: systems[6].id, severity: 'High', teamIdx: 3, priority: 90 },
        { name: 'Loan Processing + High → Loan Ops', systemId: systems[7].id, severity: 'High', teamIdx: 4, priority: 90 },
        // System-only rules (medium priority)
        { name: 'Core Banking (any) → Banking Team', systemId: systems[0].id, severity: null, teamIdx: 5, priority: 50 },
        { name: 'Mobile App (any) → Mobile Team', systemId: systems[5].id, severity: null, teamIdx: 6, priority: 50 },
        { name: 'CRM (any) → CRM Support', systemId: systems[2].id, severity: null, teamIdx: 7, priority: 50 },
        // Severity-only rules (lower priority)
        { name: 'Any Critical → Critical Team', systemId: null, severity: 'Critical', teamIdx: 8, priority: 30 },
        { name: 'Any High → Level 2 Support', systemId: null, severity: 'High', teamIdx: 9, priority: 20 },
        // Catch-all (lowest priority)
        { name: 'Default → General Support', systemId: null, severity: null, teamIdx: 10, priority: 0 },
        // Inactive example
        { name: 'Old DW Rule (Disabled)', systemId: systems[9].id, severity: null, teamIdx: 11, priority: 40, inactive: true },
    ];

    for (const cfg of autoAssignConfigs) {
        await prisma.autoAssignmentRule.create({
            data: {
                name: cfg.name,
                systemId: cfg.systemId,
                severity: cfg.severity,
                teamId: teams[cfg.teamIdx % teams.length].id,
                priority: cfg.priority,
                isActive: cfg.inactive ? false : true,
            }
        });
    }

    // ── Webhooks (4 webhooks with delivery history) ──
    console.log('Creating webhooks and delivery history...');
    const webhookConfigs = [
        {
            name: 'Slack Notifications',
            url: 'https://hooks.slack.example.com/services/T00000000/B00000000/XXXXXXXX',
            secret: 'slack-webhook-secret-key-min16',
            events: 'incident.created,incident.resolved,incident.escalated',
            isActive: true,
        },
        {
            name: 'PagerDuty Integration',
            url: 'https://events.pagerduty.example.com/v2/enqueue',
            secret: 'pagerduty-integration-key16char',
            events: 'incident.created,incident.sla_breached,incident.escalated',
            isActive: true,
        },
        {
            name: 'ServiceNow ITSM Sync',
            url: 'https://instance.servicenow.example.com/api/sn_em_connector/em/inbound_event',
            secret: 'servicenow-secret-key-here16c',
            events: 'incident.created,incident.updated,incident.resolved',
            isActive: true,
        },
        {
            name: 'Old Monitoring (Disabled)',
            url: 'https://old-monitoring.example.com/webhook',
            secret: 'old-monitoring-key-16chars',
            events: 'incident.created',
            isActive: false,
        },
    ];

    const webhookEvents = ['incident.created', 'incident.updated', 'incident.resolved', 'incident.escalated', 'incident.sla_breached'];

    for (const cfg of webhookConfigs) {
        const webhook = await prisma.webhook.create({ data: cfg });

        // Generate 5-8 delivery logs per active webhook
        if (cfg.isActive) {
            const deliveryCount = faker.number.int({ min: 5, max: 8 });
            for (let d = 0; d < deliveryCount; d++) {
                const event = faker.helpers.arrayElement(webhookEvents);
                const success = Math.random() > 0.2; // 80% success rate
                const statusCode = success ? 200 : faker.helpers.arrayElement([500, 502, 503, 408, null]);
                await prisma.webhookDelivery.create({
                    data: {
                        webhookId: webhook.id,
                        event,
                        payload: JSON.stringify({
                            event,
                            timestamp: faker.date.recent({ days: 30 }).toISOString(),
                            data: { incidentId: faker.string.uuid(), title: faker.hacker.phrase(), severity: faker.helpers.arrayElement(['Critical', 'High', 'Medium', 'Low']) }
                        }),
                        statusCode,
                        response: success ? '{"ok":true}' : (statusCode ? `Error ${statusCode}: Server internal error` : null),
                        attemptCount: success ? 1 : faker.number.int({ min: 1, max: 3 }),
                        success,
                        error: success ? null : faker.helpers.arrayElement(['Connection timed out', 'HTTP 502: Bad Gateway', 'HTTP 503: Service Unavailable', 'ECONNREFUSED']),
                        deliveredAt: success ? faker.date.recent({ days: 30 }) : null,
                        createdAt: faker.date.recent({ days: 30 }),
                    }
                });
            }
        }
    }

    // ── Planning Instances & Jobs ──
    console.log('Creating planning instances and jobs...');
    const planningInstances = [
        { name: 'February 2026 Monthly Plan', description: 'Standard monthly maintenance window', period: 'monthly' as const, startDate: new Date('2026-02-01'), endDate: new Date('2026-02-28'), status: 'active' as const },
        { name: 'Q1 2026 Quarterly Plan', description: 'Major quarterly infrastructure upgrades', period: 'quarterly' as const, startDate: new Date('2026-01-01'), endDate: new Date('2026-03-31'), status: 'active' as const },
        { name: 'January 2026 Monthly Plan', description: 'Completed January maintenance', period: 'monthly' as const, startDate: new Date('2026-01-01'), endDate: new Date('2026-01-31'), status: 'archived' as const },
        { name: '2025 Annual Review', description: 'Year-end infrastructure review and cleanup', period: 'annual' as const, startDate: new Date('2025-01-01'), endDate: new Date('2025-12-31'), status: 'archived' as const },
    ];

    const pStatuses = ['pending', 'running', 'done'] as const;
    for (const instCfg of planningInstances) {
        const instance = await prisma.planningInstance.create({
            data: {
                name: instCfg.name,
                description: instCfg.description,
                period: instCfg.period,
                startDate: instCfg.startDate,
                endDate: instCfg.endDate,
                status: instCfg.status,
                createdById: admin.id,
            }
        });

        // Add 4-6 planning jobs per instance (using unique jobs per instance)
        const jobCount = faker.number.int({ min: 4, max: 6 });
        const shuffledJobs = faker.helpers.shuffle([...jobs]).slice(0, jobCount);
        let xPos = 100;
        for (let j = 0; j < shuffledJobs.length; j++) {
            const job = shuffledJobs[j];
            const isArchived = instCfg.status === 'archived';
            const status = isArchived ? 'done' : faker.helpers.arrayElement(pStatuses);
            const scheduledTime = new Date(instCfg.startDate.getTime() + (j + 1) * 86400000 * 3);

            await prisma.planningJob.create({
                data: {
                    instanceId: instance.id,
                    systemId: job.systemId,
                    jobId: job.id,
                    scheduledTime,
                    status,
                    positionX: xPos,
                    positionY: 50 + (j % 3) * 120,
                    dependencies: '[]',
                    completedAt: status === 'done' ? new Date(scheduledTime.getTime() + 3600000) : null,
                    completedById: status === 'done' ? faker.helpers.arrayElement(experts).id : null,
                }
            });
            xPos += 250;
        }
    }

    // ── Audit Logs (80 entries) ──
    console.log('Creating audit logs...');
    const auditActions = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'STATUS_CHANGE', 'ASSIGN'];
    const auditEntities = ['INCIDENT', 'PROCEDURE', 'TEAM', 'USER', 'SYSTEM', 'SLA', 'ROLE'];
    const auditDetails: Record<string, string[]> = {
        'CREATE': ['Created new record', 'Initial creation via seed', 'Auto-created by system'],
        'UPDATE': ['Updated status to In Progress', 'Changed severity from Medium to High', 'Updated description', 'Modified resolution steps'],
        'DELETE': ['Soft-deleted record', 'Permanently removed', 'Cleaned up stale entry'],
        'LOGIN': ['Successful login from web UI', 'Login from mobile device', 'Login via SSO'],
        'LOGOUT': ['User logged out', 'Session expired', 'Manual logout'],
        'STATUS_CHANGE': ['Status changed: Open → In Progress', 'Status changed: In Progress → Resolved', 'Reopened incident', 'Status changed: Resolved → Closed'],
        'ASSIGN': ['Assigned to team', 'Reassigned to new team', 'Auto-assigned by rule'],
    };
    const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
        'PostmanRuntime/7.32.3',
    ];

    for (let i = 0; i < 80; i++) {
        const action = faker.helpers.arrayElement(auditActions);
        const entity = faker.helpers.arrayElement(auditEntities);
        await prisma.auditLog.create({
            data: {
                userId: faker.helpers.arrayElement(users).id,
                actionType: action,
                entityType: entity,
                entityId: faker.string.uuid(),
                details: faker.helpers.arrayElement(auditDetails[action] || ['Action performed']),
                ipAddress: faker.internet.ip(),
                userAgent: faker.helpers.arrayElement(userAgents),
                result: Math.random() > 0.05 ? 'SUCCESS' : 'FAILURE',
                timestamp: faker.date.recent({ days: 60 }),
            }
        });
    }

    console.log('✅ Large scale seed completed successfully!');
    console.log('\nPlease login with: admin@prodkb.com / password123');
    console.log('\n📊 Data summary:');
    console.log('   • 52 users (admin + viewer + 50 random)');
    console.log('   • 20 teams with members');
    console.log('   • 10 systems, 50 jobs, 4 SLAs');
    console.log('   • 55 procedures, 120 incidents with logs');
    console.log('   • 15 escalation rules (3-level chains)');
    console.log('   • 12 auto-assignment rules (priority-based)');
    console.log('   • 4 webhooks with ~25 delivery logs');
    console.log('   • 4 planning instances with ~20 jobs');
    console.log('   • 80 audit log entries');
    console.log('   • 4 email templates');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', JSON.stringify(e, null, 2));
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
