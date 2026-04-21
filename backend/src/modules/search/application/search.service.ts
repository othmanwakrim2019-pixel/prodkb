import { prisma } from '../../../common/utils/prisma';

export class SearchService {
    async globalSearch(searchStr: string) {
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

        return { procedures, incidents };
    }
}

export const searchService = new SearchService();
