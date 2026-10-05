import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import app from '../src/app.js';
import { config } from '../src/config/index.js';
import { setOtpSender, OtpSender, isDevConsoleOtpEnabled } from '../src/utils/whatsappCloud.js';
import { otpRequestLimiter, otpVerifyLimiter } from '../src/modules/auth/auth.routes.js';
import { normalizeAuthPhone, hashOtp } from '../src/modules/auth/otp.service.js';

const prisma = new PrismaClient();
jest.setTimeout(60000);

// ─── Test doubles ────────────────────────────────────────────────────────────

const sent: { phone: string; code: string }[] = [];
let failNextSend = false;
let senderConfigured = true;

const mockSender: OtpSender = {
  isConfigured: () => senderConfigured,
  async sendOtp(phone, code) {
    if (failNextSend) {
      failNextSend = false;
      throw new Error('simulated provider outage');
    }
    sent.push({ phone, code });
  },
};

const lastCodeFor = (phone: string) => [...sent].reverse().find((s) => s.phone === phone)?.code;

// Unique Indian mobile per test run: +91 9XXXXXXXXX
let seq = 0;
const runTag = String(Date.now()).slice(-5);
function freshPhone(): string {
  seq += 1;
  return `+919${runTag}${String(seq).padStart(4, '0')}`;
}

const createdPhones: string[] = [];
const createdUserIds: string[] = [];

async function requestCode(phone: string) {
  createdPhones.push(normalizeAuthPhone(phone)!);
  return request(app).post('/api/v1/auth/otp/request').send({ phone });
}

async function verifyCode(phone: string, otp: string) {
  const res = await request(app).post('/api/v1/auth/otp/verify').send({ phone, otp });
  if (res.body?.user?.id) createdUserIds.push(res.body.user.id);
  return res;
}

function wrongCodeFor(code: string) {
  return code === '000000' ? '111111' : '000000';
}

beforeAll(() => setOtpSender(mockSender));

beforeEach(() => {
  otpRequestLimiter.reset();
  otpVerifyLimiter.reset();
  failNextSend = false;
  senderConfigured = true;
});

afterAll(async () => {
  setOtpSender(null);
  const phones = Array.from(new Set(createdPhones));
  await prisma.otpChallenge.deleteMany({ where: { phone: { in: phones } } });
  const userIds = Array.from(new Set(createdUserIds));
  await prisma.quote.deleteMany({ where: { customerId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  await prisma.$disconnect();
});

// ─── Phone normalization ─────────────────────────────────────────────────────

describe('normalizeAuthPhone', () => {
  it('normalizes common Indian formats to E.164', () => {
    expect(normalizeAuthPhone('+91 98765 43210')).toBe('+919876543210');
    expect(normalizeAuthPhone('9876543210')).toBe('+919876543210');
    expect(normalizeAuthPhone('09876543210')).toBe('+919876543210');
    expect(normalizeAuthPhone('919876543210')).toBe('+919876543210');
    expect(normalizeAuthPhone('+971 50 123 4567')).toBe('+971501234567');
  });

  it('rejects invalid input', () => {
    expect(normalizeAuthPhone('12345')).toBeNull();
    expect(normalizeAuthPhone('+91 12345 67890')).toBeNull(); // Indian mobiles start 6-9
    expect(normalizeAuthPhone('abc')).toBeNull();
    expect(normalizeAuthPhone(undefined)).toBeNull();
    expect(normalizeAuthPhone('98765432101234567890')).toBeNull();
  });
});

// ─── OTP request ─────────────────────────────────────────────────────────────

describe('POST /api/v1/auth/otp/request', () => {
  it('sends a 6-digit OTP via the WhatsApp service and never returns it', async () => {
    const phone = freshPhone();
    const res = await requestCode(phone);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.resendIn).toBe(config.otp.resendCooldownSeconds);

    const code = lastCodeFor(phone);
    expect(code).toMatch(/^\d{6}$/);
    expect(JSON.stringify(res.body)).not.toContain(code);

    // Only an HMAC is stored, never the code
    const challenge = await prisma.otpChallenge.findUnique({ where: { phone } });
    expect(challenge?.codeHash).toBe(hashOtp(phone, code!));
    expect(challenge?.codeHash).not.toContain(code);
  });

  it('normalizes the phone before sending', async () => {
    const e164 = freshPhone();
    const local = `${e164.slice(3, 8)} ${e164.slice(8)}`; // "9XXXX XXXXX"
    const res = await requestCode(local);
    expect(res.status).toBe(200);
    expect(lastCodeFor(e164)).toBeDefined();
  });

  it('rejects an invalid phone number', async () => {
    const res = await request(app).post('/api/v1/auth/otp/request').send({ phone: '12345abc' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects a country code outside the allowlist', async () => {
    const res = await request(app).post('/api/v1/auth/otp/request').send({ phone: '+14155550123' });
    expect(res.status).toBe(400);
  });

  it('gives the same response for new and existing numbers (no account enumeration)', async () => {
    const existing = await prisma.user.create({
      data: { name: 'Enum Check', phone: freshPhone(), role: 'CUSTOMER' },
    });
    createdUserIds.push(existing.id);
    const a = await requestCode(existing.phone!);
    const b = await requestCode(freshPhone());
    expect(a.status).toBe(b.status);
    expect(Object.keys(a.body).sort()).toEqual(Object.keys(b.body).sort());
    expect(a.body.message).toBe(b.body.message);
  });

  it('enforces the resend cooldown', async () => {
    const phone = freshPhone();
    expect((await requestCode(phone)).status).toBe(200);

    const again = await requestCode(phone);
    expect(again.status).toBe(429);
    expect(again.body.retryAfter).toBeGreaterThan(0);
    expect(again.headers['retry-after']).toBeDefined();
  });

  it('a resend after the cooldown invalidates the previous code', async () => {
    const phone = freshPhone();
    await requestCode(phone);
    const first = lastCodeFor(phone)!;

    await prisma.otpChallenge.update({
      where: { phone },
      data: { lastSentAt: new Date(Date.now() - (config.otp.resendCooldownSeconds + 1) * 1000) },
    });
    expect((await requestCode(phone)).status).toBe(200);
    const second = lastCodeFor(phone)!;

    if (first !== second) {
      expect((await verifyCode(phone, first)).status).toBe(400);
    }
    expect((await verifyCode(phone, second)).status).toBe(200);
  });

  it('caps sends per phone per hour', async () => {
    const phone = freshPhone();
    await requestCode(phone);
    await prisma.otpChallenge.update({
      where: { phone },
      data: { sendCount: config.otp.maxSendsPerWindow, lastSentAt: new Date(Date.now() - 120000) },
    });
    const res = await requestCode(phone);
    expect(res.status).toBe(429);
    expect(res.body.message).toMatch(/too many codes/i);
  });

  it('rate-limits OTP requests per IP', async () => {
    const statuses: number[] = [];
    for (let i = 0; i <= config.otp.ipRequestLimit; i++) {
      statuses.push((await requestCode(freshPhone())).status);
    }
    expect(statuses.slice(0, config.otp.ipRequestLimit).every((s) => s === 200)).toBe(true);
    expect(statuses[config.otp.ipRequestLimit]).toBe(429);
  });

  it('returns 502 and invalidates the code when WhatsApp delivery fails', async () => {
    const phone = freshPhone();
    failNextSend = true;
    const res = await requestCode(phone);
    expect(res.status).toBe(502);
    const challenge = await prisma.otpChallenge.findUnique({ where: { phone } });
    expect(challenge?.codeHash).toBeNull();
  });

  it('returns 503 when WhatsApp delivery is not configured', async () => {
    senderConfigured = false;
    const res = await requestCode(freshPhone());
    expect(res.status).toBe(503);
  });
});

// ─── OTP verify ──────────────────────────────────────────────────────────────

describe('POST /api/v1/auth/otp/verify', () => {
  it('creates a minimal CUSTOMER and returns the standard JWT', async () => {
    const phone = freshPhone();
    await requestCode(phone);
    const res = await verifyCode(phone, lastCodeFor(phone)!);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.role).toBe('CUSTOMER');
    expect(res.body.user.phone).toBe(phone);

    // Same token format authenticateJWT already consumes
    const decoded: any = jwt.verify(res.body.token, config.jwtSecret);
    expect(decoded).toMatchObject({ id: res.body.user.id, role: 'CUSTOMER', email: null, companyId: null });

    const user = await prisma.user.findUnique({ where: { id: res.body.user.id } });
    expect(user).toMatchObject({ verifiedPhone: phone, email: null, passwordHash: null, role: 'CUSTOMER' });

    // Token works on protected routes
    const me = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${res.body.token}`);
    expect(me.status).toBe(200);
    expect(me.body.user.id).toBe(res.body.user.id);
  });

  it('logs the same customer in again on a later OTP (no duplicate account)', async () => {
    const phone = freshPhone();
    await requestCode(phone);
    const first = await verifyCode(phone, lastCodeFor(phone)!);

    await prisma.otpChallenge.update({ where: { phone }, data: { lastSentAt: new Date(0) } });
    await requestCode(phone);
    const second = await verifyCode(phone, lastCodeFor(phone)!);

    expect(second.status).toBe(200);
    expect(second.body.user.id).toBe(first.body.user.id);
  });

  it('rejects a wrong OTP and reports remaining attempts', async () => {
    const phone = freshPhone();
    await requestCode(phone);
    const res = await verifyCode(phone, wrongCodeFor(lastCodeFor(phone)!));
    expect(res.status).toBe(400);
    expect(res.body.token).toBeUndefined();
    expect(res.body.attemptsRemaining).toBe(config.otp.maxVerifyAttempts - 1);
  });

  it('rejects an expired OTP', async () => {
    const phone = freshPhone();
    await requestCode(phone);
    await prisma.otpChallenge.update({ where: { phone }, data: { expiresAt: new Date(Date.now() - 1000) } });
    const res = await verifyCode(phone, lastCodeFor(phone)!);
    expect(res.status).toBe(400);
    expect(res.body.token).toBeUndefined();
  });

  it('rejects a reused OTP (single use)', async () => {
    const phone = freshPhone();
    await requestCode(phone);
    const code = lastCodeFor(phone)!;
    expect((await verifyCode(phone, code)).status).toBe(200);

    const replay = await verifyCode(phone, code);
    expect(replay.status).toBe(400);
    expect(replay.body.token).toBeUndefined();
  });

  it('locks the code after too many wrong attempts, even for the right code', async () => {
    const phone = freshPhone();
    await requestCode(phone);
    const code = lastCodeFor(phone)!;
    const wrong = wrongCodeFor(code);

    for (let i = 0; i < config.otp.maxVerifyAttempts - 1; i++) {
      expect((await verifyCode(phone, wrong)).status).toBe(400);
    }
    expect((await verifyCode(phone, wrong)).status).toBe(429);

    const correct = await verifyCode(phone, code);
    expect(correct.status).toBe(429);
    expect(correct.body.token).toBeUndefined();
  });

  it('rejects verification when no code was requested', async () => {
    const phone = freshPhone();
    createdPhones.push(phone);
    const res = await verifyCode(phone, '123456');
    expect(res.status).toBe(400);
  });

  it('rejects a malformed OTP', async () => {
    const res = await request(app).post('/api/v1/auth/otp/verify').send({ phone: freshPhone(), otp: '12ab' });
    expect(res.status).toBe(400);
  });

  it('rate-limits verification per IP', async () => {
    const phone = freshPhone();
    createdPhones.push(phone);
    let last = 0;
    for (let i = 0; i <= config.otp.ipVerifyLimit; i++) {
      last = (await request(app).post('/api/v1/auth/otp/verify').send({ phone, otp: '123456' })).status;
    }
    expect(last).toBe(429);
  });
});

// ─── Existing accounts ───────────────────────────────────────────────────────

describe('Existing account handling', () => {
  it('links an existing CUSTOMER by contact phone and preserves their data', async () => {
    const e164 = freshPhone();
    const legacy = await prisma.user.create({
      data: {
        name: 'Legacy Customer',
        email: `legacy-${runTag}-${seq}@otp.test`,
        passwordHash: await bcrypt.hash('legacy-pass-123', 4),
        phone: `${e164.slice(3, 8)} ${e164.slice(8)}`, // stored in a loose local format
        role: 'CUSTOMER',
      },
    });
    createdUserIds.push(legacy.id);

    await requestCode(e164);
    const res = await verifyCode(e164, lastCodeFor(e164)!);

    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(legacy.id);
    expect(res.body.user.name).toBe('Legacy Customer');
    const after = await prisma.user.findUnique({ where: { id: legacy.id } });
    expect(after?.verifiedPhone).toBe(e164);
    expect(after?.email).toBe(legacy.email);
  });

  it('refuses OTP sign-in for a number that belongs to an ADMIN', async () => {
    const phone = freshPhone();
    const admin = await prisma.user.create({
      data: {
        name: 'Admin With Phone',
        email: `admin-phone-${runTag}-${seq}@otp.test`,
        passwordHash: await bcrypt.hash('admin-pass-123', 4),
        phone: `${phone.slice(3, 8)} ${phone.slice(8)}`,
        role: 'ADMIN',
      },
    });
    createdUserIds.push(admin.id);
    const usersBefore = await prisma.user.count();

    await requestCode(phone);
    const res = await verifyCode(phone, lastCodeFor(phone)!);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('ADMIN_PASSWORD_LOGIN');
    expect(res.body.token).toBeUndefined();
    expect(await prisma.user.count()).toBe(usersBefore); // no customer created for an admin number
    expect((await prisma.user.findUnique({ where: { id: admin.id } }))?.verifiedPhone).toBeNull();
  });

  it('refuses OTP for an account promoted to ADMIN after its phone was bound', async () => {
    const phone = freshPhone();
    const promoted = await prisma.user.create({
      data: { name: 'Promoted', email: `promoted-${runTag}@otp.test`, phone, verifiedPhone: phone, role: 'ADMIN' },
    });
    createdUserIds.push(promoted.id);
    await requestCode(phone);
    const res = await verifyCode(phone, lastCodeFor(phone)!);
    expect(res.status).toBe(403);
    expect(res.body.token).toBeUndefined();
  });

  it('refuses a deactivated customer', async () => {
    const phone = freshPhone();
    const inactive = await prisma.user.create({
      data: { name: 'Inactive', phone, verifiedPhone: phone, role: 'CUSTOMER', isActive: false },
    });
    createdUserIds.push(inactive.id);
    await requestCode(phone);
    const res = await verifyCode(phone, lastCodeFor(phone)!);
    expect(res.status).toBe(403);
    expect(res.body.token).toBeUndefined();
  });

  it('a passwordless OTP customer cannot use password login', async () => {
    const phone = freshPhone();
    await requestCode(phone);
    const res = await verifyCode(phone, lastCodeFor(phone)!);
    expect(res.status).toBe(200);
    const login = await request(app).post('/api/v1/auth/login').send({ email: 'nobody@otp.test', password: 'x' });
    expect(login.status).toBe(401);
  });
});

// ─── SALES / PRODUCTION are disabled ─────────────────────────────────────────

describe('SALES / PRODUCTION are disabled', () => {
  it.each(['SALES', 'PRODUCTION'] as const)('%s cannot sign in with WhatsApp OTP', async (role) => {
    const phone = freshPhone();
    const staff = await prisma.user.create({
      data: {
        name: `${role} Member`,
        email: `${role.toLowerCase()}-otp-${runTag}@otp.test`,
        phone: `+91 ${phone.slice(3, 8)} ${phone.slice(8)}`,
        role,
      },
    });
    createdUserIds.push(staff.id);
    const usersBefore = await prisma.user.count();

    await requestCode(phone);
    const res = await verifyCode(phone, lastCodeFor(phone)!);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('SIGN_IN_UNAVAILABLE');
    expect(res.body.message).not.toMatch(/sales|production/i); // generic
    expect(res.body.token).toBeUndefined();
    expect(await prisma.user.count()).toBe(usersBefore); // no customer created for a staff number
  });

  it.each(['SALES', 'PRODUCTION'] as const)('%s bound earlier by OTP is refused now', async (role) => {
    const phone = freshPhone();
    const staff = await prisma.user.create({ data: { name: `Bound ${role}`, phone, verifiedPhone: phone, role } });
    createdUserIds.push(staff.id);
    await requestCode(phone);
    const res = await verifyCode(phone, lastCodeFor(phone)!);
    expect(res.status).toBe(403);
    expect(res.body.token).toBeUndefined();
  });

  it.each(['SALES', 'PRODUCTION'] as const)('%s password login fails with the generic message', async (role) => {
    const email = `${role.toLowerCase()}-pw-${runTag}@otp.test`;
    const password = 'Str0ng-pass!';
    const staff = await prisma.user.create({
      data: { name: `${role} Tester`, email, passwordHash: await bcrypt.hash(password, 4), role },
    });
    createdUserIds.push(staff.id);

    const right = await request(app).post('/api/v1/auth/login').send({ email, password });
    const wrong = await request(app).post('/api/v1/auth/login').send({ email, password: 'nope' });
    expect(right.status).toBe(401);
    expect(right.body).toEqual(wrong.body); // indistinguishable from a wrong password
    expect(right.body.token).toBeUndefined();
  });

  it.each([
    ['SALES', '/api/v1/agents'],
    ['SALES', '/api/v1/quotes'],
    ['PRODUCTION', '/api/v1/production/kanban'],
    ['PRODUCTION', '/api/v1/orders'],
    ['PRODUCTION', '/api/v1/dispatch'],
  ] as const)('an existing %s token is rejected on %s', async (role, path) => {
    const token = jwt.sign({ id: 'legacy-staff', email: null, role }, config.jwtSecret, { expiresIn: '1h' });
    const res = await request(app).get(path).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('an admin can no longer assign the SALES role', async () => {
    const target = await prisma.user.create({ data: { name: 'Role Target', role: 'CUSTOMER' } });
    createdUserIds.push(target.id);
    const adminToken = jwt.sign({ id: 'admin-otp-test', email: 'a@otp.test', role: 'ADMIN' }, config.jwtSecret);
    await request(app).put(`/api/v1/agents/${target.id}`).set('Authorization', `Bearer ${adminToken}`).send({ role: 'SALES' });
    expect((await prisma.user.findUnique({ where: { id: target.id } }))?.role).toBe('CUSTOMER');
  });

  it('unknown numbers always become CUSTOMER, whatever role the browser sends', async () => {
    const phone = freshPhone();
    await requestCode(phone);
    const res = await request(app)
      .post('/api/v1/auth/otp/verify')
      .send({ phone, otp: lastCodeFor(phone), role: 'ADMIN', userId: 'someone-else', companyId: 'x' });
    createdUserIds.push(res.body.user.id);

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('CUSTOMER');
    expect((jwt.verify(res.body.token, config.jwtSecret) as any).role).toBe('CUSTOMER');
  });

  it('an admin changing a stored phone unbinds the old number', async () => {
    const oldPhone = freshPhone();
    const newPhone = freshPhone();
    const cust = await prisma.user.create({
      data: { name: 'Rebind Customer', phone: oldPhone, verifiedPhone: oldPhone, role: 'CUSTOMER' },
    });
    createdUserIds.push(cust.id);
    const adminToken = jwt.sign({ id: 'admin-otp-test', email: 'a@otp.test', role: 'ADMIN' }, config.jwtSecret);

    const upd = await request(app)
      .put(`/api/v1/agents/${cust.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ phone: newPhone });
    expect(upd.status).toBe(200);
    expect((await prisma.user.findUnique({ where: { id: cust.id } }))?.verifiedPhone).toBeNull();

    await requestCode(oldPhone);
    const oldRes = await verifyCode(oldPhone, lastCodeFor(oldPhone)!);
    expect(oldRes.body.user.id).not.toBe(cust.id);

    await requestCode(newPhone);
    const newRes = await verifyCode(newPhone, lastCodeFor(newPhone)!);
    expect(newRes.body.user.id).toBe(cust.id);
  });

  it("creating a quote never overwrites a non-customer's phone", async () => {
    const victimPhone = freshPhone();
    const victim = await prisma.user.create({ data: { name: 'Victim Staff', phone: victimPhone, role: 'SALES' } });
    const admin = await prisma.user.create({ data: { name: 'Quote Admin', email: `quote-admin-${runTag}@otp.test`, role: 'ADMIN' } });
    createdUserIds.push(victim.id, admin.id);
    const adminToken = jwt.sign({ id: admin.id, email: admin.email, role: 'ADMIN' }, config.jwtSecret);

    await request(app)
      .post('/api/v1/quotes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ customerId: victim.id, customerName: 'Hijacked', phone: '+919000000001', quantity: 50 });

    const after = await prisma.user.findUnique({ where: { id: victim.id } });
    expect(after?.phone).toBe(victimPhone);
    expect(after?.name).toBe('Victim Staff');
    await prisma.quote.deleteMany({ where: { customerId: victim.id } });
  });
});

// ─── Email + password is ADMIN-only ──────────────────────────────────────────

describe('Email + password login is for ADMIN only', () => {
  const password = 'Str0ng-pass!';
  async function passwordUser(role: 'ADMIN' | 'CUSTOMER') {
    const email = `${role.toLowerCase()}-pwonly-${runTag}@otp.test`;
    const user = await prisma.user.create({
      data: { name: `${role} Tester`, email, passwordHash: await bcrypt.hash(password, 4), role },
    });
    createdUserIds.push(user.id);
    return { user, email };
  }

  it('ADMIN logs in with email + password and the admin JWT works', async () => {
    const { user, email } = await passwordUser('ADMIN');
    const ok = await request(app).post('/api/v1/auth/login').send({ email, password });
    expect(ok.status).toBe(200);
    expect(ok.body.user.role).toBe('ADMIN');
    expect(jwt.verify(ok.body.token, config.jwtSecret)).toMatchObject({ id: user.id, email, role: 'ADMIN' });

    const adminOnly = await request(app)
      .put(`/api/v1/agents/${user.id}`)
      .set('Authorization', `Bearer ${ok.body.token}`)
      .send({ department: 'Ops' });
    expect(adminOnly.status).toBe(200);

    const bad = await request(app).post('/api/v1/auth/login').send({ email, password: 'wrong' });
    expect(bad.status).toBe(401);
  });

  it('a CUSTOMER with a correct legacy password is sent to WhatsApp OTP', async () => {
    const { email } = await passwordUser('CUSTOMER');
    const res = await request(app).post('/api/v1/auth/login').send({ email, password });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('OTP_LOGIN_REQUIRED');
    expect(res.body.token).toBeUndefined();
  });

  it('password registration is retired', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: `reg-${runTag}@otp.test`, password: 'secret123', name: 'Reg' });
    expect(res.status).toBe(410);
    expect(res.body.code).toBe('OTP_LOGIN_REQUIRED');
  });

  it('change-password is admin-only', async () => {
    const customerToken = jwt.sign({ id: 'x', email: null, role: 'CUSTOMER' }, config.jwtSecret);
    const res = await request(app)
      .post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ currentPassword: 'a', newPassword: 'b' });
    expect(res.status).toBe(403);
  });

  it('a CUSTOMER token cannot use admin APIs', async () => {
    const customerToken = jwt.sign({ id: 'x', email: null, role: 'CUSTOMER' }, config.jwtSecret);
    const res = await request(app).get('/api/v1/agents').set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(403);
  });
});

// ─── Development console OTP ─────────────────────────────────────────────────

describe('Development OTP (DEV_AUTH_OTP_MODE=console)', () => {
  const saved = { NODE_ENV: process.env.NODE_ENV, DEV_AUTH_OTP_MODE: process.env.DEV_AUTH_OTP_MODE };
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    setOtpSender(null); // use the real sender selection
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    process.env.NODE_ENV = saved.NODE_ENV;
    if (saved.DEV_AUTH_OTP_MODE === undefined) delete process.env.DEV_AUTH_OTP_MODE;
    else process.env.DEV_AUTH_OTP_MODE = saved.DEV_AUTH_OTP_MODE;
    delete process.env.RAILWAY_ENVIRONMENT;
    setOtpSender(mockSender);
  });

  const devOtpLines = () =>
    logSpy.mock.calls.map((c) => String(c[0])).filter((line) => line.startsWith('[DEV OTP]'));

  it('is enabled only for NODE_ENV=development + DEV_AUTH_OTP_MODE=console, never on Railway', () => {
    expect(isDevConsoleOtpEnabled({ NODE_ENV: 'development', DEV_AUTH_OTP_MODE: 'console' })).toBe(true);
    expect(isDevConsoleOtpEnabled({ NODE_ENV: 'production', DEV_AUTH_OTP_MODE: 'console' })).toBe(false);
    expect(isDevConsoleOtpEnabled({ NODE_ENV: 'staging', DEV_AUTH_OTP_MODE: 'console' })).toBe(false);
    expect(isDevConsoleOtpEnabled({ NODE_ENV: 'test', DEV_AUTH_OTP_MODE: 'console' })).toBe(false);
    expect(isDevConsoleOtpEnabled({ NODE_ENV: 'development' })).toBe(false);
    expect(isDevConsoleOtpEnabled({ NODE_ENV: 'development', DEV_AUTH_OTP_MODE: 'whatsapp' })).toBe(false);
    expect(
      isDevConsoleOtpEnabled({ NODE_ENV: 'development', DEV_AUTH_OTP_MODE: 'console', RAILWAY_ENVIRONMENT: 'staging' })
    ).toBe(false);
  });

  it('development: logs the real OTP (not in the response) and it verifies into a CUSTOMER session', async () => {
    process.env.NODE_ENV = 'development';
    process.env.DEV_AUTH_OTP_MODE = 'console';
    const phone = freshPhone();

    const req = await requestCode(phone);
    expect(req.status).toBe(200);
    const lines = devOtpLines();
    expect(lines).toHaveLength(1);
    const match = lines[0].match(/^\[DEV OTP\] (\+\d+) -> (\d{6})$/);
    expect(match?.[1]).toBe(phone);
    const code = match![2];
    expect(JSON.stringify(req.body)).not.toContain(code);

    // Stored like the real flow: only the hash
    const challenge = await prisma.otpChallenge.findUnique({ where: { phone } });
    expect(challenge?.codeHash).toBe(hashOtp(phone, code));

    // Wrong code still rejected; the logged code verifies
    expect((await verifyCode(phone, code === '000000' ? '111111' : '000000')).status).toBe(400);
    const res = await verifyCode(phone, code);
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('CUSTOMER');

    // Session works on customer routes, identity from the token
    const me = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${res.body.token}`);
    expect(me.body.user.id).toBe(res.body.user.id);
    const quotes = await request(app).get('/api/v1/quotes').set('Authorization', `Bearer ${res.body.token}`);
    expect(quotes.status).toBe(200);
    expect(quotes.body.quotes).toEqual([]);
  });

  it.each(['production', 'staging'])('%s: never logs the OTP, even with DEV_AUTH_OTP_MODE=console', async (nodeEnv) => {
    process.env.NODE_ENV = nodeEnv;
    process.env.DEV_AUTH_OTP_MODE = 'console';
    const res = await requestCode(freshPhone());
    // Falls back to the real WhatsApp provider (not configured in tests → 503)
    expect(res.status).toBe(503);
    expect(devOtpLines()).toHaveLength(0);
  });

  it('development on Railway: never logs the OTP', async () => {
    process.env.NODE_ENV = 'development';
    process.env.DEV_AUTH_OTP_MODE = 'console';
    process.env.RAILWAY_ENVIRONMENT = 'staging';
    const res = await requestCode(freshPhone());
    expect(res.status).toBe(503);
    expect(devOtpLines()).toHaveLength(0);
  });
});

// ─── Customer identity comes from the verified JWT ───────────────────────────

describe('Customer identity from JWT', () => {
  let token: string;
  let userId: string;
  let otherCustomerId: string;
  let otherQuoteId: string;

  beforeAll(async () => {
    const phone = freshPhone();
    await requestCode(phone);
    const res = await verifyCode(phone, lastCodeFor(phone)!);
    token = res.body.token;
    userId = res.body.user.id;

    const other = await prisma.user.create({
      data: { name: 'Other Customer', phone: freshPhone(), role: 'CUSTOMER' },
    });
    otherCustomerId = other.id;
    createdUserIds.push(other.id);

    const otherQuote = await prisma.quote.create({
      data: {
        quoteNumber: `ZQB-OTP-${runTag}`,
        customerId: other.id,
        companyId: null,
        validUntil: new Date(Date.now() + 86400000),
        subtotal: 1000,
        gstTotal: 50,
        totalAmount: 1050,
      },
    });
    otherQuoteId = otherQuote.id;
  });

  it('ignores customerId/companyId in the body and fills a missing name', async () => {
    const res = await request(app)
      .post('/api/v1/quotes')
      .set('Authorization', `Bearer ${token}`)
      .send({ customerId: otherCustomerId, companyId: 'someone-elses-company', name: 'Priya Sharma', phone: '9876543210', quantity: 50 });

    expect(res.status).toBe(201);
    const quote = await prisma.quote.findFirst({ where: { quoteNumber: res.body.quote.quoteNumber } });
    expect(quote?.customerId).toBe(userId);
    expect(quote?.companyId).toBeNull();

    const other = await prisma.user.findUnique({ where: { id: otherCustomerId } });
    expect(other?.name).toBe('Other Customer');
    const me = await prisma.user.findUnique({ where: { id: userId } });
    expect(me?.name).toBe('Priya Sharma');
  });

  it('a customer without a company only lists their own quotes', async () => {
    const res = await request(app).get('/api/v1/quotes?pageSize=100').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.quotes.length).toBeGreaterThan(0);
    expect(res.body.quotes.every((q: any) => q.customerId === userId)).toBe(true);
  });

  it("cannot open another company-less customer's quote", async () => {
    const res = await request(app).get(`/api/v1/quotes/${otherQuoteId}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('a customer without a company only lists their own orders', async () => {
    const res = await request(app).get('/api/v1/orders').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    const orders = res.body.orders || res.body.data || [];
    expect(orders.every((o: any) => o.customerId === userId)).toBe(true);
  });
});
