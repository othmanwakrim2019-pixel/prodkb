
import { Request, Response, NextFunction } from 'express';
import { procedureService } from './procedure.service';
import { AuthRequest } from '../../common/middleware/auth.middleware';
import { createResponse } from '../../common/types/api.response';
import { logAudit, generateAuditDiff } from '../audit/audit.service';
import { createProcedureSchema, updateProcedureSchema } from './procedure.schema';


export class ProcedureController {
    static async getProcedures(req: Request, res: Response, next: NextFunction) {
        try {
            const search = req.query.search as string | undefined;
            const procedures = await procedureService.findAll(search);
            res.json(createResponse(true, procedures));
        } catch (error) {
            next(error);
        }
    }

    static async getProcedureById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const procedure = await procedureService.findById(id);
            res.json(createResponse(true, procedure));
        } catch (error) {
            next(error);
        }
    }

    static async createProcedure(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const data = createProcedureSchema.parse(req.body);
            const userId = req.user?.id || 'unknown';

            const procedure = await procedureService.create(data, userId);

            await logAudit({
                userId,
                actionType: 'CREATE',
                entityType: 'PROCEDURE',
                entityId: procedure.id,
                details: JSON.stringify({ title: data.title, systemId: data.systemId }),
                req
            });

            res.status(201).json(createResponse(true, procedure, 'Procedure created successfully'));
        } catch (error) {
            next(error);
        }
    }

    static async updateProcedure(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const data = updateProcedureSchema.parse(req.body);
            const userId = req.user?.id || 'unknown';

            // Get existing for audit
            const existing = await procedureService.findById(id);
            const updated = await procedureService.update(id, data, userId);

            const changes = generateAuditDiff(existing, updated);
            if (changes !== 'No changes detected') {
                await logAudit({
                    userId,
                    actionType: 'UPDATE',
                    entityType: 'PROCEDURE',
                    entityId: id,
                    details: changes,
                    req
                });
            }

            res.json(createResponse(true, updated, 'Procedure updated successfully'));
        } catch (error) {
            next(error);
        }
    }

    static async deleteProcedure(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const userId = req.user?.id || 'unknown';

            const procedure = await procedureService.delete(id);

            await logAudit({
                userId,
                actionType: 'DELETE',
                entityType: 'PROCEDURE',
                entityId: id,
                details: JSON.stringify({ title: procedure.title }),
                req
            });

            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
}
