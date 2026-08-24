import request from 'supertest';
import app from '../src/app.js';
import jwt from 'jsonwebtoken';
import { config } from '../src/config/index.js';
import { calculateServerPricing } from '../src/modules/quotes/quotes.controller.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
jest.setTimeout(30000);

describe('Quote Management & Server-Side Pricing API Integration', () => {
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

  beforeAll(async () => {
    await prisma.company.upsert({
      where: { id: 'comp-101' },
      update: {},
      create: {
        id: 'comp-101',
        name: 'Acme Corp',
        gstin: '21TESTA1234A1Z5',
        address: 'Plot 101, Test Road',
        city: 'Bhubaneswar',
        state: 'Odisha',
        pincode: '751024',
      },
    });
    await prisma.company.upsert({
      where: { id: 'comp-202' },
      update: {},
      create: {
        id: 'comp-202',
        name: 'Zepto Corp',
        gstin: '22TESTB2345B2Z6',
        address: 'Plot 202, Test Road',
        city: 'Bhubaneswar',
        state: 'Odisha',
        pincode: '751024',
      },
    });
    await prisma.user.upsert({
      where: { id: 'cust-101' },
      update: { companyId: 'comp-101' },
      create: {
        id: 'cust-101',
        email: 'customerA@acme.com',
        passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
        name: 'Customer A',
        role: 'CUSTOMER',
        companyId: 'comp-101',
      },
    });
    await prisma.user.upsert({
      where: { id: 'cust-202' },
      update: { companyId: 'comp-202' },
      create: {
        id: 'cust-202',
        email: 'customerB@zepto.com',
        passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
        name: 'Customer B',
        role: 'CUSTOMER',
        companyId: 'comp-202',
      },
    });
    await prisma.user.upsert({
      where: { id: 'admin-101' },
      update: {},
      create: {
        id: 'admin-101',
        email: 'admin@zobbra.com',
        passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
        name: 'Admin Test',
        role: 'ADMIN',
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Server-Side Pricing Engine', () => {
    it('calculates correct unit rates, 5% GST, and total for 100 Pcs with Front & Back Print', () => {
      const pricing = calculateServerPricing(249, 100, 'Front & Back Print', 5.0);
      expect(pricing.unitPrice).toBe(219 + 40); // (249-30) + 40 = 259
      expect(pricing.subtotal).toBe(259 * 100); // 25,900
      expect(pricing.gstTotal).toBe(1295); // 5% of 25,900
      expect(pricing.totalAmount).toBe(27195);
    });
  });

  describe('Quote API Endpoints & Security Controls', () => {
    it('POST /api/v1/quotes - should reject unauthenticated request', async () => {
      const res = await request(app).post('/api/v1/quotes').send({ quantity: 50 });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/v1/quotes - creates authenticated quote with server calculated totals', async () => {
      const res = await request(app)
        .post('/api/v1/quotes')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({
          productId: 'polo-200gsm',
          quantity: 100,
          color: 'Charcoal Black',
          size: 'XL',
          printType: 'Front & Back Print',
          address: 'Plot 402, Fortune Tower, Bhubaneswar',
          gstin: '21AAACA1234A1Z5',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.quote).toBeDefined();
      expect(res.body.quote.quoteNumber).toMatch(/^ZQB-QT-/);
      expect(res.body.quote.totalAmount).toBeGreaterThan(0);
    });

    it('POST /api/v1/quotes - prevents price tampering by recalculating total on server', async () => {
      const res = await request(app)
        .post('/api/v1/quotes')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({
          productId: 'polo-200gsm',
          quantity: 50,
          // Manipulated pricing payload sent by malicious client
          unitPrice: 1,
          subtotal: 10,
          gstTotal: 0,
          totalAmount: 1,
        });

      expect(res.status).toBe(201);
      expect(res.body.quote.totalAmount).toBeGreaterThan(5000); // Server calculated real total, ignored ₹1
    });

    it('GET /api/v1/quotes - returns customer quotes with JWT customer filter', async () => {
      const res = await request(app)
        .get('/api/v1/quotes')
        .set('Authorization', `Bearer ${customerAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.quotes)).toBe(true);
    });

    it('GET /api/v1/quotes/:id - prevents Customer B from accessing Customer A quote', async () => {
      // Create quote for Customer A
      const createRes = await request(app)
        .post('/api/v1/quotes')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({ quantity: 50, color: 'Navy Blue' });

      const quoteId = createRes.body.quote.id;

      // Customer B attempts to fetch Customer A quote
      const getRes = await request(app)
        .get(`/api/v1/quotes/${quoteId}`)
        .set('Authorization', `Bearer ${customerBToken}`);

      expect(getRes.status).toBe(403);
      expect(getRes.body.success).toBe(false);
    });

    it('PUT /api/v1/quotes/:id/status - handles status update and state machine guards', async () => {
      // Create quote as admin
      const createRes = await request(app)
        .post('/api/v1/quotes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ quantity: 50, color: 'Navy Blue' });

      const quoteId = createRes.body.quote.id;

      // Update status to SENT
      const updateRes = await request(app)
        .put(`/api/v1/quotes/${quoteId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'SENT' });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.quote.status).toBe('SENT');
    });

    it('PUT /api/v1/quotes/:id/status - rejects invalid state machine transition', async () => {
      const createRes = await request(app)
        .post('/api/v1/quotes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ quantity: 50 });

      const quoteId = createRes.body.quote.id;

      // Attempt invalid status transition
      const updateRes = await request(app)
        .put(`/api/v1/quotes/${quoteId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'INVALID_STATUS' });

      expect(updateRes.status).toBe(400);
      expect(updateRes.body.success).toBe(false);
    });
  });
});
