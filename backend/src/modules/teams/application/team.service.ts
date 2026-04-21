import { NotFoundError, ValidationError } from '../../../common/errors/app.error';
import { teamRepository } from '../infrastructure/prisma-team.repository';
import type { TeamPaginationParams } from '../domain/team.repository';

export class TeamService {
    async create(data: { name: string; description?: string; emailDistribution: string; sendEmail?: boolean }) {
        return teamRepository.createTeam(data);
    }

    async findAll(pagination: TeamPaginationParams = {}) {
        return teamRepository.findTeams(pagination);
    }

    async findById(id: string) {
        const team = await teamRepository.findTeamById(id);
        if (!team) throw new NotFoundError('Team not found');
        return team;
    }

    async update(id: string, data: { name?: string; description?: string | null; emailDistribution?: string; isActive?: boolean; sendEmail?: boolean }) {
        await this.findById(id);
        return teamRepository.updateTeam(id, data);
    }

    async delete(id: string) {
        const team = await teamRepository.findTeamWithUsage(id);
        if (!team) throw new NotFoundError('Team not found');

        const reasons: string[] = [];
        if (team._count.incidents > 0) reasons.push(`${team._count.incidents} incident(s)`);
        if (team._count.jobs > 0) reasons.push(`${team._count.jobs} job(s)`);
        if (team._count.members > 0) reasons.push(`${team._count.members} membre(s)`);

        if (reasons.length > 0) {
            throw new ValidationError(
                `Impossible de supprimer l'équipe "${team.name}" car elle est liée à : ${reasons.join(', ')}. Veuillez d'abord supprimer ces éléments.`
            );
        }

        await teamRepository.deleteTeam(id);
        return team;
    }

    async addMember(teamId: string, userId: string, role: string) {
        await this.findById(teamId);
        return teamRepository.createTeamMember(teamId, userId, role);
    }

    async removeMember(teamId: string, userId: string) {
        try {
            await teamRepository.deleteTeamMember(teamId, userId);
        } catch (error) {
            throw new NotFoundError('Team member not found');
        }
    }
}

export const teamService = new TeamService();
