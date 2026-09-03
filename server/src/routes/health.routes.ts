import { Router, Request, Response } from 'express';
import { env } from '../config/env';

export const healthRouter = Router();

/**
 * @openapi
 * /api/health:
 *   get:
 *     summary: System health check
 *     description: Returns the operational status and uptime of the backend service and env configs.
 *     responses:
 *       200:
 *         description: Service is healthy.
 */
healthRouter.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'StockFlow Backend API',
    taxPercent: env.DEFAULT_TAX_PERCENT,
  });
});
