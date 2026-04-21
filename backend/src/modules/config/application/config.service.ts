
import { prisma } from '../../../common/utils/prisma';
import { emailService } from '../../../common/services/email.service';

export class ConfigService {
    async getSmtpConfig() {
        const config = await prisma.systemConfig.findUnique({
            where: { key: 'SMTP_CONFIG' },
        });

        if (!config) {
            return {
                host: '',
                port: 587,
                user: '',
                pass: '',
                from: '',
                secure: false,
            };
        }

        return JSON.parse(config.value);
    }

    async updateSmtpConfig(data: any) {
        await prisma.systemConfig.upsert({
            where: { key: 'SMTP_CONFIG' },
            update: { value: JSON.stringify(data) },
            create: { key: 'SMTP_CONFIG', value: JSON.stringify(data) },
        });

        // Trigger reload in email service
        emailService.reloadConfig();
    }

    async sendTestEmail(email: string) {
        return emailService.sendTestEmail(email);
    }

    async updateConfig(key: string, value: string) {
        await prisma.systemConfig.upsert({
            where: { key },
            update: { value },
            create: { key, value },
        });
        return { key, value };
    }

    async getConfigs(keys: string[]) {
        const configs = await prisma.systemConfig.findMany({
            where: {
                key: { in: keys }
            }
        });

        return configs.reduce((acc, config) => {
            acc[config.key] = config.value;
            return acc;
        }, {} as Record<string, string>);
    }
}

export const configService = new ConfigService();
