import { Response } from 'express';
import { prisma } from '../../config/index.js';
import { AuthRequest } from '../../middleware/auth.js';

/**
 * GET /api/v1/coupons
 * List coupons with pagination and filters
 */
export const getCoupons = async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', pageSize = '10', search, status, type, discountType, validity } = req.query;
    
    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.max(1, parseInt(String(pageSize), 10) || 10);
    const skip = (pageNum - 1) * limitNum;
    
    const where: any = {};
    
    if (search) {
      const s = String(search);
      where.OR = [
        { code: { contains: s, mode: 'insensitive' } },
        { name: { contains: s, mode: 'insensitive' } }
      ];
    }

    if (status && status !== 'All Status') {
      where.status = status.toString().toUpperCase();
    }
    
    if (discountType && discountType !== 'All Discount Type') {
      where.discountType = discountType === 'Percentage' ? 'PERCENTAGE' : 'FIXED_AMOUNT';
    }

    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.coupon.count({ where })
    ]);

    return res.json({
      success: true,
      data: coupons,
      pagination: {
        page: pageNum,
        pageSize: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/v1/coupons/stats
 * Stats for KPI cards
 */
export const getCouponStats = async (req: AuthRequest, res: Response) => {
  try {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [total, active, inactive, expired, usageThisMonthResult] = await Promise.all([
      prisma.coupon.count(),
      prisma.coupon.count({ where: { status: 'ACTIVE' } }),
      prisma.coupon.count({ where: { status: 'INACTIVE' } }),
      prisma.coupon.count({ where: { status: 'EXPIRED' } }),
      prisma.couponUsage.aggregate({
         _sum: { discountAmount: true },
         where: { usedAt: { gte: startOfMonth } }
      })
    ]);

    // To compute exact 'Total Usage' limit vs used across all coupons would require a heavier sum.
    // We will just return the core counts as required by the UI.
    
    const totalUsageAmount = usageThisMonthResult._sum.discountAmount || 0;

    return res.json({
      success: true,
      stats: {
        totalCoupons: total,
        activeCoupons: active,
        inactiveCoupons: inactive,
        expiredCoupons: expired,
        totalUsageAmount // For the "Total Usage" KPI card
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/v1/coupons/:id
 * Get single coupon detail
 */
export const getCouponById = async (req: AuthRequest, res: Response) => {
  try {
    const coupon = await prisma.coupon.findUnique({
      where: { id: req.params.id }
    });
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    return res.json({ success: true, coupon });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/v1/coupons
 * Create a new coupon
 */
export const createCoupon = async (req: AuthRequest, res: Response) => {
  try {
    const {
      code,
      name,
      description,
      discountType,
      discountValue,
      minimumOrderAmount,
      maximumDiscount,
      startAt,
      endAt,
      usageLimit,
      perCustomerLimit,
      status
    } = req.body;

    if (!code || !name || !discountType || !discountValue || !startAt || !endAt) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const uppercaseCode = code.toUpperCase().trim();

    const existing = await prisma.coupon.findUnique({ where: { code: uppercaseCode } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Coupon code already exists' });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: uppercaseCode,
        name,
        description,
        discountType,
        discountValue: parseFloat(discountValue),
        minimumOrderAmount: minimumOrderAmount ? parseFloat(minimumOrderAmount) : null,
        maximumDiscount: maximumDiscount ? parseFloat(maximumDiscount) : null,
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        usageLimit: usageLimit ? parseInt(usageLimit, 10) : null,
        perCustomerLimit: perCustomerLimit ? parseInt(perCustomerLimit, 10) : null,
        status: status || 'ACTIVE',
        createdById: req.user?.id
      }
    });

    return res.status(201).json({ success: true, coupon });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/v1/coupons/:id
 * Update an existing coupon
 */
export const updateCoupon = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      discountType,
      discountValue,
      minimumOrderAmount,
      maximumDiscount,
      startAt,
      endAt,
      usageLimit,
      perCustomerLimit,
      status
    } = req.body;

    const coupon = await prisma.coupon.update({
      where: { id },
      data: {
        name,
        description,
        discountType,
        discountValue: discountValue !== undefined && discountValue !== '' ? parseFloat(discountValue) : undefined,
        minimumOrderAmount: minimumOrderAmount !== undefined && minimumOrderAmount !== '' ? parseFloat(minimumOrderAmount) : null,
        maximumDiscount: maximumDiscount !== undefined && maximumDiscount !== '' ? parseFloat(maximumDiscount) : null,
        startAt: startAt ? new Date(startAt) : undefined,
        endAt: endAt ? new Date(endAt) : undefined,
        usageLimit: usageLimit !== undefined && usageLimit !== '' ? parseInt(usageLimit, 10) : null,
        perCustomerLimit: perCustomerLimit !== undefined && perCustomerLimit !== '' ? parseInt(perCustomerLimit, 10) : null,
        status
      }
    });

    return res.json({ success: true, coupon });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /api/v1/coupons/:id
 * Archive (deactivate) a coupon to preserve history
 */
export const deleteCoupon = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if used
    const usages = await prisma.couponUsage.count({ where: { couponId: id } });
    if (usages > 0) {
       // Just deactivate
       await prisma.coupon.update({ where: { id }, data: { status: 'INACTIVE' }});
       return res.json({ success: true, message: 'Coupon deactivated successfully (cannot be deleted because it has usage history)' });
    }

    await prisma.coupon.delete({ where: { id } });
    return res.json({ success: true, message: 'Coupon deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
