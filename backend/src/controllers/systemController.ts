import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export const getSystems = async (req: Request, res: Response) => {
    try {
        const systems = await prisma.system.findMany({
            include: {
                jobs: {
                    include: {
                        team: true
                    }
                },
                procedures: {
                    include: {
                        job: true
                    }
                }
            },
        });
        res.json(systems);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch systems' });
    }
};

export const createSystem = async (req: Request, res: Response) => {
    const { name, description } = req.body;
    try {
        const system = await prisma.system.create({
            data: { name, description },
        });
        res.status(201).json(system);
    } catch (error) {
        res.status(400).json({ error: 'Failed to create system' });
    }
};

export const getJobs = async (req: Request, res: Response) => {
    try {
        const jobs = await prisma.job.findMany({
            include: {
                system: true,
                team: true
            },
        });
        res.json(jobs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch jobs' });
    }
};

export const createJob = async (req: Request, res: Response) => {
    const { name, code, systemId, teamId } = req.body;
    try {
        const job = await prisma.job.create({
            data: {
                name,
                code,
                systemId,
                ...(teamId && { teamId })
            },
            include: {
                system: true,
                team: true
            }
        });
        res.status(201).json(job);
    } catch (error) {
        res.status(400).json({ error: 'Failed to create job' });
    }
};

export const updateSystem = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, description } = req.body;
    try {
        const system = await prisma.system.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description }),
            },
            include: { jobs: true },
        });
        res.json(system);
    } catch (error) {
        console.error('Failed to update system:', error);
        res.status(400).json({ error: 'Failed to update system' });
    }
};

export const deleteSystem = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        // Check if system has incidents or jobs
        const system = await prisma.system.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { incidents: true, jobs: true, procedures: true }
                }
            }
        });

        if (!system) {
            return res.status(404).json({ error: 'System not found' });
        }

        const totalUsage = system._count.incidents + system._count.jobs + system._count.procedures;
        if (totalUsage > 0) {
            return res.status(400).json({
                error: `Cannot delete system: ${system._count.incidents} incidents, ${system._count.jobs} jobs, ${system._count.procedures} procedures depend on it`
            });
        }

        await prisma.system.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        console.error('Failed to delete system:', error);
        res.status(500).json({ error: 'Failed to delete system' });
    }
};

export const updateJob = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, code, systemId, teamId } = req.body;
    try {
        const job = await prisma.job.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(code && { code }),
                ...(systemId && { systemId }),
                ...(teamId !== undefined && { teamId: teamId || null }),
            },
            include: {
                system: true,
                team: true,
            },
        });
        res.json(job);
    } catch (error) {
        console.error('Failed to update job:', error);
        res.status(400).json({ error: 'Failed to update job' });
    }
};

export const deleteJob = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        // Check if job has incidents or procedures
        const job = await prisma.job.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { incidents: true, procedures: true }
                }
            }
        });

        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        const totalUsage = job._count.incidents + job._count.procedures;
        if (totalUsage > 0) {
            return res.status(400).json({
                error: `Cannot delete job: ${job._count.incidents} incidents and ${job._count.procedures} procedures depend on it`
            });
        }

        await prisma.job.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        console.error('Failed to delete job:', error);
        res.status(500).json({ error: 'Failed to delete job' });
    }
};

