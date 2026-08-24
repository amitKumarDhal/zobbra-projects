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
