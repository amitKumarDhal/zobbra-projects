import { Response } from 'express';
import { prisma } from '../../config/index.js';
import { AuthRequest } from '../../middleware/auth.js';

// Allowed Order status transitions
const ALLOWED_ORDER_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['IN_PRODUCTION', 'CANCELLED'],
  IN_PRODUCTION: ['READY_FOR_DISPATCH', 'CANCELLED'],
  READY_FOR_DISPATCH: ['DISPATCHED', 'CANCELLED'],
  DISPATCHED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

export const convertQuoteToOrder = async (req: AuthRequest, res: Response) => {
  const quoteId = req.params.quoteId || req.body.quoteId;

  if (!quoteId) {
    return res.status(400).json({ success: false, message: 'Quote ID is required for conversion' });
  }

  // 1. Fetch Quote with items, customer, and company
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { items: { include: { product: true } }, customer: true, company: true },
  });

  if (!quote) {
    return res.status(404).json({ success: false, message: 'Quote not found' });
  }

  // 2. Security Check: Customer ownership
  if (req.user?.role === 'CUSTOMER' && quote.customerId !== req.user.id && quote.companyId !== req.user.companyId) {
    return res.status(403).json({ success: false, message: 'Unauthorized to convert this quote' });
  }

  // 3. Status Guard: Quote MUST be APPROVED
  if (quote.status !== 'APPROVED') {
    return res.status(400).json({
      success: false,
      message: `Only APPROVED quotes can be converted to an order. Current status: ${quote.status}`,
    });
  }

  // 4. Duplicate Check: Prevent multiple orders from the same quote (409 Conflict)
  const existingOrder = await prisma.order.findUnique({ where: { quoteId: quote.id } });
  if (existingOrder) {
    return res.status(409).json({
      success: false,
      message: `Quote #${quote.quoteNumber} has already been converted to Order #${existingOrder.orderNumber}`,
      order: existingOrder,
    });
  }

  // 5. Execute Atomic Prisma Transaction
  try {
    const orderCount = await prisma.order.count();
    const orderNumber = `ZQB-ORD-${new Date().getFullYear()}-${String(orderCount + 5001).padStart(4, '0')}`;

    const result = await prisma.$transaction(async (tx) => {
      // Create Order record with preserved quote pricing
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          quoteId: quote.id,
          customerId: quote.customerId,
          companyId: quote.companyId,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          subtotal: quote.subtotal,
          gstTotal: quote.gstTotal,
          discountAmount: quote.discount,
          totalAmount: quote.totalAmount,
          items: {
            create: quote.items.map((item) => ({
              productId: item.productId,
              printType: item.printType,
              color: item.color,
              size: item.size,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
            })),
          },
          production: {
            create: {
              stage: 'PENDING',
              notes: `Order created from approved quotation #${quote.quoteNumber}`,
            },
          },
          invoices: {
            create: {
              invoiceNumber: `INV-${new Date().getFullYear()}-${String(orderCount + 8001).padStart(4, '0')}`,
              companyId: quote.companyId,
              amount: quote.subtotal,
              gstAmount: quote.gstTotal,
              totalAmount: quote.totalAmount,
              dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
              status: 'UNPAID',
            },
          },
        },
        include: {
          customer: { select: { id: true, name: true, email: true } },
          company: { select: { id: true, name: true, gstin: true } },
          items: { include: { product: true } },
          production: true,
          invoices: true,
        },
      });

      return newOrder;
    });

    return res.status(201).json({ success: true, order: result });
  } catch (error: any) {
    console.error('Order creation transaction failed:', error);
    return res.status(500).json({ success: false, message: 'Failed to convert quote to order' });
  }
};

export const getOrders = async (req: AuthRequest, res: Response) => {
  const { status, paymentStatus, search, page = '1', pageSize = '10' } = req.query;

  const where: any = {};
  if (status && status !== 'All Status') where.status = String(status);
  if (paymentStatus && paymentStatus !== 'All Payment') where.paymentStatus = String(paymentStatus);

  if (search) {
    const searchStr = String(search);
    where.OR = [
      { orderNumber: { contains: searchStr, mode: 'insensitive' } },
      { customer: { name: { contains: searchStr, mode: 'insensitive' } } },
      { customer: { email: { contains: searchStr, mode: 'insensitive' } } },
      { company: { name: { contains: searchStr, mode: 'insensitive' } } },
      { quote: { quoteNumber: { contains: searchStr, mode: 'insensitive' } } }
    ];
  }

  // Customer role security filter
  if (req.user?.role === 'CUSTOMER') {
    if (where.OR) {
      where.AND = [
        {
          OR: [
            { customerId: req.user.id },
            { companyId: req.user.companyId || undefined },
          ]
        }
      ];
    } else {
      where.OR = [
        { customerId: req.user.id },
        { companyId: req.user.companyId || undefined },
      ];
    }
  }

  const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
  const limitNum = Math.max(1, parseInt(String(pageSize), 10) || 10);
  const skip = (pageNum - 1) * limitNum;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limitNum,
      include: {
        quote: { select: { quoteNumber: true } },
        customer: { select: { id: true, name: true, email: true, phone: true } },
        company: { select: { id: true, name: true, gstin: true } },
        items: { include: { product: true } },
        production: true,
        dispatch: true,
        invoices: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.count({ where }),
  ]);

  return res.json({ 
    success: true, 
    data: orders,
    orders,
    pagination: {
      page: pageNum,
      pageSize: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  });
};

export const getOrderStats = async (req: AuthRequest, res: Response) => {
  const baseWhere: any = {};
  if (req.user?.role === 'CUSTOMER') {
    baseWhere.OR = [
      { customerId: req.user.id },
      { companyId: req.user.companyId || undefined },
    ];
  }

  // Not CANCELLED
  const validWhere = { ...baseWhere, status: { not: 'CANCELLED' } };

  const [total, pending, confirmed, completed, revenueData] = await Promise.all([
    prisma.order.count({ where: baseWhere }),
    prisma.order.count({ where: { ...baseWhere, status: 'PENDING' } }),
    prisma.order.count({ where: { ...baseWhere, status: { in: ['CONFIRMED', 'IN_PRODUCTION', 'READY_FOR_DISPATCH', 'DISPATCHED'] } } }),
    prisma.order.count({ where: { ...baseWhere, status: 'DELIVERED' } }),
    prisma.order.aggregate({ _sum: { totalAmount: true }, where: validWhere }),
  ]);

  return res.json({
    success: true,
    stats: {
      total,
      pending,
      confirmed,
      completed,
      revenue: revenueData._sum.totalAmount || 0
    }
  });
};

export const getOrderById = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, name: true, email: true, phone: true } },
      company: true,
      items: { include: { product: true } },
      production: true,
      dispatch: true,
      invoices: true,
      payments: true,
    },
  });


  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

  // Ownership guard
  if (req.user?.role === 'CUSTOMER' && order.customerId !== req.user.id && order.companyId !== req.user.companyId) {
    return res.status(403).json({ success: false, message: 'Unauthorized to view this order' });
  }

  return res.json({ success: true, order });
};

export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status, paymentStatus } = req.body;

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  // Customers cannot modify order status directly
  if (req.user?.role === 'CUSTOMER') {
    return res.status(403).json({ success: false, message: 'Customers are not authorized to modify order status' });
  }

  if (status) {
    const currentStatus = order.status;
    const allowed = ALLOWED_ORDER_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(status) && currentStatus !== status) {
      return res.status(400).json({
        success: false,
        message: `Invalid order status transition from ${currentStatus} to ${status}. Allowed: ${allowed.join(', ')}`,
      });
    }
  }

  const updatedOrder = await prisma.order.update({
    where: { id },
    data: {
      status: status || undefined,
      paymentStatus: paymentStatus || undefined,
    },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      company: true,
      items: { include: { product: true } },
      production: true,
      dispatch: true,
    },
  });

  return res.json({ success: true, order: updatedOrder });
};
