import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export class EmailTemplateController {
    // Get all templates
    async getAllTemplates(req: Request, res: Response) {
        try {
            const templates = await (prisma as any).emailTemplate.findMany({
                orderBy: { name: 'asc' }
            });
            res.json(templates);
        } catch (error) {
            console.error('Failed to fetch email templates:', error);
            res.status(500).json({ error: 'Failed to fetch email templates' });
        }
    }

    // Get a single template by ID
    async getTemplate(req: Request, res: Response) {
        const { id } = req.params;
        try {
            const template = await (prisma as any).emailTemplate.findUnique({
                where: { id }
            });
            if (!template) {
                return res.status(404).json({ error: 'Template not found' });
            }
            res.json(template);
        } catch (error) {
            console.error('Failed to fetch email template:', error);
            res.status(500).json({ error: 'Failed to fetch email template' });
        }
    }

    // Update a template
    async updateTemplate(req: Request, res: Response) {
        const { id } = req.params;
        const { subject, body, enabled, cc } = req.body;

        try {
            const template = await (prisma as any).emailTemplate.update({
                where: { id },
                data: { subject, body, enabled, cc }
            });
            res.json(template);
        } catch (error) {
            console.error('Failed to update email template:', error);
            res.status(500).json({ error: 'Failed to update email template' });
        }
    }

    // Reset template to default (if needed, currently just deletes the custom one if we implemented defaults in code, but here we update)
    // For now, let's just assume we only update.

    // Preview template (optional, returns rendered HTML with dummy data)
    async previewTemplate(req: Request, res: Response) {
        const { subject, body } = req.body;
        // Mock data for preview
        const mockData = {
            incident: {
                id: '12345678-uuid',
                title: 'Example Incident',
                severity: 'High',
                status: 'Open',
                description: 'This is a test description.',
                createdAt: new Date().toISOString(),
                createdBy: { name: 'John Doe', email: 'john@example.com' },
                assignedTeam: { name: 'DevOps' },
                sla: { name: 'Gold' },
                system: { name: 'Payment Gateway' },
                job: { code: 'PAY-001', name: 'Process Payments' },
                environment: 'PROD'
            }
        };

        // Simple replacement logic (same as service)
        let renderedSubject = subject;
        let renderedBody = body;

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

        const flatData = flatten(mockData);

        for (const key in flatData) {
            const value = flatData[key];
            renderedSubject = renderedSubject.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
            renderedBody = renderedBody.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
        }

        res.json({ subject: renderedSubject, body: renderedBody });
    }
}

export const emailTemplateController = new EmailTemplateController();
