
import { prisma } from '../../common/utils/prisma';
import { emailService } from '../../common/services/email.service';

interface SmtpConfigInput {
    enabled?: boolean;
    host?: string;
    port?: number;
    user?: string;
    pass?: string;
    from?: string;
    secure?: boolean;
    tlsMode?: 'starttls' | 'ssl' | 'none';
    rejectUnauthorized?: boolean;
    replyTo?: string;
    connectionTimeout?: number;
}

export class ConfigService {
    async getSmtpConfig() {
        const config = await prisma.systemConfig.findUnique({
            where: { key: 'SMTP_CONFIG' },
        });

        if (!config) {
            return {
                enabled: false,
                host: '',
                port: 587,
                user: '',
                pass: '',
                passwordConfigured: false,
                from: '',
                secure: false,
                tlsMode: 'starttls',
                rejectUnauthorized: true,
                replyTo: '',
                connectionTimeout: 10000,
            };
        }

        const parsed = JSON.parse(config.value);
        return {
            enabled: parsed.enabled ?? Boolean(parsed.host && parsed.user && parsed.pass),
            host: parsed.host ?? '',
            port: parsed.port ?? 587,
            user: parsed.user ?? '',
            pass: '',
            passwordConfigured: Boolean(parsed.pass),
            from: parsed.from ?? '',
            secure: parsed.secure ?? parsed.tlsMode === 'ssl',
            tlsMode: parsed.tlsMode ?? (parsed.secure ? 'ssl' : 'starttls'),
            rejectUnauthorized: parsed.rejectUnauthorized ?? true,
            replyTo: parsed.replyTo ?? '',
            connectionTimeout: parsed.connectionTimeout ?? 10000,
        };
    }

    async updateSmtpConfig(data: SmtpConfigInput) {
        const existing = await prisma.systemConfig.findUnique({
            where: { key: 'SMTP_CONFIG' },
        });
        const current = existing ? JSON.parse(existing.value) : {};
        const next = {
            ...current,
            ...data,
            pass: data.pass?.trim() ? data.pass : current.pass,
            replyTo: data.replyTo?.trim() || '',
            enabled: data.enabled ?? current.enabled ?? false,
            secure: data.tlsMode ? data.tlsMode === 'ssl' : data.secure ?? current.secure ?? false,
        };

        await prisma.systemConfig.upsert({
            where: { key: 'SMTP_CONFIG' },
            update: { value: JSON.stringify(next) },
            create: { key: 'SMTP_CONFIG', value: JSON.stringify(next) },
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
