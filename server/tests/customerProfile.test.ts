import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../src/app.js';
import { setOtpSender, OtpSender } from '../src/utils/whatsappCloud.js';
import { otpRequestLimiter, otpVerifyLimiter } from '../src/modules/auth/auth.routes.js';
import { signAuthToken } from '../src/modules/auth/auth.controller.js';

const prisma = new PrismaClient();
jest.setTimeout(60000);

// OTP login → My Profile → Admin Customers & Leads, in the order a customer goes through it.

const sent: { phone: string; code: string }[] = [];
const mockSender: OtpSender = {
  isConfigured: () => true,
  async sendOtp(phone, code) {
    sent.push({ phone, code });
  },
};
const lastCodeFor = (phone: string) => [...sent].reverse().find((s) => s.phone === phone)?.code;

const runTag = String(Date.now()).slice(-5);
const phone = `+918${runTag}0001`;
const otherPhone = `+918${runTag}0002`;
const email = `amit.${runTag}@example.com`;

const profile = {
  name: 'Amit Kumar',
  email,
  companyName: `ABC Garments ${runTag}`,
  pincode: '751001',
  address: 'Saheed Nagar',
  city: 'Bhubaneswar',
  state: 'Odisha',
  addressType: 'Office',
};

let adminToken: string;
let token: string;
let userId: string;
let otherToken: string;
let otherUserId: string;
let categoryId: string;
let productId: string;
let quoteId: string;
let orderId: string;

async function otpLogin(number: string) {
  otpRequestLimiter.reset();
  otpVerifyLimiter.reset();
  await request(app).post('/api/v1/auth/otp/request').send({ phone: number });
  return request(app).post('/api/v1/auth/otp/verify').send({ phone: number, otp: lastCodeFor(number) });
}

/** The admin Customers & Leads rows matching this customer's phone. */
async function adminRows(number = phone) {
  const res = await request(app)
    .get('/api/v1/customers/accounts')
    .query({ search: number, pageSize: 50 })
    .set('Authorization', `Bearer ${adminToken}`);
  expect(res.status).toBe(200);
  return res.body.data as any[];
}

const saveProfile = (body: Record<string, unknown>, bearer = token) =>
  request(app).put('/api/v1/auth/me').set('Authorization', `Bearer ${bearer}`).send(body);

beforeAll(async () => {
  setOtpSender(mockSender);
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN', isActive: true } });
  adminToken = signAuthToken({ id: admin?.id ?? 'test-admin', email: admin?.email ?? null, role: 'ADMIN', companyId: null });

  const category = await prisma.category.create({
    data: { name: `Profile Test ${runTag}`, slug: `profile-test-${runTag}` },
  });
  categoryId = category.id;
  const product = await prisma.product.create({
    data: {
      name: `Profile Test Tee ${runTag}`,
      slug: `profile-test-tee-${runTag}`,
      description: 'Test product',
      basePrice: 200,
      categoryId,
    },
  });
  productId = product.id;
});

afterAll(async () => {
  setOtpSender(null);
  const userIds = [userId, otherUserId].filter(Boolean);
  const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { companyId: true } });
  const companyIds = users.map((u) => u.companyId).filter((id): id is string => Boolean(id));

  await prisma.invoice.deleteMany({ where: { order: { customerId: { in: userIds } } } });
  await prisma.order.deleteMany({ where: { customerId: { in: userIds } } });
  await prisma.quote.deleteMany({ where: { customerId: { in: userIds } } });
  await prisma.systemActivity.deleteMany({ where: { entityType: 'User', entityId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  await prisma.company.deleteMany({ where: { id: { in: companyIds } } });
  await prisma.otpChallenge.deleteMany({ where: { phone: { in: [phone, otherPhone] } } });
  if (productId) await prisma.product.delete({ where: { id: productId } });
  if (categoryId) await prisma.category.delete({ where: { id: categoryId } });
  await prisma.$disconnect();
});

describe('customer profile → admin Customers & Leads', () => {
  it('1-2: a new OTP customer is listed in Admin Customers with phone only, as Abandoned Cart', async () => {
    const res = await otpLogin(phone);
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ role: 'CUSTOMER', phone, email: null, name: '' });
    token = res.body.token;
    userId = res.body.user.id;

    const rows = await adminRows();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: userId,
      name: null,
      phone,
      email: null,
      company: null,
      pincode: null,
      address: null,
      city: null,
      state: null,
      addressType: null,
      gstin: null,
      ordersCount: 0,
      totalValue: 0,
      status: 'ABANDONED_CART',
    });
  });

  it('3-10: My Profile saves every field onto the same customer', async () => {
    const res = await saveProfile(profile);
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ id: userId, name: profile.name, email, phone, role: 'CUSTOMER' });
    expect(res.body.user.company).toMatchObject({
      name: profile.companyName,
      pincode: '751001',
      address: 'Saheed Nagar',
      city: 'Bhubaneswar',
      state: 'Odisha',
      addressType: 'Office',
      gstin: null,
    });
    // A company was linked, so the session token is refreshed for the same user
    expect(res.body.token).toBeDefined();
    token = res.body.token;
  });

  it('11-12: the profile persists when the session is refreshed', async () => {
    const me = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`);
    expect(me.status).toBe(200);
    expect(me.body.user).toMatchObject({ id: userId, name: profile.name, email, phone });
    expect(me.body.user.company).toMatchObject({ name: profile.companyName, pincode: '751001', addressType: 'Office' });

    // A later OTP login resolves to the same account with the saved profile
    // (age the challenge past the resend cooldown, which stays enforced)
    await prisma.otpChallenge.updateMany({ where: { phone }, data: { lastSentAt: new Date(0) } });
    const again = await otpLogin(phone);
    expect(again.body.user.id).toBe(userId);
    expect(again.body.user.name).toBe(profile.name);
  });

  it('13-16: Admin Customers shows the saved profile, with no duplicate and status unchanged', async () => {
    const rows = await adminRows();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: userId,
      name: 'Amit Kumar',
      phone,
      email,
      company: profile.companyName,
      pincode: '751001',
      address: 'Saheed Nagar',
      city: 'Bhubaneswar',
      state: 'Odisha',
      addressType: 'Office',
      status: 'ABANDONED_CART',
    });

    expect(await prisma.user.count({ where: { OR: [{ verifiedPhone: phone }, { phone }, { email }] } })).toBe(1);
    expect(await prisma.company.count({ where: { name: profile.companyName } })).toBe(1);

    const detail = await request(app)
      .get(`/api/v1/customers/accounts/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(detail.status).toBe(200);
    expect(detail.body.customer).toMatchObject({ id: userId, name: 'Amit Kumar', address: 'Saheed Nagar', status: 'ABANDONED_CART' });
    expect(detail.body.customer.orders).toEqual([]);
    expect(detail.body.customer.designHistory).toEqual([]);
    expect(detail.body.customer.activity.map((a: any) => a.type)).toEqual(expect.arrayContaining(['ACCOUNT', 'UPDATE_PROFILE']));
  });

  it('saving again updates the same records, and clearing a field shows it as empty', async () => {
    const res = await saveProfile({ city: 'Cuttack', addressType: '' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeUndefined();

    const rows = await adminRows();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ city: 'Cuttack', addressType: null, name: 'Amit Kumar', pincode: '751001' });
    expect(await prisma.company.count({ where: { name: profile.companyName } })).toBe(1);

    await saveProfile({ city: 'Bhubaneswar', addressType: 'Office' });
  });

  it('the account comes from the token: ids, phone and role in the body are ignored', async () => {
    const other = await otpLogin(otherPhone);
    otherToken = other.body.token;
    otherUserId = other.body.user.id;

    const res = await saveProfile(
      { name: 'Intruder', id: userId, userId, customerId: userId, phone, verifiedPhone: phone, role: 'ADMIN' },
      otherToken
    );
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ id: otherUserId, name: 'Intruder', phone: otherPhone, role: 'CUSTOMER' });

    const victim = await prisma.user.findUnique({ where: { id: userId } });
    expect(victim).toMatchObject({ name: 'Amit Kumar', verifiedPhone: phone, role: 'CUSTOMER' });
    const intruder = await prisma.user.findUnique({ where: { id: otherUserId } });
    expect(intruder).toMatchObject({ verifiedPhone: otherPhone, phone: otherPhone, role: 'CUSTOMER' });
  });

  it('rejects an email that belongs to another account, an invalid email, and non-customers', async () => {
    const taken = await saveProfile({ email }, otherToken);
    expect(taken.status).toBe(409);

    const invalid = await saveProfile({ email: 'not-an-email' });
    expect(invalid.status).toBe(400);

    const asAdmin = await saveProfile({ name: 'Admin' }, adminToken);
    expect(asAdmin.status).toBe(403);

    const anonymous = await request(app).put('/api/v1/auth/me').send({ name: 'Nobody' });
    expect(anonymous.status).toBe(401);
  });

  it('a started but unfinished checkout shows as Abandoned Checkout', async () => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const quote = await prisma.quote.create({
      data: {
        quoteNumber: `ZQB-QT-TEST-${runTag}`,
        customerId: userId,
        companyId: user!.companyId,
        status: 'APPROVED',
        subtotal: 2000,
        gstTotal: 100,
        totalAmount: 2100,
        validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        items: { create: { productId, quantity: 10, unitPrice: 200, totalPrice: 2000 } },
      },
    });
    quoteId = quote.id;

    const rows = await adminRows();
    expect(rows[0]).toMatchObject({ status: 'ABANDONED_CHECKOUT', ordersCount: 0 });
  });

  it('17: creating an order makes the customer Purchased and snapshots the delivery address', async () => {
    const res = await request(app)
      .post(`/api/v1/orders/from-quote/${quoteId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(201);
    orderId = res.body.order.id;

    const rows = await adminRows();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ status: 'PURCHASED', ordersCount: 1, totalValue: 2100 });

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    expect(order!.deliveryAddress).toMatchObject({
      name: 'Amit Kumar',
      phone,
      company: profile.companyName,
      address: 'Saheed Nagar',
      addressType: 'Office',
      city: 'Bhubaneswar',
      state: 'Odisha',
      pincode: '751001',
    });
  });

  it('18-19: changing the profile address afterwards leaves the old order address untouched', async () => {
    const res = await saveProfile({ address: 'Patia', pincode: '751024', city: 'Cuttack', addressType: 'Home' });
    expect(res.status).toBe(200);

    const rows = await adminRows();
    expect(rows[0]).toMatchObject({ address: 'Patia', pincode: '751024', city: 'Cuttack', addressType: 'Home', status: 'PURCHASED' });

    const order = await request(app).get(`/api/v1/orders/${orderId}`).set('Authorization', `Bearer ${token}`);
    expect(order.status).toBe(200);
    expect(order.body.order.deliveryAddress).toMatchObject({
      address: 'Saheed Nagar',
      pincode: '751001',
      city: 'Bhubaneswar',
      addressType: 'Office',
    });
  });
});
