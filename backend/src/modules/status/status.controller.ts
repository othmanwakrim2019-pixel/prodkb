import type { Request, Response } from 'express';
import { statusService } from './status.service';

export class StatusController {
    static async getPublicStatus(_req: Request, res: Response) {
        try {
            const data = await statusService.getPublicStatus();
            res.json(data);
        } catch {
            res.status(500).json({ error: 'Failed to load status data' });
        }
    }
}
