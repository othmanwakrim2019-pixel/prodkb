import nodemailer from 'nodemailer';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

interface IncidentEmailData {
  incident: any; // Using any to avoid Prisma type conflicts
  logs?: any[];
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private config: EmailConfig | null = null;
  private enabled: boolean = false;

  constructor() {
    this.initialize();
  }



  private async initialize() {
    try {
      // Priority: DB Config > Env Config
      let dbConfig = null;
      try {
        const configRecord = await prisma.systemConfig.findUnique({
          where: { key: 'SMTP_CONFIG' },
        });
        if (configRecord) {
          dbConfig = JSON.parse(configRecord.value);
        }
      } catch (e) {
        logger.warn('Could not fetch SMTP config from DB (may not be initialized yet)');
      }

      const host = dbConfig?.host || process.env.SMTP_HOST;
      const port = dbConfig?.port || process.env.SMTP_PORT;
      const user = dbConfig?.user || process.env.SMTP_USER;
      const pass = dbConfig?.pass || process.env.SMTP_PASS;
      const from = dbConfig?.from || process.env.SMTP_FROM || 'ProdKB <prodkb@company.com>';

      if (!host || !port || !user || !pass) {
        logger.warn('SMTP configuration not complete (DB or ENV). Email notifications disabled.');
        this.enabled = false;
        return;
      }

      this.config = {
        host,
        port: Number(port),
        secure: dbConfig?.secure !== undefined ? dbConfig.secure : (process.env.SMTP_SECURE === 'true'),
        auth: { user, pass },
        from,
      };

      this.transporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        auth: this.config.auth,
      });

      this.enabled = true;
      logger.info('Email service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize email service', { error: error instanceof Error ? error.message : 'Unknown error' });
      this.enabled = false;
    }
  }

  /** Re-read SMTP config from DB and recreate the transporter */
  async reloadConfig(): Promise<void> {
    logger.info('Reloading email service configuration…');
    await this.initialize();
  }

  /** Send a lightweight test email to verify SMTP settings */
  async sendTestEmail(to: string): Promise<boolean> {
    if (!this.enabled || !this.transporter || !this.config) {
      throw new Error('Email service is not configured. Save a valid SMTP configuration first.');
    }

    await this.transporter.sendMail({
      from: this.config.from,
      to,
      subject: 'ProdKB — SMTP Test',
      text: 'If you see this message, your SMTP configuration is working correctly.',
      html: '<p>If you see this message, your SMTP configuration is <strong>working correctly</strong>.</p>',
    });

    return true;
  }

  async sendIncidentCreated(data: IncidentEmailData): Promise<boolean> {
    if (!this.enabled || !this.transporter || !this.config) {
      logger.warn('Email service not enabled, skipping incident notification');
      return false;
    }

    const { incident } = data;

    // Check if team has opted out of emails
    if (incident.assignedTeam && incident.assignedTeam.sendEmail === false) {
      logger.warn('Email skipped for team (sendEmail=false)', { teamName: incident.assignedTeam.name });
      return false;
    }

    // Get email recipients - team distribution list, fallback to team member emails
    let recipients = incident.assignedTeam?.emailDistribution || '';
    if (!recipients && incident.assignedTeamId) {
      // Fallback: resolve from team members
      try {
        const members = await prisma.teamMember.findMany({
          where: { teamId: incident.assignedTeamId },
          include: { user: { select: { email: true } } },
        });
        recipients = members.map(m => m.user.email).filter(Boolean).join(',');
      } catch (e) {
        logger.warn('Failed to resolve team member emails', { teamId: incident.assignedTeamId });
      }
    }
    if (!recipients) {
      logger.warn('No email recipients found for incident (no distribution list and no team members)', { incidentId: incident.id, teamId: incident.assignedTeamId });
      return false;
    }

    const template = await this.getTemplate('incident_created');

    // Check if template is disabled
    if (template && template.enabled === false) {
      logger.info('Email skipped: template incident_created is disabled');
      return false;
    }

    const subject = this.processTemplate(template?.subject || `[${incident.severity}] Incident #${incident.id.substring(0, 8)} - ${incident.job?.code || 'N/A'} - ${incident.title}`, data);
    const htmlContent = template ? this.processTemplate(template.body, data) : this.generateIncidentCreatedEmail(data);
    const textContent = template ? this.stripHtml(htmlContent) : this.generateIncidentCreatedEmailText(data);

    // Add CCs if present in template
    const cc = template?.cc ? template.cc.split(',').map((e: string) => e.trim()).filter((e: string) => e) : undefined;

    try {
      await this.transporter.sendMail({
        from: this.config.from,
        to: recipients,
        cc,
        subject,
        text: textContent,
        html: htmlContent,
      });

      logger.info('Email sent successfully', { incidentId: incident.id, recipients });
      return true;
    } catch (error) {
      logger.error('Failed to send email', { error: error instanceof Error ? error.message : 'Unknown error' });
      return false;
    }
  }

  async sendIncidentUpdated(data: IncidentEmailData): Promise<boolean> {
    if (!this.enabled || !this.transporter || !this.config) {
      return false;
    }

    const { incident } = data;

    if (incident.assignedTeam && incident.assignedTeam.sendEmail === false) {
      return false;
    }

    let recipients = incident.assignedTeam?.emailDistribution || '';
    if (!recipients && incident.assignedTeamId) {
      try {
        const members = await prisma.teamMember.findMany({
          where: { teamId: incident.assignedTeamId },
          include: { user: { select: { email: true } } },
        });
        recipients = members.map(m => m.user.email).filter(Boolean).join(',');
      } catch (e) {
        logger.warn('Failed to resolve team member emails for update notification');
      }
    }
    if (!recipients) {
      return false;
    }

    const template = await this.getTemplate('incident_updated');

    // Check if template is disabled
    if (template && template.enabled === false) {
      logger.info('Email skipped: template incident_updated is disabled');
      return false;
    }

    const subject = this.processTemplate(template?.subject || `[${incident.severity}] Incident Updated #${incident.id.substring(0, 8)} - ${incident.title}`, data);
    const htmlContent = template ? this.processTemplate(template.body, data) : this.generateIncidentUpdatedEmail(data);
    const textContent = template ? this.stripHtml(htmlContent) : this.generateIncidentUpdatedEmailText(data);

    // Add CCs if present in template
    const cc = template?.cc ? template.cc.split(',').map((e: string) => e.trim()).filter((e: string) => e) : undefined;

    try {
      await this.transporter.sendMail({
        from: this.config.from,
        to: recipients,
        cc,
        subject,
        text: textContent,
        html: htmlContent,
      });

      logger.info('Update email sent', { incidentId: incident.id });
      return true;
    } catch (error) {
      logger.error('Failed to send update email', { error: error instanceof Error ? error.message : 'Unknown error' });
      return false;
    }
  }

  async sendIncidentResolved(data: IncidentEmailData): Promise<boolean> {
    if (!this.enabled || !this.transporter || !this.config) {
      return false;
    }

    const { incident } = data;

    if (incident.assignedTeam && incident.assignedTeam.sendEmail === false) {
      return false;
    }

    let recipients = incident.assignedTeam?.emailDistribution || '';
    if (!recipients && incident.assignedTeamId) {
      try {
        const members = await prisma.teamMember.findMany({
          where: { teamId: incident.assignedTeamId },
          include: { user: { select: { email: true } } },
        });
        recipients = members.map(m => m.user.email).filter(Boolean).join(',');
      } catch (e) {
        logger.warn('Failed to resolve team member emails for resolved notification');
      }
    }
    if (!recipients) {
      return false;
    }

    const template = await this.getTemplate('incident_resolved');

    // Check if template is disabled
    if (template && template.enabled === false) {
      logger.info('Email skipped: template incident_resolved is disabled');
      return false;
    }

    const subject = this.processTemplate(template?.subject || `[RESOLVED] Incident #${incident.id.substring(0, 8)} - ${incident.title}`, data);
    const htmlContent = template ? this.processTemplate(template.body, data) : this.generateIncidentResolvedEmail(data);
    const textContent = template ? this.stripHtml(htmlContent) : this.generateIncidentResolvedEmailText(data);

    // Add CCs if present in template
    const cc = template?.cc ? template.cc.split(',').map((e: string) => e.trim()).filter((e: string) => e) : undefined;

    try {
      await this.transporter.sendMail({
        from: this.config.from,
        to: recipients,
        cc,
        subject,
        text: textContent,
        html: htmlContent,
      });

      logger.info('Resolution email sent', { incidentId: incident.id });
      return true;
    } catch (error) {
      logger.error('Failed to send resolution email', { error: error instanceof Error ? error.message : 'Unknown error' });
      return false;
    }
  }

  private async getTemplate(name: string) {
    try {
      const template = await prisma.emailTemplate.findUnique({ where: { name } });
      if (template) {
        logger.info(`Email template '${name}' loaded from DB (enabled=${template.enabled})`);
      } else {
        logger.warn(`Email template '${name}' not found in DB — using hardcoded fallback`);
      }
      return template;
    } catch (error: any) {
      logger.error('Failed to fetch email template from DB', { templateName: name, error: error?.message });
      return null;
    }
  }

  private processTemplate(templateString: string, data: any): string {
    const flatten = (obj: any, prefix = '') => {
      return Object.keys(obj).reduce((acc: any, k) => {
        const pre = prefix.length ? prefix + '.' : '';
        if (typeof obj[k] === 'object' && obj[k] !== null && !(obj[k] instanceof Date)) {
          Object.assign(acc, flatten(obj[k], pre + k));
        } else {
          acc[pre + k] = obj[k];
        }
        return acc;
      }, {});
    };

    const flatData = flatten(data);
    let result = templateString;

    // Add appUrl manually if not present
    flatData['appUrl'] = process.env.FRONTEND_URL || 'http://localhost:5173';

    for (const key in flatData) {
      const value = flatData[key];
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }
    return result;
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>?/gm, '');
  }

  private generateIncidentCreatedEmail(data: IncidentEmailData): string {
    const { incident } = data;
    const appUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const incRef = `#${incident.id.substring(0, 8).toUpperCase()}`;
    const sevColor = { Critical: '#dc2626', High: '#ea580c', Medium: '#ca8a04', Low: '#16a34a', Info: '#2563eb' }[incident.severity as string] || '#64748b';

    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Nouvel Incident - CIH Bank ProdKB</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background-color: #f1f5f9; font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; }
    a { color: inherit; text-decoration: none; }
  </style>
</head>
<body>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9; padding: 32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; border-radius:8px; overflow:hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">

        <!-- HEADER -->
        <tr>
          <td style="background:#003d82; padding:0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#ff6b35; width:6px; min-height:80px;"> </td>
                <td style="padding: 24px 28px;">
                  <p style="color:#93c5fd; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:2px; margin-bottom:6px;">CIH Bank — ProdKB</p>
                  <h1 style="color:#ffffff; font-size:20px; font-weight:700; line-height:1.3; margin:0;">🚨 Nouvel Incident Déclaré</h1>
                  <p style="color:#bfdbfe; font-size:13px; margin-top:6px;">${incRef} &nbsp;·&nbsp; ${incident.severity} &nbsp;·&nbsp; ${incident.environment}</p>
                </td>
                <td style="padding:24px 28px; text-align:right; vertical-align:top;">
                  <span style="display:inline-block; background:${sevColor}; color:#fff; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:1px; padding:5px 12px; border-radius:4px;">SEV: ${incident.severity}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="background:#ffffff; padding: 28px 32px;">

            <p style="font-size:15px; color:#334155; margin-bottom:24px; line-height:1.6;">
              Un nouvel incident a été déclaré et nécessite votre attention immédiate.
            </p>

            <!-- Data Grid -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0; border-radius:6px; overflow:hidden; margin-bottom:24px;">
              <tr style="background:#f8fafc;">
                <td style="padding:8px 16px; border-bottom:1px solid #e2e8f0; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:#64748b; width:40%;">Champ</td>
                <td style="padding:8px 16px; border-bottom:1px solid #e2e8f0; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:#64748b;">Valeur</td>
              </tr>
              ${[
                ['Titre', incident.title],
                ['Statut', incident.status],
                ['Système', incident.system?.name || 'N/A'],
                ['Application', `${incident.job?.code || 'N/A'} — ${incident.job?.name || 'N/A'}`],
                ['Équipe assignée', incident.assignedTeam?.name || 'Non assigné'],
                ['SLA', incident.sla?.name || 'Aucun'],
                ['Déclaré par', `${incident.createdBy?.name} (${incident.createdBy?.email})`],
                ['Date', new Date(incident.createdAt).toLocaleString('fr-MA', { dateStyle: 'medium', timeStyle: 'short' })],
              ].map(([k, v], i) => `<tr style="background:${i % 2 === 0 ? '#fff' : '#f8fafc'};">
                <td style="padding:10px 16px; font-size:13px; font-weight:600; color:#64748b; border-bottom:1px solid #f1f5f9;">${k}</td>
                <td style="padding:10px 16px; font-size:13px; color:#1e293b; border-bottom:1px solid #f1f5f9;">${v}</td>
              </tr>`).join('')}
            </table>

            <!-- Description -->
            ${incident.description ? `<div style="background:#fef9f0; border-left:4px solid #ff6b35; border-radius:0 6px 6px 0; padding:14px 18px; margin-bottom:24px;">
              <p style="font-size:12px; font-weight:700; color:#92400e; text-transform:uppercase; letter-spacing:1px; margin-bottom:6px;">Description</p>
              <p style="font-size:14px; color:#78350f; line-height:1.6;">${incident.description}</p>
            </div>` : ''}

            <!-- CTA Buttons -->
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-right:12px;">
                  <a href="${appUrl}/incidents/${incident.id}" style="display:inline-block; background:linear-gradient(90deg,#ff6b35,#e85d2b); color:#fff; font-size:14px; font-weight:700; padding:12px 28px; border-radius:6px; text-decoration:none; box-shadow:0 4px 12px rgba(255,107,53,0.35);">Voir l'incident →</a>
                </td>
                <td>
                  <a href="${appUrl}/procedures" style="display:inline-block; background:#003d82; color:#fff; font-size:14px; font-weight:700; padding:12px 28px; border-radius:6px; text-decoration:none;">Rechercher une procédure</a>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#1e293b; padding:20px 32px; border-top:3px solid #ff6b35;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <p style="color:#94a3b8; font-size:11px; line-height:1.7;">
                    <strong style="color:#e2e8f0;">CIH Bank — Plateforme ProdKB</strong><br />
                    Gestion des Incidents de Production<br />
                    Ce message est automatique, merci de ne pas y répondre.
                  </p>
                </td>
                <td align="right" style="vertical-align:top;">
                  <p style="color:#64748b; font-size:10px;">${new Date().getFullYear()} © CIH Bank</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }

  private generateIncidentCreatedEmailText(data: IncidentEmailData): string {
    const { incident } = data;
    const appUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    return `
🚨 NEW INCIDENT CREATED

Incident ID: #${incident.id.substring(0, 8)}
Title: ${incident.title}
Severity: ${incident.severity}
Environment: ${incident.environment}
System: ${incident.system?.name || 'N/A'}
Job: ${incident.job?.code || 'N/A'} - ${incident.job?.name || 'N/A'}
Status: ${incident.status}

Description:
${incident.description}

Assigned To: ${incident.assignedTeam?.name || 'Unassigned'}
SLA: ${incident.sla?.name || 'No SLA'}
Created By: ${incident.createdBy.name} (${incident.createdBy.email})
Created At: ${new Date(incident.createdAt).toLocaleString()}

View Incident: ${appUrl}/incidents/${incident.id}
Search Procedures: ${appUrl}/procedures

---
Dollar Universe Production - ProdKB
    `;
  }

  private generateIncidentUpdatedEmail(data: IncidentEmailData): string {
    const { incident } = data;
    const appUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const incRef = `#${incident.id.substring(0, 8).toUpperCase()}`;
    const statusColor: Record<string, string> = { 'Open': '#dc2626', 'In Progress': '#d97706', 'Acknowledged': '#2563eb', 'Resolved': '#16a34a', 'Closed': '#64748b' };
    const sColor = statusColor[incident.status as string] || '#64748b';

    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Incident Mis à Jour - CIH Bank ProdKB</title>
  <style>* { box-sizing: border-box; margin: 0; padding: 0; } body { background-color: #f1f5f9; font-family: 'Segoe UI', Arial, sans-serif; }</style>
</head>
<body>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9; padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; border-radius:8px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#003d82; padding:0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#ff6b35; width:6px;"> </td>
                <td style="padding:24px 28px;">
                  <p style="color:#93c5fd; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:2px; margin-bottom:6px;">CIH Bank — ProdKB</p>
                  <h1 style="color:#ffffff; font-size:20px; font-weight:700; margin:0;">🔄 Incident Mis à Jour</h1>
                  <p style="color:#bfdbfe; font-size:13px; margin-top:6px;">${incRef} &nbsp;·&nbsp; ${incident.title}</p>
                </td>
                <td style="padding:24px 28px; text-align:right; vertical-align:top;">
                  <span style="display:inline-block; background:${sColor}; color:#fff; font-size:11px; font-weight:800; padding:5px 12px; border-radius:4px;">${incident.status}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff; padding:28px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0; border-radius:6px; overflow:hidden; margin-bottom:24px;">
              ${[
                ['Référence', incRef],
                ['Titre', incident.title],
                ['Statut actuel', incident.status],
                ['Sévérité', incident.severity],
                ['Équipe', incident.assignedTeam?.name || 'N/A'],
              ].map(([k, v], i) => `<tr style="background:${i % 2 === 0 ? '#fff' : '#f8fafc'};"><td style="padding:10px 16px; font-size:13px; font-weight:600; color:#64748b; width:40%; border-bottom:1px solid #f1f5f9;">${k}</td><td style="padding:10px 16px; font-size:13px; color:#1e293b; border-bottom:1px solid #f1f5f9;">${v}</td></tr>`).join('')}
            </table>
            <a href="${appUrl}/incidents/${incident.id}" style="display:inline-block; background:linear-gradient(90deg,#ff6b35,#e85d2b); color:#fff; font-size:14px; font-weight:700; padding:12px 28px; border-radius:6px; text-decoration:none;">Voir les détails →</a>
          </td>
        </tr>
        <tr><td style="background:#1e293b; padding:20px 32px; border-top:3px solid #ff6b35;">
          <p style="color:#94a3b8; font-size:11px;"><strong style="color:#e2e8f0;">CIH Bank — Plateforme ProdKB</strong><br />Ce message est automatique, merci de ne pas y répondre. © ${new Date().getFullYear()} CIH Bank</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
  }

  private generateIncidentUpdatedEmailText(data: IncidentEmailData): string {
    const { incident } = data;
    const appUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    return `
ℹ️ INCIDENT UPDATED

Incident #${incident.id.substring(0, 8)} has been updated.

Title: ${incident.title}
Current Status: ${incident.status}
Severity: ${incident.severity}

View Details: ${appUrl}/incidents/${incident.id}

---
ProdKB Incident Management System
    `;
  }

  private generateIncidentResolvedEmail(data: IncidentEmailData): string {
    const { incident } = data;
    const appUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const incRef = `#${incident.id.substring(0, 8).toUpperCase()}`;
    const resolutionMins = incident.timeToResolve || 0;
    const resolutionStr = resolutionMins >= 60
      ? `${Math.floor(resolutionMins / 60)}h ${resolutionMins % 60}m`
      : `${resolutionMins} min`;

    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Incident Résolu - CIH Bank ProdKB</title>
  <style>* { box-sizing: border-box; margin: 0; padding: 0; } body { background-color: #f0fdf4; font-family: 'Segoe UI', Arial, sans-serif; }</style>
</head>
<body>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4; padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; border-radius:8px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#003d82; padding:0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#16a34a; width:6px;"> </td>
                <td style="padding:24px 28px;">
                  <p style="color:#93c5fd; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:2px; margin-bottom:6px;">CIH Bank — ProdKB</p>
                  <h1 style="color:#ffffff; font-size:20px; font-weight:700; margin:0;">✅ Incident Résolu</h1>
                  <p style="color:#bfdbfe; font-size:13px; margin-top:6px;">${incRef} &nbsp;·&nbsp; ${incident.title}</p>
                </td>
                <td style="padding:24px 28px; text-align:right; vertical-align:top;">
                  <span style="display:inline-block; background:#16a34a; color:#fff; font-size:11px; font-weight:800; padding:5px 12px; border-radius:4px;">RÉSOLU</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff; padding:28px 32px;">
            <p style="font-size:15px; color:#334155; margin-bottom:24px; line-height:1.6;">L'incident <strong>${incRef}</strong> a été résolu avec succès.</p>

            <!-- Resolution summary card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #dcfce7; border-radius:6px; background:#f0fdf4; margin-bottom:24px;">
              <tr>
                <td style="padding:16px 20px; text-align:center; border-right:1px solid #dcfce7;">
                  <p style="font-size:28px; font-weight:800; color:#15803d;">${resolutionStr}</p>
                  <p style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:#16a34a; margin-top:4px;">Temps de Résolution</p>
                </td>
                <td style="padding:16px 20px; text-align:center;">
                  <p style="font-size:28px; font-weight:800; color:#003d82;">${incident.severity}</p>
                  <p style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:#1e40af; margin-top:4px;">Sévérité</p>
                </td>
              </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0; border-radius:6px; overflow:hidden; margin-bottom:24px;">
              ${[
                ['Titre', incident.title],
                ['Système', incident.system?.name || 'N/A'],
                ['Équipe', incident.assignedTeam?.name || 'N/A'],
                ['Résolu le', new Date().toLocaleString('fr-MA', { dateStyle: 'medium', timeStyle: 'short' })],
              ].map(([k, v], i) => `<tr style="background:${i % 2 === 0 ? '#fff' : '#f8fafc'};"><td style="padding:10px 16px; font-size:13px; font-weight:600; color:#64748b; width:40%; border-bottom:1px solid #f1f5f9;">${k}</td><td style="padding:10px 16px; font-size:13px; color:#1e293b; border-bottom:1px solid #f1f5f9;">${v}</td></tr>`).join('')}
            </table>

            <a href="${appUrl}/incidents/${incident.id}" style="display:inline-block; background:linear-gradient(90deg,#ff6b35,#e85d2b); color:#fff; font-size:14px; font-weight:700; padding:12px 28px; border-radius:6px; text-decoration:none;">Voir le rapport complet →</a>
          </td>
        </tr>
        <tr><td style="background:#1e293b; padding:20px 32px; border-top:3px solid #16a34a;">
          <p style="color:#94a3b8; font-size:11px;"><strong style="color:#e2e8f0;">CIH Bank — Plateforme ProdKB</strong><br />Ce message est automatique, merci de ne pas y répondre. © ${new Date().getFullYear()} CIH Bank</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
  }

  private generateIncidentResolvedEmailText(data: IncidentEmailData): string {
    const { incident } = data;
    const appUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    return `
✅ INCIDENT RESOLVED

Incident #${incident.id.substring(0, 8)} has been resolved!

Title: ${incident.title}
Time to Resolve: ${incident.timeToResolve ? `${incident.timeToResolve} minutes` : 'N/A'}

View Details: ${appUrl}/incidents/${incident.id}

---
ProdKB Incident Management System
    `;
  }

  /**
   * Send a raw email (used by digest worker and custom senders).
   */
  async sendRawEmail(to: string, subject: string, html: string, text?: string): Promise<boolean> {
    if (!this.enabled || !this.transporter || !this.config) {
      logger.warn('Email service not enabled, skipping raw email');
      return false;
    }
    try {
      await this.transporter.sendMail({
        from: this.config.from,
        to,
        subject,
        text: text || this.stripHtml(html),
        html,
      });
      logger.info('Raw email sent', { to, subject });
      return true;
    } catch (error) {
      logger.error('Failed to send raw email', { error: error instanceof Error ? error.message : 'Unknown' });
      return false;
    }
  }
}

export const emailService = new EmailService();
