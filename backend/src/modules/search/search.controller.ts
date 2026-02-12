
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
                        { title: { contains: searchStr } },
                        { description: { contains: searchStr } },
                        { rootCause: { contains: searchStr } },
                        { resolutionSteps: { contains: searchStr } },
                        { errorCode: { contains: searchStr } },
                        { tags: { contains: searchStr } },
                    ],
                },
                take: 10,
            });

            const incidents = await prisma.incident.findMany({
                where: {
                    OR: [
                        { title: { contains: searchStr } },
                        { description: { contains: searchStr } },
                        { logs: { some: { rawLog: { contains: searchStr } } } },
                        { logs: { some: { errorMessage: { contains: searchStr } } } },
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
