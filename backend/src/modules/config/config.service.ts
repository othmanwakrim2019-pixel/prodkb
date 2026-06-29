
import { prisma } from '../../common/utils/prisma';
import { emailService } from '../../common/services/email.service';
import { addWeeks, getISOWeek, getISOWeekYear, startOfISOWeek } from 'date-fns';

interface SmtpConfigInput {
    enabled?: boolean;
    host?: string;
    port?: number;
    user?: string;
    pass?: string;
    from?: string;
    secure?: boolean;
    tlsMode?: 'starttls' | 'ssl' | 'none';
    rejectUnauthorized?: boolean;
    replyTo?: string;
    connectionTimeout?: number;
}

export class ConfigService {
    async getSmtpConfig() {
        const config = await prisma.systemConfig.findUnique({
            where: { key: 'SMTP_CONFIG' },
        });

        if (!config) {
            return {
                enabled: false,
                host: '',
                port: 587,
                user: '',
                pass: '',
                passwordConfigured: false,
                from: '',
                secure: false,
                tlsMode: 'starttls',
                rejectUnauthorized: true,
                replyTo: '',
                connectionTimeout: 10000,
            };
        }

        const parsed = JSON.parse(config.value);
        return {
            enabled: parsed.enabled ?? Boolean(parsed.host && parsed.user && parsed.pass),
            host: parsed.host ?? '',
            port: parsed.port ?? 587,
            user: parsed.user ?? '',
            pass: '',
            passwordConfigured: Boolean(parsed.pass),
            from: parsed.from ?? '',
            secure: parsed.secure ?? parsed.tlsMode === 'ssl',
            tlsMode: parsed.tlsMode ?? (parsed.secure ? 'ssl' : 'starttls'),
            rejectUnauthorized: parsed.rejectUnauthorized ?? true,
            replyTo: parsed.replyTo ?? '',
            connectionTimeout: parsed.connectionTimeout ?? 10000,
        };
    }

    async updateSmtpConfig(data: SmtpConfigInput) {
        const existing = await prisma.systemConfig.findUnique({
            where: { key: 'SMTP_CONFIG' },
        });
        const current = existing ? JSON.parse(existing.value) : {};
        const next = {
            ...current,
            ...data,
            pass: data.pass?.trim() ? data.pass : current.pass,
            replyTo: data.replyTo?.trim() || '',
            enabled: data.enabled ?? current.enabled ?? false,
            secure: data.tlsMode ? data.tlsMode === 'ssl' : data.secure ?? current.secure ?? false,
        };

        await prisma.systemConfig.upsert({
            where: { key: 'SMTP_CONFIG' },
            update: { value: JSON.stringify(next) },
            create: { key: 'SMTP_CONFIG', value: JSON.stringify(next) },
        });

        // Trigger reload in email service
        emailService.reloadConfig();
    }

    async sendTestEmail(email: string) {
        return emailService.sendTestEmail(email);
    }

    async updateConfig(key: string, value: string) {
        await prisma.systemConfig.upsert({
            where: { key },
            update: { value },
            create: { key, value },
        });
        return { key, value };
    }

    async getConfigs(keys: string[]) {
        const configs = await prisma.systemConfig.findMany({
            where: {
                key: { in: keys }
            }
        });

        return configs.reduce((acc, config) => {
            acc[config.key] = config.value;
            return acc;
        }, {} as Record<string, string>);
    }

    async getOperationsReadiness() {
        const now = new Date();
        const nextWeeks = Array.from({ length: 4 }, (_, index) => {
            const weekStart = startOfISOWeek(addWeeks(now, index));
            return {
                weekNumber: getISOWeek(weekStart),
                year: getISOWeekYear(weekStart),
            };
        });

        const [
            smtpConfig,
            emailTemplates,
            activeTeams,
            usersCount,
            systemsCount,
            jobsCount,
            jobsWithoutTeam,
            systemsWithoutJobs,
            slas,
            openCriticalIncidents,
            openHighIncidents,
            blockedTasks,
            activeWebhooks,
            failedWebhookDeliveries,
            maintenanceUpcoming,
            currentAstreintes,
            astreinteCoverage,
            dailyPlansToday,
            demoUsers,
        ] = await Promise.all([
            this.getSmtpConfig(),
            prisma.emailTemplate.findMany({ select: { name: true, enabled: true } }),
            prisma.team.findMany({
                where: { isActive: true },
                select: {
                    id: true,
                    name: true,
                    emailDistribution: true,
                    sendEmail: true,
                    members: { select: { id: true }, take: 1 },
                },
            }),
            prisma.user.count({ where: { isActive: true } }),
            prisma.system.count(),
            prisma.job.count(),
            prisma.job.count({ where: { teamId: null } }),
            prisma.system.count({ where: { jobs: { none: {} } } }),
            prisma.sLA.findMany({ select: { severity: true, isActive: true } }),
            prisma.incident.count({ where: { severity: 'Critical', status: { notIn: ['Resolved', 'Closed'] } } }),
            prisma.incident.count({ where: { severity: 'High', status: { notIn: ['Resolved', 'Closed'] } } }),
            prisma.operationalTask.count({ where: { status: 'BLOCKED' } }),
            prisma.webhook.count({ where: { isActive: true } }),
            prisma.webhookDelivery.count({ where: { success: false, createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } } }),
            prisma.maintenanceWindow.count({ where: { status: { in: ['SCHEDULED', 'ACTIVE'] } } }),
            prisma.astreinte.count({ where: { startDate: { lte: now }, endDate: { gte: now } } }),
            prisma.astreinte.findMany({
                where: {
                    OR: nextWeeks.map((week) => ({
                        weekNumber: week.weekNumber,
                        year: week.year,
                    })),
                },
                select: { teamId: true, weekNumber: true, year: true },
            }),
            prisma.dailyPlan.count({
                where: {
                    date: {
                        gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
                        lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
                    },
                },
            }),
            prisma.user.count({ where: { email: { in: ['admin@prodkb.com', 'manager@prodkb.com', 'operator@prodkb.com'] } } }),
        ]);

        const activeTeamCount = activeTeams.length;
        const teamsWithoutEmail = activeTeams.filter(team => !team.emailDistribution || !team.sendEmail).length;
        const teamsWithoutMembers = activeTeams.filter(team => team.members.length === 0).length;
        const enabledTemplates = emailTemplates.filter(template => template.enabled).length;
        const disabledTemplates = emailTemplates.length - enabledTemplates;
        const activeSlaSeverities = new Set(slas.filter(sla => sla.isActive).map(sla => sla.severity));
        const missingSlaSeverities = ['Critical', 'High', 'Medium', 'Low'].filter(severity => !activeSlaSeverities.has(severity));

        const coverageKeys = new Set(
            astreinteCoverage.map(item => `${item.teamId}:${item.weekNumber}:${item.year}`)
        );
        const uncoveredAstreinteSlots = activeTeams.flatMap(team =>
            nextWeeks
                .filter(week => !coverageKeys.has(`${team.id}:${week.weekNumber}:${week.year}`))
                .map(week => ({ teamId: team.id, teamName: team.name, ...week }))
        );

        const checks = [
            {
                id: 'smtp',
                label: 'SMTP configured',
                status: smtpConfig.enabled && smtpConfig.host && smtpConfig.user && smtpConfig.passwordConfigured ? 'ok' : 'warning',
                detail: smtpConfig.enabled ? 'Email sending is enabled.' : 'Email sending is disabled or incomplete.',
                action: 'Review SMTP settings',
            },
            {
                id: 'email-templates',
                label: 'Email templates ready',
                status: emailTemplates.length >= 3 && enabledTemplates > 0 ? 'ok' : 'warning',
                detail: `${enabledTemplates}/${emailTemplates.length} templates enabled.`,
                action: disabledTemplates > 0 ? 'Enable or review disabled templates' : 'Seed or create templates',
            },
            {
                id: 'teams',
                label: 'Teams ready',
                status: activeTeamCount > 0 && teamsWithoutEmail === 0 && teamsWithoutMembers === 0 ? 'ok' : 'warning',
                detail: `${activeTeamCount} active teams, ${teamsWithoutEmail} missing email, ${teamsWithoutMembers} without members.`,
                action: 'Review teams and membership',
            },
            {
                id: 'systems-jobs',
                label: 'Systems and jobs mapped',
                status: systemsCount > 0 && jobsCount > 0 && jobsWithoutTeam === 0 ? 'ok' : 'warning',
                detail: `${systemsCount} systems, ${jobsCount} jobs, ${jobsWithoutTeam} jobs without owner team.`,
                action: 'Assign owners to jobs',
            },
            {
                id: 'sla',
                label: 'SLA coverage',
                status: missingSlaSeverities.length === 0 ? 'ok' : 'warning',
                detail: missingSlaSeverities.length ? `Missing active SLA for: ${missingSlaSeverities.join(', ')}` : 'Critical, High, Medium, and Low are covered.',
                action: 'Review SLA policies',
            },
            {
                id: 'astreinte',
                label: 'Astreinte coverage',
                status: uncoveredAstreinteSlots.length === 0 && currentAstreintes > 0 ? 'ok' : 'warning',
                detail: `${currentAstreintes} current assignments, ${uncoveredAstreinteSlots.length} uncovered team/week slots in the next 4 weeks.`,
                action: 'Complete astreinte planning',
            },
            {
                id: 'operations',
                label: 'Today operations',
                status: blockedTasks === 0 ? 'ok' : 'critical',
                detail: `${dailyPlansToday} daily plans today, ${blockedTasks} blocked tasks.`,
                action: 'Review Mes Taches and Equipe board',
            },
            {
                id: 'webhooks',
                label: 'Webhook delivery',
                status: failedWebhookDeliveries === 0 ? 'ok' : 'warning',
                detail: `${activeWebhooks} active webhooks, ${failedWebhookDeliveries} failed deliveries in 24h.`,
                action: 'Review webhook deliveries',
            },
        ];

        const critical = checks.filter(check => check.status === 'critical').length;
        const warnings = checks.filter(check => check.status === 'warning').length;

        return {
            generatedAt: now,
            score: Math.max(0, Math.round(((checks.length - warnings - critical * 1.5) / checks.length) * 100)),
            status: critical > 0 ? 'critical' : warnings > 0 ? 'warning' : 'ok',
            checks,
            metrics: {
                users: usersCount,
                activeTeams: activeTeamCount,
                systems: systemsCount,
                jobs: jobsCount,
                jobsWithoutTeam,
                systemsWithoutJobs,
                activeSlas: slas.filter(sla => sla.isActive).length,
                openCriticalIncidents,
                openHighIncidents,
                blockedTasks,
                activeWebhooks,
                failedWebhookDeliveries,
                maintenanceUpcoming,
                currentAstreintes,
                uncoveredAstreinteSlots: uncoveredAstreinteSlots.length,
                dailyPlansToday,
                demoDataPresent: demoUsers >= 3,
            },
            gaps: {
                teamsWithoutEmail: activeTeams
                    .filter(team => !team.emailDistribution || !team.sendEmail)
                    .map(team => team.name),
                teamsWithoutMembers: activeTeams
                    .filter(team => team.members.length === 0)
                    .map(team => team.name),
                missingSlaSeverities,
                uncoveredAstreinteSlots: uncoveredAstreinteSlots.slice(0, 12),
            },
            workers: [
                { name: 'SLA Worker', expected: true, signal: 'Configured in Docker Compose' },
                { name: 'Webhook Worker', expected: true, signal: 'Configured in Docker Compose' },
                { name: 'Cleanup Worker', expected: true, signal: 'Configured in Docker Compose' },
                { name: 'Astreinte Worker', expected: true, signal: 'Configured in Docker Compose' },
                { name: 'Daily Digest Worker', expected: false, signal: 'Script exists but Docker Compose service is not configured' },
            ],
        };
    }
}

export const configService = new ConfigService();
