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
      RegisterRequest: {
        type: 'object',
        required: ['email', 'password', 'name'],
        properties: {
          email: { type: 'string', format: 'email', example: 'user@example.com' },
          password: { type: 'string', minLength: 8, example: 'Password123!' },
          name: { type: 'string', example: 'John Doe' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'demo@stockflow.dev' },
          password: { type: 'string', example: 'Password123!' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: '9c9584f4-4e6e-4df0-8a95-454068f7cbbc' },
                  email: { type: 'string', example: 'demo@stockflow.dev' },
                  name: { type: 'string', example: 'Demo Manager' },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' },
                },
              },
              token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            },
          },
        },
      },
      UserProfileResponse: {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  name: { type: 'string' },
                  createdAt: { type: 'string' },
                  updatedAt: { type: 'string' },
                },
              },
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
      Product: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'd459eeff-af4f-4b28-9458-5e91d37498ea' },
          userId: { type: 'string', example: '9c9584f4-4e6e-4df0-8a95-454068f7cbbc' },
          sku: { type: 'string', example: 'SKU-SCAN-01' },
          name: { type: 'string', example: 'Wireless Barcode Scanner' },
          description: { type: 'string', example: 'Handheld 2D Bluetooth barcode scanner' },
          unitPrice: { type: 'integer', example: 8500, description: 'Stored in cents' },
          quantityOnHand: { type: 'integer', example: 25 },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateProductRequest: {
        type: 'object',
        required: ['sku', 'name', 'unitPrice', 'quantityOnHand'],
        properties: {
          sku: { type: 'string', example: 'SKU-NEW-01' },
          name: { type: 'string', example: 'Laser Barcode Reader' },
          description: { type: 'string', example: 'Industrial grade barcode scanner' },
          unitPrice: {
            type: 'integer',
            minimum: 0,
            example: 9900,
            description: 'Price in cents ($99.00)',
          },
          quantityOnHand: { type: 'integer', minimum: 0, example: 20 },
        },
      },
      UpdateProductRequest: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'Updated Product Name' },
          description: { type: 'string', example: 'Updated description' },
          unitPrice: { type: 'integer', minimum: 0, example: 10500 },
          quantityOnHand: { type: 'integer', minimum: 0, example: 25 },
        },
      },
    },
  },
  paths: {
    '/api/health': {
      get: {
        tags: ['System'],
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
    '/api/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register a new user account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/RegisterRequest',
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'User registered successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/AuthResponse',
                },
              },
            },
          },
          '400': { description: 'Validation error' },
          '409': { description: 'Email already registered' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Log in with email and password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/LoginRequest',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Authenticated successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/AuthResponse',
                },
              },
            },
          },
          '401': { description: 'Invalid email or password' },
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Get current authenticated user profile',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'Current user profile',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/UserProfileResponse',
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/auth/logout': {
      post: {
        tags: ['Authentication'],
        summary: 'Acknowledge client logout and token invalidation',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': { description: 'Logged out successfully' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/products': {
      get: {
        tags: ['Products'],
        summary: 'List products with pagination and search',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Paginated product list' },
          '401': { description: 'Unauthorized' },
        },
      },
      post: {
        tags: ['Products'],
        summary: 'Create a new product in the catalog',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CreateProductRequest',
              },
            },
          },
        },
        responses: {
          '201': { description: 'Product created' },
          '400': { description: 'Validation error' },
          '409': { description: 'SKU already in use' },
        },
      },
    },
    '/api/products/{id}': {
      get: {
        tags: ['Products'],
        summary: 'Get product details by ID',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Product details' },
          '404': { description: 'Product not found' },
        },
      },
      put: {
        tags: ['Products'],
        summary: 'Update product information',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UpdateProductRequest',
              },
            },
          },
        },
        responses: {
          '200': { description: 'Product updated' },
          '404': { description: 'Product not found' },
        },
      },
      delete: {
        tags: ['Products'],
        summary: 'Delete product (blocked if referenced by an invoice)',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Product deleted' },
          '404': { description: 'Product not found' },
          '409': { description: 'Product referenced in an existing invoice' },
        },
      },
    },
    '/api/invoices': {
      get: {
        tags: ['Invoices'],
        summary: 'List invoices with pagination and status filter',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string', enum: ['DRAFT', 'ISSUED', 'PAID', 'CANCELLED'] },
          },
        ],
        responses: {
          '200': { description: 'Paginated invoice list' },
          '401': { description: 'Unauthorized' },
        },
      },
      post: {
        tags: ['Invoices'],
        summary: 'Create a draft invoice with stock guard',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['customerName', 'issueDate', 'dueDate', 'items'],
                properties: {
                  customerName: { type: 'string', example: 'Acme Logistics Ltd' },
                  issueDate: { type: 'string', format: 'date-time' },
                  dueDate: { type: 'string', format: 'date-time' },
                  notes: { type: 'string', example: 'Deliver to Bay 4' },
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['productId', 'quantity'],
                      properties: {
                        productId: { type: 'string' },
                        quantity: { type: 'integer', minimum: 1, example: 2 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Draft invoice created with calculated totals' },
          '422': { description: 'Stock insufficient for one or more products' },
        },
      },
    },
    '/api/invoices/{id}': {
      get: {
        tags: ['Invoices'],
        summary: 'Get invoice details by ID with line items',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Invoice details' },
          '404': { description: 'Invoice not found' },
        },
      },
      put: {
        tags: ['Invoices'],
        summary: 'Update DRAFT invoice details or items (blocked if not DRAFT)',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Invoice updated' },
          '422': { description: 'Only DRAFT invoices can be edited' },
        },
      },
    },
    '/api/invoices/{id}/issue': {
      post: {
        tags: ['Invoices'],
        summary: 'Issue invoice: atomically decrement product stock on hand (DRAFT -> ISSUED)',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Invoice issued and stock decremented' },
          '422': { description: 'Stock insufficient or illegal status transition' },
        },
      },
    },
    '/api/invoices/{id}/pay': {
      post: {
        tags: ['Invoices'],
        summary: 'Mark invoice as paid (ISSUED -> PAID)',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Invoice marked as paid' },
          '422': { description: 'Only ISSUED invoices can be marked as paid' },
        },
      },
    },
    '/api/invoices/{id}/cancel': {
      post: {
        tags: ['Invoices'],
        summary: 'Cancel invoice: atomically restores stock if ISSUED (ISSUED/DRAFT -> CANCELLED)',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Invoice cancelled and stock restored if previously issued' },
          '422': { description: 'PAID invoices cannot be cancelled' },
        },
      },
    },
  },
};

export const setupSwagger = (app: Express): void => {
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, {
      customSiteTitle: 'StockFlow API Docs',
    })
  );
};
