import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import {
  createProductSchema,
  updateProductSchema,
  getProductByIdSchema,
  listProductsSchema,
} from '../schemas/product.schema';

export const productRouter = Router();

// Rule A6 & A7: Every product route requires authentication
productRouter.use(authenticate);

productRouter.get('/', validate(listProductsSchema), ProductController.list);
productRouter.post('/', validate(createProductSchema), ProductController.create);
productRouter.get('/:id', validate(getProductByIdSchema), ProductController.getById);
productRouter.put('/:id', validate(updateProductSchema), ProductController.update);
productRouter.delete('/:id', validate(getProductByIdSchema), ProductController.delete);
