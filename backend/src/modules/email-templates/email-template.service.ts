
import { prisma } from '../../common/utils/prisma';
import { ConflictError, NotFoundError } from '../../common/errors/app.error';
import type { CreateEmailTemplateInput, UpdateEmailTemplateInput } from './email-template.schema';

export class EmailTemplateService {
    async findAll() {
        return prisma.emailTemplate.findMany({
            orderBy: { name: 'asc' }
        });
    }

    async findById(id: string) {
        const template = await prisma.emailTemplate.findUnique({
            where: { id }
        });
        if (!template) throw new NotFoundError('Template not found');
        return template;
    }

    async create(data: CreateEmailTemplateInput) {
        const existing = await prisma.emailTemplate.findUnique({
            where: { name: data.name }
        });
        if (existing) throw new ConflictError('Template name already exists');

        return prisma.emailTemplate.create({
            data: {
                name: data.name,
                subject: data.subject,
                body: data.body,
                variables: data.variables?.trim() || null,
                enabled: data.enabled ?? true,
                cc: data.cc?.trim() || null,
            }
        });
    }

    async update(id: string, data: UpdateEmailTemplateInput) {
        await this.findById(id);

        if (data.name) {
            const existing = await prisma.emailTemplate.findUnique({
                where: { name: data.name }
            });
            if (existing && existing.id !== id) throw new ConflictError('Template name already exists');
        }

        return prisma.emailTemplate.update({
            where: { id },
            data: {
                ...data,
                variables: data.variables === undefined ? undefined : data.variables?.trim() || null,
                cc: data.cc === undefined ? undefined : data.cc?.trim() || null,
            }
        });
    }

    async delete(id: string) {
        await this.findById(id);
        await prisma.emailTemplate.delete({ where: { id } });
    }

    // Preview logic
    async preview(subject: string, body: string) {
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

        let renderedSubject = subject;
        let renderedBody = body;

        const flatten = (obj: Record<string, unknown>, prefix = ''): Record<string, unknown> => {
            return Object.keys(obj).reduce((acc: Record<string, unknown>, k) => {
                const pre = prefix.length ? prefix + '.' : '';
                if (typeof obj[k] === 'object' && obj[k] !== null && !(obj[k] instanceof Date)) {
                    Object.assign(acc, flatten(obj[k] as Record<string, unknown>, pre + k));
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

        return { subject: renderedSubject, body: renderedBody };
    }
}

export const emailTemplateService = new EmailTemplateService();
