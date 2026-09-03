import { z } from 'zod';

export const invoiceItemInputSchema = z.object({
  productId: z.string().uuid('Invalid product ID format'),
  quantity: z
    .number({ required_error: 'Quantity is required' })
    .int('Quantity must be an integer')
    .positive('Quantity must be greater than zero'),
});

export const createInvoiceSchema = z.object({
  body: z
    .object({
      customerName: z
        .string({ required_error: 'Customer name is required' })
        .trim()
        .min(1, 'Customer name cannot be blank'),
      issueDate: z.coerce.date({ required_error: 'Issue date is required' }),
      dueDate: z.coerce.date({ required_error: 'Due date is required' }),
      notes: z.string().trim().optional(),
      items: z
        .array(invoiceItemInputSchema)
        .min(1, 'An invoice must contain at least one line item'),
    })
    .refine((data) => data.dueDate >= data.issueDate, {
      message: 'Due date must be on or after issue date',
      path: ['dueDate'],
    }),
});

export const updateInvoiceSchema = z.object({
  body: z
    .object({
      customerName: z.string().trim().min(1, 'Customer name cannot be blank').optional(),
      issueDate: z.coerce.date().optional(),
      dueDate: z.coerce.date().optional(),
      notes: z.string().trim().optional(),
      items: z.array(invoiceItemInputSchema).min(1, 'An invoice must contain at least one line item').optional(),
    })
    .refine(
      (data) => {
        if (data.issueDate && data.dueDate) {
          return data.dueDate >= data.issueDate;
        }
        return true;
      },
      {
        message: 'Due date must be on or after issue date',
        path: ['dueDate'],
      }
    ),
  params: z.object({
    id: z.string().uuid('Invalid invoice ID format'),
  }),
});

export const getInvoiceByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid invoice ID format'),
  }),
});

export const listInvoicesSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(10).optional(),
    status: z.enum(['DRAFT', 'ISSUED', 'PAID', 'CANCELLED']).optional(),
  }),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>['body'];
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>['body'];
export type ListInvoicesQuery = z.infer<typeof listInvoicesSchema>['query'];
