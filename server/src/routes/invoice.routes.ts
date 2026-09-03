import { Router } from 'express';
import { InvoiceController } from '../controllers/invoice.controller';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import {
  createInvoiceSchema,
  updateInvoiceSchema,
  getInvoiceByIdSchema,
  listInvoicesSchema,
} from '../schemas/invoice.schema';

export const invoiceRouter = Router();

// Rule A6: Every invoice endpoint strictly requires authentication
invoiceRouter.use(authenticate);

invoiceRouter.get('/', validate(listInvoicesSchema), InvoiceController.list);
invoiceRouter.post('/', validate(createInvoiceSchema), InvoiceController.create);
invoiceRouter.get('/:id', validate(getInvoiceByIdSchema), InvoiceController.getById);
invoiceRouter.put('/:id', validate(updateInvoiceSchema), InvoiceController.update);

// Rule V6, V7, V8: State Transition Actions
invoiceRouter.post('/:id/issue', validate(getInvoiceByIdSchema), InvoiceController.issue);
invoiceRouter.post('/:id/pay', validate(getInvoiceByIdSchema), InvoiceController.markAsPaid);
invoiceRouter.post('/:id/cancel', validate(getInvoiceByIdSchema), InvoiceController.cancel);
