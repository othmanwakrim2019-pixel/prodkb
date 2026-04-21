
import { prisma } from '../../../common/utils/prisma';
import { NotFoundError } from '../../../common/errors/app.error';

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

    async update(id: string, data: Partial<{ subject: string; body: string; enabled: boolean; cc: string | null; variables: string }>) {
        return prisma.emailTemplate.update({
            where: { id },
            data
        });
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
