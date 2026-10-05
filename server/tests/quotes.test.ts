import request from 'supertest';
import app from '../src/app.js';
import jwt from 'jsonwebtoken';
import { config } from '../src/config/index.js';
import { calculateServerPricing } from '../src/modules/quotes/quotes.controller.js';
import { SECOND_SIDE_SURCHARGE } from '../src/modules/quotes/quote-pricing.js';
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

  let testProductId: string;

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
      update: { companyId: 'comp-101', phone: '+919876543210' },
      create: {
        id: 'cust-101',
        email: 'customerA@acme.com',
        passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
        name: 'Customer A',
        role: 'CUSTOMER',
        companyId: 'comp-101',
        phone: '+919876543210',
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

    const cat = await prisma.category.upsert({
      where: { slug: 'apparel' },
      update: {},
      create: {
        id: 'cat-apparel-101',
        name: 'Apparel',
        slug: 'apparel',
      },
    });

    const testProduct = await prisma.product.upsert({
      where: { slug: 'polo-200gsm' },
      update: { basePrice: 249, gstRate: 5.0, isActive: true },
      create: {
        id: 'prod-polo-200gsm',
        name: 'Classic Corporate Polo Shirt',
        slug: 'polo-200gsm',
        description: 'Classic Corporate Polo Shirt 200 GSM',
        basePrice: 249,
        gstRate: 5.0,
        categoryId: cat.id,
        isActive: true,
      },
    });

    testProductId = testProduct.id;

    await prisma.bulkPricing.deleteMany({ where: { productId: testProduct.id } });
    await prisma.bulkPricing.createMany({
      data: [
        { productId: testProduct.id, minQuantity: 50, maxQuantity: 99, pricePerUnit: 229, printType: 'Front & Back Print' },
        { productId: testProduct.id, minQuantity: 100, maxQuantity: 249, pricePerUnit: 219, printType: 'Front & Back Print' },
      ],
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ============================================================
  // SERVER-SIDE PRICING ENGINE UNIT TESTS
  // ============================================================
  describe('Server-Side Pricing Engine (unit)', () => {
    const tiers = [
      { minQuantity: 50, maxQuantity: 99, pricePerUnit: 229 },
      { minQuantity: 100, maxQuantity: 249, pricePerUnit: 219 },
    ];

    it('uses the base price when the product has no quantity ranges (no hidden volume discount)', () => {
      const pricing = calculateServerPricing(249, 100, 'Front Only', 5.0);
      expect(pricing.unitPrice).toBe(249);
      expect(pricing.subtotal).toBe(249 * 100);
      expect(pricing.gstTotal).toBe(Math.round(24900 * 0.05));
      expect(pricing.totalAmount).toBe(pricing.subtotal + pricing.gstTotal);
    });

    it('never raises a cheap product above its admin price (no price floor)', () => {
      const pricing = calculateServerPricing(80, 500, 'Front Only', 5.0);
      expect(pricing.unitPrice).toBe(80);
    });

    it('uses the base price below the first quantity range', () => {
      const pricing = calculateServerPricing(249, 20, 'Front Only', 5.0, true, { tiers });
      expect(pricing.unitPrice).toBe(249);
    });

    it('uses the quantity range price for the ordered quantity', () => {
      expect(calculateServerPricing(249, 50, 'Front Only', 5.0, true, { tiers }).unitPrice).toBe(229);
      expect(calculateServerPricing(249, 99, 'Front Only', 5.0, true, { tiers }).unitPrice).toBe(229);
      expect(calculateServerPricing(249, 100, 'Front Only', 5.0, true, { tiers }).unitPrice).toBe(219);
    });

    it('keeps the last range price above the highest configured range', () => {
      expect(calculateServerPricing(249, 5000, 'Front Only', 5.0, true, { tiers }).unitPrice).toBe(219);
    });

    it('Back Only is a single-side print: no surcharge', () => {
      const pricing = calculateServerPricing(249, 100, 'Back Only', 5.0, true, { tiers });
      expect(pricing.unitPrice).toBe(219);
      expect(pricing.printSurcharge).toBe(0);
    });

    it('Front & Back adds the documented second-side surcharge per piece', () => {
      const pricing = calculateServerPricing(249, 100, 'Front & Back', 5.0, true, { tiers });
      expect(pricing.productUnitPrice).toBe(219);
      expect(pricing.printSurcharge).toBe(SECOND_SIDE_SURCHARGE);
      expect(pricing.unitPrice).toBe(219 + SECOND_SIDE_SURCHARGE);
      expect(pricing.subtotal).toBe((219 + SECOND_SIDE_SURCHARGE) * 100);
    });

    it('adds an opted-in addon to the subtotal before GST', () => {
      const pricing = calculateServerPricing(249, 100, 'Front Only', 5.0, true, { tiers, addonAmount: 500 });
      expect(pricing.subtotal).toBe(219 * 100 + 500);
      expect(pricing.gstTotal).toBe(Math.round((219 * 100 + 500) * 0.05));
    });

    it('returns discount = 0 (no client-side discount)', () => {
      const pricing = calculateServerPricing(249, 100, 'Front Only', 5.0);
      expect(pricing.discount).toBe(0);
    });

    it('returns correct gstRate in result', () => {
      const pricing = calculateServerPricing(249, 100, 'Front Only', 12.0);
      expect(pricing.gstRate).toBe(12.0);
    });
  });

  // ============================================================
  // PRICING PREVIEW ENDPOINT TESTS
  // ============================================================
  describe('POST /api/v1/quotes/pricing-preview', () => {
    it('returns 401 without authentication', async () => {
      const res = await request(app)
        .post('/api/v1/quotes/pricing-preview')
        .send({ productId: 'polo-200gsm', quantity: 100 });
      expect(res.status).toBe(401);
    });

    it('returns pricing preview for CUSTOMER with real product slug', async () => {
      const res = await request(app)
        .post('/api/v1/quotes/pricing-preview')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({
          productId: 'polo-200gsm',
          quantity: 100,
          printType: 'Front Only',
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.unitPrice).toBeGreaterThan(0);
      expect(res.body.data.subtotal).toBeGreaterThan(0);
      expect(res.body.data.gstRate).toBe(5.0);
      expect(res.body.data.gstTotal).toBeGreaterThan(0);
      expect(res.body.data.totalAmount).toBeGreaterThan(0);
    });

    it('returns pricing preview for quantity 50', async () => {
      const res = await request(app)
        .post('/api/v1/quotes/pricing-preview')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({ productId: 'polo-200gsm', quantity: 50, printType: 'Front Only' });
      expect(res.status).toBe(200);
      expect(res.body.data.unitPrice).toBe(229); // admin range 50-99
    });

    it('returns pricing preview for quantity 100', async () => {
      const res = await request(app)
        .post('/api/v1/quotes/pricing-preview')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({ productId: 'polo-200gsm', quantity: 100, printType: 'Front Only' });
      expect(res.status).toBe(200);
      expect(res.body.data.unitPrice).toBe(219); // admin range 100-249
    });

    it('returns pricing preview for quantity 500', async () => {
      const res = await request(app)
        .post('/api/v1/quotes/pricing-preview')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({ productId: 'polo-200gsm', quantity: 500, printType: 'Front Only' });
      expect(res.status).toBe(200);
      expect(res.body.data.unitPrice).toBe(219); // last range applies above it
    });

    it('returns pricing for Front Only', async () => {
      const res = await request(app)
        .post('/api/v1/quotes/pricing-preview')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({ productId: 'polo-200gsm', quantity: 100, printType: 'Front Only' });
      expect(res.status).toBe(200);
      expect(res.body.data.unitPrice).toBe(219); // single side: no surcharge
    });

    it('returns pricing for Back Only', async () => {
      const res = await request(app)
        .post('/api/v1/quotes/pricing-preview')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({ productId: 'polo-200gsm', quantity: 100, printType: 'Back Only' });
      expect(res.status).toBe(200);
      expect(res.body.data.unitPrice).toBe(219); // single side: no surcharge
    });

    it('returns pricing for Front & Back', async () => {
      const res = await request(app)
        .post('/api/v1/quotes/pricing-preview')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({ productId: 'polo-200gsm', quantity: 100, printType: 'Front & Back' });
      expect(res.status).toBe(200);
      expect(res.body.data.unitPrice).toBe(219 + SECOND_SIDE_SURCHARGE); // second side
    });

    it('returns 400 for invalid product', async () => {
      const res = await request(app)
        .post('/api/v1/quotes/pricing-preview')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({ productId: 'non-existent-product-xyz', quantity: 100 });
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 for missing productId', async () => {
      const res = await request(app)
        .post('/api/v1/quotes/pricing-preview')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({ quantity: 100 });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 for zero quantity', async () => {
      const res = await request(app)
        .post('/api/v1/quotes/pricing-preview')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({ productId: 'polo-200gsm', quantity: 0 });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects invalid variants (sum != quantity)', async () => {
      const res = await request(app)
        .post('/api/v1/quotes/pricing-preview')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({
          productId: 'polo-200gsm',
          quantity: 100,
          variants: [
            { color: 'Red', size: 'M', quantity: 40 },
            { color: 'Red', size: 'L', quantity: 30 },
            // Total = 70, should be 100 — INVALID
          ],
        });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('accepts valid variants (sum == quantity)', async () => {
      const res = await request(app)
        .post('/api/v1/quotes/pricing-preview')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({
          productId: 'polo-200gsm',
          quantity: 100,
          printType: 'Front Only',
          variants: [
            { color: 'Red', size: 'M', quantity: 40 },
            { color: 'Red', size: 'L', quantity: 30 },
            { color: 'Black', size: 'M', quantity: 20 },
            { color: 'Black', size: 'L', quantity: 10 },
          ],
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalAmount).toBeGreaterThan(0);
    });

    it('returns correct GST (5%) in data', async () => {
      const res = await request(app)
        .post('/api/v1/quotes/pricing-preview')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({ productId: 'polo-200gsm', quantity: 100, printType: 'Front Only' });
      expect(res.status).toBe(200);
      expect(res.body.data.gstRate).toBe(5.0);
      const expectedGst = Math.round(res.body.data.subtotal * 0.05);
      expect(res.body.data.gstTotal).toBe(expectedGst);
    });

    it('ADMIN can access pricing-preview', async () => {
      const res = await request(app)
        .post('/api/v1/quotes/pricing-preview')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ productId: 'polo-200gsm', quantity: 100, printType: 'Front Only' });
      expect(res.status).toBe(200);
    });
  });

  // ============================================================
  // QUOTE API ENDPOINTS & SECURITY CONTROLS
  // ============================================================
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

    it('POST /api/v1/quotes - CLIENT PRICE TAMPERING: server ignores client-supplied prices', async () => {
      const res = await request(app)
        .post('/api/v1/quotes')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({
          productId: 'polo-200gsm',
          quantity: 50,
          // Manipulated pricing — server must ignore these
          unitPrice: 1,
          subtotal: 10,
          gstTotal: 0,
          totalAmount: 1,
        });

      expect(res.status).toBe(201);
      // Server must recalculate from the stored product pricing: qty=50 → range 50-99 = ₹229
      // subtotal = 229*50 = 11,450; gst = 573; total = 12,023
      expect(res.body.quote.totalAmount).toBeGreaterThan(5000);
      expect(res.body.quote.items[0].unitPrice).toBeGreaterThan(5);
      expect(res.body.quote.items[0].unitPrice).not.toBe(1);
      expect(res.body.quote.totalAmount).not.toBe(1);
    });

    it('POST /api/v1/quotes - customer identity comes from the JWT; body customerId/companyId cannot take over another account', async () => {
      const res = await request(app)
        .post('/api/v1/quotes')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({
          productId: 'polo-200gsm',
          quantity: 50,
          customerId: 'cust-202', // another customer
          companyId: 'comp-202', // another company
          userId: 'admin-101',
        });

      expect(res.status).toBe(201);
      expect(res.body.quote.customerId).toBe('cust-101');
      expect(res.body.quote.companyId).toBe('comp-101');

      // Customer B does not see it; Customer A does
      const asB = await request(app).get(`/api/v1/quotes/${res.body.quote.id}`).set('Authorization', `Bearer ${customerBToken}`);
      expect(asB.status).toBe(403);
      const asA = await request(app).get(`/api/v1/quotes/${res.body.quote.id}`).set('Authorization', `Bearer ${customerAToken}`);
      expect(asA.status).toBe(200);
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
        .send({ customerId: 'cust-101', quantity: 50, color: 'Navy Blue' });

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
        .send({ customerId: 'cust-101', quantity: 50 });

      const quoteId = createRes.body.quote.id;

      // Attempt invalid status transition
      const updateRes = await request(app)
        .put(`/api/v1/quotes/${quoteId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'INVALID_STATUS' });

      expect(updateRes.status).toBe(400);
      expect(updateRes.body.success).toBe(false);
    });

    it('POST /api/v1/quotes - rejects quote containing embedded base64 data:image in canvasStateJson', async () => {
      const res = await request(app)
        .post('/api/v1/quotes')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({
          quantity: 50,
          canvasStateJson: JSON.stringify({
            objects: [{ type: 'image', src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=' }]
          })
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Base64 data URLs are not permitted');
    });

    it('POST /api/v1/quotes - rejects quote containing embedded base64 data:image in artworkUrl', async () => {
      const res = await request(app)
        .post('/api/v1/quotes')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({
          quantity: 50,
          artworkUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Base64 data URLs are not permitted');
    });

    it('POST /api/v1/quotes - accepts quote with Cloudinary CDN URLs and sanitized canvas JSON', async () => {
      const res = await request(app)
        .post('/api/v1/quotes')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({
          quantity: 50,
          color: 'White',
          artworkUrl: 'https://res.cloudinary.com/zobra/image/upload/v12345/artwork.png',
          previewFrontUrl: 'https://res.cloudinary.com/zobra/image/upload/v12345/preview_front.png',
          previewBackUrl: 'https://res.cloudinary.com/zobra/image/upload/v12345/preview_back.png',
          canvasStateJson: JSON.stringify({
            front: JSON.stringify({
              objects: [{ type: 'image', src: 'https://res.cloudinary.com/zobra/image/upload/v12345/artwork.png' }]
            }),
            back: JSON.stringify({ objects: [] })
          }),
          customizationRequirements: JSON.stringify({
            selectedColor: 'White',
            printPosition: 'Front Only'
          })
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.quote.artworkUrl).toBe('https://res.cloudinary.com/zobra/image/upload/v12345/artwork.png');
      expect(res.body.quote.previewFrontUrl).toBe('https://res.cloudinary.com/zobra/image/upload/v12345/preview_front.png');
    });
  });
});
