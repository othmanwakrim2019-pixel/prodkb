import { PlanningStatus } from '@prisma/client';
import { ValidationError } from '../../../common/errors/app.error';

const ALLOWED_TRANSITIONS: Record<PlanningStatus, PlanningStatus[]> = {
    [PlanningStatus.pending]: [PlanningStatus.running, PlanningStatus.done, PlanningStatus.failed, PlanningStatus.blocked],
    [PlanningStatus.running]: [PlanningStatus.done, PlanningStatus.failed, PlanningStatus.pending],
    [PlanningStatus.done]: [PlanningStatus.pending],
    [PlanningStatus.failed]: [PlanningStatus.pending, PlanningStatus.running],
    [PlanningStatus.blocked]: [PlanningStatus.pending],
};

export function validatePlanningTransition(from: PlanningStatus, to: PlanningStatus): void {
    if (!ALLOWED_TRANSITIONS[from]?.includes(to)) {
        throw new ValidationError(`Status transition from '${from}' to '${to}' is not allowed`);
    }
}
