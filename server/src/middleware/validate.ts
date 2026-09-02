import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';

// TS interface only exist during compile time, so I used zod to bridge it to catch
// bad payloads before they touch controllers or db services

export const validate =
  (schema: AnyZodObject) =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      next(error);
    }
  };
