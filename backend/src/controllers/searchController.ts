import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export const globalSearch = async (req: Request, res: Response) => {
    const { query } = req.query;
    const searchStr = String(query);

    if (!query) {
        res.status(400).json({ error: 'Query parameter is required' });
        return;
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
        res.status(500).json({ error: 'Search failed' });
    }
};
