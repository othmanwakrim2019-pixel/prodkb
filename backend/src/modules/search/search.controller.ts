
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../common/utils/prisma';
import { createResponse } from '../../common/types/api.response';

export class SearchController {
    static async globalSearch(req: Request, res: Response, next: NextFunction) {
        const { query } = req.query;
        const searchStr = String(query); // Check empty? controller did check.

        if (!query) {
            return res.status(400).json({ error: 'Query parameter is required' });
        }

        try {
            const procedures = await prisma.procedure.findMany({
                where: {
                    OR: [
                        { title: { contains: searchStr, mode: 'insensitive' } },
                        { description: { contains: searchStr, mode: 'insensitive' } },
                        { rootCause: { contains: searchStr, mode: 'insensitive' } },
                        { resolutionSteps: { contains: searchStr, mode: 'insensitive' } },
                        { errorCode: { contains: searchStr, mode: 'insensitive' } },
                        { tags: { contains: searchStr, mode: 'insensitive' } },
                    ],
                },
                take: 10,
            });

            const incidents = await prisma.incident.findMany({
                where: {
                    OR: [
                        { title: { contains: searchStr, mode: 'insensitive' } },
                        { description: { contains: searchStr, mode: 'insensitive' } },
                        { logs: { some: { rawLog: { contains: searchStr, mode: 'insensitive' } } } },
                        { logs: { some: { errorMessage: { contains: searchStr, mode: 'insensitive' } } } },
                    ],
                },
                take: 10,
                include: { logs: true },
            });

            res.json({ procedures, incidents });
        } catch (error) {
            next(error);
        }
    }
}
