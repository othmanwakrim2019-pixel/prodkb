import { NotFoundError, ValidationError, ConflictError } from '../../common/errors/app.error';
import { systemRepository, type SystemPaginationParams } from './repositories/system.repository';

export class SystemService {
    async findAllSystems(pagination: SystemPaginationParams = {}) {
        return systemRepository.findSystems(pagination);
    }

    async createSystem(data: { name: string; description?: string }) {
        const existing = await systemRepository.findSystemByName(data.name);
        if (existing) throw new ConflictError('System with this name already exists');

        return systemRepository.createSystem(data);
    }

    async updateSystem(id: string, data: { name?: string; description?: string | null }) {
        const system = await systemRepository.findSystemById(id);
        if (!system) throw new NotFoundError('System not found');

        return systemRepository.updateSystem(id, data);
    }

    async deleteSystem(id: string) {
        const system = await systemRepository.findSystemWithUsage(id);
        if (!system) throw new NotFoundError('System not found');

        const totalUsage = system._count.incidents + system._count.jobs + system._count.procedures;
        if (totalUsage > 0) {
            throw new ValidationError(
                `Cannot delete system: ${system._count.incidents} incidents, ${system._count.jobs} jobs, ${system._count.procedures} procedures depend on it`
            );
        }

        await systemRepository.deleteSystem(id);
        return system;
    }

    async findAllJobs(pagination: SystemPaginationParams = {}) {
        return systemRepository.findJobs(pagination);
    }

    async createJob(data: { name: string; code: string; systemId: string; teamId?: string }) {
        const system = await systemRepository.findSystemRef(data.systemId);
        if (!system) throw new ValidationError('Invalid system ID');

        const existing = await systemRepository.findJobByCode(data.code);
        if (existing) throw new ConflictError('Job with this code already exists');

        return systemRepository.createJob(data);
    }

    async updateJob(id: string, data: { name?: string; code?: string; systemId?: string; teamId?: string | null }) {
        const job = await systemRepository.findJobById(id);
        if (!job) throw new NotFoundError('Job not found');

        return systemRepository.updateJob(id, data);
    }

    async deleteJob(id: string) {
        const job = await systemRepository.findJobWithUsage(id);
        if (!job) throw new NotFoundError('Job not found');

        const totalUsage = job._count.incidents + job._count.procedures;
        if (totalUsage > 0) {
            throw new ValidationError(
                `Cannot delete job: ${job._count.incidents} incidents and ${job._count.procedures} procedures depend on it`
            );
        }

        await systemRepository.deleteJob(id);
        return job;
    }

    async findSystemById(id: string) {
        const system = await systemRepository.findSystemById(id);
        if (!system) throw new NotFoundError('System not found');
        return system;
    }

    async findJobById(id: string) {
        const job = await systemRepository.findJobById(id);
        if (!job) throw new NotFoundError('Job not found');
        return job;
    }
}

export const systemService = new SystemService();
