
/**
 * Astreinte Notification Worker — SEPARATE PROCESS
 * Runs every Sunday at 18:00 UTC via BullMQ repeatable cron.
 *
 * 1. Notifies the person on astreinte for the coming week (starting Monday).
 * 2. Alerts managers about uncovered weeks in the next month.
 *
 * @module workers/astreinte.worker
 */

import 'dotenv/config';
import { Worker, Queue, Job } from 'bullmq';
import { prisma } from '../common/utils/prisma';
import { logger } from '../common/utils/logger';
import { emailService } from '../common/services/email.service';
import { parseRedisUrl } from '../common/utils/redis';
import { startOfISOWeek, addWeeks, getISOWeek, getYear } from 'date-fns';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const QUEUE_NAME = 'astreinte-notifications';
const connection = parseRedisUrl(REDIS_URL);

// ── Register the repeatable job ──
const astreinteQueue = new Queue(QUEUE_NAME, { connection });

(async () => {
  // Run every Sunday at 18:00 UTC
  await astreinteQueue.upsertJobScheduler(
    'astreinte-sunday-alert',
    { pattern: '0 18 * * 0' },
    { name: 'astreinte-alert' },
  );
  logger.info('Astreinte Notification scheduled job registered (Sunday 18:00 UTC)');
})();

// ── Worker logic ──
const worker = new Worker(
  QUEUE_NAME,
  async (_job: Job) => {
    logger.info('Astreinte Notification job started');

    const appUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    // 1. Find astreinte for next week
    const nextMonday = startOfISOWeek(addWeeks(new Date(), 1));
    const nextWeekNumber = getISOWeek(nextMonday);
    const nextYear = getYear(nextMonday);

    const upcomingAstreintes = await prisma.astreinte.findMany({
      where: {
        weekNumber: nextWeekNumber,
        year: nextYear,
      },
      include: {
        user: true,
        team: true,
      },
    });

    for (const astr of upcomingAstreintes) {
      try {
        const subject = `[ProdKB] Rappel : Votre astreinte commence demain (Semaine ${nextWeekNumber})`;
        const html = `
          <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <div style="background: #1e40af; color: white; padding: 20px;">
              <h1 style="margin: 0; font-size: 20px;">📞 Rappel Astreinte</h1>
            </div>
            <div style="padding: 20px; background: #f8fafc;">
              <p>Bonjour <strong>${astr.user.name}</strong>,</p>
              <p>Ceci est un rappel que vous êtes d'astreinte pour l'équipe <strong>${astr.team.name}</strong> pour la semaine prochaine.</p>
              
              <div style="background: white; padding: 15px; border-radius: 6px; border: 1px solid #e2e8f0; margin: 20px 0;">
                <p style="margin: 0 0 10px 0;"><strong>Période :</strong> Semaine ${nextWeekNumber} (${nextYear})</p>
                <p style="margin: 0 0 10px 0;"><strong>Début :</strong> Lundi ${astr.startDate.toLocaleDateString('fr-FR')} 00:00</p>
                <p style="margin: 0;"><strong>Fin :</strong> Dimanche ${astr.endDate.toLocaleDateString('fr-FR')} 23:59</p>
              </div>

              ${astr.notes ? `<p><strong>Notes :</strong> ${astr.notes}</p>` : ''}
              
              <p>En cas d'incident, vous serez le premier point de contact.</p>
              
              <p style="margin-top: 30px;">
                <a href="${appUrl}/equipe" style="background: #3b82f6; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">
                  Voir le planning complet →
                </a>
              </p>
            </div>
            <div style="padding: 15px; text-align: center; font-size: 12px; color: #94a3b8; background: #f1f5f9;">
              ProdKB — CIH Bank
            </div>
          </div>
        `;

        await emailService.sendRawEmail(astr.user.email, subject, html);
        logger.info(`Astreinte reminder sent to ${astr.user.email} (Team: ${astr.team.name})`);
      } catch (err) {
        logger.error(`Failed to send astreinte reminder to ${astr.user.email}`, { error: err });
      }
    }

    // 2. Check for uncovered weeks in the next 4 weeks
    const teams = await prisma.team.findMany({ where: { isActive: true } });
    for (const team of teams) {
      const uncoveredWeeks = [];
      for (let i = 1; i <= 4; i++) {
        const targetDate = startOfISOWeek(addWeeks(new Date(), i));
        const weekNum = getISOWeek(targetDate);
        const yearNum = getYear(targetDate);

        const exists = await prisma.astreinte.findUnique({
          where: {
            teamId_weekNumber_year: {
              teamId: team.id,
              weekNumber: weekNum,
              year: yearNum,
            },
          },
        });

        if (!exists) {
          uncoveredWeeks.push({ week: weekNum, year: yearNum });
        }
      }

      if (uncoveredWeeks.length > 0) {
        // Notify team leads or distribution list
        const subject = `[ProdKB] ⚠️ Alerte : Semaines d'astreinte non couvertes — ${team.name}`;
        const html = `
          <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <div style="background: #ef4444; color: white; padding: 20px;">
              <h1 style="margin: 0; font-size: 20px;">⚠️ Alerte Planning Astreinte</h1>
            </div>
            <div style="padding: 20px; background: #fff;">
              <p>Bonjour,</p>
              <p>Les semaines suivantes n'ont pas encore d'astreinte assignée pour l'équipe <strong>${team.name}</strong> :</p>
              
              <ul>
                ${uncoveredWeeks.map(w => `<li><strong>Semaine ${w.week}</strong> (${w.year})</li>`).join('')}
              </ul>
              
              <p>Veuillez compléter le planning dès que possible pour assurer la continuité de service.</p>
              
              <p style="margin-top: 30px;">
                <a href="${appUrl}/equipe" style="background: #1e293b; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">
                  Gérer le planning →
                </a>
              </p>
            </div>
          </div>
        `;

        await emailService.sendRawEmail(team.emailDistribution, subject, html);
        logger.info(`Uncovered weeks alert sent for team ${team.name}`, { count: uncoveredWeeks.length });
      }
    }

    logger.info('Astreinte Notification job completed');
  },
  {
    connection,
    concurrency: 1,
  },
);

worker.on('completed', (job) => {
  logger.debug('Astreinte notification job completed', { jobId: job?.id });
});

worker.on('failed', (job, err) => {
  logger.error('Astreinte notification job failed', {
    jobId: job?.id,
    error: err.message,
  });
});

// ── Graceful shutdown ──
const shutdown = async (signal: string) => {
  logger.info(`Astreinte worker received ${signal}. Shutting down...`);
  await worker.close();
  await astreinteQueue.close();
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

logger.info('Astreinte Notification Worker started — listening for jobs');
