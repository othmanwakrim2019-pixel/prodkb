import { prisma } from '../../common/utils/prisma';

interface SavePostMortemInput {
    summary?: string;
    rootCause?: string;
    timeline?: string;
    impact?: string;
    lessonsLearned?: string;
    preventiveActions?: string;
    status?: string;
}

class PostMortemService {
    async findIncidentTeam(incidentId: string) {
        return prisma.incident.findUnique({
            where: { id: incidentId },
            select: { assignedTeamId: true },
        });
    }

    async findByIncidentId(incidentId: string) {
        return prisma.postMortem.findUnique({
            where: { incidentId },
            include: {
                createdBy: {
                    select: { id: true, name: true, email: true },
                },
            },
        });
    }

    async saveByIncidentId(incidentId: string, userId: string, input: SavePostMortemInput) {
        return prisma.postMortem.upsert({
            where: { incidentId },
            create: {
                incidentId,
                summary: input.summary || '',
                rootCause: input.rootCause || '',
                timeline: input.timeline || '',
                impact: input.impact || '',
                lessonsLearned: input.lessonsLearned || '',
                preventiveActions: input.preventiveActions || '',
                status: input.status || 'DRAFT',
                createdById: userId,
            },
            update: {
                summary: input.summary,
                rootCause: input.rootCause,
                timeline: input.timeline,
                impact: input.impact,
                lessonsLearned: input.lessonsLearned,
                preventiveActions: input.preventiveActions,
                status: input.status || 'DRAFT',
            },
            include: {
                createdBy: {
                    select: { id: true, name: true, email: true },
                },
            },
        });
    }
}

export const postMortemService = new PostMortemService();
