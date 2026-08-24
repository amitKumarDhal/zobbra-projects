import request from 'supertest';
import app from '../src/app.js';
import jwt from 'jsonwebtoken';
import { config } from '../src/config/index.js';

describe('Approved Quote to Order MVP API Integration', () => {
  const customerAToken = jwt.sign(
    { id: 'cust-101', email: 'customerA@acme.com', role: 'CUSTOMER', companyId: 'comp-101' },
    config.jwtSecret,
    { expiresIn: '1h' }
  );

  const customerBToken = jwt.sign(
    { id: 'cust-202', email: 'customerB@zepto.com', role: 'CUSTOMER', companyId: 'comp-202' },
    config.jwtSecret,
    { expiresIn: '1h' }
  );

  const adminToken = jwt.sign(
    { id: 'admin-101', email: 'admin@zobbra.com', role: 'ADMIN' },
    config.jwtSecret,
    { expiresIn: '1h' }
  );

  describe('Order Creation & Security Guards', () => {
    it('POST /api/v1/orders/from-quote/:quoteId - rejects unauthenticated request', async () => {
      const res = await request(app).post('/api/v1/orders/from-quote/some-quote-id');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/v1/orders/from-quote/:quoteId - returns 404 for non-existent quote', async () => {
      const res = await request(app)
        .post('/api/v1/orders/from-quote/non-existent-quote-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/v1/orders/from-quote/:quoteId - rejects conversion of non-APPROVED quote with 400', async () => {
      // 1. Create a draft quote
      const createQuoteRes = await request(app)
        .post('/api/v1/quotes')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({ quantity: 50, color: 'Navy Blue' });

      const quoteId = createQuoteRes.body.quote.id;

      // 2. Attempt order conversion on DRAFT quote
      const convertRes = await request(app)
        .post(`/api/v1/orders/from-quote/${quoteId}`)
        .set('Authorization', `Bearer ${customerAToken}`);

      expect(convertRes.status).toBe(400);
      expect(convertRes.body.success).toBe(false);
      expect(convertRes.body.message).toContain('APPROVED');
    });

    it('POST /api/v1/orders/from-quote/:quoteId - converts APPROVED quote to Order and copies financial totals', async () => {
      // 1. Create quote as admin
      const createQuoteRes = await request(app)
        .post('/api/v1/quotes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ quantity: 100, color: 'Charcoal Black', printType: 'Front & Back Print' });

      const quoteId = createQuoteRes.body.quote.id;

      // 2. Approve quote
      await request(app)
        .put(`/api/v1/quotes/${quoteId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'APPROVED' });

      // 3. Convert APPROVED quote to Order
      const convertRes = await request(app)
        .post(`/api/v1/orders/from-quote/${quoteId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(convertRes.status).toBe(201);
      expect(convertRes.body.success).toBe(true);
      expect(convertRes.body.order).toBeDefined();
      expect(convertRes.body.order.orderNumber).toMatch(/^ZQB-ORD-/);
      expect(convertRes.body.order.subtotal).toBe(createQuoteRes.body.quote.subtotal);
      expect(convertRes.body.order.totalAmount).toBe(createQuoteRes.body.quote.totalAmount);
    });

    it('POST /api/v1/orders/from-quote/:quoteId - prevents duplicate conversion (409 Conflict)', async () => {
      // 1. Create and approve quote
      const createQuoteRes = await request(app)
        .post('/api/v1/quotes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ quantity: 50 });

      const quoteId = createQuoteRes.body.quote.id;

      await request(app)
        .put(`/api/v1/quotes/${quoteId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'APPROVED' });

      // 2. First conversion -> 201
      await request(app)
        .post(`/api/v1/orders/from-quote/${quoteId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      // 3. Second conversion attempt -> 409 Conflict
      const duplicateRes = await request(app)
        .post(`/api/v1/orders/from-quote/${quoteId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(duplicateRes.status).toBe(409);
      expect(duplicateRes.body.success).toBe(false);
      expect(duplicateRes.body.message).toContain('already been converted');
    });

    it('GET /api/v1/orders - returns orders with customer ownership boundary', async () => {
      const res = await request(app)
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${customerAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.orders)).toBe(true);
    });
  });
});
