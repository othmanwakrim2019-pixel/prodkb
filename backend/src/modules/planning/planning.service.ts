
import { prisma } from '../../common/utils/prisma';
import { logger } from '../../common/utils/logger';
import { NotFoundError, ValidationError } from '../../common/errors/app.error';
import { PlanningPeriod, PlanningStatus, TaskType, InstanceStatus, type PlanningJob } from '@prisma/client';

// --- State Transition Validation ---

// BATCH:        pending → running → done/failed | done → pending (reopen)
// MANUAL_ACTION: pending → done/failed/blocked    | done → pending (reopen)
const ALLOWED_TRANSITIONS: Record<PlanningStatus, PlanningStatus[]> = {
    [PlanningStatus.pending]: [PlanningStatus.running, PlanningStatus.done, PlanningStatus.failed, PlanningStatus.blocked],
    [PlanningStatus.running]: [PlanningStatus.done, PlanningStatus.failed, PlanningStatus.pending],
    [PlanningStatus.done]: [PlanningStatus.pending], // allow reopening
    [PlanningStatus.failed]: [PlanningStatus.pending, PlanningStatus.running],
    [PlanningStatus.blocked]: [PlanningStatus.pending],
};

function validateTransition(from: PlanningStatus, to: PlanningStatus): void {
    if (!ALLOWED_TRANSITIONS[from]?.includes(to)) {
        throw new ValidationError(`Status transition from '${from}' to '${to}' is not allowed`);
    }
}

// --- Planning Instance Service ---

export class PlanningInstanceService {

    async findAll(filters?: { period?: PlanningPeriod; status?: InstanceStatus }) {
        const where: Record<string, unknown> = {};
        if (filters?.period) where.period = filters.period;
        if (filters?.status) where.status = filters.status;

        return prisma.planningInstance.findMany({
            where,
            include: {
                createdBy: { select: { id: true, name: true, email: true } },
                _count: { select: { jobs: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findById(id: string) {
        const instance = await prisma.planningInstance.findUnique({
            where: { id },
            include: {
                createdBy: { select: { id: true, name: true, email: true } },
                _count: { select: { jobs: true } },
            },
        });
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
        return prisma.planningInstance.create({
            data: {
                name: data.name,
                description: data.description,
                period: data.period,
                startDate: data.startDate,
                endDate: data.endDate,
                createdById: data.createdById,
            },
            include: {
                createdBy: { select: { id: true, name: true, email: true } },
            },
        });
    }

    async archive(id: string) {
        await this.findById(id);
        return prisma.planningInstance.update({
            where: { id },
            data: { status: InstanceStatus.archived },
        });
    }

    async reactivate(id: string) {
        await this.findById(id);
        return prisma.planningInstance.update({
            where: { id },
            data: { status: InstanceStatus.active },
        });
    }

    /**
     * Clone an existing planning instance for the next month.
     * Copies all jobs, advances scheduledTime by 1 month, resets statuses to pending.
     */
    async cloneForNextMonth(instanceId: string, createdById: string) {
        const source = await prisma.planningInstance.findUnique({
            where: { id: instanceId },
            include: { jobs: true },
        });
        if (!source) throw new NotFoundError('Planning instance not found');

        // Advance start/end dates by 1 month
        const advanceMonth = (d: Date) => {
            const next = new Date(d);
            next.setMonth(next.getMonth() + 1);
            return next;
        };

        const newInstance = await prisma.planningInstance.create({
            data: {
                name: source.name.replace(/\d{4}$/, '') + new Date(advanceMonth(source.startDate)).getFullYear()
                    || `${source.name} (Clone)`,
                description: source.description ?? undefined,
                period: source.period,
                startDate: advanceMonth(source.startDate),
                endDate: advanceMonth(source.endDate),
                createdById,
                status: InstanceStatus.active,
            },
        });

        // Map old job IDs to new job IDs to fix dependency references
        const idMap = new Map<string, string>();
        const createdJobs: PlanningJob[] = [];

        for (const job of source.jobs) {
            const newJob = await prisma.planningJob.create({
                data: {
                    instanceId: newInstance.id,
                    systemId: job.systemId ?? undefined,
                    jobId: job.jobId ?? undefined,
                    customTaskName: job.customTaskName ?? undefined,
                    scheduledTime: advanceMonth(job.scheduledTime),
                    dependencies: [], // fill after all created
                    status: PlanningStatus.pending,
                    taskType: job.taskType,
                    supportContact: job.supportContact ?? undefined,
                    notes: undefined,
                    positionX: job.positionX ?? undefined,
                    positionY: job.positionY ?? undefined,
                },
            });
            idMap.set(job.id, newJob.id);
            createdJobs.push(newJob);
        }

        // Now fix dependency references using the id map
        for (let i = 0; i < source.jobs.length; i++) {
            const oldJob = source.jobs[i];
            const newJobId = idMap.get(oldJob.id)!;
            const oldDeps = oldJob.dependencies as string[];
            const newDeps = oldDeps.map(depId => idMap.get(depId) || depId);

            if (newDeps.length > 0) {
                await prisma.planningJob.update({
                    where: { id: newJobId },
                    data: { dependencies: newDeps },
                });
            }
        }

        logger.info(`Cloned planning instance ${instanceId} → ${newInstance.id} with ${createdJobs.length} jobs`);

        return prisma.planningInstance.findUnique({
            where: { id: newInstance.id },
            include: {
                createdBy: { select: { id: true, name: true, email: true } },
                _count: { select: { jobs: true } },
            },
        });
    }

    /** Delete a planning instance and all its jobs (cascade) */
    async delete(id: string) {
        const instance = await prisma.planningInstance.findUnique({ where: { id } });
        if (!instance) throw new NotFoundError('Planning instance not found');
        await prisma.planningInstance.delete({ where: { id } });
        logger.info(`Deleted planning instance ${id}`);
        return instance;
    }

    /**
     * Import a planning instance from parsed CSV rows.
     * Each row must follow the defined 9-column format.
     */
    async importFromCsv(params: {
        instanceName: string;
        period: PlanningPeriod;
        rows: Record<string, string>[];
        createdById: string;
    }) {
        const { instanceName, period, rows, createdById } = params;
        const warnings: string[] = [];
        const skipped: string[] = [];

        // ── 1. Filter valid rows (must have ref + task_type + date) ──────────
        const validRows = rows.filter(r => {
            const ref = r.ref?.trim();
            const taskType = r.task_type?.trim().toUpperCase();
            const date = r.date?.trim();
            if (!ref || !date) return false;
            if (taskType !== 'BATCH' && taskType !== 'MANUAL') {
                skipped.push(`Row ref="${ref}": unknown task_type "${taskType}" — skipped`);
                return false;
            }
            return true;
        });

        if (validRows.length === 0) {
            throw new ValidationError('No valid rows found in CSV. Make sure ref, task_type, and date columns are filled in.');
        }

        // ── 2. Detect duplicate refs ─────────────────────────────────────────
        const seenRefs = new Set<string>();
        for (const r of validRows) {
            const ref = r.ref.trim();
            if (seenRefs.has(ref)) {
                throw new ValidationError(`Duplicate ref "${ref}" found in CSV. Each row must have a unique ref.`);
            }
            seenRefs.add(ref);
        }

        // ── 3. Parse dates ───────────────────────────────────────────────────
        const parseDate = (dateStr: string, timeStr: string): Date => {
            // Supports: DD/MM/YYYY, D/M/YYYY, M/D/YY, DD/MM/YY
            const [datePart] = [dateStr.trim()];
            const timePart = timeStr?.trim() || '08:00';
            const parts = datePart.split('/');
            let d: Date;
            if (parts.length === 3) {
                const [p1, p2, p3] = parts.map(Number);
                const year = p3 < 100 ? 2000 + p3 : p3;
                // If day > 12, must be DD/MM format
                const month = p1 > 12 ? p2 - 1 : p2 - 1; // still MM in both cases after swap
                const day = p1 > 12 ? p1 : p2;
                const mm = p1 > 12 ? p2 : p1;
                // DD/MM/YYYY: p1 is day (> 12 gives it away), else ambiguous — treat as MM/DD/YY
                if (p1 > 12) {
                    d = new Date(year, p2 - 1, p1);
                } else {
                    // treat as MM/DD/YY (US format like planning_dump.csv)
                    d = new Date(year, p1 - 1, p2);
                }
            } else {
                d = new Date(dateStr);
            }
            const [hh, mm2] = timePart.split(':').map(Number);
            d.setHours(hh || 8, mm2 || 0, 0, 0);
            return d;
        };

        // ── 4. Resolve system/job refs for BATCH rows ────────────────────────
        const systemCache = new Map<string, string>(); // name → id
        const jobCache = new Map<string, string>();    // code → id

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

        for (const r of validRows) {
            const ref = r.ref.trim();
            const taskType = r.task_type.trim().toUpperCase() as 'BATCH' | 'MANUAL';
            const scheduledTime = parseDate(r.date, r.time);
            const supportParts = [r.support_contact, r.intervenant].filter(Boolean);
            const supportContact = supportParts.join(' / ').trim() || undefined;
            const rawDepsRefs = (r.depends_on || '')
                .split(/[,;\s]+/)
                .map(s => s.trim())
                .filter(Boolean);

            if (taskType === 'MANUAL') {
                const taskName = r.task_name?.trim();
                if (!taskName) {
                    skipped.push(`Row ref="${ref}": MANUAL task with empty task_name — skipped`);
                    continue;
                }
                resolvedJobs.push({ ref, taskType, scheduledTime, customTaskName: taskName, supportContact, rawDepsRefs });
            } else {
                // BATCH — look up system by name and job by code
                const sysName = r.system_name?.trim();
                const jobCode = r.job_code?.trim();

                if (!sysName || !jobCode) {
                    skipped.push(`Row ref="${ref}": BATCH task missing system_name or job_code — skipped`);
                    continue;
                }

                let systemId = systemCache.get(sysName);
                if (!systemId) {
                    const sys = await prisma.system.findFirst({ where: { name: { equals: sysName, mode: 'insensitive' } } });
                    if (!sys) {
                        warnings.push(`Row ref="${ref}": System "${sysName}" not found in DB — skipped`);
                        skipped.push(ref);
                        continue;
                    }
                    systemCache.set(sysName, sys.id);
                    systemId = sys.id;
                }

                let jobId = jobCache.get(jobCode);
                if (!jobId) {
                    const job = await prisma.job.findFirst({ where: { code: { equals: jobCode, mode: 'insensitive' }, systemId } });
                    if (!job) {
                        warnings.push(`Row ref="${ref}": Job code "${jobCode}" not found for system "${sysName}" — skipped`);
                        skipped.push(ref);
                        continue;
                    }
                    jobCache.set(jobCode, job.id);
                    jobId = job.id;
                }

                resolvedJobs.push({ ref, taskType, scheduledTime, systemId, jobId, supportContact, rawDepsRefs });
            }
        }

        // ── 5. Resolve depends_on refs → validate no circular deps ──────────
        const refToIdx = new Map<string, number>();
        resolvedJobs.forEach((j, i) => refToIdx.set(j.ref, i));

        const resolvedDeps: Map<number, number[]> = new Map();
        for (let i = 0; i < resolvedJobs.length; i++) {
            const deps: number[] = [];
            for (const depRef of resolvedJobs[i].rawDepsRefs) {
                const depIdx = refToIdx.get(depRef);
                if (depIdx === undefined) {
                    warnings.push(`Row ref="${resolvedJobs[i].ref}": dependency ref "${depRef}" not found — ignored`);
                } else {
                    deps.push(depIdx);
                }
            }
            resolvedDeps.set(i, deps);
        }

        // Simple cycle detection via DFS
        const visited = new Array(resolvedJobs.length).fill(0); // 0=unvisited,1=visiting,2=done
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
        for (let i = 0; i < resolvedJobs.length; i++) {
            if (detectCycle(i)) {
                throw new ValidationError('Circular dependency detected in CSV. Please check your depends_on column.');
            }
        }

        // ── 6. Compute date range from scheduled times ───────────────────────
        const dates = resolvedJobs.map(j => j.scheduledTime);
        const startDate = new Date(Math.min(...dates.map(d => d.getTime())));
        const endDate = new Date(Math.max(...dates.map(d => d.getTime())));
        // End date = end of that day
        endDate.setHours(23, 59, 59, 999);

        // ── 7. Create instance + jobs in a transaction ───────────────────────
        const result = await prisma.$transaction(async (tx) => {
            const instance = await tx.planningInstance.create({
                data: {
                    name: instanceName,
                    period,
                    startDate,
                    endDate,
                    createdById,
                    status: InstanceStatus.active,
                },
            });

            // Create all jobs first (no deps yet) to get DB IDs
            const createdJobIds: string[] = [];
            for (const job of resolvedJobs) {
                const created = await tx.planningJob.create({
                    data: {
                        instanceId: instance.id,
                        taskType: job.taskType === 'BATCH' ? TaskType.BATCH : TaskType.MANUAL_ACTION,
                        scheduledTime: job.scheduledTime,
                        systemId: job.systemId ?? undefined,
                        jobId: job.jobId ?? undefined,
                        customTaskName: job.customTaskName ?? undefined,
                        supportContact: job.supportContact ?? undefined,
                        status: PlanningStatus.pending,
                        dependencies: [],
                    },
                });
                createdJobIds.push(created.id);
            }

            // Now update dependencies using real DB IDs
            for (let i = 0; i < resolvedJobs.length; i++) {
                const depIdxs = resolvedDeps.get(i) || [];
                if (depIdxs.length > 0) {
                    const depDbIds = depIdxs.map(idx => createdJobIds[idx]);
                    await tx.planningJob.update({
                        where: { id: createdJobIds[i] },
                        data: { dependencies: depDbIds },
                    });
                }
            }

            return instance;
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


// --- Planning Job Service ---

export class PlanningJobService {

    private includeRelations = {
        system: { select: { id: true, name: true } },
        job: { select: { id: true, name: true, code: true } },
        completedBy: { select: { id: true, name: true } },
        launchedBy: { select: { id: true, name: true } },
    };

    async findByInstance(instanceId: string) {
        return prisma.planningJob.findMany({
            where: { instanceId },
            include: this.includeRelations,
            orderBy: { scheduledTime: 'asc' },
        });
    }

    async findById(id: string) {
        const job = await prisma.planningJob.findUnique({
            where: { id },
            include: this.includeRelations,
        });
        if (!job) throw new NotFoundError('Planning job not found');
        return job;
    }

    async create(data: {
        instanceId: string;
        systemId?: string;
        jobId?: string;
        customTaskName?: string;
        scheduledTime: Date;
        dependencies: string[];
        status?: PlanningStatus;
        taskType?: TaskType;
        supportContact?: string;
        notes?: string;
    }) {
        const instance = await prisma.planningInstance.findUnique({ where: { id: data.instanceId } });
        if (!instance) throw new NotFoundError('Planning instance not found');
        if (instance.status === InstanceStatus.archived) {
            throw new ValidationError('Cannot add jobs to an archived planning instance');
        }

        if (data.dependencies.length > 0) {
            await this.validateDependencies(data.dependencies, data.instanceId);
        }

        return prisma.planningJob.create({
            data: {
                instanceId: data.instanceId,
                systemId: data.systemId ?? undefined,
                jobId: data.jobId ?? undefined,
                customTaskName: data.customTaskName ?? undefined,
                scheduledTime: data.scheduledTime,
                dependencies: data.dependencies,
                status: data.status || PlanningStatus.pending,
                taskType: data.taskType || TaskType.BATCH,
                supportContact: data.supportContact,
                notes: data.notes,
            },
            include: this.includeRelations,
        });
    }

    async update(id: string, data: {
        systemId?: string;
        jobId?: string;
        scheduledTime?: Date;
        dependencies?: string[];
        taskType?: TaskType;
        supportContact?: string | null;
        notes?: string | null;
    }) {
        const existing = await this.findById(id);

        if (data.dependencies && data.dependencies.length > 0) {
            await this.validateDependencies(data.dependencies, existing.instanceId, id);

            const allJobs = await prisma.planningJob.findMany({
                where: { instanceId: existing.instanceId },
            });
            if (this.detectCycle(id, data.dependencies, allJobs)) {
                throw new ValidationError('Circular dependency detected');
            }
        }

        return prisma.planningJob.update({
            where: { id },
            data: {
                ...(data.systemId !== undefined && { systemId: data.systemId }),
                ...(data.jobId !== undefined && { jobId: data.jobId }),
                ...(data.scheduledTime !== undefined && { scheduledTime: data.scheduledTime }),
                ...(data.dependencies !== undefined && { dependencies: data.dependencies }),
                ...(data.taskType !== undefined && { taskType: data.taskType }),
                ...(data.supportContact !== undefined && { supportContact: data.supportContact }),
                ...(data.notes !== undefined && { notes: data.notes }),
            },
            include: this.includeRelations,
        });
    }

    async delete(id: string) {
        const job = await this.findById(id);

        const siblings = await prisma.planningJob.findMany({
            where: { instanceId: job.instanceId },
        });

        const cleanupPromises = siblings
            .filter(s => {
                const deps = s.dependencies as string[];
                return deps.includes(id);
            })
            .map(s => {
                const deps = (s.dependencies as string[]).filter(depId => depId !== id);
                return prisma.planningJob.update({
                    where: { id: s.id },
                    data: { dependencies: deps },
                });
            });

        await Promise.all(cleanupPromises);
        await prisma.planningJob.delete({ where: { id } });

        logger.info(`Deleted planning job ${id}, cleaned ${cleanupPromises.length} dependency references`);
        return job;
    }

    /**
     * Update job status with type-aware transitions and tracking timestamps.
     */
    async updateStatus(id: string, newStatus: PlanningStatus, userId?: string, notes?: string) {
        const job = await this.findById(id);
        validateTransition(job.status, newStatus);

        // ── Guard: transitioning to "running" ──────────────────────────────
        if (newStatus === PlanningStatus.running) {
            const deps = job.dependencies as string[];

            // 1. All direct dependencies must be done
            if (deps.length > 0) {
                const depJobs = await prisma.planningJob.findMany({
                    where: { id: { in: deps } },
                    select: { id: true, status: true },
                });
                const notDone = depJobs.filter(d => d.status !== PlanningStatus.done);
                if (notDone.length > 0) {
                    throw new ValidationError(
                        `Cannot start this task: ${notDone.length} dependency(ies) are not yet completed.`
                    );
                }
            }

            // 2. No earlier-scheduled tasks in the same instance should still be pending/running
            const earlierBlocking = await prisma.planningJob.findMany({
                where: {
                    instanceId: job.instanceId,
                    scheduledTime: { lt: job.scheduledTime },
                    status: { in: [PlanningStatus.pending, PlanningStatus.running] },
                    id: { not: id },
                },
                select: { id: true, scheduledTime: true },
                take: 1,
            });
            if (earlierBlocking.length > 0) {
                const blocked = earlierBlocking[0];
                const blockedDate = new Date(blocked.scheduledTime).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
                throw new ValidationError(
                    `Cannot start this task: there are earlier-scheduled tasks (${blockedDate}) that have not been completed yet.`
                );
            }
        }

        // ── Guard: MANUAL_ACTION done requires a note ──────────────────────
        if (job.taskType === TaskType.MANUAL_ACTION && newStatus === PlanningStatus.done && !notes) {
            throw new ValidationError('A confirmation note is required when marking a manual action as done');
        }

        const updateData: Record<string, unknown> = { status: newStatus };

        if (newStatus === PlanningStatus.running) {
            updateData.launchedAt = new Date();
            updateData.launchedById = userId || null;
        }

        if (newStatus === PlanningStatus.done) {
            updateData.completedAt = new Date();
            updateData.completedById = userId || null;
            if (notes) updateData.notes = notes;
        }

        if (newStatus === PlanningStatus.pending) {
            // Clear all tracking when reopened
            updateData.completedAt = null;
            updateData.completedById = null;
            updateData.launchedAt = null;
            updateData.launchedById = null;
        }

        const updated = await prisma.planningJob.update({
            where: { id },
            data: updateData,
            include: this.includeRelations,
        });

        // If marked done, cascade-activate dependents
        if (newStatus === PlanningStatus.done) {
            await this.cascadeActivation(id, job.instanceId);
        }

        return updated;
    }

    async complete(id: string, userId?: string, notes?: string) {
        return this.updateStatus(id, PlanningStatus.done, userId, notes);
    }

    async updatePosition(id: string, positionX: number, positionY: number) {
        return prisma.planningJob.update({
            where: { id },
            data: { positionX, positionY },
        });
    }

    async updatePositions(positions: Array<{ id: string; positionX: number; positionY: number }>) {
        const updates = positions.map(pos =>
            prisma.planningJob.update({
                where: { id: pos.id },
                data: { positionX: pos.positionX, positionY: pos.positionY },
            })
        );
        await Promise.all(updates);
    }

    // --- Private helpers ---

    private async cascadeActivation(completedJobId: string, instanceId: string) {
        const allJobs = await prisma.planningJob.findMany({
            where: { instanceId },
        });

        const autoStarted: string[] = [];
        const unblocked: string[] = [];

        for (const candidate of allJobs) {
            const deps = candidate.dependencies as string[];
            if (!deps.includes(completedJobId)) continue;
            if (candidate.status !== PlanningStatus.blocked && candidate.status !== PlanningStatus.pending) continue;

            const allDepsDone = deps.every(depId => {
                if (depId === completedJobId) return true;
                const depJob = allJobs.find(j => j.id === depId);
                return depJob?.status === PlanningStatus.done;
            });

            if (allDepsDone) {
                if (candidate.taskType === TaskType.BATCH) {
                    // Auto-start BATCH tasks: they don't require human intervention
                    await prisma.planningJob.update({
                        where: { id: candidate.id },
                        data: {
                            status: PlanningStatus.running,
                            launchedAt: new Date(),
                        },
                    });
                    autoStarted.push(candidate.id);
                } else {
                    // MANUAL_ACTION tasks: move to pending so the user can acknowledge
                    await prisma.planningJob.update({
                        where: { id: candidate.id },
                        data: { status: PlanningStatus.pending },
                    });
                    unblocked.push(candidate.id);
                }
            }
        }

        if (autoStarted.length > 0) {
            logger.info(`Job ${completedJobId} done → auto-started ${autoStarted.length} downstream BATCH job(s): ${autoStarted.join(', ')}`);
        }
        if (unblocked.length > 0) {
            logger.info(`Job ${completedJobId} done → unblocked ${unblocked.length} MANUAL job(s) awaiting user: ${unblocked.join(', ')}`);
        }
    }

    private async validateDependencies(depIds: string[], instanceId: string, excludeId?: string) {
        if (excludeId && depIds.includes(excludeId)) {
            throw new ValidationError('A job cannot depend on itself');
        }

        const existing = await prisma.planningJob.findMany({
            where: { id: { in: depIds }, instanceId },
            select: { id: true },
        });

        const foundIds = new Set(existing.map(j => j.id));
        const missing = depIds.filter(id => !foundIds.has(id));

        if (missing.length > 0) {
            throw new ValidationError(
                `Dependencies not found in this instance: ${missing.join(', ')}`
            );
        }
    }

    private detectCycle(jobId: string, deps: string[], allJobs: PlanningJob[]): boolean {
        const visited = new Set<string>();
        const stack = [...deps];
        while (stack.length > 0) {
            const current = stack.pop()!;
            if (current === jobId) return true;
            if (visited.has(current)) continue;
            visited.add(current);
            const job = allJobs.find(j => j.id === current);
            if (job) stack.push(...(job.dependencies as string[]));
        }
        return false;
    }
}

export const planningInstanceService = new PlanningInstanceService();
export const planningJobService = new PlanningJobService();
