
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const defaultTemplates = [
    {
        name: 'INCIDENT_CREATED',
        subject: '[{{incident.severity}}] Incident #{{incident.id}} - {{incident.title}}',
        body: `
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
      <span class="value">#{{incident.id}}</span>
    </div>
    <div class="field">
      <span class="label">Title:</span>
      <span class="value">{{incident.title}}</span>
    </div>
    <div class="field">
      <span class="label">Severity:</span>
      <span class="value">{{incident.severity}}</span>
    </div>
    <div class="field">
      <span class="label">Status:</span>
      <span class="value">{{incident.status}}</span>
    </div>
    <div class="field">
      <span class="label">Description:</span>
      <div class="value">{{incident.description}}</div>
    </div>
    <div class="field">
      <span class="label">Assigned To:</span>
      <span class="value">{{incident.assignedTeam.name}}</span>
    </div>
    
    <a href="{{appUrl}}/incidents/{{incident.id}}" class="button">View Incident</a>
  </div>
  <div class="footer">
    ProdKB Incident Management System
  </div>
</body>
</html>
        `,
        variables: '{{incident.id}}, {{incident.title}}, {{incident.severity}}, {{incident.status}}, {{incident.description}}, {{incident.assignedTeam.name}}, {{appUrl}}'
    },
    {
        name: 'INCIDENT_UPDATED',
        subject: '[UPDATED] {{incident.title}}',
        body: `
<!DOCTYPE html>
<html>
<body>
  <h2>ℹ️ Incident Updated</h2>
  <p>Incident <strong>#{{incident.id}}</strong> has been updated.</p>
  <ul>
    <li><strong>Title:</strong> {{incident.title}}</li>
    <li><strong>Status:</strong> {{incident.status}}</li>
    <li><strong>Severity:</strong> {{incident.severity}}</li>
  </ul>
  <p><a href="{{appUrl}}/incidents/{{incident.id}}">View Incident</a></p>
</body>
</html>
        `,
        variables: '{{incident.id}}, {{incident.title}}, {{incident.status}}, {{incident.severity}}, {{appUrl}}'
    },
    {
        name: 'INCIDENT_RESOLVED',
        subject: '[RESOLVED] {{incident.title}}',
        body: `
<!DOCTYPE html>
<html>
<body>
  <h2>✅ Incident Resolved</h2>
  <p>Incident <strong>#{{incident.id}}</strong> has been resolved.</p>
  <ul>
    <li><strong>Title:</strong> {{incident.title}}</li>
    <li><strong>Resolution Time:</strong> {{incident.timeToResolve}} minutes</li>
  </ul>
  <p><a href="{{appUrl}}/incidents/{{incident.id}}">View Incident</a></p>
</body>
</html>
        `,
        variables: '{{incident.id}}, {{incident.title}}, {{incident.timeToResolve}}, {{appUrl}}'
    }
];

async function main() {
    console.log('Seeding email templates...');
    for (const t of defaultTemplates) {
        // Use any cast to avoid type errors in this script too
        const exists = await (prisma as any).emailTemplate.findUnique({ where: { name: t.name } });
        if (!exists) {
            await (prisma as any).emailTemplate.create({ data: t });
            console.log(`Created template: ${t.name}`);
        } else {
            console.log(`Template ${t.name} already exists.`);
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
