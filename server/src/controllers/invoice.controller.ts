import { Request, Response, NextFunction } from 'express';
import { InvoiceService } from '../services/invoice.service';

export class InvoiceController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const invoice = await InvoiceService.create(req.user!.id, req.body);
      res.status(201).json({ data: invoice });
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await InvoiceService.list(req.user!.id, req.query as any);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const invoice = await InvoiceService.getById(req.user!.id, req.params.id);
      res.status(200).json({ data: invoice });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const invoice = await InvoiceService.update(req.user!.id, req.params.id, req.body);
      res.status(200).json({ data: invoice });
    } catch (error) {
      next(error);
    }
  }

  static async issue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const invoice = await InvoiceService.issue(req.user!.id, req.params.id);
      res.status(200).json({ data: invoice });
    } catch (error) {
      next(error);
    }
  }

  static async markAsPaid(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const invoice = await InvoiceService.markAsPaid(req.user!.id, req.params.id);
      res.status(200).json({ data: invoice });
    } catch (error) {
      next(error);
    }
  }

  static async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const invoice = await InvoiceService.cancel(req.user!.id, req.params.id);
      res.status(200).json({ data: invoice });
    } catch (error) {
      next(error);
    }
  }
}
