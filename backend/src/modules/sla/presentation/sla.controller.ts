
import { Request, Response, NextFunction } from 'express';
import { slaService } from '../application/sla.service';
import { createResponse } from '../../../common/types/api.response';
import { createSLASchema, updateSLASchema } from '../presentation/sla.schema';


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
