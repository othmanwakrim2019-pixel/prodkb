import { prisma } from '../../../common/utils/prisma';

class WarRoomService {
    async findIncidentTeam(incidentId: string) {
        return prisma.incident.findUnique({
            where: { id: incidentId },
            select: { assignedTeamId: true },
        });
    }

    async getHistory(incidentId: string, limit = 100) {
        return prisma.warRoomMessage.findMany({
            where: { incidentId },
            include: {
                user: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'asc' },
            take: limit,
        });
    }

    async saveMessage(incidentId: string, userId: string, content: string, type: 'message' | 'system_event' = 'message') {
        return prisma.warRoomMessage.create({
            data: { incidentId, userId, content, type },
            include: {
                user: { select: { id: true, name: true } },
            },
        });
    }

    async postSystemEvent(incidentId: string, content: string) {
        // Use a sentinel system user ID — find first admin
        const admin = await prisma.user.findFirst({ where: { isActive: true } });
        if (!admin) return null;
        return this.saveMessage(incidentId, admin.id, content, 'system_event');
    }
}

export const warRoomService = new WarRoomService();
