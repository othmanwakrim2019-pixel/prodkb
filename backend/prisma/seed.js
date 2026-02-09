const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // Clean existing data
    console.log('Cleaning existing data...');
    // Delete in order of dependencies (child first)
    await prisma.incidentLog.deleteMany();
    // await prisma.file.deleteMany(); // Model does not exist
    await prisma.incident.deleteMany();
    await prisma.procedure.deleteMany();
    await prisma.teamMember.deleteMany();
    await prisma.job.deleteMany();
    await prisma.system.deleteMany();
    await prisma.sLA.deleteMany();
    await prisma.team.deleteMany();
    await prisma.user.deleteMany();

    // Create Users
    console.log('Creating users...');
    const hashedPassword = await bcrypt.hash('password123', 10);

    const admin = await prisma.user.create({
        data: {
            name: 'Admin User',
            email: 'admin@prodkb.com',
            password: hashedPassword,
            role: 'ADMIN',
            isActive: true
        }
    });

    const expert1 = await prisma.user.create({
        data: {
            name: 'Sarah Expert',
            email: 'sarah.expert@prodkb.com',
            password: hashedPassword,
            role: 'EXPERT',
            isActive: true
        }
    });

    const expert2 = await prisma.user.create({
        data: {
            name: 'Mike Expert',
            email: 'mike.expert@prodkb.com',
            password: hashedPassword,
            role: 'EXPERT',
            isActive: true
        }
    });

    const operator1 = await prisma.user.create({
        data: {
            name: 'John Operator',
            email: 'john.operator@prodkb.com',
            password: hashedPassword,
            role: 'OPERATOR',
            isActive: true
        }
    });

    const operator2 = await prisma.user.create({
        data: {
            name: 'Lisa Operator',
            email: 'lisa.operator@prodkb.com',
            password: hashedPassword,
            role: 'OPERATOR',
            isActive: true
        }
    });

    const inactiveUser = await prisma.user.create({
        data: {
            name: 'Inactive User',
            email: 'inactive@prodkb.com',
            password: hashedPassword,
            role: 'OPERATOR',
            isActive: false
        }
    });

    // Create Teams
    console.log('Creating teams...');
    const devOpsTeam = await prisma.team.create({
        data: {
            name: 'DevOps Team',
            description: 'Infrastructure and deployment team',
            emailDistribution: 'devops@prodkb.com'
        }
    });

    const backendTeam = await prisma.team.create({
        data: {
            name: 'Backend Team',
            description: 'Backend services and APIs',
            emailDistribution: 'backend@prodkb.com, backend-lead@prodkb.com'
        }
    });

    const supportTeam = await prisma.team.create({
        data: {
            name: 'Support Team',
            description: '24/7 production support',
            emailDistribution: 'support@prodkb.com'
        }
    });

    // Assign team members
    console.log('Assigning team members...');
    await prisma.teamMember.createMany({
        data: [
            { teamId: devOpsTeam.id, userId: expert1.id, role: 'LEAD' },
            { teamId: devOpsTeam.id, userId: operator1.id, role: 'MEMBER' },
            { teamId: backendTeam.id, userId: expert2.id, role: 'LEAD' },
            { teamId: backendTeam.id, userId: operator2.id, role: 'MEMBER' },
            { teamId: supportTeam.id, userId: operator1.id, role: 'MEMBER' },
            { teamId: supportTeam.id, userId: operator2.id, role: 'MEMBER' },
        ]
    });

    // Create Systems
    console.log('Creating systems...');
    const coreSystem = await prisma.system.create({
        data: {
            name: 'Core Banking System',
            description: 'Main banking platform handling all transactions'
        }
    });

    const paymentSystem = await prisma.system.create({
        data: {
            name: 'Payment Gateway',
            description: 'External payment processing system'
        }
    });

    const reportingSystem = await prisma.system.create({
        data: {
            name: 'Reporting Engine',
            description: 'Business intelligence and reporting'
        }
    });

    // Create SLAs
    console.log('Creating SLAs...');
    const criticalSLA = await prisma.sLA.create({
        data: {
            name: 'Critical Severity SLA',
            severity: 'Critical',
            acknowledgeTimeMinutes: 15,
            resolveTimeMinutes: 60,
            description: 'For production-breaking incidents'
        }
    });

    const highSLA = await prisma.sLA.create({
        data: {
            name: 'High Severity SLA',
            severity: 'High',
            acknowledgeTimeMinutes: 30,
            resolveTimeMinutes: 240,
            description: 'For significant impact incidents'
        }
    });

    const mediumSLA = await prisma.sLA.create({
        data: {
            name: 'Medium Severity SLA',
            severity: 'Medium',
            acknowledgeTimeMinutes: 60,
            resolveTimeMinutes: 480,
            description: 'For moderate impact incidents'
        }
    });

    // Create Jobs
    console.log('Creating jobs...');
    const dailySettlement = await prisma.job.create({
        data: {
            name: 'Daily Settlement Process',
            code: 'DAILY_SETTLE_001',
            systemId: coreSystem.id,
            teamId: backendTeam.id
        }
    });

    const batchProcessing = await prisma.job.create({
        data: {
            name: 'Batch Processing',
            code: 'BATCH_PROC_002',
            systemId: coreSystem.id,
            teamId: devOpsTeam.id
        }
    });

    const paymentReconciliation = await prisma.job.create({
        data: {
            name: 'Payment Reconciliation',
            code: 'PAY_RECON_003',
            systemId: paymentSystem.id,
            teamId: backendTeam.id
        }
    });

    const monthlyReports = await prisma.job.create({
        data: {
            name: 'Monthly Reports Generation',
            code: 'RPT_MONTHLY_004',
            systemId: reportingSystem.id,
            teamId: null
        }
    });

    // Create Procedures
    console.log('Creating procedures...');
    const settlementProcedure = await prisma.procedure.create({
        data: {
            title: 'Settlement Failure Recovery',
            content: `# Settlement Failure Recovery Procedure

## Steps to Resolve:
1. Check job execution logs
2. Verify database connection
3. Check for lock files
4. Re-run settlement job

## Issues:
- Timeout: Increase connection timeout
- Lock file: Remove and restart`,
            systemId: coreSystem.id,
            jobId: dailySettlement.id,
            createdById: expert1.id
        }
    });

    const paymentProcedure = await prisma.procedure.create({
        data: {
            title: 'Payment Gateway Troubleshooting',
            content: `# Payment Gateway Issues

## Quick Checks:
1. Verify API credentials
2. Check network connectivity

## Escalation:
Contact provider if > 30 min`,
            systemId: paymentSystem.id,
            jobId: paymentReconciliation.id,
            createdById: expert2.id
        }
    });

    // Create Incidents
    console.log('Creating incidents...');
    const incident1 = await prisma.incident.create({
        data: {
            title: 'Daily Settlement Job Failed',
            description: 'Settlement job failed to complete. Multiple transaction batches are pending.',
            severity: 'Critical',
            status: 'Resolved',
            environment: 'Production',
            impact: 'All customer transactions on hold',
            detectionSource: 'Automated monitoring alert',
            systemId: coreSystem.id,
            jobId: dailySettlement.id,
            slaId: criticalSLA.id,
            assignedTeamId: backendTeam.id,
            createdById: operator1.id,
            resolvedById: expert1.id,
            resolvedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
            linkedProcedureId: settlementProcedure.id
        }
    });

    const incident2 = await prisma.incident.create({
        data: {
            title: 'Payment Gateway Timeout Issues',
            description: 'Multiple payment transactions timing out. Customer complaints increasing.',
            severity: 'High',
            status: 'In Progress',
            environment: 'Production',
            impact: '~20% of payment transactions failing',
            detectionSource: 'Customer support tickets',
            systemId: paymentSystem.id,
            jobId: paymentReconciliation.id,
            slaId: highSLA.id,
            assignedTeamId: devOpsTeam.id,
            createdById: operator2.id,
            linkedProcedureId: paymentProcedure.id
        }
    });

    const incident3 = await prisma.incident.create({
        data: {
            title: 'Report Generation Slow Performance',
            description: 'Monthly report generation taking 5x longer than usual',
            severity: 'Medium',
            status: 'Open',
            environment: 'Production',
            impact: 'Reports delayed, no customer impact',
            detectionSource: 'Performance monitoring',
            systemId: reportingSystem.id,
            jobId: monthlyReports.id,
            slaId: mediumSLA.id,
            assignedTeamId: null,
            createdById: operator1.id
        }
    });

    const incident4 = await prisma.incident.create({
        data: {
            title: 'Database Connection Pool Exhausted',
            description: 'Core banking database connection pool at 100% capacity',
            severity: 'Critical',
            status: 'Closed',
            environment: 'Production',
            impact: 'Intermittent service outages',
            detectionSource: 'Database monitoring',
            systemId: coreSystem.id,
            slaId: criticalSLA.id,
            assignedTeamId: devOpsTeam.id,
            createdById: operator2.id,
            resolvedById: expert1.id,
            resolvedAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
        }
    });

    // Add logs to incidents (as created via logs relation or IncidentLog model)
    console.log('Adding incident logs...');
    // We use IncidentLog model
    await prisma.incidentLog.createMany({
        data: [
            {
                incidentId: incident1.id,
                logType: 'investigation',
                rawLog: 'Initial investigation started. Checking error logs.',
                userId: operator1.id
            },
            {
                incidentId: incident1.id,
                logType: 'analysis',
                rawLog: 'Found lock file preventing job execution. Database connection timeout detected.',
                userId: expert1.id
            },
            {
                incidentId: incident1.id,
                logType: 'resolution',
                rawLog: 'Removed lock file, increased DB timeout to 60s, restarted settlement job.',
                userId: expert1.id
            },
            {
                incidentId: incident2.id,
                logType: 'investigation',
                rawLog: 'Checking payment gateway API response times. Average latency: 8s.',
                userId: operator2.id
            },
            {
                incidentId: incident3.id,
                logType: 'investigation',
                rawLog: 'Report generation job running since 3 hours.',
                userId: operator1.id
            },
            {
                incidentId: incident4.id,
                logType: 'investigation',
                rawLog: 'Connection pool at max capacity (200 connections).',
                userId: operator2.id
            }
        ]
    });

    // Add files to incidents (as logs with file metadata)
    console.log('Adding incident files...');
    await prisma.incidentLog.createMany({
        data: [
            {
                incidentId: incident1.id,
                logType: 'file',
                fileName: 'settlement_error_log.txt',
                filePath: '/logs/settlement_error_20260206.txt',
                fileSize: 45678,
                mimeType: 'text/plain',
                userId: expert1.id,
                metadata: '{}'
            },
            {
                incidentId: incident1.id,
                logType: 'screenshot',
                fileName: 'database_connection_screenshot.png',
                filePath: '/screenshots/db_monitor_20260206.png',
                fileSize: 123456,
                mimeType: 'image/png',
                userId: expert1.id,
                metadata: '{}'
            },
            {
                incidentId: incident2.id,
                logType: 'file',
                fileName: 'payment_gateway_metrics.pdf',
                filePath: '/reports/pg_metrics_20260206.pdf',
                fileSize: 234567,
                mimeType: 'application/pdf',
                userId: expert2.id,
                metadata: '{}'
            },
            {
                incidentId: incident4.id,
                logType: 'file',
                fileName: 'connection_pool_analysis.xlsx',
                filePath: '/analysis/pool_analysis_20260205.xlsx',
                fileSize: 156789,
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                userId: expert1.id,
                metadata: '{}'
            }
        ]
    });

    console.log('✅ Seed completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Users: 6 (1 Admin, 2 Experts, 2 Operators, 1 Inactive)`);
    console.log(`- Teams: 3`);
    console.log(`- Systems: 3`);
    console.log(`- Jobs: 4`);
    console.log(`- SLAs: 3`);
    console.log(`- Procedures: 2`);
    console.log(`- Incidents: 4`);
    console.log('\n🔑 Login credentials:');
    console.log('Email: admin@prodkb.com | Password: password123');
    console.log('Email: sarah.expert@prodkb.com | Password: password123');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
