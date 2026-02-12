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

  async sendIncidentCreated(data: IncidentEmailData): Promise<boolean> {
    if (!this.enabled || !this.transporter || !this.config) {
      logger.debug('Email service not enabled, skipping email');
      return false;
    }

    const { incident } = data;

    // Check if team has opted out of emails
    if (incident.assignedTeam && incident.assignedTeam.sendEmail === false) {
      logger.debug('Email skipped for team (sendEmail=false)', { teamName: incident.assignedTeam.name });
      return false;
    }

    // Get email recipients - team distribution list
    const recipients = incident.assignedTeam?.emailDistribution || '';
    if (!recipients) {
      logger.debug('No email recipients for incident', { incidentId: incident.id });
      return false;
    }

    const template = await this.getTemplate('INCIDENT_CREATED');

    // Check if template is disabled
    if (template && template.enabled === false) {
      logger.info('Email skipped: template INCIDENT_CREATED is disabled');
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

    // Check team preference
    if (incident.assignedTeam && incident.assignedTeam.sendEmail === false) {
      logger.debug('Update email skipped for team (sendEmail=false)', { teamName: incident.assignedTeam.name });
      return false;
    }

    const recipients = incident.assignedTeam?.emailDistribution || '';
    if (!recipients) {
      return false;
    }

    const template = await this.getTemplate('INCIDENT_UPDATED');

    // Check if template is disabled
    if (template && template.enabled === false) {
      logger.info('Email skipped: template INCIDENT_UPDATED is disabled');
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

    // Check team preference
    if (incident.assignedTeam && incident.assignedTeam.sendEmail === false) {
      logger.debug('Resolution email skipped for team (sendEmail=false)', { teamName: incident.assignedTeam.name });
      return false;
    }

    const recipients = incident.assignedTeam?.emailDistribution || '';
    if (!recipients) {
      return false;
    }

    const template = await this.getTemplate('INCIDENT_RESOLVED');

    // Check if template is disabled
    if (template && template.enabled === false) {
      logger.info('Email skipped: template INCIDENT_RESOLVED is disabled');
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
      return await (prisma as any).emailTemplate.findUnique({ where: { name } });
    } catch (error) {
      logger.warn('Failed to fetch email template, using fallback', { templateName: name });
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

  // Fallback methods (keep existing ones below)
  private generateIncidentCreatedEmail(data: IncidentEmailData): string {
    const { incident } = data;
    const appUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background-color: #d32f2f; color: white; padding: 20px; }
    .content { padding: 20px; }
    .field { margin-bottom: 10px; }
    .label { font-weight: bold; color: #666; }
    .value { color: #000; }
    .button { background-color: #1976d2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 15px; }
    .footer { background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🚨 New Incident Created</h1>
  </div>
  <div class="content">
    <div class="field">
      <span class="label">Incident ID:</span>
      <span class="value">#${incident.id.substring(0, 8)}</span>
    </div>
    <div class="field">
      <span class="label">Title:</span>
      <span class="value">${incident.title}</span>
    </div>
    <div class="field">
      <span class="label">Severity:</span>
      <span class="value">${incident.severity}</span>
    </div>
    <div class="field">
      <span class="label">Environment:</span>
      <span class="value">${incident.environment}</span>
    </div>
    <div class="field">
      <span class="label">System:</span>
      <span class="value">${incident.system?.name || 'N/A'}</span>
    </div>
    <div class="field">
      <span class="label">Job:</span>
      <span class="value">${incident.job?.code || 'N/A'} - ${incident.job?.name || 'N/A'}</span>
    </div>
    <div class="field">
      <span class="label">Status:</span>
      <span class="value">${incident.status}</span>
    </div>
    <div class="field">
      <span class="label">Description:</span>
      <div class="value">${incident.description}</div>
    </div>
    <div class="field">
      <span class="label">Assigned To:</span>
      <span class="value">${incident.assignedTeam?.name || 'Unassigned'}</span>
    </div>
    <div class="field">
      <span class="label">SLA:</span>
      <span class="value">${incident.sla?.name || 'No SLA'}</span>
    </div>
    <div class="field">
      <span class="label">Created By:</span>
      <span class="value">${incident.createdBy.name} (${incident.createdBy.email})</span>
    </div>
    <div class="field">
      <span class="label">Created At:</span>
      <span class="value">${new Date(incident.createdAt).toLocaleString()}</span>
    </div>

    <a href="${appUrl}/incidents/${incident.id}" class="button">View Incident</a>
    <a href="${appUrl}/procedures" class="button">Search Procedures</a>
  </div>
  <div class="footer">
    Dollar Universe Production - ProdKB Incident Management System
  </div>
</body>
</html>
    `;
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

    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background-color: #1976d2; color: white; padding: 20px; }
    .content { padding: 20px; }
    .field { margin-bottom: 10px; }
    .label { font-weight: bold; color: #666; }
    .value { color: #000; }
    .button { background-color: #1976d2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 15px; }
    .footer { background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <h1>ℹ️ Incident Updated</h1>
  </div>
  <div class="content">
    <p>Incident <strong>#${incident.id.substring(0, 8)}</strong> has been updated.</p>
    <div class="field">
      <span class="label">Title:</span>
      <span class="value">${incident.title}</span>
    </div>
    <div class="field">
      <span class="label">Current Status:</span>
      <span class="value">${incident.status}</span>
    </div>
    <div class="field">
      <span class="label">Severity:</span>
      <span class="value">${incident.severity}</span>
    </div>
    <a href="${appUrl}/incidents/${incident.id}" class="button">View Details</a>
  </div>
  <div class="footer">
    ProdKB Incident Management System
  </div>
</body>
</html>
    `;
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

    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background-color: #388e3c; color: white; padding: 20px; }
    .content { padding: 20px; }
    .field { margin-bottom: 10px; }
    .label { font-weight: bold; color: #666; }
    .value { color: #000; }
    .button { background-color: #1976d2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 15px; }
    .footer { background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <h1>✅ Incident Resolved</h1>
  </div>
  <div class="content">
    <p>Incident <strong>#${incident.id.substring(0, 8)}</strong> has been resolved!</p>
    <div class="field">
      <span class="label">Title:</span>
      <span class="value">${incident.title}</span>
    </div>
    <div class="field">
      <span class="label">Time to Resolve:</span>
      <span class="value">${incident.timeToResolve ? `${incident.timeToResolve} minutes` : 'N/A'}</span>
    </div>
    <a href="${appUrl}/incidents/${incident.id}" class="button">View Details</a>
  </div>
  <div class="footer">
    ProdKB Incident Management System
  </div>
</body>
</html>
    `;
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
}

export const emailService = new EmailService();
