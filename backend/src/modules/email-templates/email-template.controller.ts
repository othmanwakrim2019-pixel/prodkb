
import { Request, Response, NextFunction } from 'express';
import { emailTemplateService } from './email-template.service';

export class EmailTemplateController {
    static async getAllTemplates(req: Request, res: Response, next: NextFunction) {
        try {
            const templates = await emailTemplateService.findAll();
            res.json(templates);
        } catch (error) {
            next(error);
        }
    }

    static async getTemplate(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const template = await emailTemplateService.findById(id);
            res.json(template);
        } catch (error) {
            next(error);
        }
    }

    static async updateTemplate(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { subject, body, enabled, cc } = req.body;
            const template = await emailTemplateService.update(id, { subject, body, enabled, cc });
            res.json(template);
        } catch (error) {
            next(error);
        }
    }

    static async previewTemplate(req: Request, res: Response, next: NextFunction) {
        try {
            const { subject, body } = req.body;
            const preview = await emailTemplateService.preview(subject, body);
            res.json(preview);
        } catch (error) {
            next(error);
        }
    }
}
