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

    const trimmedEmail = email ? String(email).trim().toLowerCase() : '';
    const trimmedName = name ? String(name).trim() : '';
    const trimmedCompanyName = companyName && String(companyName).trim() ? String(companyName).trim() : null;
    const trimmedGstin = gstin && String(gstin).trim() ? String(gstin).trim() : null;
    const trimmedPhone = phone && String(phone).trim() ? String(phone).trim() : null;
    const trimmedCity = city && String(city).trim() ? String(city).trim() : null;
    const trimmedState = state && String(state).trim() ? String(state).trim() : null;

    if (!trimmedEmail || !password || !trimmedName) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: trimmedEmail } });
    if (existingUser) {
      const duration = Date.now() - startTime;
      logAuth('REGISTER_DUPLICATE', {
        requestId,
        route: '/api/v1/auth/register',
        email: trimmedEmail,
        status: 400,
        duration,
        errorCategory: 'VALIDATION_ERROR',
      });
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    let companyId: string | null = null;
    if (trimmedCompanyName) {
      let company = trimmedGstin ? await prisma.company.findUnique({ where: { gstin: trimmedGstin } }) : null;
      if (!company) {
        try {
          company = await prisma.company.create({
            data: {
              name: trimmedCompanyName,
              gstin: trimmedGstin || undefined,
              address: 'Main Office',
              city: trimmedCity || 'Bhubaneswar',
              state: trimmedState || 'Odisha',
              pincode: '751012',
            },
          });
        } catch (companyErr: any) {
          console.warn('[AUTH] Company creation notice:', companyErr.message);
          if (trimmedGstin) {
            company = await prisma.company.findUnique({ where: { gstin: trimmedGstin } });
          }
          if (!company) {
            company = await prisma.company.create({
              data: {
                name: trimmedCompanyName,
                address: 'Main Office',
                city: trimmedCity || 'Bhubaneswar',
                state: trimmedState || 'Odisha',
                pincode: '751012',
              },
            });
          }
        }
      }
      companyId = company ? company.id : null;
    }

    const user = await prisma.user.create({
      data: {
        email: trimmedEmail,
        passwordHash,
        name: trimmedName,
        phone: trimmedPhone,
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
      email: trimmedEmail,
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
    return res.status(500).json({
      success: false,
      message: error.message || 'Registration failed. Please try again.',
    });
  }
};

export const login = async (req: Request, res: Response) => {
  const requestId = (req as any).id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();

  try {
    const { email, password } = req.body;

    const trimmedEmail = email ? String(email).trim().toLowerCase() : '';

    const user = await prisma.user.findUnique({
      where: { email: trimmedEmail },
      include: { company: true },
    });

    if (!user) {
      const duration = Date.now() - startTime;
      logAuth('LOGIN_NO_USER', {
        requestId,
        route: '/api/v1/auth/login',
        email: trimmedEmail,
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
        email: trimmedEmail,
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
      email: trimmedEmail,
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
    return res.status(500).json({
      success: false,
      message: error.message || 'Login failed. Please try again.',
    });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
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
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to fetch user' });
  }
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
  try {
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
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to change password' });
  }
};
