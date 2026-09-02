import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'StockFlow REST API',
    version: '1.0.0',
    description: 'API documentation for StockFlow — Minimal Inventory & Invoicing System.',
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Local Development Server',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              message: { type: 'string', example: 'Invalid request data' },
              details: { type: 'array', items: { type: 'object' } },
            },
          },
        },
      },
      HealthResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'ok' },
          uptime: { type: 'number', example: 12.45 },
          timestamp: { type: 'string', example: '2026-09-03T00:00:00.000Z' },
          version: { type: 'string', example: '1.0.0' },
          service: { type: 'string', example: 'StockFlow Backend API' },
        },
      },
    },
  },
  paths: {
    '/api/health': {
      get: {
        summary: 'System health check',
        description: 'Returns the operational status and uptime of the backend service.',
        responses: {
          '200': {
            description: 'Backend is healthy',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/HealthResponse',
                },
              },
            },
          },
        },
      },
    },
  },
};

export const setupSwagger = (app: Express): void => {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    customSiteTitle: 'StockFlow API Docs',
  }));
};
