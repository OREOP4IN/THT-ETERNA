import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/config/db';
import { Express } from 'express';

describe('StockFlow Core Test Suite (Mandatory & Invariant Tests)', () => {
  let app: Express;
  let authToken: string;
  let userId: string;
  let testProductId: string;

  beforeAll(async () => {
    app = createApp();

    // 1. Create dedicated test user
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Automated Tester',
        email: `tester_${Date.now()}@stockflow.dev`,
        password: 'Password123!',
      });

    expect(userRes.status).toBe(201);
    authToken = userRes.body.data.token;
    userId = userRes.body.data.user.id;

    // 2. Create dedicated test product 
    // stock = 10, unitPrice = $50.00 / 5000 cents
    const productRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        sku: `SKU-TEST-${Date.now()}`,
        name: 'Industrial Barcode Scanner X',
        description: 'Test fixture product',
        unitPrice: 5000,
        quantityOnHand: 10,
      });

    expect(productRes.status).toBe(201);
    testProductId = productRes.body.data.id;
  });

  afterAll(async () => {
    // Cleanup test user and related records afterall tests are done
    if (userId) {
      await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  // Automated tests in Rule N4 line162, fullstack-js-take-home-test.md

  // ==========================================
  // 1. Mandatory Test (a): Wrong Password
  // ==========================================
  it('Mandatory Test (a): Login with incorrect password returns 401 with opaque message', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'demo@stockflow.dev',
        password: 'WrongPassword999!',
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    expect(res.body.error.message).toBe('Invalid email or password');
  });

  // ==========================================
  // 2. Mandatory Test (b): Unauthenticated Route
  // ==========================================
  it('Mandatory Test (b): Unauthenticated request to protected route returns 401', async () => {
    const res = await request(app).get('/api/products');

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  // ==========================================
  // 3. Mandatory Test (c): Stock Guard
  // ==========================================
  it('Mandatory Test (c): Invoicing quantity exceeding available quantityOnHand returns 422 stock error', async () => {
    const res = await request(app)
      .post('/api/invoices')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        customerName: 'MegaCorp Retail',
        issueDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 86400000 * 14).toISOString(),
        items: [
          {
            productId: testProductId,
            quantity: 25, // Available stock is only 10 line 39
          },
        ],
      });

    expect(res.status).toBe(422);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('STOCK_INSUFFICIENT');
    expect(res.body.error.message).toContain('Insufficient stock');
  });

  // ==========================================
  // 4. Mandatory Test (d): Atomic Stock Decrement on Issue
  // ==========================================
  it('Mandatory Test (d): Issuing an invoice decrements product stock atomically', async () => {
    // Check initial stock is 10, line 39
    const initialProduct = await prisma.product.findUnique({ where: { id: testProductId } });
    expect(initialProduct?.quantityOnHand).toBe(10);

    // Create DRAFT invoice for 3 units
    const createRes = await request(app)
      .post('/api/invoices')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        customerName: 'Logistics Partner A',
        issueDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 86400000 * 14).toISOString(),
        items: [
          {
            productId: testProductId,
            quantity: 3,
          },
        ],
      });

    expect(createRes.status).toBe(201);
    const invoiceId = createRes.body.data.id;
    expect(createRes.body.data.status).toBe('DRAFT');

    // Stock remains at 10 while invoice is still DRAFT
    const draftProduct = await prisma.product.findUnique({ where: { id: testProductId } });
    expect(draftProduct?.quantityOnHand).toBe(10);

    // Issue invoice DRAFT -> ISSUED
    const issueRes = await request(app)
      .post(`/api/invoices/${invoiceId}/issue`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(issueRes.status).toBe(200);
    expect(issueRes.body.data.status).toBe('ISSUED');

    // Stock now is decremented to 7 (10 - 3)
    const updatedProduct = await prisma.product.findUnique({ where: { id: testProductId } });
    expect(updatedProduct?.quantityOnHand).toBe(7);
  });

  // ==========================================
  // 5. Mandatory Test (e): Atomic Stock Restore on Cancel
  // ==========================================
  it('Mandatory Test (e): Cancelling an issued invoice restores stock atomically', async () => {
    // Current stock is 7 from previous test
    const currentProduct = await prisma.product.findUnique({ where: { id: testProductId } });
    expect(currentProduct?.quantityOnHand).toBe(7);

    // Create and issue a new invoice for 4 units
    const createRes = await request(app)
      .post('/api/invoices')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        customerName: 'Logistics Partner B',
        issueDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 86400000 * 14).toISOString(),
        items: [{ productId: testProductId, quantity: 4 }],
      });

    const invoiceId = createRes.body.data.id;

    const issueRes = await request(app)
      .post(`/api/invoices/${invoiceId}/issue`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(issueRes.status).toBe(200);

    // Stock decremented to 3 (7 - 4)
    const issuedProduct = await prisma.product.findUnique({ where: { id: testProductId } });
    expect(issuedProduct?.quantityOnHand).toBe(3);

    // Cancel the issued invoice (ISSUED -> CANCELLED)
    const cancelRes = await request(app)
      .post(`/api/invoices/${invoiceId}/cancel`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.status).toBe('CANCELLED');

    // Stock must be restored back to 7 (3 + 4)
    const restoredProduct = await prisma.product.findUnique({ where: { id: testProductId } });
    expect(restoredProduct?.quantityOnHand).toBe(7);
  });

  // ==========================================
  // 6. Invariant Test (f) Rule V4: Snapshot Price Integrity,  line 130, bonus test
  // ==========================================
  it('Invariant Test (f) Rule V4: Price changes to a product do not alter existing invoices', async () => {
    // Create an invoice with price $50.00
    const createRes = await request(app)
      .post('/api/invoices')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        customerName: 'Historical Price Client',
        issueDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 86400000 * 14).toISOString(),
        items: [{ productId: testProductId, quantity: 1 }],
      });

    const invoiceId = createRes.body.data.id;
    expect(createRes.body.data.subtotal).toBe(5000);
    expect(createRes.body.data.items[0].unitPrice).toBe(5000);

    // Update product catalog price to $100.00
    const updateRes = await request(app)
      .put(`/api/products/${testProductId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        unitPrice: 10000,
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.unitPrice).toBe(10000);

    // Fetch historical invoice
    // must still show original unitPrice = 5000 and subtotal = 5000
    const fetchRes = await request(app)
      .get(`/api/invoices/${invoiceId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(fetchRes.status).toBe(200);
    expect(fetchRes.body.data.subtotal).toBe(5000);
    expect(fetchRes.body.data.items[0].unitPrice).toBe(5000);
  });

  // ==========================================
  // 7. Invariant Test (g) Rule I4: Referential Integrity Guard
  // ==========================================
  it('Invariant Test (g) Rule I4: Deleting a product referenced in an existing invoice returns HTTP 409 Conflict', async () => {
    // testProductId is referenced in invoices created above
    const deleteRes = await request(app)
      .delete(`/api/products/${testProductId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(deleteRes.status).toBe(409);
    expect(deleteRes.body.error).toBeDefined();
    expect(deleteRes.body.error.code).toBe('PRODUCT_REFERENCED_IN_INVOICE');
    expect(deleteRes.body.error.message).toContain('referenced in');
  });

  // ==========================================
  // 8. Invariant Test (h) Rule V8, V9: State Machine Guard
  // ==========================================
  it('Invariant Test (h) Rule V8, V9: Illegal state transitions and mutations on non-draft invoices are rejected', async () => {
    // Create draft invoice
    const createRes = await request(app)
      .post('/api/invoices')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        customerName: 'State Machine Test Co',
        issueDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 86400000 * 14).toISOString(),
        items: [{ productId: testProductId, quantity: 1 }],
      });

    const invoiceId = createRes.body.data.id;

    // 1. Cannot transition directly from DRAFT to PAID
    const illegalPayRes = await request(app)
      .post(`/api/invoices/${invoiceId}/pay`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(illegalPayRes.status).toBe(422);
    expect(illegalPayRes.body.error.code).toBe('INVALID_STATE_TRANSITION');

    // 2. Issue invoice
    await request(app)
      .post(`/api/invoices/${invoiceId}/issue`)
      .set('Authorization', `Bearer ${authToken}`);

    // 3. Cannot edit line items or details once in ISSUED state (Rule V9)
    const editIssuedRes = await request(app)
      .put(`/api/invoices/${invoiceId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ customerName: 'Attempted Renamed Customer' });

    expect(editIssuedRes.status).toBe(422);
    expect(editIssuedRes.body.error.code).toBe('INVOICE_NOT_EDITABLE');

    // 4. Cancel invoice (ISSUED -> CANCELLED)
    await request(app)
      .post(`/api/invoices/${invoiceId}/cancel`)
      .set('Authorization', `Bearer ${authToken}`);

    // 5. Cannot pay a CANCELLED invoice (terminal state)
    const payCancelledRes = await request(app)
      .post(`/api/invoices/${invoiceId}/pay`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(payCancelledRes.status).toBe(422);
    expect(payCancelledRes.body.error.code).toBe('INVALID_STATE_TRANSITION');
  });
});
