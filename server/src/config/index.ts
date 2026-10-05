import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

dotenv.config();

function getCloudinarySecret(): string {
  const secret = process.env.CLOUDINARY_API_SECRET?.trim();
  const isInvalid =
    !secret ||
    secret === 'secret' ||
    secret === '<secret>' ||
    secret === '[SECRET]' ||
    secret === 'mock_secret' ||
    secret.toLowerCase().includes('mock') ||
    secret.toLowerCase().includes('demo') ||
    secret.toLowerCase().includes('placeholder') ||
    secret.toLowerCase().includes('example') ||
    secret.startsWith('<') ||
    secret.startsWith('[') ||
    secret.length < 15;

  if (isInvalid) {
    throw new Error('CLOUDINARY_API_SECRET is missing or invalid.');
  }

  return secret;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  const isInvalid =
    !secret ||
    secret.toLowerCase() === 'secret' ||
    secret.toLowerCase().includes('mock') ||
    secret.toLowerCase().includes('demo') ||
    secret.toLowerCase().includes('placeholder') ||
    secret.toLowerCase().includes('example') ||
    secret.startsWith('<') ||
    secret.startsWith('[') ||
    secret.length < 16;

  if (isInvalid) {
    throw new Error('JWT_SECRET is missing or invalid.');
  }

  return secret;
}

function intEnv(name: string, fallback: number): number {
  const parsed = parseInt(process.env[name] || '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const jwtSecret = getJwtSecret();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  jwtSecret,
  jwtExpiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'],
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME?.trim() || '',
    apiKey: process.env.CLOUDINARY_API_KEY?.trim() || '',
    apiSecret: getCloudinarySecret(),
  },
  resendApiKey: process.env.RESEND_API_KEY || 're_mock_key',
  // WhatsApp Cloud API (Meta) — server-side only, never sent to the browser.
  whatsapp: {
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN?.trim() || '',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() || '',
    apiVersion: process.env.WHATSAPP_API_VERSION?.trim() || 'v21.0',
    otpTemplateName: process.env.WHATSAPP_OTP_TEMPLATE_NAME?.trim() || '',
    otpTemplateLanguage: process.env.WHATSAPP_OTP_TEMPLATE_LANGUAGE?.trim() || 'en',
    // Authentication templates with a "copy code" button need the code passed to the button too.
    otpTemplateHasCopyButton: process.env.WHATSAPP_OTP_TEMPLATE_COPY_BUTTON !== 'false',
  },
  otp: {
    // Separate secret recommended; falls back to a key derived from JWT_SECRET.
    hashSecret: process.env.OTP_HASH_SECRET?.trim() || `otp:${jwtSecret}`,
    ttlSeconds: intEnv('OTP_TTL_SECONDS', 300),
    resendCooldownSeconds: intEnv('OTP_RESEND_COOLDOWN_SECONDS', 30),
    maxVerifyAttempts: intEnv('OTP_MAX_VERIFY_ATTEMPTS', 5),
    maxSendsPerWindow: intEnv('OTP_MAX_SENDS_PER_HOUR', 5),
    sendWindowSeconds: 3600,
    ipRequestLimit: intEnv('OTP_IP_REQUEST_LIMIT', 10),
    ipVerifyLimit: intEnv('OTP_IP_VERIFY_LIMIT', 30),
    ipWindowSeconds: 900,
    // Dial codes (without +) that may receive OTPs. Defaults to India only.
    allowedCountryCodes: (process.env.OTP_ALLOWED_COUNTRY_CODES || '91')
      .split(',')
      .map((c) => c.trim().replace(/^\+/, ''))
      .filter(Boolean),
  },
  company: {
    name: 'Zobra Prints & Merchandise',
    email: 'sales@zobbra.com',
    phone: '+91 91244 49665',
    gstin: '21ABCDE1234F1Z5',
    address: 'Plot 402, Fortune Tower, District Center, Bhubaneswar, Odisha - 751012',
  }
};

// Prisma singleton - prevents connection pool exhaustion in development hot reload
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
