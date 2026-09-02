import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/product.service';

export class ProductController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await ProductService.create(req.user!.id, req.body);
      res.status(201).json({
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ProductService.list(req.user!.id, req.query as any);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await ProductService.getById(req.user!.id, req.params.id);
      res.status(200).json({
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await ProductService.update(req.user!.id, req.params.id, req.body);
      res.status(200).json({
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ProductService.delete(req.user!.id, req.params.id);
      res.status(200).json({
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
