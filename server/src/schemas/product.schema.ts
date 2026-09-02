import { z } from 'zod';

export const createProductSchema = z.object({
  body: z.object({
    sku: z
      .string({ required_error: 'SKU is required' })
      .trim()
      .min(1, 'SKU cannot be blank'),
    name: z
      .string({ required_error: 'Name is required' })
      .trim()
      .min(1, 'Name cannot be blank'),
    description: z.string().trim().optional(),
    unitPrice: z
      .number({ required_error: 'Unit price is required' })
      .int('Unit price must be an integer in minor units (cents)')
      .min(0, 'Unit price cannot be negative'),
    quantityOnHand: z
      .number({ required_error: 'Quantity on hand is required' })
      .int('Quantity on hand must be an integer')
      .min(0, 'Quantity on hand cannot be negative'),
  }),
});

export const updateProductSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Name cannot be blank').optional(),
    description: z.string().trim().optional(),
    unitPrice: z
      .number()
      .int('Unit price must be an integer in minor units (cents)')
      .min(0, 'Unit price cannot be negative')
      .optional(),
    quantityOnHand: z
      .number()
      .int('Quantity on hand must be an integer')
      .min(0, 'Quantity on hand cannot be negative')
      .optional(),
  }),
  params: z.object({
    id: z.string().uuid('Invalid product ID format'),
  }),
});

export const getProductByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid product ID format'),
  }),
});

export const listProductsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(10).optional(),
    search: z.string().trim().optional(),
  }),
});

export type CreateProductInput = z.infer<typeof createProductSchema>['body'];
export type UpdateProductInput = z.infer<typeof updateProductSchema>['body'];
export type ListProductsQuery = z.infer<typeof listProductsSchema>['query'];
