
import { prisma } from '../../common/utils/prisma';
import { NotFoundError } from '../../common/errors/app.error';

export class SlaService {
    async findAllSLAs() {
        return prisma.sLA.findMany({
            include: {
                _count: {
                    select: {
                        incidents: true,
                    },
                },
            },
            orderBy: [
                { severity: 'asc' },
                { name: 'asc' },
            ],
        });
    }

    async findSLAById(id: string) {
        const sla = await prisma.sLA.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        incidents: true,
                    },
                },
            },
        });

        if (!sla) throw new NotFoundError('SLA not found');
        return sla;
    }

    async createSLA(data: any) {
        return prisma.sLA.create({
            data,
        });
    }

    async updateSLA(id: string, data: any) {
        // Verify existence
        await this.findSLAById(id);

        return prisma.sLA.update({
            where: { id },
            data,
        });
    }

    async deleteSLA(id: string) {
        // Verify existence
        const sla = await this.findSLAById(id);

        // Note: Prisma might throw error if foreign key constraints exist and not handled.
        // Assuming incidents linked to SLA might prevent deletion or set null depending on schema.
        // Schema says: incidents Incident[]
        // Incident model: sla SLA? @relation(fields: [slaId], references: [id], onDelete: SetNull)
        // So deletion is safe, will set incident.slaId to null.

        await prisma.sLA.delete({
            where: { id },
        });

        return sla;
    }
}

export const slaService = new SlaService();
