import { Prisma, Product } from '@prisma/client';
import { prisma } from '../config/db';
import { env } from '../config/env';
import { CreateInvoiceInput, UpdateInvoiceInput, ListInvoicesQuery } from '../schemas/invoice.schema';
import { AppError } from '../middleware/errorHandler';

export class InvoiceService {
  /**
   * Generates a unique sequential invoice number per year.
   * e.g. INV-2026-0001
   */
  private static async generateInvoiceNumber(tx: Prisma.TransactionClient): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;

    const count = await tx.invoice.count({
      where: {
        invoiceNumber: {
          startsWith: prefix,
        },
      },
    });

    const sequence = (count + 1).toString().padStart(4, '0');
    return `${prefix}${sequence}`;
  }

  /**
   * Core financial calculation for invoice line items and totals.
   * Enforces integer minor units (cents) with zero floating-point arithmetic.
   */
  private static calculateTotals<T extends { unitPrice: number; quantity: number }>(items: T[]) {
    const taxRatePercent = env.DEFAULT_TAX_PERCENT;
    const taxRateBasisPoints = taxRatePercent * 100;

    let subtotal = 0;
    const computedItems = items.map((item) => {
      const lineTotal = item.unitPrice * item.quantity;
      subtotal += lineTotal;
      return {
        ...item,
        lineTotal,
      };
    });

    // Tax calculation rounded to nearest whole cent
    const taxAmount = Math.round((subtotal * taxRatePercent) / 100);
    const total = subtotal + taxAmount;

    return {
      subtotal,
      taxRate: taxRateBasisPoints,
      taxAmount,
      total,
      computedItems,
    };
  }

  static async create(userId: string, input: CreateInvoiceInput) {
    return prisma.$transaction(async (tx) => {
      // 1. Fetch referenced products belonging to this user
      const productIds = Array.from(new Set(input.items.map((i) => i.productId)));
      const products = await tx.product.findMany({
        where: {
          id: { in: productIds },
          userId,
        },
      });

      if (products.length !== productIds.length) {
        throw new AppError('One or more referenced products do not exist in your catalog', 400, 'PRODUCT_NOT_FOUND');
      }

      const productMap = new Map<string, Product>(products.map((p: Product) => [p.id, p]));

      // 2. Validate Stock Guards (Rule V5) & Snapshot details (Rule V4)
      const itemsToCreate = input.items.map((item) => {
        const product = productMap.get(item.productId)!;

        // Rule V5: Stock guard on invoice creation
        if (item.quantity > product.quantityOnHand) {
          throw new AppError(
            `Insufficient stock for '${product.name}' (${product.sku}). Available: ${product.quantityOnHand}, Requested: ${item.quantity}.`,
            422,
            'STOCK_INSUFFICIENT'
          );
        }

        return {
          productId: product.id,
          productName: product.name, // Snapshot
          unitPrice: product.unitPrice, // Snapshot
          quantity: item.quantity,
        };
      });

      // 3. Rule V2: Server calculates totals
      const { subtotal, taxRate, taxAmount, total, computedItems } = this.calculateTotals(itemsToCreate);

      // 4. Generate unique invoice number
      const invoiceNumber = await this.generateInvoiceNumber(tx);

      // 5. Create Invoice and snapshot Line Items
      const invoice = await tx.invoice.create({
        data: {
          userId,
          invoiceNumber,
          customerName: input.customerName.trim(),
          issueDate: new Date(input.issueDate),
          dueDate: new Date(input.dueDate),
          notes: input.notes?.trim() || null,
          status: 'DRAFT',
          subtotal,
          taxRate,
          taxAmount,
          total,
          items: {
            create: computedItems.map((ci) => ({
              productId: ci.productId,
              productName: ci.productName,
              unitPrice: ci.unitPrice,
              quantity: ci.quantity,
              lineTotal: ci.lineTotal,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      return invoice;
    });
  }

  static async list(userId: string, query: ListInvoicesQuery) {
    const rawPage = query.page ? Number(query.page) : 1;
    const rawLimit = query.limit ? Number(query.limit) : 10;
    const page = !isNaN(rawPage) && rawPage > 0 ? rawPage : 1;
    const limit = !isNaN(rawLimit) && rawLimit > 0 && rawLimit <= 100 ? rawLimit : 10;
    const skip = (page - 1) * limit;

    const where: Prisma.InvoiceWhereInput = { userId };
    if (query.status) {
      where.status = query.status;
    }

    const [total, invoices] = await Promise.all([
      prisma.invoice.count({ where }),
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data: invoices,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  static async getById(userId: string, id: string) {
    const invoice = await prisma.invoice.findFirst({
      where: { id, userId },
      include: {
        items: true,
      },
    });

    if (!invoice) {
      throw new AppError('Invoice not found', 404, 'NOT_FOUND');
    }

    return invoice;
  }

  static async update(userId: string, id: string, input: UpdateInvoiceInput) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.invoice.findFirst({
        where: { id, userId },
        include: { items: true },
      });

      if (!existing) {
        throw new AppError('Invoice not found', 404, 'NOT_FOUND');
      }

      // Rule V9: Only DRAFT invoices may have their line items edited
      if (existing.status !== 'DRAFT') {
        throw new AppError(
          `Cannot edit invoice in '${existing.status}' status. Only DRAFT invoices can be modified.`,
          422,
          'INVOICE_NOT_EDITABLE'
        );
      }

      let subtotal = existing.subtotal;
      let taxAmount = existing.taxAmount;
      let total = existing.total;
      let itemsData = undefined;

      // If items are being updated
      if (input.items && input.items.length > 0) {
        const productIds = Array.from(new Set(input.items.map((i) => i.productId)));
        const products = await tx.product.findMany({
          where: {
            id: { in: productIds },
            userId,
          },
        });

        if (products.length !== productIds.length) {
          throw new AppError('One or more referenced products do not exist', 400, 'PRODUCT_NOT_FOUND');
        }

        const productMap = new Map<string, Product>(products.map((p: Product) => [p.id, p]));

        const itemsToCreate = input.items.map((item) => {
          const product = productMap.get(item.productId)!;

          if (item.quantity > product.quantityOnHand) {
            throw new AppError(
              `Insufficient stock for '${product.name}' (${product.sku}). Available: ${product.quantityOnHand}, Requested: ${item.quantity}.`,
              422,
              'STOCK_INSUFFICIENT'
            );
          }

          return {
            productId: product.id,
            productName: product.name,
            unitPrice: product.unitPrice,
            quantity: item.quantity,
          };
        });

        const calculated = this.calculateTotals(itemsToCreate);
        subtotal = calculated.subtotal;
        taxAmount = calculated.taxAmount;
        total = calculated.total;

        // Delete existing items and recreate
        await tx.invoiceItem.deleteMany({
          where: { invoiceId: existing.id },
        });

        itemsData = calculated.computedItems.map((ci) => ({
          productId: ci.productId,
          productName: ci.productName,
          unitPrice: ci.unitPrice,
          quantity: ci.quantity,
          lineTotal: ci.lineTotal,
        }));
      }

      const updated = await tx.invoice.update({
        where: { id: existing.id },
        data: {
          customerName: input.customerName !== undefined ? input.customerName.trim() : undefined,
          issueDate: input.issueDate !== undefined ? new Date(input.issueDate) : undefined,
          dueDate: input.dueDate !== undefined ? new Date(input.dueDate) : undefined,
          notes: input.notes !== undefined ? input.notes?.trim() || null : undefined,
          subtotal,
          taxAmount,
          total,
          items: itemsData ? { create: itemsData } : undefined,
        },
        include: {
          items: true,
        },
      });

      return updated;
    });
  }

  /**
   * Rule V6 & V8: Issue Invoice (DRAFT -> ISSUED)
   * Decrements product quantityOnHand atomically within a transaction.
   */
  static async issue(userId: string, id: string) {
    return prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findFirst({
        where: { id, userId },
        include: { items: true },
      });

      if (!invoice) {
        throw new AppError('Invoice not found', 404, 'NOT_FOUND');
      }

      // Rule V8: Status transition guard
      if (invoice.status !== 'DRAFT') {
        throw new AppError(
          `Cannot issue invoice with status '${invoice.status}'. Only DRAFT invoices can be issued.`,
          422,
          'INVALID_STATE_TRANSITION'
        );
      }

      // Re-verify stock on hand for all line items within the transaction
      for (const item of invoice.items) {
        if (!item.productId) continue;

        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new AppError(
            `Product '${item.productName}' no longer exists in catalog`,
            404,
            'PRODUCT_NOT_FOUND'
          );
        }

        if (product.quantityOnHand < item.quantity) {
          throw new AppError(
            `Cannot issue invoice: Insufficient stock for '${product.name}' (${product.sku}). Available: ${product.quantityOnHand}, Requested: ${item.quantity}.`,
            422,
            'STOCK_INSUFFICIENT'
          );
        }

        // Rule V6: Decrement stock atomically
        await tx.product.update({
          where: { id: product.id },
          data: {
            quantityOnHand: {
              decrement: item.quantity,
            },
          },
        });

        // Record stock movement audit entry
        await tx.stockMovement.create({
          data: {
            productId: product.id,
            invoiceId: invoice.id,
            quantityChange: -item.quantity,
            reason: 'INVOICE_ISSUED',
          },
        });
      }

      // Transition status to ISSUED
      const updatedInvoice = await tx.invoice.update({
        where: { id: invoice.id },
        data: { status: 'ISSUED' },
        include: { items: true },
      });

      return updatedInvoice;
    });
  }

  /**
   * Rule V8: Mark Invoice as Paid (ISSUED -> PAID)
   * Terminal state.
   */
  static async markAsPaid(userId: string, id: string) {
    const invoice = await prisma.invoice.findFirst({
      where: { id, userId },
    });

    if (!invoice) {
      throw new AppError('Invoice not found', 404, 'NOT_FOUND');
    }

    // Rule V8: Only ISSUED invoices can transition to PAID
    if (invoice.status !== 'ISSUED') {
      throw new AppError(
        `Cannot mark invoice as PAID from '${invoice.status}' status. Only ISSUED invoices can be marked as PAID.`,
        422,
        'INVALID_STATE_TRANSITION'
      );
    }

    const updated = await prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: 'PAID' },
      include: { items: true },
    });

    return updated;
  }

  /**
   * Rule V7 & V8: Cancel Invoice
   * If status was ISSUED: restores stock atomically.
   * If status was DRAFT: marks as CANCELLED with no stock effect.
   * PAID and CANCELLED are terminal and cannot be cancelled.
   */
  static async cancel(userId: string, id: string) {
    return prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findFirst({
        where: { id, userId },
        include: { items: true },
      });

      if (!invoice) {
        throw new AppError('Invoice not found', 404, 'NOT_FOUND');
      }

      if (invoice.status === 'PAID') {
        throw new AppError('Cannot cancel an invoice that has already been PAID.', 422, 'INVALID_STATE_TRANSITION');
      }

      if (invoice.status === 'CANCELLED') {
        throw new AppError('Invoice is already CANCELLED.', 422, 'INVALID_STATE_TRANSITION');
      }

      // Rule V7: If ISSUED, restore stock atomically
      if (invoice.status === 'ISSUED') {
        for (const item of invoice.items) {
          if (!item.productId) continue;

          await tx.product.update({
            where: { id: item.productId },
            data: {
              quantityOnHand: {
                increment: item.quantity,
              },
            },
          });

          // Record stock movement audit entry
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              invoiceId: invoice.id,
              quantityChange: item.quantity,
              reason: 'INVOICE_CANCELLED',
            },
          });
        }
      }

      // Transition to terminal CANCELLED status
      const updated = await tx.invoice.update({
        where: { id: invoice.id },
        data: { status: 'CANCELLED' },
        include: { items: true },
      });

      return updated;
    });
  }
}
