import { EmailService } from '../src/common/services/email.service';
import nodemailer from 'nodemailer';
import { prisma } from '../src/common/utils/prisma';

// Mock nodemailer
jest.mock('nodemailer');
const sendMailMock = jest.fn();
(nodemailer.createTransport as jest.Mock).mockReturnValue({
    sendMail: sendMailMock,
});

// Mock prisma
jest.mock('../src/common/utils/prisma', () => ({
    prisma: {
        systemConfig: {
            findUnique: jest.fn(),
        },
        emailTemplate: {
            findUnique: jest.fn(),
        },
    },
}));

describe('EmailService', () => {
    let emailService: EmailService;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.SMTP_HOST = 'smtp.example.com';
        process.env.SMTP_PORT = '587';
        process.env.SMTP_USER = 'user';
        process.env.SMTP_PASS = 'pass';

        // Reset instance for each test
        emailService = new EmailService();
    });

    describe('sendIncidentCreated', () => {
        it('should not send email if recipients are missing', async () => {
            const data = {
                incident: {
                    id: '123',
                    assignedTeam: { emailDistribution: '' }, // No recipients
                },
            };

            const result = await emailService.sendIncidentCreated(data as any);
            expect(result).toBe(false);
            expect(sendMailMock).not.toHaveBeenCalled();
        });

        it('should send email if configuration and recipients are valid', async () => {
            const data = {
                incident: {
                    id: '123456789',
                    title: 'Test Incident',
                    severity: 'HIGH',
                    status: 'Open',
                    createdAt: new Date(),
                    createdBy: { name: 'Tester', email: 'test@example.com' },
                    assignedTeam: { name: 'DevOps', emailDistribution: 'team@example.com', sendEmail: true },
                },
            };

            const result = await emailService.sendIncidentCreated(data as any);

            expect(result).toBe(true);
            expect(sendMailMock).toHaveBeenCalledWith(expect.objectContaining({
                to: 'team@example.com',
                subject: expect.stringContaining('Test Incident'),
            }));
        });

        it('should respect team opt-out', async () => {
            const data = {
                incident: {
                    id: '123',
                    assignedTeam: {
                        name: 'NoEmailTeam',
                        emailDistribution: 'team@example.com',
                        sendEmail: false // Opt-out
                    },
                },
            };

            const result = await emailService.sendIncidentCreated(data as any);
            expect(result).toBe(false);
            expect(sendMailMock).not.toHaveBeenCalled();
        });
    });
});
