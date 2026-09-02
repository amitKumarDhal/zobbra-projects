import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma, config } from '../../config/index.js';
import { AuthRequest } from '../../middleware/auth.js';

// Structured logging helper
function logAuth(event: string, data: Record<string, any>) {
  const timestamp = new Date().toISOString();
  console.log(`[AUTH] ${timestamp} ${event}`, JSON.stringify(data));
}

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(2),
    phone: z.string().optional(),
    companyName: z.string().optional(),
    gstin: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string(),
  }),
});

export const register = async (req: Request, res: Response) => {
  const requestId = (req as any).id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();

  try {
    const { email, password, name, phone, companyName, gstin, city, state } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const duration = Date.now() - startTime;
      logAuth('REGISTER_DUPLICATE', {
        requestId,
        route: '/api/v1/auth/register',
        email,
        status: 400,
        duration,
        errorCategory: 'VALIDATION_ERROR',
      });
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    let companyId: string | null = null;
    if (companyName) {
      let company = gstin ? await prisma.company.findUnique({ where: { gstin } }) : null;
      if (!company) {
        company = await prisma.company.create({
          data: {
            name: companyName,
            gstin: gstin || undefined,
            address: 'Main Office',
            city: city || 'Bhubaneswar',
            state: state || 'Odisha',
            pincode: '751012',
          },
        });
      }
      companyId = company.id;
    }

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        phone,
        role: 'CUSTOMER',
        companyId,
      },
      include: { company: true },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, companyId: user.companyId },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    const duration = Date.now() - startTime;
    logAuth('REGISTER_SUCCESS', {
      requestId,
      route: '/api/v1/auth/register',
      email,
      userId: user.id,
      status: 201,
      duration,
    });

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        company: user.company,
      },
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logAuth('REGISTER_ERROR', {
      requestId,
      route: '/api/v1/auth/register',
      status: 500,
      duration,
      errorCategory: 'SERVER_ERROR',
      error: error.message,
    });
    throw error;
  }
};

export const login = async (req: Request, res: Response) => {
  const requestId = (req as any).id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();

  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { company: true },
    });

    if (!user) {
      const duration = Date.now() - startTime;
      logAuth('LOGIN_NO_USER', {
        requestId,
        route: '/api/v1/auth/login',
        email,
        status: 401,
        duration,
        errorCategory: 'INVALID_CREDENTIALS',
      });
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      const duration = Date.now() - startTime;
      logAuth('LOGIN_WRONG_PASSWORD', {
        requestId,
        route: '/api/v1/auth/login',
        email,
        userId: user.id,
        status: 401,
        duration,
        errorCategory: 'INVALID_CREDENTIALS',
      });
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, companyId: user.companyId },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    const duration = Date.now() - startTime;
    logAuth('LOGIN_SUCCESS', {
      requestId,
      route: '/api/v1/auth/login',
      email,
      userId: user.id,
      role: user.role,
      status: 200,
      duration,
    });

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        company: user.company,
      },
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logAuth('LOGIN_ERROR', {
      requestId,
      route: '/api/v1/auth/login',
      status: 500,
      duration,
      errorCategory: 'SERVER_ERROR',
      error: error.message,
    });
    throw error;
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { company: true },
  });

  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  return res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      company: user.company,
    },
  });
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  // Trigger password reset simulation
  return res.json({
    success: true,
    message: `Password reset instructions sent to ${email}`,
  });
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Missing passwords' });
  }

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) {
    return res.status(400).json({ success: false, message: 'Incorrect current password' });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: req.user.id },
    data: { passwordHash }
  });

  await prisma.systemActivity.create({
    data: {
      userId: req.user.id,
      action: 'UPDATE_PASSWORD',
      entityType: 'User',
      entityId: req.user.id,
      message: 'User changed their password',
    }
  });

  return res.json({ success: true, message: 'Password updated successfully' });
};
