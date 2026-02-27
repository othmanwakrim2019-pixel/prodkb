
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { configService } from './config.service';
import { createResponse } from '../../common/types/api.response';
import { logger } from '../../common/utils/logger';

const smtpConfigSchema = z.object({
    host: z.string().min(1),
    port: z.number().int().positive(),
    user: z.string().min(1),
    pass: z.string().min(1),
    from: z.string().email(),
    secure: z.boolean().optional(),
});

export class ConfigController {
    static async getSmtpConfig(req: Request, res: Response, next: NextFunction) {
        try {
            const config = await configService.getSmtpConfig();
            res.json(config); // Keeping legacy response format for FE compatibility if needed, or switch to createResponse?
            // Legacy controller returned raw object. Let's stick to that for now or verify FE.
            // But previous refactors used createResponse. Let's check apiRoutes usage.
            // Actually, for config, it might expect direct object. Let's stick to legacy behavior for now to minimal change risk.
            // Wait, I should try to unify. The standard response is better.
            // But if existing FE expects { host: ... }, then createResponse({ data: { host... } }) breaks it.
            // Checking systemConfigController.ts: res.json(parsed); -> Direct object.
            // I will keep direct object for now to avoid breaking FE settings page.
        } catch (error) {
            next(error);
        }
    }

    static async updateSmtpConfig(req: Request, res: Response, next: NextFunction) {
        try {
            const data = smtpConfigSchema.parse(req.body);
            await configService.updateSmtpConfig(data);
            res.json({ message: 'SMTP config updated successfully' });
        } catch (error) {
            next(error);
        }
    }

    static async testSmtpConfig(req: Request, res: Response, next: NextFunction) {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ error: 'Email address required' });
            }

            await configService.sendTestEmail(email);
            res.json({ message: 'Test email sent successfully' });
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'Unknown error';
            res.status(400).json({ error: `Failed to send test email: ${msg}` });
        }
    }

    static async updateConfig(req: Request, res: Response, next: NextFunction) {
        try {
            const { key } = req.params;
            const { value } = req.body;

            if (!key) {
                return res.status(400).json({ error: 'Config key required' });
            }

            const result = await configService.updateConfig(key, String(value));
            res.json({ message: 'Config updated successfully', ...result });
        } catch (error) {
            next(error);
        }
    }

    static async getConfigs(req: Request, res: Response, next: NextFunction) {
        try {
            const { keys } = req.query;
            if (!keys) {
                return res.json({});
            }

            const keyList = (keys as string).split(',');
            const result = await configService.getConfigs(keyList);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }
}
