
import { Request, Response, NextFunction } from 'express';
import { searchService } from './search.service';

export class SearchController {
    static async globalSearch(req: Request, res: Response, next: NextFunction) {
        const { query } = req.query;
        const searchStr = String(query); // Check empty? controller did check.

        if (!query) {
            return res.status(400).json({ error: 'Query parameter is required' });
        }

        try {
            const result = await searchService.globalSearch(searchStr);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }
}
