
import { prisma } from '../../common/utils/prisma';
import { NotFoundError } from '../../common/errors/app.error';

export class ProcedureService {
    async findAll(search?: string) {
        const where: Record<string, unknown> = {};
        if (search) {
            where.OR = [
                { title: { contains: search } },
                { description: { contains: search } },
                { errorCode: { contains: search } },
                { tags: { contains: search } },
            ];
        }

        return prisma.procedure.findMany({
            where,
            include: {
                system: true,
                job: true,
                _count: { select: { incidents: true } },
            },
        });
    }

    async findById(id: string) {
        const procedure = await prisma.procedure.findUnique({
            where: { id },
            include: {
                system: true,
                job: true,
                incidents: {
                    select: { id: true, title: true, status: true, createdAt: true },
                },
                createdBy: { select: { name: true } },
            },
        });

        if (!procedure) throw new NotFoundError('Procedure not found');
        return procedure;
    }

    async create(data: any, userId: string) {
        return prisma.procedure.create({
            data: {
                ...data,
                createdById: userId,
            },
        });
    }

    async update(id: string, data: any, userId: string) {
        const procedure = await prisma.procedure.findUnique({ where: { id } });
        if (!procedure) throw new NotFoundError('Procedure not found');

        return prisma.procedure.update({
            where: { id },
            data: {
                ...data,
                updatedById: userId,
            },
        });
    }

    async delete(id: string) {
        const procedure = await prisma.procedure.findUnique({ where: { id } });
        if (!procedure) throw new NotFoundError('Procedure not found');

        await prisma.procedure.delete({ where: { id } });
        return procedure;
    }
}

export const procedureService = new ProcedureService();
