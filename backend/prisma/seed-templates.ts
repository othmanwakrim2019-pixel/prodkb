/**
 * Seed only email templates — safe to run without resetting other data.
 * Usage: npx ts-node prisma/seed-templates.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Re-seeding email templates...');

    // Delete existing templates
    await prisma.emailTemplate.deleteMany();

    const availableVars = '{{incident.id}}, {{incident.title}}, {{incident.severity}}, {{incident.status}}, {{incident.description}}, {{incident.environment}}, {{incident.createdAt}}, {{incident.createdBy.name}}, {{incident.createdBy.email}}, {{incident.assignedTeam.name}}, {{incident.system.name}}, {{incident.job.code}}, {{incident.job.name}}, {{incident.sla.name}}, {{incident.resolvedBy.name}}, {{incident.resolvedAt}}';

    const templates = [
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

    for (const t of templates) {
        await prisma.emailTemplate.create({ data: t });
    }

    console.log(`✅ Seeded ${templates.length} email templates successfully!`);
    console.log('Templates:', templates.map(t => t.name).join(', '));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
