/**
 * 07 — Demo Data Seed
 *
 * Generates realistic demo data for development and staging:
 * - 50 random users, 20 teams with members
 * - 50 jobs (5 per system), 55 procedures
 * - 120 incidents with logs
 * - 15 escalation rules, 12 auto-assignment rules
 * - 4 webhooks with delivery history
 * - 4 planning instances with jobs
 * - 80 audit log entries
 *
 * ⚠️  THROWS AN ERROR if NODE_ENV === 'production'.
 *     This seed should never run in production.
 *     Use --demo flag to include it explicitly.
 */

import { faker } from '@faker-js/faker';
import { prisma, getHashedPassword, logSeed } from '../helpers/seed.utils';

export async function seedDemo(): Promise<void> {
    // ── Safety gate ──
    if (process.env.NODE_ENV === 'production') {
        throw new Error(
            '🚨 FATAL: Demo seed cannot run in production! ' +
            'Set NODE_ENV to "development" or "test", or do not pass --demo.'
        );
    }

    console.log('\n🎲 Seeding demo data (development only)...');
    const hashedPassword = await getHashedPassword();

    // ── Load prerequisite data ──
    const allRoles = await prisma.role.findMany();
    const allSystems = await prisma.system.findMany();
    const allSLAs = await prisma.sLA.findMany();

    if (allRoles.length === 0 || allSystems.length === 0) {
        throw new Error('Run seeds 01-04 first — roles and systems are required for demo data.');
    }

    // ── 50 Random Users ──
    console.log('  Creating 50 random users...');
    const users: Array<{ id: string; roleId: string | null }> = [];

    // Include existing users
    const existingUsers = await prisma.user.findMany({ select: { id: true, roleId: true } });
    users.push(...existingUsers);

    for (let i = 0; i < 50; i++) {
        const role = faker.helpers.arrayElement(allRoles);
        const email = faker.internet.email().toLowerCase();
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            users.push({ id: existing.id, roleId: existing.roleId });
            continue;
        }
        const user = await prisma.user.create({
            data: {
                name: faker.person.fullName(),
                email,
                password: hashedPassword,
                roleId: role.id,
                isActive: true,
            },
        });
        users.push({ id: user.id, roleId: user.roleId });
    }
    logSeed('Users', '50 random users', true);

    const expertRole = allRoles.find(r => r.name === 'EXPERT');
    const operatorRole = allRoles.find(r => r.name === 'OPERATOR');
    const experts = users.filter(u => u.roleId === expertRole?.id);
    const operators = users.filter(u => u.roleId === operatorRole?.id);
    // Fallback if no experts/operators found
    const safeExperts = experts.length > 0 ? experts : users;
    const safeOperators = operators.length > 0 ? operators : users;

    // ── 20 Teams with members ──
    console.log('  Creating 20 teams...');
    const teams: Array<{ id: string }> = [];
    for (let i = 0; i < 20; i++) {
        const teamName = `${faker.company.name()} Team`;
        const existing = await prisma.team.findUnique({ where: { name: teamName } });
        if (existing) {
            teams.push({ id: existing.id });
            continue;
        }
        const team = await prisma.team.create({
            data: {
                name: teamName,
                description: faker.company.catchPhrase(),
                emailDistribution: faker.internet.email(),
            },
        });
        teams.push({ id: team.id });

        // Add 3 random members
        const members = faker.helpers.arrayElements(users, 3);
        for (const m of members) {
            const memberExists = await prisma.teamMember.findUnique({
                where: { teamId_userId: { teamId: team.id, userId: m.id } },
            });
            if (!memberExists) {
                await prisma.teamMember.create({
                    data: { teamId: team.id, userId: m.id, role: 'MEMBER' },
                });
            }
        }
    }
    logSeed('Teams', '20 teams with members', true);

    // ── 50 Jobs (5 per system) ──
    console.log('  Creating 50 jobs...');
    const jobs: Array<{ id: string; systemId: string }> = [];
    for (const system of allSystems) {
        for (let i = 0; i < 5; i++) {
            const code = `${system.name.substring(0, 3).toUpperCase()}_JOB_${faker.string.alphanumeric(4).toUpperCase()}`;
            const existing = await prisma.job.findUnique({ where: { code } });
            if (existing) {
                jobs.push({ id: existing.id, systemId: existing.systemId });
                continue;
            }
            const job = await prisma.job.create({
                data: {
                    name: `${system.name} - Job ${i + 1}`,
                    code,
                    systemId: system.id,
                    teamId: faker.helpers.arrayElement(teams).id,
                },
            });
            jobs.push({ id: job.id, systemId: job.systemId });
        }
    }
    logSeed('Jobs', '50 jobs across 10 systems', true);

    // ── 55 Procedures ──
    console.log('  Creating 55 procedures...');
    const procedures: Array<{ id: string }> = [];
    for (let i = 0; i < 55; i++) {
        const system = faker.helpers.arrayElement(allSystems);
        const systemJobs = jobs.filter(j => j.systemId === system.id);
        const job = systemJobs.length > 0 ? faker.helpers.arrayElement(systemJobs) : null;

        const proc = await prisma.procedure.create({
            data: {
                title: `Resolution for ${faker.hacker.adjective()} issue in ${system.name}`,
                description: faker.lorem.paragraph(),
                resolutionSteps: `# Steps\n\n1. ${faker.hacker.verb()} the ${faker.hacker.noun()}\n2. Check logs\n3. Restart service`,
                systemId: system.id,
                jobId: job?.id,
                createdById: faker.helpers.arrayElement(safeExperts).id,
            },
        });
        procedures.push({ id: proc.id });
    }
    logSeed('Procedures', '55 procedures', true);

    // ── 120 Incidents with logs ──
    console.log('  Creating 120 incidents with logs...');
    const statuses = ['Open', 'In Progress', 'Resolved', 'Closed'];
    const severities = ['Critical', 'High', 'Medium', 'Low'];

    for (let i = 0; i < 120; i++) {
        const severity = faker.helpers.arrayElement(severities);
        const status = faker.helpers.arrayElement(statuses);
        const system = faker.helpers.arrayElement(allSystems);
        const systemJobs = jobs.filter(j => j.systemId === system.id);
        const job = systemJobs.length > 0 ? faker.helpers.arrayElement(systemJobs) : null;
        const sla = allSLAs.find(s => s.severity === severity);
        const creator = faker.helpers.arrayElement(safeOperators);
        const createdAt = faker.date.recent({ days: 90 });

        let resolvedAt: Date | null = null;
        let resolvedById: string | null = null;
        if (status === 'Resolved' || status === 'Closed') {
            resolvedAt = new Date(createdAt.getTime() + Math.random() * 86400000);
            resolvedById = faker.helpers.arrayElement(safeExperts).id;
        }

        const incident = await prisma.incident.create({
            data: {
                title: `${system.name}: ${faker.hacker.phrase()}`,
                description: faker.lorem.paragraph(),
                severity,
                status,
                environment: 'PROD',
                impact: faker.lorem.sentence(),
                detectionSource: faker.helpers.arrayElement(['Monitoring', 'User Report', 'Support Ticket']),
                systemId: system.id,
                jobId: job?.id,
                slaId: sla?.id,
                assignedTeamId: faker.helpers.arrayElement(teams).id,
                createdById: creator.id,
                createdAt,
                resolvedById,
                resolvedAt,
                linkedProcedureId: Math.random() > 0.7 && procedures.length > 0
                    ? faker.helpers.arrayElement(procedures).id
                    : null,
            },
        });

        // Add 1-5 logs per incident
        const logCount = faker.number.int({ min: 1, max: 5 });
        for (let j = 0; j < logCount; j++) {
            await prisma.incidentLog.create({
                data: {
                    incidentId: incident.id,
                    logType: faker.helpers.arrayElement(['investigation', 'update', 'resolution']),
                    rawLog: faker.lorem.sentence(),
                    createdAt: new Date(createdAt.getTime() + Math.random() * 3600000),
                },
            });
        }
    }
    logSeed('Incidents', '120 incidents with logs', true);

    // ── 15 Escalation Rules ──
    console.log('  Creating escalation rules...');
    const escalationConfigs = [
        { name: 'Core Banking Critical L1', systemIdx: 0, severity: 'Critical', level: 1, teamIdx: 0, delay: 15 },
        { name: 'Core Banking Critical L2', systemIdx: 0, severity: 'Critical', level: 2, teamIdx: 1, delay: 30 },
        { name: 'Core Banking Critical L3', systemIdx: 0, severity: 'Critical', level: 3, teamIdx: 2, delay: 60 },
        { name: 'Payment Critical L1', systemIdx: 1, severity: 'Critical', level: 1, teamIdx: 3, delay: 10 },
        { name: 'Payment Critical L2', systemIdx: 1, severity: 'Critical', level: 2, teamIdx: 4, delay: 20 },
        { name: 'Payment Critical L3', systemIdx: 1, severity: 'Critical', level: 3, teamIdx: 5, delay: 45 },
        { name: 'ATM High L1', systemIdx: 6, severity: 'High', level: 1, teamIdx: 6, delay: 30 },
        { name: 'ATM High L2', systemIdx: 6, severity: 'High', level: 2, teamIdx: 7, delay: 60 },
        { name: 'Fraud Critical L1', systemIdx: 8, severity: 'Critical', level: 1, teamIdx: 8, delay: 5 },
        { name: 'Fraud Critical L2', systemIdx: 8, severity: 'Critical', level: 2, teamIdx: 9, delay: 15 },
        { name: 'Fraud Critical L3', systemIdx: 8, severity: 'Critical', level: 3, teamIdx: 10, delay: 30 },
        { name: 'Default Catch-All L1', systemIdx: null, severity: null, level: 1, teamIdx: 11, delay: 60 },
        { name: 'Default Catch-All L2', systemIdx: null, severity: null, level: 2, teamIdx: 12, delay: 120 },
        { name: 'CRM Medium L1 (Disabled)', systemIdx: 2, severity: 'Medium', level: 1, teamIdx: 13, delay: 120, inactive: true },
        { name: 'CRM Medium L2 (Disabled)', systemIdx: 2, severity: 'Medium', level: 2, teamIdx: 14, delay: 240, inactive: true },
    ];

    for (const cfg of escalationConfigs) {
        const systemId = cfg.systemIdx !== null ? allSystems[cfg.systemIdx]?.id : null;
        await prisma.escalationRule.create({
            data: {
                name: cfg.name,
                systemId: systemId ?? null,
                severity: cfg.severity,
                level: cfg.level,
                teamId: teams[cfg.teamIdx % teams.length].id,
                delayMinutes: cfg.delay,
                isActive: !cfg.inactive,
            },
        });
    }
    logSeed('Escalation', '15 escalation rules', true);

    // ── 12 Auto-Assignment Rules ──
    console.log('  Creating auto-assignment rules...');
    const autoAssignConfigs = [
        { name: 'Core Banking + Critical → DB Ops', systemIdx: 0, severity: 'Critical', teamIdx: 0, priority: 100 },
        { name: 'Payment + Critical → Payment Ops', systemIdx: 1, severity: 'Critical', teamIdx: 1, priority: 100 },
        { name: 'Fraud + Critical → Security Team', systemIdx: 8, severity: 'Critical', teamIdx: 2, priority: 100 },
        { name: 'ATM + High → ATM Support', systemIdx: 6, severity: 'High', teamIdx: 3, priority: 90 },
        { name: 'Loan Processing + High → Loan Ops', systemIdx: 7, severity: 'High', teamIdx: 4, priority: 90 },
        { name: 'Core Banking (any) → Banking Team', systemIdx: 0, severity: null, teamIdx: 5, priority: 50 },
        { name: 'Mobile App (any) → Mobile Team', systemIdx: 5, severity: null, teamIdx: 6, priority: 50 },
        { name: 'CRM (any) → CRM Support', systemIdx: 2, severity: null, teamIdx: 7, priority: 50 },
        { name: 'Any Critical → Critical Team', systemIdx: null, severity: 'Critical', teamIdx: 8, priority: 30 },
        { name: 'Any High → Level 2 Support', systemIdx: null, severity: 'High', teamIdx: 9, priority: 20 },
        { name: 'Default → General Support', systemIdx: null, severity: null, teamIdx: 10, priority: 0 },
        { name: 'Old DW Rule (Disabled)', systemIdx: 9, severity: null, teamIdx: 11, priority: 40, inactive: true },
    ];

    for (const cfg of autoAssignConfigs) {
        const systemId = cfg.systemIdx !== null ? allSystems[cfg.systemIdx]?.id : null;
        await prisma.autoAssignmentRule.create({
            data: {
                name: cfg.name,
                systemId: systemId ?? null,
                severity: cfg.severity,
                teamId: teams[cfg.teamIdx % teams.length].id,
                priority: cfg.priority,
                isActive: !cfg.inactive,
            },
        });
    }
    logSeed('Auto-Assign', '12 auto-assignment rules', true);

    // ── 4 Webhooks with delivery history ──
    console.log('  Creating webhooks...');
    const webhookConfigs = [
        { name: 'Slack Notifications', url: 'https://hooks.slack.example.com/services/T00000000/B00000000/XXXXXXXX', secret: 'slack-webhook-secret-key-min16', events: 'incident.created,incident.resolved,incident.escalated', isActive: true },
        { name: 'PagerDuty Integration', url: 'https://events.pagerduty.example.com/v2/enqueue', secret: 'pagerduty-integration-key16char', events: 'incident.created,incident.sla_breached,incident.escalated', isActive: true },
        { name: 'ServiceNow ITSM Sync', url: 'https://instance.servicenow.example.com/api/sn_em_connector/em/inbound_event', secret: 'servicenow-secret-key-here16c', events: 'incident.created,incident.updated,incident.resolved', isActive: true },
        { name: 'Old Monitoring (Disabled)', url: 'https://old-monitoring.example.com/webhook', secret: 'old-monitoring-key-16chars', events: 'incident.created', isActive: false },
    ];

    const webhookEvents = ['incident.created', 'incident.updated', 'incident.resolved', 'incident.escalated', 'incident.sla_breached'];

    for (const cfg of webhookConfigs) {
        const webhook = await prisma.webhook.create({ data: cfg });
        if (cfg.isActive) {
            const deliveryCount = faker.number.int({ min: 5, max: 8 });
            for (let d = 0; d < deliveryCount; d++) {
                const event = faker.helpers.arrayElement(webhookEvents);
                const success = Math.random() > 0.2;
                const statusCode = success ? 200 : faker.helpers.arrayElement([500, 502, 503, 408]);
                await prisma.webhookDelivery.create({
                    data: {
                        webhookId: webhook.id,
                        event,
                        payload: JSON.stringify({ event, timestamp: faker.date.recent({ days: 30 }).toISOString(), data: { incidentId: faker.string.uuid(), title: faker.hacker.phrase() } }),
                        statusCode,
                        response: success ? '{"ok":true}' : `Error ${statusCode}: Server error`,
                        attemptCount: success ? 1 : faker.number.int({ min: 1, max: 3 }),
                        success,
                        error: success ? null : faker.helpers.arrayElement(['Connection timed out', 'HTTP 502: Bad Gateway', 'ECONNREFUSED']),
                        deliveredAt: success ? faker.date.recent({ days: 30 }) : null,
                        createdAt: faker.date.recent({ days: 30 }),
                    },
                });
            }
        }
    }
    logSeed('Webhooks', '4 webhooks with delivery logs', true);

    // ── 4 Planning Instances with jobs ──
    console.log('  Creating planning instances...');
    const admin = await prisma.user.findFirst({ where: { email: 'admin@prodkb.com' } });
    const adminId = admin?.id || users[0].id;

    const planningInstances = [
        { name: 'February 2026 Monthly Plan', description: 'Standard monthly maintenance window', period: 'monthly' as const, startDate: new Date('2026-02-01'), endDate: new Date('2026-02-28'), status: 'active' as const },
        { name: 'Q1 2026 Quarterly Plan', description: 'Major quarterly infrastructure upgrades', period: 'quarterly' as const, startDate: new Date('2026-01-01'), endDate: new Date('2026-03-31'), status: 'active' as const },
        { name: 'January 2026 Monthly Plan', description: 'Completed January maintenance', period: 'monthly' as const, startDate: new Date('2026-01-01'), endDate: new Date('2026-01-31'), status: 'archived' as const },
        { name: '2025 Annual Review', description: 'Year-end infrastructure review and cleanup', period: 'annual' as const, startDate: new Date('2025-01-01'), endDate: new Date('2025-12-31'), status: 'archived' as const },
    ];

    const pStatuses = ['pending', 'running', 'done'] as const;
    for (const instCfg of planningInstances) {
        const instance = await prisma.planningInstance.create({
            data: { ...instCfg, createdById: adminId },
        });
        const jobCount = faker.number.int({ min: 4, max: 6 });
        const shuffledJobs = faker.helpers.shuffle([...jobs]).slice(0, jobCount);
        let xPos = 100;
        for (let j = 0; j < shuffledJobs.length; j++) {
            const pJob = shuffledJobs[j];
            const isArchived = instCfg.status === 'archived';
            const pStatus = isArchived ? 'done' : faker.helpers.arrayElement(pStatuses);
            const scheduledTime = new Date(instCfg.startDate.getTime() + (j + 1) * 86400000 * 3);
            await prisma.planningJob.create({
                data: {
                    instanceId: instance.id,
                    systemId: pJob.systemId,
                    jobId: pJob.id,
                    scheduledTime,
                    status: pStatus,
                    positionX: xPos,
                    positionY: 50 + (j % 3) * 120,
                    dependencies: '[]',
                    completedAt: pStatus === 'done' ? new Date(scheduledTime.getTime() + 3600000) : null,
                    completedById: pStatus === 'done' ? faker.helpers.arrayElement(safeExperts).id : null,
                },
            });
            xPos += 250;
        }
    }
    logSeed('Planning', '4 instances with jobs', true);

    // ── 80 Audit Log entries ──
    console.log('  Creating audit logs...');
    const auditActions = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'STATUS_CHANGE', 'ASSIGN'];
    const auditEntities = ['INCIDENT', 'PROCEDURE', 'TEAM', 'USER', 'SYSTEM', 'SLA', 'ROLE'];
    const auditDetails: Record<string, string[]> = {
        'CREATE': ['Created new record', 'Initial creation', 'Auto-created by system'],
        'UPDATE': ['Updated status', 'Changed severity', 'Updated description'],
        'DELETE': ['Soft-deleted record', 'Permanently removed'],
        'LOGIN': ['Successful login from web UI', 'Login from mobile'],
        'LOGOUT': ['User logged out', 'Session expired'],
        'STATUS_CHANGE': ['Open → In Progress', 'In Progress → Resolved', 'Resolved → Closed'],
        'ASSIGN': ['Assigned to team', 'Reassigned', 'Auto-assigned by rule'],
    };
    const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
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
            },
        });
    }
    logSeed('Audit', '80 audit log entries', true);

    console.log('\n📊 Demo data summary:');
    console.log('   • 50 random users + 20 teams');
    console.log('   • 50 jobs, 55 procedures');
    console.log('   • 120 incidents with logs');
    console.log('   • 15 escalation + 12 auto-assign rules');
    console.log('   • 4 webhooks with deliveries');
    console.log('   • 4 planning instances with jobs');
    console.log('   • 80 audit log entries');
}
