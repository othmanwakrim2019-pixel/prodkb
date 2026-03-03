import { Router, Request, Response } from 'express';
import { statusService } from './status.service';

const router = Router();

// Public route — no auth required
router.get('/', async (req: Request, res: Response) => {
    try {
        const data = await statusService.getPublicStatus();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load status data' });
    }
});

export const statusRoutes = router;
