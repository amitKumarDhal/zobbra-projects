import { Request, Response } from 'express';
import { prisma } from '../../config/index.js';
import { AuthRequest, customerOwnershipFilter, isCustomerOwner } from '../../middleware/auth.js';
import { deductStockForOrder } from '../products/stock.js';

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

/**
 * Delivery details frozen onto the order at creation. An address given with the quote
 * wins; otherwise the customer's profile as it is right now. Later profile edits must
 * not rewrite where an existing order was sent.
 */
function buildDeliverySnapshot(quote: {
  notes: string | null;
  customer: { name: string; phone: string | null };
  company: {
    name: string;
    gstin: string | null;
    address: string;
    addressType: string | null;
    city: string;
    state: string;
    pincode: string;
  } | null;
}) {
  const prefix = 'Delivery Address: ';
  const quoteAddress = quote.notes
    ?.split(' | ')
    .find((part) => part.startsWith(prefix))
    ?.slice(prefix.length)
    .trim();
  const company = quote.company;

  return {
    name: quote.customer.name || null,
    phone: quote.customer.phone || null,
    company: company?.name || null,
    address: quoteAddress || company?.address || null,
    addressType: company?.addressType || null,
    city: company?.city || null,
    state: company?.state || null,
    pincode: company?.pincode || null,
    gstin: company?.gstin || null,
  };
}

export const convertQuoteToOrder = async (req: AuthRequest, res: Response) => {
  const quoteId = req.params.quoteId || req.body.quoteId;

  if (!quoteId) {
    return res.status(400).json({ success: false, message: 'Quote ID is required for conversion' });
  }

  // 1. Fetch Quote with items, customer, and company
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { items: { include: { product: true, variants: true } }, customer: true, company: true },
  });

  if (!quote) {
    return res.status(404).json({ success: false, message: 'Quote not found' });
  }

  // 2. Security Check: Customer ownership
  if (req.user?.role === 'CUSTOMER' && !isCustomerOwner(req.user, quote)) {
    return res.status(403).json({ success: false, message: 'Unauthorized to convert this quote' });
  }

  // 3. Status Guard: Quote MUST be APPROVED
  if (quote.status !== 'APPROVED') {
    return res.status(400).json({
      success: false,
      message: `Only APPROVED quotes can be converted to an order. Current status: ${quote.status}`,
    });
  }

  // 3b. Data Integrity Guard: Quote MUST have items and value
  if (!quote.items || quote.items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot convert a quote to an order because it has no items.',
    });
  }
  if (quote.totalAmount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot convert a quote to an order with zero total amount.',
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
    // Continue from the highest number already issued: a row count would reuse a number after a deletion.
    const year = new Date().getFullYear();
    const orderCount = await prisma.order.count();
    const [lastOrder, lastInvoice] = await Promise.all([
      prisma.order.findFirst({
        where: { orderNumber: { startsWith: `ZQB-ORD-${year}-` } },
        orderBy: { orderNumber: 'desc' },
        select: { orderNumber: true },
      }),
      prisma.invoice.findFirst({
        where: { invoiceNumber: { startsWith: `INV-${year}-` } },
        orderBy: { invoiceNumber: 'desc' },
        select: { invoiceNumber: true },
      }),
    ]);
    const lastSeq = (value?: string) => parseInt(value?.split('-').pop() || '', 10) || 0;
    const orderSeq = Math.max(orderCount + 5001, lastSeq(lastOrder?.orderNumber) + 1);
    const invoiceSeq = Math.max(orderCount + 8001, lastSeq(lastInvoice?.invoiceNumber) + 1);
    const orderNumber = `ZQB-ORD-${year}-${String(orderSeq).padStart(4, '0')}`;

    const result = await prisma.$transaction(
      async (tx) => {
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
          artworkUrl: quote.artworkUrl || null,
          previewFrontUrl: quote.previewFrontUrl || null,
          previewBackUrl: quote.previewBackUrl || null,
          canvasStateJson: quote.canvasStateJson || null,
          addonTitle: quote.addonTitle,
          addonAmount: quote.addonAmount,
          freeGiftTitle: quote.freeGiftTitle,
          deliveryAddress: buildDeliverySnapshot(quote),
          items: {
            create: quote.items.map((item) => ({
              productId: item.productId,
              printType: item.printType,
              color: item.color,
              size: item.size,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              customizationDetails: quote.notes || null,
              variants: item.variants ? {
                create: item.variants.map((v) => ({
                  color: v.color,
                  size: v.size,
                  quantity: v.quantity
                }))
              } : undefined
            })),
          },
          production: {
            create: {
              stage: 'PENDING',
              notes: quote.notes ? `Approved quotation #${quote.quoteNumber} | ${quote.notes}` : `Order created from approved quotation #${quote.quoteNumber}`,
            },
          },
          invoices: {
            create: {
              invoiceNumber: `INV-${year}-${String(invoiceSeq).padStart(4, '0')}`,
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
          items: { include: { product: true, variants: true } },
          production: true,
          invoices: true,
        },
      });

        // Internal stock deduction: ordered colours reduce the mapped stock types (same transaction as the order)
        await deductStockForOrder(tx, quote.items);

        // Mark linked inquiry as closed / converted to order
        const linkedInquiry = await tx.inquiry.findFirst({
          where: { quoteId: quote.id }
        });

        if (linkedInquiry) {
          await tx.inquiry.update({
            where: { id: linkedInquiry.id },
            data: { status: 'CLOSED' }
          });

          await tx.inquiryActivity.create({
            data: {
              inquiryId: linkedInquiry.id,
              type: 'STATUS_CHANGE',
              message: `Converted to Order #${orderNumber}`,
              userId: req.user?.id || null,
            }
          });
        }

        return newOrder;
      },
      { maxWait: 15000, timeout: 30000 }
    );

    return res.status(201).json({ success: true, order: result });
  } catch (error: any) {
    console.error('Order creation transaction failed:', error);
    return res.status(500).json({ success: false, message: 'Failed to convert quote to order' });
  }
};

export const getOrders = async (req: AuthRequest, res: Response) => {
  try {
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
            OR: customerOwnershipFilter(req.user)
          }
        ];
      } else {
        where.OR = customerOwnershipFilter(req.user);
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
          quote: {
            select: {
              quoteNumber: true,
              artworkUrl: true,
              previewFrontUrl: true,
              previewBackUrl: true,
              inquiry: {
                select: {
                  customerName: true,
                  artworkUrl: true,
                  phone: true,
                  email: true,
                  productInterest: true,
                },
              },
            },
          },
          customer: { select: { id: true, name: true, email: true, phone: true } },
          company: { select: { id: true, name: true, gstin: true } },
          items: { include: { product: true, variants: true } },
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
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrderStats = async (req: AuthRequest, res: Response) => {
  try {
    const baseWhere: any = {};
    if (req.user?.role === 'CUSTOMER') {
      baseWhere.OR = customerOwnershipFilter(req.user);
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
  } catch (error: any) {
    console.error('Error fetching order stats:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrderById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        company: true,
        quote: {
          select: {
            quoteNumber: true,
            artworkUrl: true,
            previewFrontUrl: true,
            previewBackUrl: true,
            inquiry: {
              select: {
                customerName: true,
                artworkUrl: true,
                phone: true,
                email: true,
                productInterest: true,
              },
            },
          },
        },
        items: { include: { product: true, variants: true } },
        production: true,
        dispatch: true,
        invoices: true,
        payments: true,
      },
    });

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Ownership guard
    if (req.user?.role === 'CUSTOMER' && !isCustomerOwner(req.user, order)) {
      return res.status(403).json({ success: false, message: 'Unauthorized to view this order' });
    }

    return res.json({ success: true, order });
  } catch (error: any) {
    console.error('Error fetching order by id:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
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
      items: { include: { product: true, variants: true } },
      production: true,
      dispatch: true,
    },
  });

  return res.json({ success: true, order: updatedOrder });
};

// Public order tracking by order number. Order numbers are sequential, so this
// returns progress only — never customer identity, pricing or artwork.
export const trackOrder = async (req: Request, res: Response) => {
  const orderNumber = String(req.params.orderNumber || '').trim();

  if (!orderNumber || orderNumber.length > 40) {
    return res.status(400).json({ success: false, message: 'Please enter a valid order ID.' });
  }

  const order = await prisma.order.findFirst({
    where: { orderNumber: { equals: orderNumber, mode: 'insensitive' } },
    select: {
      orderNumber: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      items: { select: { quantity: true, product: { select: { name: true } } } },
      production: { select: { stage: true } },
      dispatch: {
        select: {
          courierName: true,
          trackingNumber: true,
          trackingUrl: true,
          status: true,
          dispatchedAt: true,
          deliveredAt: true,
        },
      },
    },
  });

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'No order found with this ID. Please check the order ID and try again.',
    });
  }

  return res.json({
    success: true,
    order: {
      orderNumber: order.orderNumber,
      status: order.status,
      placedAt: order.createdAt,
      updatedAt: order.updatedAt,
      productionStage: order.production?.stage ?? null,
      items: order.items.map((item) => ({ name: item.product.name, quantity: item.quantity })),
      shipment: order.dispatch,
    },
  });
};
