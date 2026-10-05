import crypto from 'crypto';
import { prisma, config } from '../../config/index.js';
import { getOtpSender } from '../../utils/whatsappCloud.js';

type Failure = { ok: false; status: number; message: string; retryAfter?: number; attemptsRemaining?: number };

const OTP_LENGTH = 6;

/**
 * Normalize user input to E.164 (`+<digits>`). Bare 10-digit numbers (or with a
 * leading 0) are treated as Indian mobiles. Returns null when not a plausible number.
 */
export function normalizeAuthPhone(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!/^\+?[\d\s\-().]{7,24}$/.test(trimmed)) return null;

  let digits = trimmed.replace(/\D/g, '');
  if (!trimmed.startsWith('+')) {
    if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
    if (digits.length === 10) digits = `91${digits}`;
    else if (!(digits.length === 12 && digits.startsWith('91'))) return null;
  }

  if (!/^[1-9]\d{7,14}$/.test(digits)) return null;
  // Indian mobile numbers: +91 followed by 10 digits starting 6-9
  if (digits.startsWith('91') && !/^91[6-9]\d{9}$/.test(digits)) return null;
  return `+${digits}`;
}

export function isCountryAllowed(phoneE164: string): boolean {
  const digits = phoneE164.slice(1);
  return config.otp.allowedCountryCodes.some((cc) => digits.startsWith(cc));
}

/** Mask for logs: +91******3210 */
export function maskPhone(phoneE164: string): string {
  return phoneE164.length > 7 ? `${phoneE164.slice(0, 3)}******${phoneE164.slice(-4)}` : '***';
}

export function hashOtp(phoneE164: string, code: string): string {
  return crypto.createHmac('sha256', config.otp.hashSecret).update(`${phoneE164}:${code}`).digest('hex');
}

function safeEqualHex(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'hex');
  const bb = Buffer.from(b, 'hex');
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

function generateOtp(): string {
  return crypto.randomInt(0, 10 ** OTP_LENGTH).toString().padStart(OTP_LENGTH, '0');
}

export async function requestOtp(
  phone: string
): Promise<{ ok: true; expiresIn: number; resendIn: number } | Failure> {
  const sender = getOtpSender();
  if (!sender.isConfigured()) {
    console.warn('[AUTH] OTP_DELIVERY_NOT_CONFIGURED — set WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_OTP_TEMPLATE_NAME');
    return { ok: false, status: 503, message: 'WhatsApp login is temporarily unavailable. Please try again later.' };
  }

  const { ttlSeconds, resendCooldownSeconds, maxSendsPerWindow, sendWindowSeconds } = config.otp;
  const now = new Date();

  let challenge = await prisma.otpChallenge.findUnique({ where: { phone } });
  if (!challenge) {
    try {
      challenge = await prisma.otpChallenge.create({ data: { phone, expiresAt: now } });
    } catch (err: any) {
      if (err?.code !== 'P2002') throw err;
      challenge = await prisma.otpChallenge.findUnique({ where: { phone } });
    }
  }
  if (!challenge) throw new Error('OTP challenge could not be initialised');

  // Resend cooldown
  if (challenge.lastSentAt) {
    const elapsed = (now.getTime() - challenge.lastSentAt.getTime()) / 1000;
    if (elapsed < resendCooldownSeconds) {
      const retryAfter = Math.ceil(resendCooldownSeconds - elapsed);
      return { ok: false, status: 429, message: `Please wait ${retryAfter}s before requesting a new code.`, retryAfter };
    }
  }

  // Sends per rolling window, per phone
  const windowAge = (now.getTime() - challenge.windowStartedAt.getTime()) / 1000;
  const windowExpired = windowAge >= sendWindowSeconds;
  const sendCount = windowExpired ? 0 : challenge.sendCount;
  if (sendCount >= maxSendsPerWindow) {
    const retryAfter = Math.ceil(sendWindowSeconds - windowAge);
    return {
      ok: false,
      status: 429,
      message: 'Too many codes requested for this number. Please try again later.',
      retryAfter,
    };
  }

  const code = generateOtp();
  const codeHash = hashOtp(phone, code);

  // Optimistic concurrency on lastSentAt: only one concurrent request can win.
  const claimed = await prisma.otpChallenge.updateMany({
    where: { id: challenge.id, lastSentAt: challenge.lastSentAt },
    data: {
      codeHash,
      expiresAt: new Date(now.getTime() + ttlSeconds * 1000),
      attempts: 0,
      consumedAt: null,
      lastSentAt: now,
      sendCount: sendCount + 1,
      windowStartedAt: windowExpired ? now : challenge.windowStartedAt,
    },
  });
  if (claimed.count === 0) {
    return {
      ok: false,
      status: 429,
      message: `Please wait ${resendCooldownSeconds}s before requesting a new code.`,
      retryAfter: resendCooldownSeconds,
    };
  }

  try {
    await sender.sendOtp(phone, code);
  } catch (err: any) {
    // Invalidate the undelivered code
    await prisma.otpChallenge.updateMany({ where: { id: challenge.id, codeHash }, data: { codeHash: null } });
    console.error('[AUTH] OTP_SEND_FAILED', JSON.stringify({ phone: maskPhone(phone), error: err?.message }));
    return { ok: false, status: 502, message: 'We could not send the code on WhatsApp. Please try again shortly.' };
  }

  return { ok: true, expiresIn: ttlSeconds, resendIn: resendCooldownSeconds };
}

export async function verifyOtp(phone: string, code: string): Promise<{ ok: true } | Failure> {
  const { maxVerifyAttempts } = config.otp;
  const now = new Date();
  const expiredMessage = 'This code is invalid or has expired. Please request a new code.';
  const lockedMessage = 'Too many incorrect attempts. Please request a new code.';

  // Atomically count this attempt against a live, unconsumed challenge.
  const bumped = await prisma.otpChallenge.updateMany({
    where: {
      phone,
      codeHash: { not: null },
      consumedAt: null,
      expiresAt: { gt: now },
      attempts: { lt: maxVerifyAttempts },
    },
    data: { attempts: { increment: 1 } },
  });

  if (bumped.count === 0) {
    const current = await prisma.otpChallenge.findUnique({ where: { phone } });
    const locked =
      current && current.codeHash && !current.consumedAt && current.expiresAt > now && current.attempts >= maxVerifyAttempts;
    return locked
      ? { ok: false, status: 429, message: lockedMessage, attemptsRemaining: 0 }
      : { ok: false, status: 400, message: expiredMessage };
  }

  const challenge = await prisma.otpChallenge.findUnique({ where: { phone } });
  if (!challenge?.codeHash) return { ok: false, status: 400, message: expiredMessage };

  const expected = challenge.codeHash;
  if (!safeEqualHex(expected, hashOtp(phone, code))) {
    const attemptsRemaining = Math.max(0, maxVerifyAttempts - challenge.attempts);
    return attemptsRemaining > 0
      ? { ok: false, status: 400, message: 'Incorrect code. Please check and try again.', attemptsRemaining }
      : { ok: false, status: 429, message: lockedMessage, attemptsRemaining: 0 };
  }

  // Single use: consume only if this exact code is still live (prevents replay/races).
  const consumed = await prisma.otpChallenge.updateMany({
    where: { phone, codeHash: expected, consumedAt: null },
    data: { consumedAt: now, codeHash: null },
  });
  if (consumed.count === 0) return { ok: false, status: 400, message: expiredMessage };

  return { ok: true };
}

export type OtpUserResolution =
  | { ok: true; user: NonNullable<Awaited<ReturnType<typeof loadUser>>>; created: boolean }
  | { ok: false; status: number; code: string; message: string };

const include = { company: true } as const;
const loadUser = (verifiedPhone: string) => prisma.user.findUnique({ where: { verifiedPhone }, include });

const ADMIN_REFUSAL = {
  ok: false as const,
  status: 403,
  code: 'ADMIN_PASSWORD_LOGIN',
  message: 'This number belongs to an admin account. Please use Admin Login with your email and password.',
};

// SALES/PRODUCTION are disabled roles: refuse with a generic message.
const DISABLED_REFUSAL = {
  ok: false as const,
  status: 403,
  code: 'SIGN_IN_UNAVAILABLE',
  message: 'This number cannot be used to sign in. Please contact support.',
};

type UserRow = NonNullable<Awaited<ReturnType<typeof loadUser>>>;

/** Only CUSTOMER accounts may complete OTP sign-in. */
function resolved(user: UserRow, created: boolean): OtpUserResolution {
  if (user.role === 'ADMIN') return ADMIN_REFUSAL;
  if (user.role !== 'CUSTOMER') return DISABLED_REFUSAL;
  return { ok: true, user, created };
}

/**
 * Resolve the account for a phone that has just been proven via OTP.
 * Only CUSTOMER signs in this way (ADMIN uses email + password; SALES and
 * PRODUCTION are disabled). The role always comes from the database.
 *
 * 1. Account already bound to this verified phone → sign in if it is a CUSTOMER.
 * 2. Otherwise match unbound accounts whose stored contact phone normalizes to it:
 *    - any ADMIN match → refused (use Admin Login)
 *    - any SALES/PRODUCTION match → refused (disabled roles)
 *    - exactly one CUSTOMER → bind and sign in (keeps their quotes/orders/company)
 *    - several CUSTOMERs → new customer (legacy duplicates are left untouched)
 * 3. No match → create a minimal CUSTOMER (no email, no password).
 */
export async function findOrCreateOtpUser(phone: string): Promise<OtpUserResolution> {
  const bound = await loadUser(phone);
  if (bound) return resolved(bound, false);

  const last10 = phone.slice(-10);
  const candidates = await prisma.$queryRaw<{ id: string; phone: string | null; role: string }[]>`
    SELECT id, phone, role::text AS role FROM "users"
    WHERE "verifiedPhone" IS NULL
      AND phone IS NOT NULL
      AND right(regexp_replace(phone, '[^0-9]', '', 'g'), 10) = ${last10}`;
  const matches = candidates.filter((c) => normalizeAuthPhone(c.phone) === phone);

  if (matches.some((m) => m.role === 'ADMIN')) return ADMIN_REFUSAL;
  if (matches.some((m) => m.role !== 'CUSTOMER')) return DISABLED_REFUSAL;

  if (matches.length === 1) {
    try {
      const linked = await prisma.user.update({ where: { id: matches[0].id }, data: { verifiedPhone: phone }, include });
      return resolved(linked, false);
    } catch (err: any) {
      if (err?.code !== 'P2002') throw err;
      const raced = await loadUser(phone);
      if (!raced) throw err;
      return resolved(raced, false);
    }
  }

  if (matches.length > 1) {
    console.warn(
      '[AUTH] OTP_AMBIGUOUS_LEGACY_PHONE',
      JSON.stringify({ phone: maskPhone(phone), candidates: matches.map((m) => m.id) })
    );
  }

  try {
    const user = await prisma.user.create({
      data: { name: '', phone, verifiedPhone: phone, role: 'CUSTOMER' },
      include,
    });
    return resolved(user, true);
  } catch (err: any) {
    if (err?.code !== 'P2002') throw err;
    const raced = await loadUser(phone);
    if (!raced) throw err;
    return resolved(raced, false);
  }
}
