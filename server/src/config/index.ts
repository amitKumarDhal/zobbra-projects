import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  jwtSecret: process.env.JWT_SECRET || 'zobra_b2b_secret_key_2026_super_secure',
  jwtExpiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'],
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'demo_zobra',
    apiKey: process.env.CLOUDINARY_API_KEY || '123456789',
    apiSecret: process.env.CLOUDINARY_API_SECRET || 'secret',
  },
  resendApiKey: process.env.RESEND_API_KEY || 're_mock_key',
  company: {
    name: 'Zobra Prints & Merchandise',
    email: 'hello@zobbra.com',
    phone: '+91 91244 96665',
    gstin: '21ABCDE1234F1Z5',
    address: 'Plot 402, Fortune Tower, District Center, Bhubaneswar, Odisha - 751012',
  }
};

export const prisma = new PrismaClient();
