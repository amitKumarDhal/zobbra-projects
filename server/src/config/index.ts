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

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  jwtSecret: getJwtSecret(),
  jwtExpiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'],
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME?.trim() || '',
    apiKey: process.env.CLOUDINARY_API_KEY?.trim() || '',
    apiSecret: getCloudinarySecret(),
  },
  resendApiKey: process.env.RESEND_API_KEY || 're_mock_key',
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
