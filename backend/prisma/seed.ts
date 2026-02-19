import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // Clean existing data
    console.log('Cleaning existing data...');
    // Delete in order of dependencies (child first)
    await prisma.incidentLog.deleteMany();
    await prisma.auditLog.deleteMany();
    // await prisma.file.deleteMany(); // Model does not exist
    await prisma.incident.deleteMany();
    await prisma.procedure.deleteMany();
    await prisma.teamMember.deleteMany();
    await prisma.job.deleteMany();
    await prisma.system.deleteMany();
    await prisma.sLA.deleteMany();
    await prisma.team.deleteMany();
    await prisma.user.deleteMany();
    await prisma.role.deleteMany();
    await prisma.emailTemplate.deleteMany();
    await prisma.permission.deleteMany();

    // Create Permissions & Roles
    console.log('Creating permissions and roles...');
    const permissions = [
        'DASHBOARD_VIEW',
        'INCIDENT_VIEW', 'INCIDENT_CREATE', 'INCIDENT_EDIT', 'INCIDENT_DELETE',
        'PROCEDURE_VIEW', 'PROCEDURE_CREATE', 'PROCEDURE_EDIT', 'PROCEDURE_DELETE',
        'USER_VIEW', 'USER_MANAGE',
        'ROLE_MANAGE',
        'AUDIT_VIEW',
        'SYSTEM_MANAGE',
        'TEAM_MANAGE', 'TEAM_DELETE',
        'SLA_MANAGE',
        'SEARCH_VIEW'
    ];

    const permsMap = new Map();
    for (const code of permissions) {
        const p = await prisma.permission.create({
            data: { code, description: `Permission to ${code.toLowerCase().replace('_', ' ')}` }
        });
        permsMap.set(code, p.id);
    }

    const adminRole = await prisma.role.create({
        data: {
            name: 'ADMIN',
            description: 'Full system access',
            permissions: { connect: permissions.map(code => ({ id: permsMap.get(code) })) }
        }
    });

    const expertRole = await prisma.role.create({
        data: {
            name: 'EXPERT',
            description: 'Can manage procedures and resolve incidents',
            permissions: {
                connect: ['DASHBOARD_VIEW', 'INCIDENT_VIEW', 'INCIDENT_EDIT', 'PROCEDURE_VIEW', 'PROCEDURE_CREATE', 'PROCEDURE_EDIT']
                    .map(code => ({ id: permsMap.get(code) }))
            }
        }
    });

    const operatorRole = await prisma.role.create({
        data: {
            name: 'OPERATOR',
            description: 'Can create incidents and view status',
            permissions: {
                connect: ['DASHBOARD_VIEW', 'INCIDENT_VIEW', 'INCIDENT_CREATE', 'INCIDENT_EDIT', 'PROCEDURE_VIEW']
                    .map(code => ({ id: permsMap.get(code) }))
            }
        }
    });

    const viewerRole = await prisma.role.create({
        data: {
            name: 'VIEWER',
            description: 'Read-only access to assigned team incidents',
            permissions: {
                connect: ['DASHBOARD_VIEW', 'INCIDENT_VIEW', 'PROCEDURE_VIEW']
                    .map(code => ({ id: permsMap.get(code) }))
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

    console.log('✅ Large scale seed completed successfully!');
    console.log('\nPlease login with: admin@prodkb.com / password123');
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
