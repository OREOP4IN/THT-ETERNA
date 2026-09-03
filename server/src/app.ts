import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { healthRouter } from './routes/health.routes';
import { authRouter } from './routes/auth.routes';
import { productRouter } from './routes/product.routes';
import { invoiceRouter } from './routes/invoice.routes';
import { setupSwagger } from './docs/swagger';

export const createApp = (): Express => {
  const app = express();

  // Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // Cross-Origin Resource Sharing
  app.use(
    cors({
      origin: [env.CLIENT_URL, 'http://localhost:5173'],
      credentials: true,
    })
  );

  // Body Parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Swagger Documentation
  setupSwagger(app);

  // Mount Routes
  app.use('/api/health', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/products', productRouter);
  app.use('/api/invoices', invoiceRouter);

  // 404 Handler for undefined API routes
  app.use((_req, res) => {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'The requested API endpoint does not exist',
      },
    });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
};
