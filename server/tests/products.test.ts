import request from 'supertest';
import app from '../src/app.js';
import jwt from 'jsonwebtoken';
import { config } from '../src/config/index.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
jest.setTimeout(30000);

/**
 * Admin → database → customer catalog: products created by an admin are the same records the
 * public/customer endpoints serve; hidden products never reach the public; only staff can write.
 */
describe('Product catalog sync: admin create → customer catalog', () => {
  const adminToken = jwt.sign({ id: 'admin-prod-test', email: 'admin@zobbra.com', role: 'ADMIN' }, config.jwtSecret, {
    expiresIn: '1h',
  });
  const customerToken = jwt.sign(
    { id: 'cust-prod-test', email: 'cust@zobbra.com', role: 'CUSTOMER', companyId: null },
    config.jwtSecret,
    { expiresIn: '1h' }
  );

  const RUN = Date.now();
  const ACTIVE_NAME = `JEST SYNC ACTIVE ${RUN}`;
  const HIDDEN_NAME = `JEST SYNC HIDDEN ${RUN}`;
  const IMAGE = `https://res.cloudinary.com/demo/image/upload/v1/products/jest-sync-${RUN}.png`;
  const createdIds: string[] = [];
  let categoryId: string;

  const createAsAdmin = (body: Record<string, unknown>) =>
    request(app).post('/api/v1/products').set('Authorization', `Bearer ${adminToken}`).send({
      categoryId,
      description: 'Created by products.test.ts',
      basePrice: 349,
      ...body,
    });

  /** Public list filtered to this run's products (search keeps the result small and exact). */
  const publicList = (query = '') =>
    request(app).get(`/api/v1/products?search=${encodeURIComponent(`JEST SYNC`)}&pageSize=100${query}`);

  beforeAll(async () => {
    const category = await prisma.category.upsert({
      where: { slug: 'caps' },
      update: {},
      create: { name: 'Caps', slug: 'caps' },
    });
    categoryId = category.id;
  });

  afterAll(async () => {
    if (createdIds.length) {
      await prisma.productVariant.deleteMany({ where: { productId: { in: createdIds } } });
      await prisma.bulkPricing.deleteMany({ where: { productId: { in: createdIds } } });
      await prisma.product.deleteMany({ where: { id: { in: createdIds } } });
    }
    await prisma.$disconnect();
  });

  it('admin creates an ACTIVE product → it is persisted and appears in the customer catalog', async () => {
    const res = await createAsAdmin({
      name: ACTIVE_NAME,
      images: [IMAGE],
      isActive: true,
      bulkPricing: [{ minQuantity: 25, maxQuantity: 99, pricePerUnit: 349 }],
      variants: [{ color: 'Black', size: 'Free Size', sku: `JEST-${RUN}-BLK`, stock: 400 }],
    });
    expect(res.status).toBe(201);
    const created = res.body.product;
    createdIds.push(created.id);

    // Persisted with a clean name-derived slug and every catalog field
    expect(created.slug).toBe(`jest-sync-active-${RUN}`);
    const row = await prisma.product.findUnique({
      where: { id: created.id },
      include: { category: true, bulkPricing: true, variants: true },
    });
    expect(row).toBeTruthy();
    expect(row!.isActive).toBe(true);
    expect(row!.images).toEqual([IMAGE]);
    expect(row!.basePrice).toBe(349);
    expect(row!.category.slug).toBe('caps');
    expect(row!.bulkPricing[0].minQuantity).toBe(25); // MOQ
    expect(row!.variants[0].stock).toBe(400);

    // Guest and customer see the same DB record in the list...
    for (const auth of [undefined, `Bearer ${customerToken}`]) {
      const req = publicList();
      const list = auth ? await req.set('Authorization', auth) : await req;
      expect(list.status).toBe(200);
      const found = list.body.data.find((p: any) => p.id === created.id);
      expect(found).toBeTruthy();
      expect(found.images[0]).toBe(IMAGE);
      expect(found.slug).toBe(created.slug);
    }

    // ...and the detail endpoint resolves it by slug and by id
    for (const key of [created.slug, created.id]) {
      const detail = await request(app).get(`/api/v1/products/${key}`);
      expect(detail.status).toBe(200);
      expect(detail.body.product.id).toBe(created.id);
      expect(detail.body.product.category.slug).toBe('caps');
    }
  });

  it('admin creates a HIDDEN product → it never reaches the customer catalog', async () => {
    const res = await createAsAdmin({ name: HIDDEN_NAME, isActive: false });
    expect(res.status).toBe(201);
    const hidden = res.body.product;
    createdIds.push(hidden.id);
    expect(hidden.isActive).toBe(false);

    // Not in the public list, including when a guest/customer tries the admin status filters
    for (const q of ['', '&status=All%20Status', '&status=Draft']) {
      const guest = await publicList(q);
      expect(guest.body.data.some((p: any) => p.id === hidden.id)).toBe(false);
      const customer = await publicList(q).set('Authorization', `Bearer ${customerToken}`);
      expect(customer.body.data.some((p: any) => p.id === hidden.id)).toBe(false);
    }

    // Detail is 404 for the public, including customers
    expect((await request(app).get(`/api/v1/products/${hidden.slug}`)).status).toBe(404);
    expect(
      (await request(app).get(`/api/v1/products/${hidden.slug}`).set('Authorization', `Bearer ${customerToken}`)).status
    ).toBe(404);

    // Admin still sees it (list filter + edit form lookup)
    const adminDrafts = await publicList('&status=Draft').set('Authorization', `Bearer ${adminToken}`);
    expect(adminDrafts.body.data.some((p: any) => p.id === hidden.id)).toBe(true);
    const adminDetail = await request(app)
      .get(`/api/v1/products/${hidden.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminDetail.status).toBe(200);
  });

  it('hiding an active product removes it from the customer catalog', async () => {
    const activeId = createdIds[0];
    const upd = await request(app)
      .put(`/api/v1/products/${activeId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });
    expect(upd.status).toBe(200);
    const list = await publicList();
    expect(list.body.data.some((p: any) => p.id === activeId)).toBe(false);

    // restore for the remaining tests
    await request(app).put(`/api/v1/products/${activeId}`).set('Authorization', `Bearer ${adminToken}`).send({ isActive: true });
  });

  it('customer and guest cannot create, edit, duplicate or delete products', async () => {
    const productId = createdIds[0];
    const body = { name: `JEST SYNC CUSTOMER ${RUN}`, categoryId, basePrice: 1, description: 'x' };

    const customerCreate = await request(app).post('/api/v1/products').set('Authorization', `Bearer ${customerToken}`).send(body);
    expect(customerCreate.status).toBe(403);
    expect((await request(app).post('/api/v1/products').send(body)).status).toBe(401);

    const auth = { Authorization: `Bearer ${customerToken}` };
    expect((await request(app).put(`/api/v1/products/${productId}`).set(auth).send({ isActive: false })).status).toBe(403);
    expect((await request(app).post(`/api/v1/products/${productId}/duplicate`).set(auth)).status).toBe(403);
    expect((await request(app).delete(`/api/v1/products/${productId}`).set(auth)).status).toBe(403);

    // Nothing changed
    const row = await prisma.product.findUnique({ where: { id: productId } });
    expect(row!.isActive).toBe(true);
    expect(await prisma.product.count({ where: { name: body.name } })).toBe(0);
  });

  it('duplicate slug returns 409 instead of hanging; a failed update keeps variants and pricing', async () => {
    const activeId = createdIds[0];
    const hiddenSlug = (await prisma.product.findUnique({ where: { id: createdIds[1] } }))!.slug;

    const dup = await createAsAdmin({ name: ACTIVE_NAME });
    expect(dup.status).toBe(409);

    // Rename onto an existing slug while replacing variants/pricing: must roll back entirely
    const upd = await request(app)
      .put(`/api/v1/products/${activeId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ slug: hiddenSlug, variants: [], bulkPricing: [] });
    expect(upd.status).toBe(409);
    const row = await prisma.product.findUnique({ where: { id: activeId }, include: { variants: true, bulkPricing: true } });
    expect(row!.variants).toHaveLength(1);
    expect(row!.bulkPricing).toHaveLength(1);
  });

  it('two products can share the same variant template (blank SKUs are scoped per product)', async () => {
    // Root cause of "admin created a product but it never appeared": the Add Product form sent
    // shared template SKUs (e.g. CAP-BLK-FS), and ProductVariant.sku is globally unique.
    const template = [
      { color: 'Charcoal Black', size: 'Free Size', sku: '', stock: 500 },
      { color: 'Navy Blue', size: 'Free Size', stock: 350 },
    ];
    const first = await createAsAdmin({ name: `JEST SYNC TEMPLATE A ${RUN}`, variants: template });
    const second = await createAsAdmin({ name: `JEST SYNC TEMPLATE B ${RUN}`, variants: template });
    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    createdIds.push(first.body.product.id, second.body.product.id);
    expect(first.body.product.variants.map((v: any) => v.sku).sort()).toEqual([
      `JEST-SYNC-TEMPLATE-A-${RUN}-CHARCOAL-BLACK-FREE-SIZE`,
      `JEST-SYNC-TEMPLATE-A-${RUN}-NAVY-BLUE-FREE-SIZE`,
    ]);

    // Both are in the customer catalog
    const list = await publicList();
    const ids = list.body.data.map((p: any) => p.id);
    expect(ids).toEqual(expect.arrayContaining([first.body.product.id, second.body.product.id]));

    // An explicit SKU already used by another product is a clear 409, not a hang
    const clash = await createAsAdmin({
      name: `JEST SYNC TEMPLATE C ${RUN}`,
      variants: [{ color: 'Red', size: 'M', sku: first.body.product.variants[0].sku, stock: 1 }],
    });
    expect(clash.status).toBe(409);
  });

  it('rejects a create without the required fields', async () => {
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: '   ', categoryId, basePrice: 'abc' });
    expect(res.status).toBe(400);
  });
});
