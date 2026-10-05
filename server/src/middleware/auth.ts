import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string | null;
    name?: string;
    role: string;
    companyId?: string | null;
  };
}

type TokenUser = NonNullable<AuthRequest['user']>;

/**
 * Prisma filter for records a CUSTOMER may see: their own, or their company's.
 * Never emit `{ companyId: undefined }` — Prisma treats that as "no filter" and
 * would match every row for customers without a company (e.g. new OTP accounts).
 */
export function customerOwnershipFilter(user: TokenUser) {
  return [{ customerId: user.id }, ...(user.companyId ? [{ companyId: user.companyId }] : [])];
}

/** True when the record belongs to the customer directly or to their (non-null) company. */
export function isCustomerOwner(
  user: TokenUser,
  record: { customerId?: string | null; companyId?: string | null }
): boolean {
  return record.customerId === user.id || Boolean(user.companyId && record.companyId === user.companyId);
}

/**
 * The only roles that may authenticate. SALES and PRODUCTION remain in the Prisma
 * enum for schema compatibility but are disabled: their tokens are rejected here,
 * so every protected route refuses them regardless of per-route role lists.
 */
export const ACTIVE_ROLES = ['ADMIN', 'CUSTOMER'] as const;
export const isActiveRole = (role: unknown) => (ACTIVE_ROLES as readonly unknown[]).includes(role);

export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authorization token missing or malformed' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as {
      id: string;
      email: string | null;
      role: string;
      companyId?: string | null;
    };
    if (!isActiveRole(decoded.role)) {
      return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
};

export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as any;
    if (isActiveRole(decoded?.role)) req.user = decoded;
  } catch (error) {
    // Ignore error for optional auth
  }
  next();
};

export const authorizeRoles = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Role '${req.user?.role || 'Guest'}' is not authorized to access this resource`,
      });
    }
    next();
  };
};
