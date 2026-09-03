import express, { Express } from 'express';
import cors from 'cors';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { healthRouter } from './routes/health.routes';
import { authRouter } from './routes/auth.routes';
import { productRouter } from './routes/product.routes';
import { invoiceRouter } from './routes/invoice.routes';
import { setupSwagger } from './docs/swagger';

export const createApp = (): Express => {
  const app = express();

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

  // Global Error Handler
  app.use(errorHandler);

  return app;
};
