import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma, config } from '../../config/index.js';
import { AuthRequest } from '../../middleware/auth.js';
import {
  normalizeAuthPhone,
  isCountryAllowed,
  maskPhone,
  requestOtp,
  verifyOtp,
  findOrCreateOtpUser,
} from './otp.service.js';

// Structured logging helper
function logAuth(event: string, data: Record<string, any>) {
  const timestamp = new Date().toISOString();
  console.log(`[AUTH] ${timestamp} ${event}`, JSON.stringify(data));
}

/** The single JWT format consumed by authenticateJWT — used by every login path. */
export function signAuthToken(user: { id: string; email: string | null; role: string; companyId: string | null }) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, companyId: user.companyId },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string(),
  }),
});

const OTP_LOGIN_REQUIRED = {
  success: false,
  code: 'OTP_LOGIN_REQUIRED',
  message: 'Email and password sign-in is for administrators only. Please sign in with your WhatsApp number.',
};

/**
 * Password registration is retired: every non-admin account is created or bound
 * by WhatsApp OTP (POST /auth/otp/verify). Kept as an explicit 410 so old clients
 * get a clear answer instead of a 404.
 */
export const register = async (_req: Request, res: Response) => {
  return res.status(410).json(OTP_LOGIN_REQUIRED);
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

    // Passwordless (WhatsApp OTP) accounts have no password to check
    const isMatch = user.passwordHash ? await bcrypt.compare(password, user.passwordHash) : false;
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

    // Only ADMIN keeps email + password; every other role must use WhatsApp OTP.
    // Checked after the password so this cannot be used to probe roles by email.
    if (user.role !== 'ADMIN') {
      logAuth('LOGIN_NON_ADMIN_REJECTED', {
        requestId,
        route: '/api/v1/auth/login',
        userId: user.id,
        role: user.role,
        duration: Date.now() - startTime,
      });
      // Customers are pointed at OTP; disabled roles (SALES/PRODUCTION) get the
      // same generic answer as a wrong password.
      return user.role === 'CUSTOMER'
        ? res.status(403).json(OTP_LOGIN_REQUIRED)
        : res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = signAuthToken(user);

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

// ─── WhatsApp OTP (passwordless CUSTOMER login) ─────────────────────────────

export const otpRequestSchema = z.object({
  body: z.object({ phone: z.string().min(7).max(24) }),
});

export const otpVerifySchema = z.object({
  body: z.object({
    phone: z.string().min(7).max(24),
    otp: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
  }),
});

function parsePhoneOrReject(raw: unknown, res: Response): string | null {
  const phone = normalizeAuthPhone(raw);
  if (!phone) {
    res.status(400).json({ success: false, message: 'Please enter a valid WhatsApp number.' });
    return null;
  }
  if (!isCountryAllowed(phone)) {
    res.status(400).json({ success: false, message: 'WhatsApp login is not yet available for this country code.' });
    return null;
  }
  return phone;
}

export const requestLoginOtp = async (req: Request, res: Response) => {
  try {
    const phone = parsePhoneOrReject(req.body.phone, res);
    if (!phone) return;

    const result = await requestOtp(phone);
    if (!result.ok) {
      if (result.retryAfter) res.setHeader('Retry-After', String(result.retryAfter));
      return res.status(result.status).json({ success: false, message: result.message, retryAfter: result.retryAfter });
    }

    logAuth('OTP_REQUEST_SENT', { phone: maskPhone(phone) });
    // Same response whether or not an account exists for this number.
    return res.json({
      success: true,
      message: 'A 6-digit code has been sent to your WhatsApp.',
      expiresIn: result.expiresIn,
      resendIn: result.resendIn,
    });
  } catch (error: any) {
    logAuth('OTP_REQUEST_ERROR', { error: error.message });
    return res.status(500).json({ success: false, message: 'Could not send the code. Please try again.' });
  }
};

export const verifyLoginOtp = async (req: Request, res: Response) => {
  try {
    const phone = parsePhoneOrReject(req.body.phone, res);
    if (!phone) return;

    const result = await verifyOtp(phone, String(req.body.otp));
    if (!result.ok) {
      logAuth('OTP_VERIFY_FAILED', { phone: maskPhone(phone), status: result.status });
      return res.status(result.status).json({
        success: false,
        message: result.message,
        attemptsRemaining: result.attemptsRemaining,
      });
    }

    const resolved = await findOrCreateOtpUser(phone);
    if (!resolved.ok) {
      logAuth('OTP_VERIFY_REFUSED', { phone: maskPhone(phone), code: resolved.code });
      return res.status(resolved.status).json({ success: false, code: resolved.code, message: resolved.message });
    }
    // Identity and role come from the database record, never from the request.
    const { user, created } = resolved;
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'This account has been deactivated. Please contact support.' });
    }

    const token = signAuthToken(user);
    logAuth('OTP_LOGIN_SUCCESS', { userId: user.id, role: user.role, created });

    return res.json({
      success: true,
      token,
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
    logAuth('OTP_VERIFY_ERROR', { error: error.message });
    return res.status(500).json({ success: false, message: 'Verification failed. Please try again.' });
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
    if (req.user.role !== 'ADMIN') return res.status(403).json(OTP_LOGIN_REQUIRED);

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Missing passwords' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (!user.passwordHash) {
      return res.status(400).json({ success: false, message: 'This account signs in with WhatsApp OTP and has no password.' });
    }

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

// ─── Customer profile (My Profile) ──────────────────────────────────────────

const profileText = (max: number) => z.string().trim().max(max).optional();

export const updateProfileSchema = z.object({
  body: z.object({
    name: profileText(120),
    email: z.union([z.literal(''), z.string().trim().toLowerCase().email().max(254)]).optional(),
    companyName: profileText(160),
    gstin: profileText(20),
    address: profileText(500),
    addressType: profileText(40),
    city: profileText(80),
    state: profileText(80),
    pincode: profileText(12),
  }),
});

const COMPANY_PROFILE_FIELDS = ['companyName', 'gstin', 'address', 'addressType', 'city', 'state', 'pincode'] as const;

/**
 * Save the signed-in customer's profile onto their existing User (+ Company) rows.
 * The account is always the one in the JWT — a customerId/userId/phone/role in the
 * body is ignored, so this can never create or re-point a customer. The phone is the
 * OTP login identity and is not editable here. A field that is absent is left as is;
 * an empty string clears it.
 */
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (req.user.role !== 'CUSTOMER') {
      return res.status(403).json({ success: false, message: 'Only customer accounts have a customer profile.' });
    }

    const body = updateProfileSchema.shape.body.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { id: req.user.id }, include: { company: true } });
    if (!existing || existing.role !== 'CUSTOMER') {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const userData: { name?: string; email?: string | null } = {};
    if (body.name !== undefined) userData.name = body.name;
    if (body.email !== undefined) userData.email = body.email || null;

    const companyTouched = COMPANY_PROFILE_FIELDS.some((f) => body[f] !== undefined);
    const companyHasValue = COMPANY_PROFILE_FIELDS.some((f) => Boolean(body[f]));

    const user = await prisma.$transaction(async (tx) => {
      let companyId = existing.companyId;

      if (companyTouched && companyId) {
        await tx.company.update({
          where: { id: companyId },
          data: {
            ...(body.companyName !== undefined && { name: body.companyName }),
            ...(body.gstin !== undefined && { gstin: body.gstin ? body.gstin.toUpperCase() : null }),
            ...(body.address !== undefined && { address: body.address }),
            ...(body.addressType !== undefined && { addressType: body.addressType || null }),
            ...(body.city !== undefined && { city: body.city }),
            ...(body.state !== undefined && { state: body.state }),
            ...(body.pincode !== undefined && { pincode: body.pincode }),
          },
        });
      } else if (companyHasValue) {
        // First time this customer saves company/address details: their profile row.
        // Unfilled fields stay empty — nothing is defaulted on the customer's behalf.
        const company = await tx.company.create({
          data: {
            name: body.companyName || '',
            gstin: body.gstin ? body.gstin.toUpperCase() : null,
            address: body.address || '',
            addressType: body.addressType || null,
            city: body.city || '',
            state: body.state || '',
            pincode: body.pincode || '',
          },
        });
        companyId = company.id;
      }

      const updated = await tx.user.update({
        where: { id: existing.id },
        data: { ...userData, companyId },
        include: { company: true },
      });

      await tx.systemActivity.create({
        data: {
          userId: existing.id,
          action: 'UPDATE_PROFILE',
          entityType: 'User',
          entityId: existing.id,
          message: 'Customer updated their profile',
        },
      });

      return updated;
    });

    return res.json({
      success: true,
      // companyId is part of the token, so a newly linked company needs a fresh one
      token: user.companyId !== existing.companyId ? signAuthToken(user) : undefined,
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
    if (error?.code === 'P2002') {
      const target = String(error.meta?.target || '');
      return res.status(409).json({
        success: false,
        message: target.includes('gstin')
          ? 'This GSTIN is already registered to another account.'
          : 'This email is already in use by another account.',
      });
    }
    logAuth('PROFILE_UPDATE_ERROR', { error: error.message });
    return res.status(500).json({ success: false, message: 'Could not save your profile. Please try again.' });
  }
};
