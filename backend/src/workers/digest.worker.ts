
/**
 * Daily Digest Worker — SEPARATE PROCESS
 * Runs every day at 08:00 UTC via BullMQ repeatable cron.
 *
 * For each team with `sendEmail=true`, it:
 *   1. Queries incidents created or updated in the last 24h
 *   2. Renders a structured HTML digest email
 *   3. Sends it to the team's emailDistribution address
 *
 * @module workers/digest.worker
 */

import 'dotenv/config';
import { Worker, Queue, Job } from 'bullmq';
import { prisma } from '../common/utils/prisma';
import { logger } from '../common/utils/logger';
import { emailService } from '../common/services/emailService';
import { parseRedisUrl } from '../common/utils/redis-url';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const QUEUE_NAME = 'daily-digest';
const connection = parseRedisUrl(REDIS_URL);

// ── Register the repeatable job ──
const digestQueue = new Queue(QUEUE_NAME, { connection: parseRedisUrl(REDIS_URL) });

(async () => {
    await digestQueue.upsertJobScheduler(
        'daily-digest-08h',
        { pattern: '0 8 * * *' },  // Every day at 08:00 UTC
        { name: 'daily-digest' },
    );
    logger.info('Daily Digest scheduled job registered (08:00 UTC)');
})();

// ── Worker logic ──
const worker = new Worker(
    QUEUE_NAME,
    async (_job: Job) => {
        logger.info('Daily Digest job started');

        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const appUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

        // Get all teams with email enabled
        const teams = await prisma.team.findMany({
            where: { isActive: true, sendEmail: true },
        });

        for (const team of teams) {
            try {
                // Incidents created in the last 24h for this team
                const newIncidents = await prisma.incident.findMany({
                    where: {
                        assignedTeamId: team.id,
                        createdAt: { gte: yesterday },
                    },
                    include: { system: true, job: true },
                    orderBy: { createdAt: 'desc' },
                });

                // Still-open incidents for this team
                const openIncidents = await prisma.incident.findMany({
                    where: {
                        assignedTeamId: team.id,
                        status: { notIn: ['resolved', 'closed'] },
                    },
                    include: { system: true, job: true },
                    orderBy: { severity: 'asc' },
                });

                // SLA breaches in last 24h
                const breachedCount = await prisma.incident.count({
                    where: {
                        assignedTeamId: team.id,
                        slaBreached: true,
                        createdAt: { gte: yesterday },
                    },
                });

                // Skip if nothing to report
                if (newIncidents.length === 0 && openIncidents.length === 0) {
                    logger.debug(`No incidents for team ${team.name}, skipping digest`);
                    continue;
                }

                const subject = `[ProdKB] Digest Quotidien — ${team.name} — ${now.toLocaleDateString('fr-FR')}`;

                const incidentRow = (inc: any) => `
                    <tr>
                        <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;">
                            <a href="${appUrl}/incidents/${inc.id}" style="color:#3b82f6;text-decoration:none;">#${inc.id.substring(0, 8)}</a>
                        </td>
                        <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;">${inc.severity}</td>
                        <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;">${inc.system?.name || '—'}</td>
                        <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;">${inc.title}</td>
                        <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;">${inc.status}</td>
                    </tr>`;

                const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; color: #1e293b; }
    .header { background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { padding: 20px; background: #f8fafc; }
    .stat-box { display: inline-block; background: white; border-radius: 8px; padding: 12px 20px; margin: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); text-align: center; }
    .stat-number { font-size: 28px; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th { background: #f1f5f9; text-align: left; padding: 8px 10px; font-size: 12px; text-transform: uppercase; color: #64748b; }
    .footer { padding: 15px; text-align: center; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin:0;">📋 Digest Quotidien — ${team.name}</h1>
    <p style="margin:5px 0 0;opacity:0.9;">${now.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
  </div>
  <div class="content">
    <div style="margin-bottom:20px;">
      <div class="stat-box">
        <div class="stat-number" style="color:#3b82f6;">${newIncidents.length}</div>
        <div>Nouveaux (24h)</div>
      </div>
      <div class="stat-box">
        <div class="stat-number" style="color:#f59e0b;">${openIncidents.length}</div>
        <div>Ouverts</div>
      </div>
      <div class="stat-box">
        <div class="stat-number" style="color:#ef4444;">${breachedCount}</div>
        <div>SLA Dépassés</div>
      </div>
    </div>

    ${newIncidents.length > 0 ? `
    <h3>🆕 Incidents des dernières 24h</h3>
    <table>
      <thead><tr><th>ID</th><th>Sév.</th><th>Système</th><th>Titre</th><th>Statut</th></tr></thead>
      <tbody>${newIncidents.map(incidentRow).join('')}</tbody>
    </table>` : ''}

    ${openIncidents.length > 0 ? `
    <h3 style="margin-top:24px;">⚠️ Incidents encore ouverts</h3>
    <table>
      <thead><tr><th>ID</th><th>Sév.</th><th>Système</th><th>Titre</th><th>Statut</th></tr></thead>
      <tbody>${openIncidents.map(incidentRow).join('')}</tbody>
    </table>` : ''}

    <p style="margin-top:24px;">
      <a href="${appUrl}/incidents" style="background:#3b82f6;color:white;padding:10px 24px;border-radius:6px;text-decoration:none;display:inline-block;">
        Voir tous les incidents →
      </a>
    </p>
  </div>
  <div class="footer">ProdKB — Gestion des Incidents de Production</div>
</body>
</html>`;

                await emailService.sendRawEmail(team.emailDistribution, subject, html);
                logger.info(`Digest sent to team ${team.name}`, {
                    newCount: newIncidents.length,
                    openCount: openIncidents.length,
                    breachedCount,
                });
            } catch (error) {
                logger.error(`Failed to send digest for team ${team.name}`, {
                    error: error instanceof Error ? error.message : 'Unknown',
                });
            }
        }

        logger.info('Daily Digest job completed');
    },
    {
        connection: parseRedisUrl(REDIS_URL),
        concurrency: 1,
    },
);

worker.on('completed', (job) => {
    logger.debug('Digest job completed', { jobId: job?.id });
});

worker.on('failed', (job, err) => {
    logger.error('Digest job failed', {
        jobId: job?.id,
        error: err.message,
    });
});

// ── Graceful shutdown ──
const shutdown = async (signal: string) => {
    logger.info(`Digest worker received ${signal}. Shutting down...`);
    await worker.close();
    await digestQueue.close();
    await prisma.$disconnect();
    process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

logger.info('Daily Digest Worker started — listening for jobs');
