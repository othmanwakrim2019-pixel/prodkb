import { ValidationError } from '../../../../common/errors/app.error';
import type { AuthRequest } from '../../../../common/middleware/auth.middleware';

export const requirePlanningUserId = (req: AuthRequest) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new ValidationError('User not authenticated');
    }

    return userId;
};
