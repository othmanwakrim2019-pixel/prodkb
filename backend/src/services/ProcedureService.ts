/**
 * Procedure Service - Business logic for procedure management
 * @module services/ProcedureService
 */

import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import { NotFoundError, ValidationError } from '../errors/AppError';
import type { CreateProcedureDTO, IProcedure } from '../types';

/**
 * Service class for procedure-related business logic
 */
export class ProcedureService {
    private readonly defaultInclude = {
        system: true,
        job: true,
        createdBy: { select: { id: true, name: true } },
        updatedBy: { select: { id: true, name: true } },
        _count: { select: { incidents: true } },
    };

    /**
     * Get all procedures with optional search
     * @param search - Optional search query
     */
    async findAll(search?: string): Promise<IProcedure[]> {
        const where: Record<string, unknown> = {};

        if (search) {
            where.OR = [
                { title: { contains: search } },
                { description: { contains: search } },
                { errorCode: { contains: search } },
                { tags: { contains: search } },
            ];
        }

        const procedures = await prisma.procedure.findMany({
            where,
            include: this.defaultInclude,
            orderBy: { updatedAt: 'desc' },
        });

        logger.debug('Fetched procedures', { count: procedures.length, search });

        return procedures as unknown as IProcedure[];
    }

    /**
     * Get a single procedure by ID
     * @param id - Procedure ID
     */
    async findById(id: string): Promise<IProcedure> {
        const procedure = await prisma.procedure.findUnique({
            where: { id },
            include: {
                ...this.defaultInclude,
                incidents: {
                    select: { id: true, title: true, status: true, createdAt: true },
                    take: 10,
                },
            },
        });

        if (!procedure) {
            throw new NotFoundError('Procedure');
        }

        return procedure as unknown as IProcedure;
    }

    /**
     * Create a new procedure
     * @param data - Procedure creation data
     * @param userId - ID of the user creating the procedure
     */
    async create(data: CreateProcedureDTO, userId: string): Promise<IProcedure> {
        // Validate system exists
        const system = await prisma.system.findUnique({ where: { id: data.systemId } });
        if (!system) {
            throw new ValidationError('Invalid system ID');
        }

        // Validate job if provided
        if (data.jobId) {
            const job = await prisma.job.findUnique({ where: { id: data.jobId } });
            if (!job) {
                throw new ValidationError('Invalid job ID');
            }
        }

        const procedure = await prisma.procedure.create({
            data: {
                title: data.title,
                description: data.description,
                systemId: data.systemId,
                jobId: data.jobId || null,
                rootCause: data.rootCause || null,
                resolutionSteps: data.resolutionSteps,
                workaround: data.workaround || null,
                commands: data.commands || null,
                errorCode: data.errorCode || null,
                tags: data.tags || null,
                createdById: userId,
            },
            include: this.defaultInclude,
        });

        logger.info('Procedure created', { procedureId: procedure.id, userId });

        return procedure as unknown as IProcedure;
    }

    /**
     * Update a procedure
     * @param id - Procedure ID
     * @param data - Update data
     * @param userId - ID of the user making the update
     */
    async update(id: string, data: Partial<CreateProcedureDTO>, userId: string): Promise<IProcedure> {
        await this.findById(id); // Throws if not found

        const procedure = await prisma.procedure.update({
            where: { id },
            data: {
                ...data,
                updatedById: userId,
            },
            include: this.defaultInclude,
        });

        logger.info('Procedure updated', { procedureId: id, userId, changes: Object.keys(data) });

        return procedure as unknown as IProcedure;
    }

    /**
     * Delete a procedure
     * @param id - Procedure ID
     * @param userId - ID of the user deleting
     */
    async delete(id: string, userId: string): Promise<void> {
        await this.findById(id); // Throws if not found

        await prisma.procedure.delete({ where: { id } });

        logger.info('Procedure deleted', { procedureId: id, userId });
    }

    /**
     * Search procedures by error code
     * @param errorCode - Error code to search for
     */
    async findByErrorCode(errorCode: string): Promise<IProcedure[]> {
        const procedures = await prisma.procedure.findMany({
            where: {
                errorCode: { contains: errorCode },
            },
            include: this.defaultInclude,
        });

        return procedures as unknown as IProcedure[];
    }
}

// Export singleton instance
export const procedureService = new ProcedureService();
