import { Response } from 'express';
import { prisma } from '../../config/index.js';
import { AuthRequest } from '../../middleware/auth.js';

export const getDashboardKPIs = async (req: AuthRequest, res: Response) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [todaysQuotes, todaysOrders, productionPending, dispatchPending, totalRevenue] = await Promise.all([
    prisma.quote.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.order.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.productionJob.count({ where: { stage: { in: ['PENDING', 'PRINTING', 'QUALITY_CHECK', 'PACKING'] } } }),
    prisma.order.count({ where: { status: 'READY_FOR_DISPATCH' } }),
    prisma.order.aggregate({ _sum: { totalAmount: true } }),
  ]);

  return res.json({
    success: true,
    kpis: {
      todaysQuotes,
      todaysOrders,
      productionPending,
      dispatchPending,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
    },
  });
};

export const getSalesReport = async (req: AuthRequest, res: Response) => {
  const totalOrders = await prisma.order.count();
  const totalQuotes = await prisma.quote.count();
  const totalCustomers = await prisma.company.count();
  const revenueAgg = await prisma.order.aggregate({ _sum: { totalAmount: true } });

  return res.json({
    success: true,
    report: {
      totalOrders,
      totalQuotes,
      totalCustomers,
      totalRevenue: revenueAgg._sum.totalAmount || 0,
    },
  });
};

export const getSidebarCounts = async (req: AuthRequest, res: Response) => {
  try {
    const [inquiries, quotes, orders, todo] = await Promise.all([
      // 1. Open / Actionable inquiries (NEW, CONTACTED, FOLLOW_UP)
      prisma.inquiry.count({
        where: {
          status: { in: ['NEW', 'CONTACTED', 'FOLLOW_UP'] }
        }
      }),
      // 2. Pending / Active quotes (DRAFT, SENT)
      prisma.quote.count({
        where: {
          status: { in: ['DRAFT', 'SENT'] }
        }
      }),
      // 3. Active / In-progress orders (not DELIVERED or CANCELLED)
      prisma.order.count({
        where: {
          status: { in: ['PENDING', 'CONFIRMED', 'IN_PRODUCTION', 'READY_FOR_DISPATCH', 'DISPATCHED'] }
        }
      }),
      // 4. Open / Incomplete tasks (PENDING, IN_PROGRESS, OVERDUE)
      prisma.task.count({
        where: {
          status: { in: ['PENDING', 'IN_PROGRESS', 'OVERDUE'] }
        }
      })
    ]);

    return res.json({
      success: true,
      counts: {
        inquiries,
        quotes,
        orders,
        todo
      }
    });
  } catch (error: any) {
    console.error('Error fetching sidebar counts:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getActivity = async (req: AuthRequest, res: Response) => {
  try {
    const activities = await prisma.systemActivity.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { user: true } });
    return res.json({ success: true, activities });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

