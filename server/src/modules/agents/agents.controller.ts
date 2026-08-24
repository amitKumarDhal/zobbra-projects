import { Request, Response } from 'express';
import { prisma } from '../../config/index.js';
import { Prisma } from '@prisma/client';

export const getAgents = async (req: Request, res: Response) => {
  const { page = '1', pageSize = '10', search, status, department, location } = req.query;

  const where: Prisma.UserWhereInput = {
    role: { in: ['SALES', 'ADMIN'] }
  };
  
  if (status && status !== 'All Status') {
     where.isActive = status === 'ACTIVE';
  }
  if (department && department !== 'All Departments') {
     where.department = department as string;
  }
  if (location && location !== 'All Locations') {
     where.location = location as string;
  }
  if (search) {
    const s = String(search);
    where.OR = [
      { name: { contains: s, mode: 'insensitive' } },
      { email: { contains: s, mode: 'insensitive' } },
      { phone: { contains: s, mode: 'insensitive' } }
    ];
  }

  const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
  const limitNum = Math.max(1, parseInt(String(pageSize), 10) || 10);
  const skip = (pageNum - 1) * limitNum;

  try {
    const [agents, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        select: {
           id: true,
           name: true,
           email: true,
           phone: true,
           role: true,
           isActive: true,
           department: true,
           location: true,
           createdAt: true,
           assignedInquiries: {
              select: { id: true, customerId: true }
           },
           assignedOrders: {
              where: { 
                 status: 'DELIVERED',
                 createdAt: {
                    gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                 }
              },
              select: { id: true, totalAmount: true }
           }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    // Compute derived metrics
    const data = agents.map(agent => {
       // Unique customers from inquiries (or direct attribution if any)
       const uniqueCustomers = new Set(agent.assignedInquiries.map(i => i.customerId).filter(Boolean)).size;
       
       const salesThisMonth = agent.assignedOrders.reduce((sum, order) => sum + order.totalAmount, 0);

       return {
          id: agent.id,
          name: agent.name,
          email: agent.email,
          phone: agent.phone,
          role: agent.role,
          isActive: agent.isActive,
          department: agent.department,
          location: agent.location,
          createdAt: agent.createdAt,
          customersCount: uniqueCustomers,
          ordersCount: agent.assignedOrders.length,
          salesThisMonth
       };
    });

    return res.json({
      success: true,
      data,
      pagination: {
         page: pageNum,
         pageSize: limitNum,
         total,
         totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch(err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getAgentStats = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalAgents, activeAgents, newThisMonth, allCompletedOrdersThisMonth] = await Promise.all([
      prisma.user.count({ where: { role: { in: ['SALES', 'ADMIN'] } } }),
      prisma.user.count({ where: { role: { in: ['SALES', 'ADMIN'] }, isActive: true } }),
      prisma.user.count({ where: { role: { in: ['SALES', 'ADMIN'] }, createdAt: { gte: firstDayOfMonth } } }),
      prisma.order.findMany({
         where: {
            status: 'DELIVERED',
            createdAt: { gte: firstDayOfMonth },
            assignedToId: { not: null }
         },
         include: { assignedTo: true }
      })
    ]);

    let totalSalesThisMonth = 0;
    const salesByAgent: Record<string, { id: string, name: string, total: number }> = {};

    for (const order of allCompletedOrdersThisMonth) {
       totalSalesThisMonth += order.totalAmount;
       const aId = order.assignedToId!;
       if (!salesByAgent[aId]) {
          salesByAgent[aId] = { id: aId, name: order.assignedTo?.name || 'Unknown', total: 0 };
       }
       salesByAgent[aId].total += order.totalAmount;
    }

    const topPerformers = Object.values(salesByAgent)
       .sort((a, b) => b.total - a.total)
       .slice(0, 5);

    const topPerformer = topPerformers.length > 0 ? topPerformers[0] : null;

    return res.json({
       success: true,
       stats: {
          totalAgents,
          activeAgents,
          newThisMonth,
          totalSalesThisMonth,
          topPerformer,
          topPerformers
       }
    });
  } catch(err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getAgentById = async (req: Request, res: Response) => {
  try {
    const agent = await prisma.user.findUnique({
       where: { id: req.params.id },
       select: {
          id: true, name: true, email: true, phone: true, role: true, 
          isActive: true, department: true, location: true, createdAt: true,
          assignedInquiries: { select: { id: true, customerId: true } },
          assignedQuotes: { select: { id: true, totalAmount: true } },
          assignedOrders: { select: { id: true, totalAmount: true, status: true } },
       }
    });

    if (!agent) return res.status(404).json({ success: false, message: 'Agent not found' });

    const customersCount = new Set(agent.assignedInquiries.map(i => i.customerId).filter(Boolean)).size;
    const inquiriesCount = agent.assignedInquiries.length;
    const quotesCount = agent.assignedQuotes.length;
    const ordersCount = agent.assignedOrders.length;
    const totalRevenue = agent.assignedOrders
       .filter(o => o.status === 'DELIVERED')
       .reduce((sum, o) => sum + o.totalAmount, 0);

    const conversionRate = quotesCount > 0 ? (ordersCount / quotesCount) * 100 : 0;

    return res.json({ 
       success: true, 
       agent: {
          id: agent.id, name: agent.name, email: agent.email, phone: agent.phone,
          role: agent.role, isActive: agent.isActive, department: agent.department, 
          location: agent.location, createdAt: agent.createdAt
       },
       performance: {
          customersCount, inquiriesCount, quotesCount, ordersCount, totalRevenue, conversionRate: conversionRate.toFixed(1)
       }
    });
  } catch(err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updateAgent = async (req: Request, res: Response) => {
   const { name, phone, department, location, isActive, role } = req.body;
   try {
      const data: any = {};
      if (name !== undefined) data.name = name;
      if (phone !== undefined) data.phone = phone;
      if (department !== undefined) data.department = department;
      if (location !== undefined) data.location = location;
      if (isActive !== undefined) data.isActive = isActive;
      if (role !== undefined && ['ADMIN', 'SALES'].includes(role)) data.role = role;

      const agent = await prisma.user.update({
         where: { id: req.params.id },
         data,
         select: {
            id: true, name: true, email: true, phone: true, role: true, 
            isActive: true, department: true, location: true
         }
      });
      return res.json({ success: true, agent });
   } catch(err: any) {
      return res.status(500).json({ success: false, message: err.message });
   }
};
