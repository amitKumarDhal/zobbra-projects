import request from 'supertest';
import app from '../src/app.js';
import jwt from 'jsonwebtoken';
import { config } from '../src/config/index.js';
import { PrismaClient } from '@prisma/client';
import {
  ProductValidationError,
  getMinAllowedQty,
  normalizeProductConfig,
  planStockDeduction,
  toPublicProduct,
} from '../src/modules/products/product-config.js';

const prisma = new PrismaClient();
jest.setTimeout(30000);

/**
 * Full admin → customer product data flow: every field of the Add Product form is persisted,
 * the customer-facing API returns the customer-facing fields (and never the internal ones),
 * and quote pricing / stock deduction use the stored product configuration.
 */
describe('Admin → customer product data flow (full product configuration)', () => {
  const RUN = Date.now();
  const ADMIN_ID = `admin-flow-${RUN}`;
  const CUSTOMER_ID = `cust-flow-${RUN}`;
  const adminToken = jwt.sign({ id: ADMIN_ID, email: `admin-flow-${RUN}@zobbra.test`, role: 'ADMIN' }, config.jwtSecret, {
    expiresIn: '1h',
  });
  const customerToken = jwt.sign(
    { id: CUSTOMER_ID, email: `cust-flow-${RUN}@zobbra.test`, role: 'CUSTOMER', companyId: null },
    config.jwtSecret,
    { expiresIn: '1h' }
  );
  const asAdmin = { Authorization: `Bearer ${adminToken}` };
  const asCustomer = { Authorization: `Bearer ${customerToken}` };

  const cdn = (file: string) => `https://res.cloudinary.com/demo/image/upload/v1/zobbra/${file}`;
  const FULL = {
    name: `JEST FULL PRODUCT ${RUN}`,
    slug: `jest-full-product-${RUN}`,
    description: 'Development full-field test product',
    basePrice: 299,
    minOrderQty: 10,
    stockCount: 500,
    minSampleQty: 1,
    rating: 4.8,
    reviewCount: 154,
    bulkPricing: [
      { minQuantity: 10, maxQuantity: 49, pricePerUnit: 299 },
      { minQuantity: 50, maxQuantity: 99, pricePerUnit: 279 },
      { minQuantity: 100, maxQuantity: '', pricePerUnit: 259 },
    ],
    stockDeduction: {
      enabled: true,
      pools: [
        { stockType: 'Dark blank caps', colors: ['Matte Black', 'Navy Blue'], stock: 300 },
        { stockType: 'White blank caps', colors: ['Classic White'], stock: 200 },
      ],
    },
    orderMode: 'BOTH',
    customizationEnabled: true,
    customizerTemplateId: 'cap-v1',
    designerEnabled: true,
    isActive: true,
    requiresSize: false,
    sizes: [],
    colors: [
      { name: 'Matte Black', hex: '#1C1C1E' },
      { name: 'Classic White', hex: '#F9FAFB' },
      { name: 'Navy Blue', hex: '#0D1333' },
    ],
    images: [cdn(`full-${RUN}-1.jpg`), cdn(`full-${RUN}-2.jpg`), cdn(`full-${RUN}-3.jpg`)],
    orderImages: [{ url: cdn(`order-${RUN}.jpg`), rating: 5 }],
    videos: [
      { url: `https://res.cloudinary.com/demo/video/upload/v1/zobbra/a-${RUN}.mp4`, rating: 5 },
      { url: `https://res.cloudinary.com/demo/video/upload/v1/zobbra/b-${RUN}.mp4`, rating: 4 },
    ],
    freeGift: { enabled: true, title: 'Free sticker pack', description: 'With every order', minQuantity: null },
    offerAddon: { enabled: true, title: 'Premium gift box', description: 'Boxed individually', price: 15, priceType: 'PER_PIECE' },
    highlights: ['6-panel structured crown', 'Adjustable brass buckle', '3D puff embroidery ready'],
  };

  const createdIds: string[] = [];
  const quoteIds: string[] = [];
  let categoryId: string;
  let full: any;

  const create = (body: Record<string, unknown>) =>
    request(app).post('/api/v1/products').set(asAdmin).send({ categoryId, ...body });

  beforeAll(async () => {
    const category = await prisma.category.upsert({ where: { slug: 'caps' }, update: {}, create: { name: 'Caps', slug: 'caps' } });
    categoryId = category.id;
    await prisma.user.create({ data: { id: ADMIN_ID, email: `admin-flow-${RUN}@zobbra.test`, name: 'Flow Admin', role: 'ADMIN' } });
    await prisma.user.create({ data: { id: CUSTOMER_ID, email: `cust-flow-${RUN}@zobbra.test`, name: 'Flow Customer', role: 'CUSTOMER' } });

    const res = await create(FULL);
    expect(res.status).toBe(201);
    full = res.body.product;
    createdIds.push(full.id);
  });

  afterAll(async () => {
    const orders = await prisma.order.findMany({ where: { customerId: CUSTOMER_ID }, select: { id: true } });
    await prisma.invoice.deleteMany({ where: { orderId: { in: orders.map((o) => o.id) } } });
    await prisma.order.deleteMany({ where: { customerId: CUSTOMER_ID } });
    await prisma.quote.deleteMany({ where: { customerId: CUSTOMER_ID } });
    await prisma.product.deleteMany({ where: { id: { in: createdIds } } });
    await prisma.user.deleteMany({ where: { id: { in: [ADMIN_ID, CUSTOMER_ID] } } });
    await prisma.$disconnect();
  });

  // ---------------------------------------------------------------- persistence
  it('1-2: admin creates a product with full data and every field persists', async () => {
    const row = await prisma.product.findUnique({
      where: { id: full.id },
      include: { bulkPricing: { orderBy: { minQuantity: 'asc' } }, variants: true, category: true },
    });
    expect(row).toBeTruthy();
    expect(row!.slug).toBe(FULL.slug);
    expect(row!.description).toBe(FULL.description);
    expect(row!.basePrice).toBe(299);
    expect(row!.minOrderQty).toBe(10);
    expect(row!.minSampleQty).toBe(1);
    expect(row!.stockCount).toBe(500);
    expect(row!.orderMode).toBe('BOTH');
    expect(row!.customizationEnabled).toBe(true);
    expect(row!.designerEnabled).toBe(true);
    expect(row!.requiresSize).toBe(false);
    expect(row!.category.slug).toBe('caps');
    expect(row!.colors).toEqual(FULL.colors);
    expect(row!.stockDeduction).toEqual(FULL.stockDeduction);
    expect(row!.bulkPricing.map((t) => [t.minQuantity, t.pricePerUnit])).toEqual([
      [10, 299],
      [50, 279],
      [100, 259],
    ]);
    // One variant per configured colour (no size required → Free Size)
    expect(row!.variants.map((v) => v.color).sort()).toEqual(['Classic White', 'Matte Black', 'Navy Blue']);
    expect(row!.variants.every((v) => v.size === 'Free Size')).toBe(true);
  });

  it('12-17: images, highlights, videos, free gift, addon and social proof persist', async () => {
    const row = (await prisma.product.findUnique({ where: { id: full.id } }))!;
    expect(row.images).toEqual(FULL.images);
    expect(row.highlights).toEqual(FULL.highlights);
    expect(row.videos).toEqual(FULL.videos);
    expect(row.orderImages).toEqual(FULL.orderImages);
    expect(row.freeGift).toEqual(FULL.freeGift);
    expect(row.offerAddon).toEqual(FULL.offerAddon);
    expect(row.ratingOverride).toBe(4.8);
    expect(row.reviewCountOverride).toBe(154);
  });

  it('admin edit form receives everything that was entered, including internal stock config', async () => {
    const res = await request(app).get(`/api/v1/products/${full.id}`).set(asAdmin);
    expect(res.status).toBe(200);
    const p = res.body.product;
    expect(p.stockDeduction).toEqual(FULL.stockDeduction);
    expect(p.stockCount).toBe(500);
    expect(p.ratingOverride).toBe(4.8);
    expect(p.reviewCountOverride).toBe(154);
    expect(p.minSampleQty).toBe(1);
    expect(p.highlights).toEqual(FULL.highlights);
  });

  // ---------------------------------------------------------------- customer API
  it('3: the customer catalog receives the product immediately', async () => {
    for (const headers of [{}, asCustomer]) {
      const list = await request(app).get(`/api/v1/products?search=${encodeURIComponent(FULL.name)}&pageSize=100`).set(headers);
      expect(list.status).toBe(200);
      const found = list.body.data.find((p: any) => p.id === full.id);
      expect(found).toBeTruthy();
      expect(found.images[0]).toBe(FULL.images[0]);
      expect(found.category.slug).toBe('caps');
      expect(found.moq).toBe(10);
      expect(found.startingPrice).toBe(259);
      expect(found.rating).toBe(4.8);
      expect(found.reviewCount).toBe(154);
      expect(found.highlights[0]).toBe(FULL.highlights[0]);
    }
  });

  it('4-7: customer detail carries colours, sizes, requiresSize, pricing and content for the customizer', async () => {
    const res = await request(app).get(`/api/v1/products/${FULL.slug}`).set(asCustomer);
    expect(res.status).toBe(200);
    const p = res.body.product;
    expect(p.availableColors).toEqual(FULL.colors);
    expect(p.requiresSize).toBe(false);
    expect(p.availableSizes).toEqual([]);
    expect(p.customizable).toBe(true);
    expect(p.orderMode).toBe('BOTH');
    expect(p.basePrice).toBe(299);
    expect(p.bulkPricing).toHaveLength(3);
    expect(p.images).toEqual(FULL.images);
    expect(p.orderImages).toEqual(FULL.orderImages);
    expect(p.videos).toEqual(FULL.videos); // admin order preserved
    expect(p.freeGift.title).toBe('Free sticker pack');
    expect(p.offerAddon).toMatchObject({ title: 'Premium gift box', price: 15, priceType: 'PER_PIECE' });
    expect(p.highlights).toEqual(FULL.highlights);
    expect(p.inStock).toBe(true);
  });

  it('18: internal stock data is never exposed to guests or customers', async () => {
    for (const headers of [{}, asCustomer]) {
      const detail = await request(app).get(`/api/v1/products/${full.id}`).set(headers);
      const list = await request(app).get(`/api/v1/products?search=${encodeURIComponent(FULL.name)}`).set(headers);
      for (const p of [detail.body.product, detail.body.data, list.body.data[0], list.body.products[0]]) {
        expect(p).not.toHaveProperty('stockDeduction');
        expect(p).not.toHaveProperty('stockCount');
        expect(p).not.toHaveProperty('ratingOverride');
        expect(p).not.toHaveProperty('reviewCountOverride');
        expect(p.variants.every((v: any) => !('stock' in v))).toBe(true);
        expect(JSON.stringify(p)).not.toContain('Dark blank caps');
      }
    }
  });

  it('6-7: a sized product exposes exactly its configured sizes and colours', async () => {
    const res = await create({
      name: `JEST FULL SIZED ${RUN}`,
      basePrice: 399,
      requiresSize: true,
      sizes: ['S', 'M', 'XL'],
      colors: [{ name: 'Olive', hex: '#4D5D3A' }],
    });
    expect(res.status).toBe(201);
    createdIds.push(res.body.product.id);
    const detail = await request(app).get(`/api/v1/products/${res.body.product.id}`);
    expect(detail.body.product.requiresSize).toBe(true);
    expect(detail.body.product.availableSizes).toEqual(['S', 'M', 'XL']);
    expect(detail.body.product.availableColors).toEqual([{ name: 'Olive', hex: '#4D5D3A' }]);
    expect(detail.body.product.variants).toHaveLength(3);
  });

  it('8: customization disabled is reported to the customer side', async () => {
    const res = await create({ name: `JEST FULL NO CUSTOM ${RUN}`, basePrice: 199, customizationEnabled: false });
    expect(res.status).toBe(201);
    createdIds.push(res.body.product.id);
    const detail = await request(app).get(`/api/v1/products/${res.body.product.id}`);
    expect(detail.body.product.customizationEnabled).toBe(false);
    expect(detail.body.product.customizable).toBe(false);

    const noDesigner = await create({ name: `JEST FULL NO DESIGNER ${RUN}`, basePrice: 199, designerEnabled: false });
    createdIds.push(noDesigner.body.product.id);
    const d2 = await request(app).get(`/api/v1/products/${noDesigner.body.product.id}`);
    expect(d2.body.product.customizable).toBe(false);
  });

  it('social proof falls back to real published reviews when no override is set (never fabricated)', async () => {
    const res = await create({ name: `JEST FULL REVIEWS ${RUN}`, basePrice: 199 });
    const id = res.body.product.id;
    createdIds.push(id);

    let detail = await request(app).get(`/api/v1/products/${id}`);
    expect(detail.body.product.rating).toBeNull();
    expect(detail.body.product.reviewCount).toBe(0);

    await prisma.testimonial.createMany({
      data: [
        { productId: id, customerName: 'A', content: 'Great', rating: 5, status: 'PUBLISHED' },
        { productId: id, customerName: 'B', content: 'Good', rating: 4, status: 'PUBLISHED' },
        { productId: id, customerName: 'C', content: 'Pending', rating: 1, status: 'PENDING' },
      ],
    });
    detail = await request(app).get(`/api/v1/products/${id}`);
    expect(detail.body.product.rating).toBe(4.5);
    expect(detail.body.product.reviewCount).toBe(2);
    await prisma.testimonial.deleteMany({ where: { productId: id } });
  });

  // ---------------------------------------------------------------- validation
  it('rejects invalid data with a clear 400 instead of silently discarding it', async () => {
    const cases: Array<[Record<string, unknown>, RegExp]> = [
      [{ rating: 7 }, /Rating/],
      [{ orderMode: 'WHOLESALE' }, /Order type/],
      [{ images: Array.from({ length: 7 }, (_, i) => cdn(`x${i}.jpg`)) }, /at most 6/],
      [{ images: ['data:image/png;base64,AAAA'] }, /valid image URLs/],
      [{ minOrderQty: 5, minSampleQty: 9 }, /sample qty/i],
      [{ bulkPricing: [{ minQuantity: 10, maxQuantity: 60, pricePerUnit: 10 }, { minQuantity: 50, maxQuantity: 99, pricePerUnit: 9 }] }, /overlap/],
      [{ offerAddon: { enabled: true, title: 'Box', price: 0 } }, /Offer addon/],
      [{ slug: 'bad slug/with?chars' }, /Slug/],
    ];
    for (const [body, message] of cases) {
      const res = await create({ name: `JEST FULL INVALID ${RUN}`, basePrice: 100, ...body });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(message);
    }
    expect(await prisma.product.count({ where: { name: `JEST FULL INVALID ${RUN}` } })).toBe(0);
  });

  it('an explicit slug is preserved; a duplicate (any casing) is a clear 409', async () => {
    expect(full.slug).toBe(FULL.slug);
    const dup = await create({ name: 'Another name', basePrice: 100, slug: FULL.slug.toUpperCase() });
    expect(dup.status).toBe(409);
  });

  it('a partial update keeps every field it did not send', async () => {
    const res = await request(app).put(`/api/v1/products/${full.id}`).set(asAdmin).send({ description: 'Updated description' });
    expect(res.status).toBe(200);
    const row = (await prisma.product.findUnique({ where: { id: full.id }, include: { variants: true, bulkPricing: true } }))!;
    expect(row.description).toBe('Updated description');
    expect(row.highlights).toEqual(FULL.highlights);
    expect(row.offerAddon).toEqual(FULL.offerAddon);
    expect(row.stockDeduction).toEqual(FULL.stockDeduction);
    expect(row.variants).toHaveLength(3);
    expect(row.bulkPricing).toHaveLength(3);
  });

  // ---------------------------------------------------------------- pricing
  it('9: quote pricing follows the admin quantity ranges exactly (detail price == quote price)', async () => {
    const expected: Array<[number, number]> = [
      [10, 299],
      [49, 299],
      [50, 279],
      [99, 279],
      [100, 259],
      [750, 259],
    ];
    for (const [quantity, unitPrice] of expected) {
      const res = await request(app)
        .post('/api/v1/quotes/pricing-preview')
        .set(asCustomer)
        .send({ productId: full.id, quantity, printType: 'Front Only' });
      expect(res.status).toBe(200);
      expect(res.body.data.unitPrice).toBe(unitPrice);
      expect(res.body.data.subtotal).toBe(unitPrice * quantity);
    }
  });

  it('9: the created quote uses the stored pricing and ignores client-supplied amounts', async () => {
    const res = await request(app).post('/api/v1/quotes').set(asCustomer).send({
      productId: full.id,
      quantity: 100,
      color: 'Matte Black',
      printType: 'Front Only',
      unitPrice: 1,
      subtotal: 1,
      totalAmount: 1,
      addonAmount: 0,
    });
    expect(res.status).toBe(201);
    quoteIds.push(res.body.quote.id);
    expect(res.body.quote.items[0].unitPrice).toBe(259);
    expect(res.body.quote.subtotal).toBe(25900);
    expect(res.body.quote.addonAmount).toBe(0);
    expect(res.body.quote.freeGiftTitle).toBe('Free sticker pack');
    expect(res.body.quote.totalAmount).toBe(25900 + Math.round(25900 * 0.05));
  });

  it('16: an opted-in addon is charged by the server from the product configuration', async () => {
    const preview = await request(app)
      .post('/api/v1/quotes/pricing-preview')
      .set(asCustomer)
      .send({ productId: full.id, quantity: 50, printType: 'Front Only', addonSelected: true });
    expect(preview.body.data.addonAmount).toBe(15 * 50);
    expect(preview.body.data.subtotal).toBe(279 * 50 + 15 * 50);

    const res = await request(app).post('/api/v1/quotes').set(asCustomer).send({
      productId: full.id,
      quantity: 50,
      color: 'Navy Blue',
      printType: 'Front Only',
      addonSelected: true,
      addonAmount: 1, // tampered: must be ignored
    });
    expect(res.status).toBe(201);
    quoteIds.push(res.body.quote.id);
    expect(res.body.quote.addonTitle).toBe('Premium gift box');
    expect(res.body.quote.addonAmount).toBe(750);
    expect(res.body.quote.items[0].totalPrice).toBe(279 * 50);
    expect(res.body.quote.subtotal).toBe(279 * 50 + 750);
  });

  it('a bulk-only product enforces its minimum for customers; staff may still quote below it', async () => {
    const res = await create({ name: `JEST FULL BULK ${RUN}`, basePrice: 150, minOrderQty: 25, orderMode: 'BULK' });
    const id = res.body.product.id;
    createdIds.push(id);

    const below = await request(app).post('/api/v1/quotes').set(asCustomer).send({ productId: id, quantity: 5 });
    expect(below.status).toBe(400);
    expect(below.body.message).toMatch(/Minimum order quantity/);

    const ok = await request(app).post('/api/v1/quotes').set(asCustomer).send({ productId: id, quantity: 25 });
    expect(ok.status).toBe(201);

    const staff = await request(app).post('/api/v1/quotes').set(asAdmin).send({ productId: id, quantity: 5, customerId: CUSTOMER_ID });
    expect(staff.status).toBe(201);
  });

  // ---------------------------------------------------------------- active / inactive
  it('10-11: an inactive product is hidden from customers and cannot be quoted', async () => {
    const res = await create({ name: `JEST FULL INACTIVE ${RUN}`, basePrice: 199, isActive: false });
    expect(res.status).toBe(201);
    const hidden = res.body.product;
    createdIds.push(hidden.id);

    const list = await request(app).get(`/api/v1/products?search=${encodeURIComponent(hidden.name)}&status=All%20Status`).set(asCustomer);
    expect(list.body.data).toHaveLength(0);
    expect((await request(app).get(`/api/v1/products/${hidden.id}`).set(asCustomer)).status).toBe(404);

    for (const key of [hidden.id, hidden.slug]) {
      const quote = await request(app).post('/api/v1/quotes').set(asCustomer).send({ productId: key, quantity: 50 });
      expect(quote.status).toBe(400);
      expect(quote.body.message).toMatch(/not available/);
      const viaItems = await request(app)
        .post('/api/v1/quotes')
        .set(asAdmin)
        .send({ customerId: CUSTOMER_ID, items: [{ productId: key, quantity: 50 }] });
      expect(viaItems.status).toBe(400);
    }
    const preview = await request(app).post('/api/v1/quotes/pricing-preview').set(asCustomer).send({ productId: hidden.id, quantity: 50 });
    expect(preview.status).toBe(404);

    // Admin can still open and edit it
    expect((await request(app).get(`/api/v1/products/${hidden.id}`).set(asAdmin)).status).toBe(200);
    expect((await request(app).put(`/api/v1/products/${hidden.id}`).set(asAdmin).send({ description: 'still editable' })).status).toBe(200);
  });

  // ---------------------------------------------------------------- stock deduction
  it('order colour is matched to its stock type and deducted when the order is created', async () => {
    const quoteRes = await request(app).post('/api/v1/quotes').set(asCustomer).send({
      productId: full.id,
      quantity: 60,
      printType: 'Front Only',
      items: [
        {
          productId: full.id,
          quantity: 60,
          color: 'Matte Black',
          variants: [
            { color: 'Matte Black', size: 'Free Size', quantity: 40 },
            { color: 'classic white', size: 'Free Size', quantity: 20 },
          ],
        },
      ],
    });
    expect(quoteRes.status).toBe(201);
    const quoteId = quoteRes.body.quote.id;
    quoteIds.push(quoteId);

    await request(app).put(`/api/v1/quotes/${quoteId}/status`).set(asCustomer).send({ status: 'APPROVED' });
    const orderRes = await request(app).post(`/api/v1/orders/from-quote/${quoteId}`).set(asCustomer);
    expect(orderRes.status).toBe(201);
    expect(orderRes.body.order.freeGiftTitle).toBe('Free sticker pack');

    const row = (await prisma.product.findUnique({ where: { id: full.id } }))!;
    expect(row.stockCount).toBe(500 - 60);
    const pools = (row.stockDeduction as any).pools;
    expect(pools.find((p: any) => p.stockType === 'Dark blank caps').stock).toBe(300 - 40);
    expect(pools.find((p: any) => p.stockType === 'White blank caps').stock).toBe(200 - 20);

    // Converting the same quote again is rejected, so stock is never deducted twice
    const again = await request(app).post(`/api/v1/orders/from-quote/${quoteId}`).set(asCustomer);
    expect(again.status).toBe(409);
    expect((await prisma.product.findUnique({ where: { id: full.id } }))!.stockCount).toBe(440);
  });
});

describe('Product configuration rules (unit)', () => {
  it('normalizes only the fields that were supplied', () => {
    expect(normalizeProductConfig({})).toEqual({});
    expect(normalizeProductConfig({ highlights: [' A ', 'a', '', 'B'] })).toEqual({ highlights: ['A', 'B'] });
    expect(normalizeProductConfig({ rating: '', reviewCount: '' })).toEqual({ ratingOverride: null, reviewCountOverride: null });
  });

  it('a colour cannot belong to two stock types', () => {
    expect(() =>
      normalizeProductConfig({
        stockDeduction: {
          enabled: true,
          pools: [
            { stockType: 'A', colors: ['Black'], stock: 1 },
            { stockType: 'B', colors: ['black'], stock: 1 },
          ],
        },
      })
    ).toThrow(ProductValidationError);
  });

  it('minimum allowed quantity depends on the order mode', () => {
    expect(getMinAllowedQty({ minOrderQty: null, orderMode: 'BULK' })).toBe(1);
    expect(getMinAllowedQty({ minOrderQty: 20, orderMode: 'BULK', minSampleQty: null })).toBe(20);
    expect(getMinAllowedQty({ minOrderQty: 20, orderMode: 'BULK', minSampleQty: 2 })).toBe(2);
    expect(getMinAllowedQty({ minOrderQty: 20, orderMode: 'BOTH' })).toBe(1);
    expect(getMinAllowedQty({ minOrderQty: 20, orderMode: 'SINGLE' })).toBe(1);
  });

  it('stock deduction matches colours case-insensitively and never goes below zero', () => {
    const plan = planStockDeduction(
      {
        stockCount: 30,
        stockDeduction: { enabled: true, pools: [{ stockType: 'Dark', colors: ['Matte Black'], stock: 10 }] },
      },
      [
        { color: ' matte black ', quantity: 25 },
        { color: 'Unmapped', quantity: 10 },
      ]
    );
    expect(plan.stockCount).toBe(0);
    expect((plan.stockDeduction as any).pools[0].stock).toBe(0);
    expect(plan.deducted).toEqual([{ stockType: 'Dark', quantity: 25 }]);
  });

  it('a disabled stock config only reduces the product stock count', () => {
    const cfg = { enabled: false, pools: [{ stockType: 'Dark', colors: ['Black'], stock: 10 }] };
    const plan = planStockDeduction({ stockCount: 30, stockDeduction: cfg }, [{ color: 'Black', quantity: 5 }]);
    expect(plan.stockCount).toBe(25);
    expect(plan.stockDeduction).toEqual(cfg);
  });

  it('the public product hides disabled offers and older products fall back to variant colours/sizes', () => {
    const p = toPublicProduct({
      basePrice: 100,
      requiresSize: true,
      colors: [],
      sizes: [],
      bulkPricing: [{ minQuantity: 20, pricePerUnit: 90 }],
      variants: [
        { color: 'Black', size: 'M', stock: 5 },
        { color: 'Black', size: 'L', stock: 0 },
      ],
      freeGift: { enabled: false, title: 'Hidden' },
      offerAddon: { enabled: false, title: 'Hidden', price: 10 },
      stockDeduction: { enabled: true, pools: [] },
      stockCount: 0,
    });
    expect(p.availableColors).toEqual([{ name: 'Black', hex: null }]);
    expect(p.availableSizes).toEqual(['M', 'L']);
    expect(p.moq).toBe(20);
    expect(p.startingPrice).toBe(90);
    expect(p.inStock).toBe(true);
    expect(p.freeGift).toBeNull();
    expect(p.offerAddon).toBeNull();
    expect(p).not.toHaveProperty('stockDeduction');
  });
});
