
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { slaService } from './sla.service';
import { createResponse } from '../../common/types/api.response';

const createSLASchema = z.object({
    name: z.string().min(2).max(100),
    description: z.string().max(500).optional(),
    severity: z.enum(['Critical', 'High', 'Medium', 'Low']),
    acknowledgeTimeMinutes: z.number().int().min(1),
    resolveTimeMinutes: z.number().int().min(1),
});

const updateSLASchema = z.object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().max(500).optional().nullable(),
    severity: z.enum(['Critical', 'High', 'Medium', 'Low']).optional(),
    acknowledgeTimeMinutes: z.number().int().min(1).optional(),
    resolveTimeMinutes: z.number().int().min(1).optional(),
    isActive: z.boolean().optional(),
});

export class SlaController {
    static async listSLAs(req: Request, res: Response, next: NextFunction) {
        try {
            const slas = await slaService.findAllSLAs();
            res.json(createResponse(true, slas));
        } catch (error) {
            next(error);
        }
    }

    static async getSLA(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const sla = await slaService.findSLAById(id);
            res.json(createResponse(true, sla));
        } catch (error) {
            next(error);
        }
    }

    static async createSLA(req: Request, res: Response, next: NextFunction) {
        try {
            const data = createSLASchema.parse(req.body);
            const sla = await slaService.createSLA(data);
            res.status(201).json(createResponse(true, sla, 'SLA created successfully'));
        } catch (error) {
            next(error);
        }
    }

    static async updateSLA(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const data = updateSLASchema.parse(req.body);
            const sla = await slaService.updateSLA(id, data);
            res.json(createResponse(true, sla, 'SLA updated successfully'));
        } catch (error) {
            next(error);
        }
    }

    static async deleteSLA(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            await slaService.deleteSLA(id);
            res.status(204).send(); // Or json response if preferred, but existing was 204
        } catch (error) {
            next(error);
        }
    }
}
