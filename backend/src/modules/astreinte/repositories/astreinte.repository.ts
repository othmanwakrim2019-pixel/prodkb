
import { Prisma } from '@prisma/client';
import { prisma } from '../../../common/utils/prisma';

export const astreinteDefaultInclude = Prisma.validator<Prisma.AstreinteInclude>()({
    team: true,
    user: { select: { id: true, name: true, email: true } },
    createdBy: { select: { id: true, name: true, email: true } },
});

export class AstreinteRepository {
    async findMany(where: Record<string, unknown>) {
        return prisma.astreinte.findMany({
            where,
            include: astreinteDefaultInclude,
            orderBy: [{ year: 'desc' }, { weekNumber: 'desc' }],
        });
    }

    async findById(id: string) {
        return prisma.astreinte.findUnique({
            where: { id },
            include: astreinteDefaultInclude,
        });
    }

    async findCurrent(teamId: string, date: Date = new Date()) {
        return prisma.astreinte.findFirst({
            where: {
                teamId,
                startDate: { lte: date },
                endDate: { gte: date },
            },
            include: astreinteDefaultInclude,
        });
    }

    /** Find the current week's astreinte with no team filter (for dashboard/my-tasks widget) */
    async findCurrentAny(date: Date = new Date()) {
        return prisma.astreinte.findFirst({
            where: {
                startDate: { lte: date },
                endDate:   { gte: date },
            },
            include: astreinteDefaultInclude,
            orderBy: { createdAt: 'desc' },
        });
    }

    async findByWeek(teamId: string, weekNumber: number, year: number) {
        return prisma.astreinte.findUnique({
            where: {
                teamId_weekNumber_year: {
                    teamId,
                    weekNumber,
                    year,
                },
            },
            include: astreinteDefaultInclude,
        });
    }

    async create(data: Prisma.AstreinteCreateArgs['data']) {
        return prisma.astreinte.create({
            data,
            include: astreinteDefaultInclude,
        });
    }

    async update(id: string, data: Prisma.AstreinteUpdateArgs['data']) {
        return prisma.astreinte.update({
            where: { id },
            data,
            include: astreinteDefaultInclude,
        });
    }

    async delete(id: string) {
        return prisma.astreinte.delete({
            where: { id },
        });
    }
}

export const astreinteRepository = new AstreinteRepository();
