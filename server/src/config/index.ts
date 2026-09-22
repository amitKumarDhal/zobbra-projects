import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  jwtSecret: process.env.JWT_SECRET || 'zobra_b2b_secret_key_2026_super_secure',
  jwtExpiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'],
  cloudinary: {
    cloudName: (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_CLOUD_NAME !== 'zobbra_demo')
      ? process.env.CLOUDINARY_CLOUD_NAME
      : 'e3sasmyr',
    apiKey: (process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_KEY !== '123456789')
      ? process.env.CLOUDINARY_API_KEY
      : '985661943518836',
    apiSecret: (process.env.CLOUDINARY_API_SECRET && process.env.CLOUDINARY_API_SECRET !== 'mock_secret' && !process.env.CLOUDINARY_API_SECRET.includes('mock') && !process.env.CLOUDINARY_API_SECRET.includes('demo'))
      ? process.env.CLOUDINARY_API_SECRET
      : 'yp5_Amms5qVY4UR4dAVNFOiQ_4M',
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
