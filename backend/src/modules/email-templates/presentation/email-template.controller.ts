
import { Request, Response, NextFunction } from 'express';
import { emailTemplateService } from '../application/email-template.service';
import { createResponse } from '../../../common/types/api.response';
import { updateEmailTemplateSchema, previewEmailTemplateSchema } from '../presentation/email-template.schema';

export class EmailTemplateController {
    static async getAllTemplates(req: Request, res: Response, next: NextFunction) {
        try {
            const templates = await emailTemplateService.findAll();
            res.json(createResponse(true, templates));
        } catch (error) {
            next(error);
        }
    }

    static async getTemplate(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const template = await emailTemplateService.findById(id);
            res.json(createResponse(true, template));
        } catch (error) {
            next(error);
        }
    }

    static async updateTemplate(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const data = updateEmailTemplateSchema.parse(req.body);
            const template = await emailTemplateService.update(id, data);
            res.json(createResponse(true, template, 'Template updated successfully'));
        } catch (error) {
            next(error);
        }
    }

    static async previewTemplate(req: Request, res: Response, next: NextFunction) {
        try {
            const { subject, body } = previewEmailTemplateSchema.parse(req.body);
            const preview = await emailTemplateService.preview(subject, body);
            res.json(createResponse(true, preview));
        } catch (error) {
            next(error);
        }
    }
}
