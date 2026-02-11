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
                connect: ['DASHBOARD_VIEW', 'INCIDENT_VIEW', 'INCIDENT_CREATE', 'PROCEDURE_VIEW']
                    .map(code => ({ id: permsMap.get(code) }))
            }
        }
    });
    const roles = [adminRole, expertRole, operatorRole];

    // Create Users (Admin + Random Users)
    console.log('Creating users...');
    const hashedPassword = await bcrypt.hash('password123', 10);
    const users = [];

    // Core Users
    const admin = await prisma.user.create({
        data: { name: 'Admin User', email: 'admin@prodkb.com', password: hashedPassword, roleId: adminRole.id, isActive: true }
    });
    users.push(admin);

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
    const emailTemplates = [
        {
            name: 'incident_created',
            subject: 'New Incident: {{title}} ({{severity}})',
            body: '<h2>New Incident Created</h2><p>A new incident has been reported.</p><ul><li><strong>ID:</strong> {{incidentId}}</li><li><strong>Title:</strong> {{title}}</li><li><strong>Severity:</strong> {{severity}}</li><li><strong>Status:</strong> {{status}}</li></ul><p>Please investigate immediately.</p>',
            variables: 'incidentId, title, severity, status, createdAt'
        },
        {
            name: 'incident_assigned',
            subject: 'Incident Assigned to Your Team: {{title}}',
            body: '<h2>Incident Assigned</h2><p>The following incident has been assigned to your team <strong>{{assignedTeam}}</strong>.</p><ul><li><strong>Title:</strong> {{title}}</li><li><strong>Severity:</strong> {{severity}}</li></ul>',
            variables: 'title, severity, assignedTeam, incidentId'
        },
        {
            name: 'incident_resolved',
            subject: 'Incident Resolved: {{title}}',
            body: '<h2>Incident Resolved</h2><p>The incident <strong>{{title}}</strong> has been resolved by {{resolvedBy}}.</p><p><strong>Resolution Time:</strong> {{timeToResolve}} minutes</p>',
            variables: 'title, resolvedBy, timeToResolve, incidentId'
        },
        {
            name: 'incident_updated',
            subject: 'Incident Updated: {{title}}',
            body: '<h2>Incident Update</h2><p>The incident <strong>{{title}}</strong> has been updated.</p><p><strong>New Status:</strong> {{status}}</p>',
            variables: 'title, status, incidentId'
        },
        {
            name: 'user_welcome',
            subject: 'Welcome to ProdKB',
            body: '<h2>Welcome, {{name}}!</h2><p>Your account has been created successfully. You can now login to the ProdKB portal.</p>',
            variables: 'name, email'
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
