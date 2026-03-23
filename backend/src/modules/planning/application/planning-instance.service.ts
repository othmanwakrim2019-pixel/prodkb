import { PlanningPeriod, PlanningStatus, InstanceStatus, type PlanningJob } from '@prisma/client';
import { logger } from '../../../common/utils/logger';
import { NotFoundError, ValidationError } from '../../../common/errors/app.error';
import { planningRepository } from '../repositories/planning.repository';

export class PlanningInstanceService {
    async findAll(filters?: { period?: PlanningPeriod; status?: InstanceStatus }) {
        return planningRepository.findInstances(filters);
    }

    async findById(id: string) {
        const instance = await planningRepository.findInstanceById(id);
        if (!instance) throw new NotFoundError('Planning instance not found');
        return instance;
    }

    async create(data: {
        name: string;
        description?: string;
        period: PlanningPeriod;
        startDate: Date;
        endDate: Date;
        createdById: string;
    }) {
        return planningRepository.createInstance(data);
    }

    async archive(id: string) {
        await this.findById(id);
        return planningRepository.updateInstanceStatus(id, InstanceStatus.archived);
    }

    async reactivate(id: string) {
        await this.findById(id);
        return planningRepository.updateInstanceStatus(id, InstanceStatus.active);
    }

    async cloneForNextMonth(instanceId: string, createdById: string) {
        const source = await planningRepository.findInstanceWithJobs(instanceId);
        if (!source) throw new NotFoundError('Planning instance not found');

        const advanceMonth = (date: Date) => {
            const next = new Date(date);
            next.setMonth(next.getMonth() + 1);
            return next;
        };

        const newInstance = await planningRepository.createInstance({
            name: source.name.replace(/\d{4}$/, '') + new Date(advanceMonth(source.startDate)).getFullYear()
                || `${source.name} (Clone)`,
            description: source.description ?? undefined,
            period: source.period,
            startDate: advanceMonth(source.startDate),
            endDate: advanceMonth(source.endDate),
            createdById,
            status: InstanceStatus.active,
        });

        const idMap = new Map<string, string>();
        const createdJobs: PlanningJob[] = [];

        for (const job of source.jobs) {
            const newJob = await planningRepository.createJob({
                instanceId: newInstance.id,
                systemId: job.systemId ?? undefined,
                jobId: job.jobId ?? undefined,
                customTaskName: job.customTaskName ?? undefined,
                scheduledTime: advanceMonth(job.scheduledTime),
                dependencies: [],
                status: PlanningStatus.pending,
                taskType: job.taskType,
                supportContact: job.supportContact ?? undefined,
                notes: undefined,
                positionX: job.positionX ?? undefined,
                positionY: job.positionY ?? undefined,
            });

            idMap.set(job.id, newJob.id);
            createdJobs.push(newJob as PlanningJob);
        }

        for (const oldJob of source.jobs) {
            const newJobId = idMap.get(oldJob.id);
            if (!newJobId) continue;

            const oldDeps = oldJob.dependencies as string[];
            const newDeps = oldDeps.map((depId) => idMap.get(depId) || depId);

            if (newDeps.length > 0) {
                await planningRepository.updateJobDependencies(newJobId, newDeps);
            }
        }

        logger.info(`Cloned planning instance ${instanceId} -> ${newInstance.id} with ${createdJobs.length} jobs`);

        return planningRepository.findInstanceById(newInstance.id);
    }

    async delete(id: string) {
        const instance = await planningRepository.findInstanceRecord(id);
        if (!instance) throw new NotFoundError('Planning instance not found');

        await planningRepository.deleteInstance(id);
        logger.info(`Deleted planning instance ${id}`);
        return instance;
    }

    async importFromCsv(params: {
        instanceName: string;
        period: PlanningPeriod;
        rows: Record<string, string>[];
        createdById: string;
    }) {
        const { instanceName, period, rows, createdById } = params;
        const warnings: string[] = [];
        const skipped: string[] = [];

        const validRows = rows.filter((row) => {
            const ref = row.ref?.trim();
            const taskType = row.task_type?.trim().toUpperCase();
            const date = row.date?.trim();
            if (!ref || !date) return false;
            if (taskType !== 'BATCH' && taskType !== 'MANUAL') {
                skipped.push(`Row ref="${ref}": unknown task_type "${taskType}" - skipped`);
                return false;
            }
            return true;
        });

        if (validRows.length === 0) {
            throw new ValidationError('No valid rows found in CSV. Make sure ref, task_type, and date columns are filled in.');
        }

        const seenRefs = new Set<string>();
        for (const row of validRows) {
            const ref = row.ref.trim();
            if (seenRefs.has(ref)) {
                throw new ValidationError(`Duplicate ref "${ref}" found in CSV. Each row must have a unique ref.`);
            }
            seenRefs.add(ref);
        }

        const parseDate = (dateStr: string, timeStr: string): Date => {
            const timePart = timeStr?.trim() || '08:00';
            const parts = dateStr.trim().split('/');
            let date: Date;

            if (parts.length === 3) {
                const [p1, p2, p3] = parts.map(Number);
                const year = p3 < 100 ? 2000 + p3 : p3;
                date = p1 > 12
                    ? new Date(year, p2 - 1, p1)
                    : new Date(year, p1 - 1, p2);
            } else {
                date = new Date(dateStr);
            }

            const [hh, mm] = timePart.split(':').map(Number);
            date.setHours(hh || 8, mm || 0, 0, 0);
            return date;
        };

        const systemCache = new Map<string, string>();
        const jobCache = new Map<string, string>();
        const resolvedJobs: Array<{
            ref: string;
            taskType: 'BATCH' | 'MANUAL';
            scheduledTime: Date;
            customTaskName?: string;
            systemId?: string;
            jobId?: string;
            supportContact?: string;
            rawDepsRefs: string[];
        }> = [];

        for (const row of validRows) {
            const ref = row.ref.trim();
            const taskType = row.task_type.trim().toUpperCase() as 'BATCH' | 'MANUAL';
            const scheduledTime = parseDate(row.date, row.time);
            const supportParts = [row.support_contact, row.intervenant].filter(Boolean);
            const supportContact = supportParts.join(' / ').trim() || undefined;
            const rawDepsRefs = (row.depends_on || '')
                .split(/[,;\s]+/)
                .map((value) => value.trim())
                .filter(Boolean);

            if (taskType === 'MANUAL') {
                const taskName = row.task_name?.trim();
                if (!taskName) {
                    skipped.push(`Row ref="${ref}": MANUAL task with empty task_name - skipped`);
                    continue;
                }

                resolvedJobs.push({ ref, taskType, scheduledTime, customTaskName: taskName, supportContact, rawDepsRefs });
                continue;
            }

            const systemName = row.system_name?.trim();
            const jobCode = row.job_code?.trim();
            if (!systemName || !jobCode) {
                skipped.push(`Row ref="${ref}": BATCH task missing system_name or job_code - skipped`);
                continue;
            }

            let systemId = systemCache.get(systemName);
            if (!systemId) {
                const system = await planningRepository.findSystemByNameInsensitive(systemName);
                if (!system) {
                    warnings.push(`Row ref="${ref}": System "${systemName}" not found in DB - skipped`);
                    skipped.push(ref);
                    continue;
                }

                systemCache.set(systemName, system.id);
                systemId = system.id;
            }

            let jobId = jobCache.get(jobCode);
            if (!jobId) {
                const job = await planningRepository.findJobByCodeAndSystem(jobCode, systemId);
                if (!job) {
                    warnings.push(`Row ref="${ref}": Job code "${jobCode}" not found for system "${systemName}" - skipped`);
                    skipped.push(ref);
                    continue;
                }

                jobCache.set(jobCode, job.id);
                jobId = job.id;
            }

            resolvedJobs.push({ ref, taskType, scheduledTime, systemId, jobId, supportContact, rawDepsRefs });
        }

        const refToIndex = new Map<string, number>();
        resolvedJobs.forEach((job, index) => refToIndex.set(job.ref, index));

        const resolvedDeps: Map<number, number[]> = new Map();
        for (let index = 0; index < resolvedJobs.length; index++) {
            const deps: number[] = [];
            for (const depRef of resolvedJobs[index].rawDepsRefs) {
                const depIndex = refToIndex.get(depRef);
                if (depIndex === undefined) {
                    warnings.push(`Row ref="${resolvedJobs[index].ref}": dependency ref "${depRef}" not found - ignored`);
                } else {
                    deps.push(depIndex);
                }
            }
            resolvedDeps.set(index, deps);
        }

        const visited = new Array(resolvedJobs.length).fill(0);
        const detectCycle = (node: number): boolean => {
            if (visited[node] === 1) return true;
            if (visited[node] === 2) return false;
            visited[node] = 1;
            for (const dep of resolvedDeps.get(node) || []) {
                if (detectCycle(dep)) return true;
            }
            visited[node] = 2;
            return false;
        };

        for (let index = 0; index < resolvedJobs.length; index++) {
            if (detectCycle(index)) {
                throw new ValidationError('Circular dependency detected in CSV. Please check your depends_on column.');
            }
        }

        const dates = resolvedJobs.map((job) => job.scheduledTime);
        const startDate = new Date(Math.min(...dates.map((date) => date.getTime())));
        const endDate = new Date(Math.max(...dates.map((date) => date.getTime())));
        endDate.setHours(23, 59, 59, 999);

        const result = await planningRepository.createImportedInstanceWithJobs({
            instanceName,
            period,
            startDate,
            endDate,
            createdById,
            jobs: resolvedJobs.map((job) => ({
                taskType: job.taskType,
                scheduledTime: job.scheduledTime,
                customTaskName: job.customTaskName,
                systemId: job.systemId,
                jobId: job.jobId,
                supportContact: job.supportContact,
            })),
            resolvedDeps,
        });

        logger.info(`Imported planning instance "${instanceName}" with ${resolvedJobs.length} jobs`);

        return {
            instance: result,
            jobsCreated: resolvedJobs.length,
            skipped,
            warnings,
        };
    }
}

export const planningInstanceService = new PlanningInstanceService();
