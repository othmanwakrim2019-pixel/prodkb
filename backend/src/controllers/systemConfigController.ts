import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { emailService } from '../services/emailService';
import { z } from 'zod';

const smtpConfigSchema = z.object({
    host: z.string().min(1),
    port: z.number().int().positive(),
    user: z.string().min(1),
    pass: z.string().min(1),
    from: z.string().email(),
    secure: z.boolean().optional(),
});

export const getSmtpConfig = async (req: Request, res: Response) => {
    try {
        const config = await prisma.systemConfig.findUnique({
            where: { key: 'SMTP_CONFIG' },
        });

        if (!config) {
            return res.json({
                host: '',
                port: 587,
                user: '',
                pass: '',
                from: '',
                secure: false,
            });
        }

        const parsed = JSON.parse(config.value);
        res.json(parsed);
    } catch (error) {
        console.error('Failed to get SMTP config:', error);
        res.status(500).json({ error: 'Failed to fetch SMTP config' });
    }
};

export const updateSmtpConfig = async (req: Request, res: Response) => {
    try {
        const data = smtpConfigSchema.parse(req.body);

        await prisma.systemConfig.upsert({
            where: { key: 'SMTP_CONFIG' },
            update: { value: JSON.stringify(data) },
            create: { key: 'SMTP_CONFIG', value: JSON.stringify(data) },
        });

        // Trigger reload in email service
        (emailService as any).reloadConfig();

        res.json({ message: 'SMTP config updated successfully' });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.issues });
        }
        console.error('Failed to update SMTP config:', error);
        res.status(500).json({ error: 'Failed to update SMTP config' });
    }
};

export const testSmtpConfig = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email address required' });
        }

        const result = await (emailService as any).sendTestEmail(email);
        if (result.success) {
            res.json({ message: 'Test email sent successfully' });
        } else {
            res.status(400).json({ error: `Failed to send test email: ${result.error}` });
        }
    } catch (error) {
        console.error('Test email failed:', error);
        res.status(500).json({ error: 'Internal server error during test' });
    }
};


export const updateConfig = async (req: Request, res: Response) => {
    try {
        const { key } = req.params;
        const { value } = req.body;

        if (!key) {
            return res.status(400).json({ error: 'Config key required' });
        }

        await prisma.systemConfig.upsert({
            where: { key },
            update: { value: String(value) },
            create: { key, value: String(value) },
        });

        res.json({ message: 'Config updated successfully', key, value });
    } catch (error) {
        console.error('Failed to update config:', error);
        res.status(500).json({ error: 'Failed to update config' });
    }
};

export const getConfigs = async (req: Request, res: Response) => {
    try {
        const { keys } = req.query;
        if (!keys) {
            return res.json({});
        }

        const keyList = (keys as string).split(',');
        const configs = await prisma.systemConfig.findMany({
            where: {
                key: { in: keyList }
            }
        });

        const result = configs.reduce((acc, config) => {
            acc[config.key] = config.value;
            return acc;
        }, {} as Record<string, string>);

        res.json(result);
    } catch (error) {
        console.error('Failed to get configs:', error);
        res.status(500).json({ error: 'Failed to get configs' });
    }
};

