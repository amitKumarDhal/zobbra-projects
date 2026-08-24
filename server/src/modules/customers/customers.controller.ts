import { Response } from 'express';
import { prisma } from '../../config/index.js';
import { AuthRequest } from '../../middleware/auth.js';

export const getCustomers = async (req: AuthRequest, res: Response) => {
  const { search, page = '1', pageSize = '10' } = req.query;

  const where: any = {};
  if (search) {
    const searchStr = String(search);
    where.OR = [
      { name: { contains: searchStr, mode: 'insensitive' } },
      { gstin: { contains: searchStr, mode: 'insensitive' } },
      { users: { some: { name: { contains: searchStr, mode: 'insensitive' } } } },
      { users: { some: { email: { contains: searchStr, mode: 'insensitive' } } } },
      { users: { some: { phone: { contains: searchStr, mode: 'insensitive' } } } },
    ];
  }

  const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
  const limitNum = Math.max(1, parseInt(String(pageSize), 10) || 10);
  const skip = (pageNum - 1) * limitNum;

  const [companies, total] = await Promise.all([
    prisma.company.findMany({
      where,
      skip,
      take: limitNum,
      include: {
        users: { select: { id: true, name: true, email: true, phone: true } },
        _count: { select: { quotes: true, orders: true } },
        orders: { 
           where: { status: { not: 'CANCELLED' } }, 
           select: { id: true, totalAmount: true, createdAt: true, status: true },
           orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.company.count({ where }),
  ]);

  return res.json({ 
    success: true, 
    data: companies,
    pagination: {
      page: pageNum,
      pageSize: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  });
};

export const getCustomerById = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      users: true,
      quotes: { orderBy: { createdAt: 'desc' } },
      orders: { 
        include: { payments: true },
        orderBy: { createdAt: 'desc' } 
      },
      invoices: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!company) {
    return res.status(404).json({ success: false, message: 'Company not found' });
  }

  return res.json({ success: true, company });
};

export const createCustomer = async (req: AuthRequest, res: Response) => {
  const { name, gstin, address, city, state, pincode, notes, contactName, contactEmail, contactPhone } = req.body;

  const company = await prisma.company.create({
    data: {
      name,
      gstin,
      address: address || 'N/A',
      city: city || 'Bhubaneswar',
      state: state || 'Odisha',
      pincode: pincode || '751012',
      notes,
    },
  });

  if (contactEmail && contactName) {
    await prisma.user.create({
      data: {
        name: contactName,
        email: contactEmail,
        phone: contactPhone,
        passwordHash: '$2a$10$e846M7G65x/t2E8j7R6W/.1p2.g1L1h4Zz0u11', // Temp hash
        role: 'CUSTOMER',
        companyId: company.id,
      },
    });
  }

  return res.status(201).json({ success: true, company });
};

export const updateCustomer = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, gstin, address, city, state, pincode, notes } = req.body;

  const company = await prisma.company.update({
    where: { id },
    data: { name, gstin, address, city, state, pincode, notes },
  });

  return res.json({ success: true, company });
};

export const getCustomerStats = async (req: AuthRequest, res: Response) => {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [totalCustomers, newThisMonth, allCompanies] = await Promise.all([
    prisma.company.count(),
    prisma.company.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.company.findMany({
      select: {
        id: true,
        orders: {
          where: { status: { not: 'CANCELLED' } },
          select: { totalAmount: true }
        }
      }
    })
  ]);

  let activeCustomers = 0;
  let repeatCustomers = 0;
  let topCustomers = 0;

  allCompanies.forEach(company => {
    if (company.orders.length > 0) activeCustomers++;
    if (company.orders.length > 1) repeatCustomers++;
    
    const spent = company.orders.reduce((sum, order) => sum + order.totalAmount, 0);
    if (spent > 50000) topCustomers++;
  });

  return res.json({
    success: true,
    stats: {
      totalCustomers,
      activeCustomers,
      newThisMonth,
      repeatCustomers,
      topCustomerCount: topCustomers
    }
  });
};
