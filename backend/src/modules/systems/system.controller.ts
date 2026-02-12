
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { systemService } from './system.service';
import { AuthRequest } from '../../common/middleware/auth.middleware';
import { createResponse } from '../../common/types/api.response';
import { logAudit, generateAuditDiff } from '../audit/audit.service';

// Schemas
const createSystemSchema = z.object({
    name: z.string().min(2).max(100),
    description: z.string().max(500).optional(),
});

const updateSystemSchema = z.object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().max(500).optional().nullable(),
});

const createJobSchema = z.object({
    name: z.string().min(2).max(100),
    code: z.string().min(1).max(50),
    systemId: z.string().uuid(),
    teamId: z.string().uuid().optional(),
});

const updateJobSchema = z.object({
    name: z.string().min(2).max(100).optional(),
    code: z.string().min(1).max(50).optional(),
    systemId: z.string().uuid().optional(),
    teamId: z.string().uuid().optional().nullable(),
});

export class SystemController {
    // --- Systems ---

    static async getSystems(req: Request, res: Response, next: NextFunction) {
        try {
            const systems = await systemService.findAllSystems();
            res.json(createResponse(true, systems));
        } catch (error) {
            next(error);
        }
    }

    static async createSystem(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const data = createSystemSchema.parse(req.body);
            const system = await systemService.createSystem(data);

            await logAudit({
                userId: req.user?.id || 'unknown',
                actionType: 'CREATE',
                entityType: 'SYSTEM',
                entityId: system.id,
                details: JSON.stringify(data),
                req
            });

            res.status(201).json(createResponse(true, system, 'System created successfully'));
        } catch (error) {
            next(error);
        }
    }

    static async updateSystem(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const data = updateSystemSchema.parse(req.body);

            // Get existing for audit
            const existing = await systemService.findSystemById(id);
            const updated = await systemService.updateSystem(id, data);

            const changes = generateAuditDiff(existing, updated);
            if (changes !== 'No changes detected') {
                await logAudit({
                    userId: req.user?.id || 'unknown',
                    actionType: 'UPDATE',
                    entityType: 'SYSTEM',
                    entityId: id,
                    details: changes,
                    req
                });
            }

            res.json(createResponse(true, updated, 'System updated successfully'));
        } catch (error) {
            next(error);
        }
    }

    static async deleteSystem(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const system = await systemService.deleteSystem(id);

            await logAudit({
                userId: req.user?.id || 'unknown',
                actionType: 'DELETE',
                entityType: 'SYSTEM',
                entityId: id,
                details: JSON.stringify({ systemName: system.name }),
                req
            });

            res.json(createResponse(true, null, 'System deleted successfully'));
        } catch (error) {
            next(error);
        }
    }

    // --- Jobs ---

    static async getJobs(req: Request, res: Response, next: NextFunction) {
        try {
            const jobs = await systemService.findAllJobs();
            res.json(createResponse(true, jobs));
        } catch (error) {
            next(error);
        }
    }

    static async createJob(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const data = createJobSchema.parse(req.body);
            const job = await systemService.createJob(data);

            await logAudit({
                userId: req.user?.id || 'unknown',
                actionType: 'CREATE',
                entityType: 'JOB',
                entityId: job.id,
                details: JSON.stringify(data),
                req
            });

            res.status(201).json(createResponse(true, job, 'Job created successfully'));
        } catch (error) {
            next(error);
        }
    }

    static async updateJob(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const data = updateJobSchema.parse(req.body);

            const existing = await systemService.findJobById(id);
            const updated = await systemService.updateJob(id, data);

            const changes = generateAuditDiff(existing, updated);
            if (changes !== 'No changes detected') {
                await logAudit({
                    userId: req.user?.id || 'unknown',
                    actionType: 'UPDATE',
                    entityType: 'JOB',
                    entityId: id,
                    details: changes,
                    req
                });
            }

            res.json(createResponse(true, updated, 'Job updated successfully'));
        } catch (error) {
            next(error);
        }
    }

    static async deleteJob(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const job = await systemService.deleteJob(id);

            await logAudit({
                userId: req.user?.id || 'unknown',
                actionType: 'DELETE',
                entityType: 'JOB',
                entityId: id,
                details: JSON.stringify({ jobName: job.name, jobCode: job.code }),
                req
            });

            res.json(createResponse(true, null, 'Job deleted successfully'));
        } catch (error) {
            next(error);
        }
    }
}
