import { prisma } from '../config/db';
import { CreateProductInput, UpdateProductInput, ListProductsQuery } from '../schemas/product.schema';
import { AppError } from '../middleware/errorHandler';

export class ProductService {
  static async create(userId: string, input: CreateProductInput) {
    const normalizedSku = input.sku.trim().toUpperCase();

    // Enforce SKU uniqueness within user's workspace
    // So diff tenants could still use the same SKU
    const existing = await prisma.product.findUnique({
      where: {
        userId_sku: {
          userId,
          sku: normalizedSku,
        },
      },
    });

    if (existing) {
      throw new AppError(`Product SKU '${normalizedSku}' is already in use in your catalog`, 409, 'SKU_EXISTS');
    }

    // Execute product creation and initial stock audit entry in transaction
    const product = await prisma.$transaction(async (tx) => {
      const newProduct = await tx.product.create({
        data: {
          userId,
          sku: normalizedSku,
          name: input.name.trim(),
          description: input.description?.trim() || null,
          unitPrice: input.unitPrice,
          quantityOnHand: input.quantityOnHand,
        },
      });

      // Audit movement
      await tx.stockMovement.create({
        data: {
          productId: newProduct.id,
          quantityChange: newProduct.quantityOnHand,
          reason: 'INITIAL',
        },
      });

      return newProduct;
    });

    return product;
  }

  static async list(userId: string, query: ListProductsQuery) {
    const rawPage = query.page ? Number(query.page) : 1;
    const rawLimit = query.limit ? Number(query.limit) : 10;
    const page = !isNaN(rawPage) && rawPage > 0 ? rawPage : 1;
    const limit = !isNaN(rawLimit) && rawLimit > 0 && rawLimit <= 100 ? rawLimit : 10;
    const skip = (page - 1) * limit;

    const searchFilter = query.search?.trim()
      ? {
          OR: [
            { name: { contains: query.search.trim() } },
            { sku: { contains: query.search.trim().toUpperCase() } },
          ],
        }
      : {};

    const where = {
      userId,
      ...searchFilter,
    };

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data: products,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  static async getById(userId: string, id: string) {
    const product = await prisma.product.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        stockMovements: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!product) {
      throw new AppError('Product not found', 404, 'NOT_FOUND');
    }

    return product;
  }

  static async update(userId: string, id: string, input: UpdateProductInput) {
    // Verify product exists and belongs to user
    const existing = await prisma.product.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new AppError('Product not found', 404, 'NOT_FOUND');
    }

    const updated = await prisma.$transaction(async (tx) => {
      // If stock changed manually, record audit movement
      if (input.quantityOnHand !== undefined && input.quantityOnHand !== existing.quantityOnHand) {
        const delta = input.quantityOnHand - existing.quantityOnHand;
        await tx.stockMovement.create({
          data: {
            productId: existing.id,
            quantityChange: delta,
            reason: 'MANUAL_ADJUSTMENT',
          },
        });
      }

      return tx.product.update({
        where: { id: existing.id },
        data: {
          name: input.name !== undefined ? input.name.trim() : undefined,
          description: input.description !== undefined ? input.description?.trim() || null : undefined,
          unitPrice: input.unitPrice !== undefined ? input.unitPrice : undefined,
          quantityOnHand: input.quantityOnHand !== undefined ? input.quantityOnHand : undefined,
        },
      });
    });

    return updated;
  }

  static async delete(userId: string, id: string) {
    // Verify product exists and belongs to user
    const product = await prisma.product.findFirst({
      where: { id, userId },
    });

    if (!product) {
      throw new AppError('Product not found', 404, 'NOT_FOUND');
    }

    // Rule I4: A product referenced by an existing invoice wont silently disappear.
    const invoiceCount = await prisma.invoiceItem.count({
      where: { productId: id },
    });

    if (invoiceCount > 0) {
      throw new AppError(
        `Cannot delete product '${product.name}' (${product.sku}) because it is referenced in ${invoiceCount} invoice(s). Historical invoices must be preserved.`,
        409,
        'PRODUCT_REFERENCED_IN_INVOICE'
      );
    }

    await prisma.product.delete({
      where: { id: product.id },
    });

    return {
      message: `Product '${product.name}' (${product.sku}) deleted successfully`,
    };
  }
}
