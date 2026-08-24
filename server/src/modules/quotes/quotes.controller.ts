import { Response } from 'express';
import { prisma } from '../../config/index.js';
import { AuthRequest } from '../../middleware/auth.js';
import { generateQuotePDFBuffer } from '../../utils/pdfGenerator.js';
import { sendQuoteEmail } from '../../utils/email.js';
import { buildWhatsAppClickUrl, generateWhatsAppMessage, WhatsAppTemplateKey } from '../../utils/whatsappTemplates.js';

// Server-side Authoritative Pricing Calculation Service
export function calculateServerPricing(
  basePrice: number,
  quantity: number,
  printType: string = 'Front Only',
  gstRate: number = 5.0
) {
  let positionAddon = 20;
  const printLower = printType.toLowerCase();
  if (printLower.includes('front') && printLower.includes('back')) {
    positionAddon = 40;
  } else if (printLower.includes('embroidery') || printLower.includes('back')) {
    positionAddon = 30;
  }

  // Volume discount tier
  let volumePrice = basePrice;
  if (quantity >= 500) {
    volumePrice = Math.max(100, basePrice - 60);
  } else if (quantity >= 100) {
    volumePrice = Math.max(120, basePrice - 30);
  } else if (quantity >= 50) {
    volumePrice = Math.max(140, basePrice - 10);
  }

  const unitPrice = volumePrice + positionAddon;
  const subtotal = unitPrice * quantity;
  const gstTotal = Math.round(subtotal * (gstRate / 100));
  const totalAmount = subtotal + gstTotal;

  return { unitPrice, subtotal, gstTotal, totalAmount };
}

// Allowed status transitions state machine
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['SENT', 'APPROVED', 'REJECTED'],
  SENT: ['APPROVED', 'REJECTED', 'EXPIRED'],
  APPROVED: ['EXPIRED'],
  REJECTED: ['DRAFT', 'SENT'],
  EXPIRED: ['DRAFT'],
};

export const getQuotes = async (req: AuthRequest, res: Response) => {
  const { status, search, page = '1', pageSize = '10' } = req.query;

  const where: any = {};
  if (status && status !== 'All Status') {
    where.status = String(status);
  }

  if (search) {
    const searchStr = String(search);
    where.OR = [
      { quoteNumber: { contains: searchStr, mode: 'insensitive' } },
      { customer: { name: { contains: searchStr, mode: 'insensitive' } } },
      { customer: { email: { contains: searchStr, mode: 'insensitive' } } },
      { company: { name: { contains: searchStr, mode: 'insensitive' } } },
    ];
  }

  // Customer role security filter
  if (req.user?.role === 'CUSTOMER') {
    // If the customer search overlaps, ensure it stays within their bounds
    where.AND = [
      {
        OR: [
          { customerId: req.user.id },
          { companyId: req.user.companyId || undefined },
        ]
      }
    ];
  }

  const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
  const limitNum = Math.max(1, parseInt(String(pageSize), 10) || 10);
  const skip = (pageNum - 1) * limitNum;

  const [quotes, total] = await Promise.all([
    prisma.quote.findMany({
      where,
      skip,
      take: limitNum,
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        company: { select: { id: true, name: true, gstin: true } },
        items: { include: { product: true } },
        activities: {
          include: { user: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.quote.count({ where }),
  ]);

  // Filter activities for customer role
  const sanitizedQuotes = quotes.map((q) => {
    if (req.user?.role === 'CUSTOMER') {
      return {
        ...q,
        activities: q.activities.filter((act) => act.type !== 'NOTE' && act.type !== 'WHATSAPP'),
      };
    }
    return q;
  });

  return res.json({ 
    success: true, 
    data: sanitizedQuotes,
    quotes: sanitizedQuotes,
    pagination: {
      page: pageNum,
      pageSize: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  });
};

export const getQuoteStats = async (req: AuthRequest, res: Response) => {
  // Base where clause for role security
  const baseWhere: any = {};
  if (req.user?.role === 'CUSTOMER') {
    baseWhere.OR = [
      { customerId: req.user.id },
      { companyId: req.user.companyId || undefined },
    ];
  }

  const [total, sent, draft, approved, expired, rejected] = await Promise.all([
    prisma.quote.count({ where: baseWhere }),
    prisma.quote.count({ where: { ...baseWhere, status: 'SENT' } }),
    prisma.quote.count({ where: { ...baseWhere, status: 'DRAFT' } }),
    prisma.quote.count({ where: { ...baseWhere, status: 'APPROVED' } }),
    prisma.quote.count({ where: { ...baseWhere, status: 'EXPIRED' } }),
    prisma.quote.count({ where: { ...baseWhere, status: 'REJECTED' } }),
  ]);

  return res.json({
    success: true,
    stats: {
      total,
      sent,
      draft,
      approved,
      expired,
      rejected,
      // For the UI "Pending" card, we map to SENT + DRAFT (or however business prefers. The prompt says 'Pending')
      pending: sent + draft 
    }
  });
};

export const getQuoteById = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const quote = await prisma.quote.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, name: true, email: true, phone: true } },
      company: true,
      items: { include: { product: true } },
      activities: {
        include: { user: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!quote) {
    return res.status(404).json({ success: false, message: 'Quote not found' });
  }

  // Ownership security check for CUSTOMER role
  if (req.user?.role === 'CUSTOMER' && quote.customerId !== req.user.id && quote.companyId !== req.user.companyId) {
    return res.status(403).json({ success: false, message: 'Unauthorized access to quote' });
  }

  // Sanitize internal sales activities for customer role
  let sanitizedActivities = quote.activities;
  if (req.user?.role === 'CUSTOMER') {
    sanitizedActivities = quote.activities.filter((act) => act.type !== 'NOTE' && act.type !== 'WHATSAPP');
  }

  return res.json({
    success: true,
    quote: {
      ...quote,
      activities: sanitizedActivities,
    },
  });
};

export const createQuote = async (req: AuthRequest, res: Response) => {
  const { customerId, companyId, productId, items, quantity = 50, color = 'Navy Blue', size = 'L', printType = 'Front Only', notes, validDays = 15, address, status } = req.body;

  const targetCustomerId = customerId || req.user?.id;
  if (!targetCustomerId) {
    return res.status(400).json({ success: false, message: 'Customer ID is required' });
  }

  const quoteCount = await prisma.quote.count();
  const quoteNumber = `ZQB-QT-${new Date().getFullYear()}-${String(quoteCount + 1001).padStart(4, '0')}`;

  let product = null;
  const targetProductId = productId || (items && items[0]?.productId);

  if (targetProductId) {
    product = await prisma.product.findFirst({
      where: {
        OR: [{ id: targetProductId }, { slug: targetProductId }],
      },
    });
  }

  if (!product) product = await prisma.product.findFirst();

  if (!product) {
    let category = await prisma.category.findFirst();
    if (!category) {
      category = await prisma.category.create({
        data: { name: 'Apparel', slug: 'apparel', description: 'Garments & Custom Apparel' },
      });
    }
    product = await prisma.product.create({
      data: {
        name: 'Customized Polo T-Shirt (200 GSM Cotton)',
        slug: 'polo-200gsm',
        description: 'Heavyweight bio-washed polo t-shirt',
        basePrice: 249,
        gstRate: 5.0,
        categoryId: category.id,
      },
    });
  }

  const normalizedItems = Array.isArray(items) && items.length > 0 ? items : [
    {
      productId: product.id,
      printType: printType || 'Front Only',
      color: color || 'Navy Blue',
      size: size || 'L',
      quantity: Number(quantity) || 50,
    },
  ];

  let subtotal = 0;
  let totalGst = 0;
  const quoteItemsData = [];

  for (const item of normalizedItems) {
    // If the items array has its own product ID, we should technically resolve it, but we fallback to main product for simplicity if not provided.
    let itemProduct = product;
    if (item.productId && item.productId !== product.id) {
       const found = await prisma.product.findUnique({ where: { id: item.productId }});
       if (found) itemProduct = found;
    }

    const itemQty = Number(item.quantity) || 50;
    const pricing = calculateServerPricing(itemProduct.basePrice, itemQty, item.printType || printType, itemProduct.gstRate);

    subtotal += pricing.subtotal;
    totalGst += pricing.gstTotal;

    quoteItemsData.push({
      productId: itemProduct.id,
      printType: item.printType || printType || 'Front Only',
      color: item.color || color || 'Navy Blue',
      size: item.size || size || 'L',
      quantity: itemQty,
      unitPrice: pricing.unitPrice,
      totalPrice: pricing.subtotal,
    });
  }

  const grandTotal = subtotal + totalGst;
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + validDays);
  
  const finalStatus = status || (req.user?.role === 'CUSTOMER' ? 'DRAFT' : 'SENT');

  const quote = await prisma.quote.create({
    data: {
      quoteNumber,
      customerId: targetCustomerId,
      companyId: companyId || req.user?.companyId || null,
      status: finalStatus,
      subtotal,
      gstTotal: totalGst,
      discount: 0,
      totalAmount: grandTotal,
      notes: notes || (address ? `Delivery Address: ${address}` : undefined),
      validUntil,
      items: { createMany: { data: quoteItemsData } },
      activities: {
        create: {
          userId: req.user?.id || null,
          type: 'STATUS_CHANGE',
          message: 'Quote created',
        },
      },
    },
    include: {
      items: true,
      customer: { select: { id: true, name: true, email: true, phone: true } },
      company: true,
      activities: { include: { user: { select: { id: true, name: true, role: true } } } },
    },
  });

  return res.status(201).json({ success: true, quote });
};

export const calculateQuotePricing = async (req: AuthRequest, res: Response) => {
  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Items array is required for calculation' });
  }

  let subtotal = 0;
  let totalGst = 0;
  const calculatedItems = [];

  for (const item of items) {
    if (!item.productId) continue;

    const product = await prisma.product.findUnique({
      where: { id: item.productId }
    });

    if (!product) continue;

    const itemQty = Number(item.quantity) || 1;
    const pricing = calculateServerPricing(product.basePrice, itemQty, item.printType || 'Front Only', product.gstRate);

    subtotal += pricing.subtotal;
    totalGst += pricing.gstTotal;

    calculatedItems.push({
      productId: product.id,
      printType: item.printType || 'Front Only',
      quantity: itemQty,
      unitPrice: pricing.unitPrice,
      totalPrice: pricing.subtotal,
      gstTotal: pricing.gstTotal
    });
  }

  const grandTotal = subtotal + totalGst;

  return res.json({
    success: true,
    data: {
      subtotal,
      gstTotal: totalGst,
      totalAmount: grandTotal,
      items: calculatedItems
    }
  });
};

export const updateQuoteStatus = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const quote = await prisma.quote.findUnique({ where: { id } });
  if (!quote) {
    return res.status(404).json({ success: false, message: 'Quote not found' });
  }

  if (req.user?.role === 'CUSTOMER') {
    if (quote.customerId !== req.user.id && quote.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to modify this quote' });
    }
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Customers can only approve or reject quotes' });
    }
  }

  const currentStatus = quote.status;
  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(status) && currentStatus !== status) {
    return res.status(400).json({
      success: false,
      message: `Invalid status transition from ${currentStatus} to ${status}. Allowed: ${allowed.join(', ')}`,
    });
  }

  const activityType = status === 'APPROVED' ? 'CUSTOMER_APPROVED' : status === 'REJECTED' ? 'CUSTOMER_REJECTED' : 'STATUS_CHANGE';

  const updatedQuote = await prisma.quote.update({
    where: { id },
    data: {
      status,
      activities: {
        create: {
          userId: req.user?.id || null,
          type: activityType,
          message: `Quote status updated to ${status}`,
        },
      },
    },
    include: {
      customer: { select: { id: true, name: true, email: true, phone: true } },
      company: true,
      items: { include: { product: true } },
      activities: { include: { user: { select: { id: true, name: true, role: true } } } },
    },
  });

  return res.json({ success: true, quote: updatedQuote });
};

export const editQuote = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { quantity, color, size, printType, notes } = req.body;

  const quote = await prisma.quote.findUnique({
    where: { id },
    include: { items: { include: { product: true } } },
  });

  if (!quote) return res.status(404).json({ success: false, message: 'Quote not found' });

  if (req.user?.role === 'CUSTOMER') {
    return res.status(403).json({ success: false, message: 'Only Admin/Sales users can edit quote specifications' });
  }

  const firstItem = quote.items[0];
  const newQty = quantity ? Number(quantity) : firstItem?.quantity || 50;
  const newColor = color || firstItem?.color || 'Black';
  const newSize = size || firstItem?.size || 'L';
  const newPrintType = printType || firstItem?.printType || 'Front Only';

  const product = firstItem?.product || (await prisma.product.findFirst());
  const basePrice = product?.basePrice || 249;
  const gstRate = product?.gstRate || 5.0;

  const pricing = calculateServerPricing(basePrice, newQty, newPrintType, gstRate);

  if (firstItem) {
    await prisma.quoteItem.update({
      where: { id: firstItem.id },
      data: {
        quantity: newQty,
        color: newColor,
        size: newSize,
        printType: newPrintType,
        unitPrice: pricing.unitPrice,
        totalPrice: pricing.subtotal,
      },
    });
  }

  const updatedQuote = await prisma.quote.update({
    where: { id },
    data: {
      subtotal: pricing.subtotal,
      gstTotal: pricing.gstTotal,
      discount: 0,
      totalAmount: pricing.totalAmount,
      couponId: null,
      notes: notes || quote.notes,
      activities: {
        create: {
          userId: req.user?.id || null,
          type: 'PRICE_UPDATE',
          message: `Quote specs updated. Quantity: ${newQty}, Print: ${newPrintType}. Server recalculated total: ₹${pricing.totalAmount.toLocaleString('en-IN')} (Any previous coupon was automatically revoked)`,
        },
      },
    },
    include: {
      customer: { select: { id: true, name: true, email: true, phone: true } },
      company: true,
      items: { include: { product: true } },
      activities: { include: { user: { select: { id: true, name: true, role: true } } } },
    },
  });

  return res.json({ success: true, quote: updatedQuote });
};

export const addQuoteActivity = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { type = 'NOTE', message } = req.body;

  if (!message || message.trim() === '') {
    return res.status(400).json({ success: false, message: 'Activity message is required' });
  }

  const quote = await prisma.quote.findUnique({ where: { id } });
  if (!quote) return res.status(404).json({ success: false, message: 'Quote not found' });

  if (req.user?.role === 'CUSTOMER') {
    return res.status(403).json({ success: false, message: 'Customers cannot create internal sales notes' });
  }

  const activity = await prisma.quoteActivity.create({
    data: {
      quoteId: quote.id,
      userId: req.user?.id || null,
      type: type || 'NOTE',
      message: message.trim(),
    },
    include: { user: { select: { id: true, name: true, role: true } } },
  });

  return res.status(201).json({ success: true, activity });
};

export const triggerWhatsAppAction = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { template = 'NEW_QUOTE' } = req.body;

  const quote = await prisma.quote.findUnique({
    where: { id },
    include: { customer: true, items: { include: { product: true } } },
  });

  if (!quote) return res.status(404).json({ success: false, message: 'Quote not found' });

  if (req.user?.role === 'CUSTOMER') {
    return res.status(403).json({ success: false, message: 'Customers cannot trigger sales WhatsApp actions' });
  }

  const firstItem = quote.items[0];
  const customerPhone = quote.customer.phone || '919876543210';
  const customerName = quote.customer.name;
  const productName = firstItem?.product.name || 'Polo T-Shirts';
  const quantity = firstItem?.quantity || 50;

  const messageText = generateWhatsAppMessage(template as WhatsAppTemplateKey, {
    customerName,
    salesUserName: req.user?.name || 'Zobra Sales',
    quoteNumber: quote.quoteNumber,
    productName,
    quantity,
    totalAmount: quote.totalAmount,
  });

  const whatsappUrl = buildWhatsAppClickUrl(customerPhone, messageText);

  // Record WHATSAPP QuoteActivity
  const activity = await prisma.quoteActivity.create({
    data: {
      quoteId: quote.id,
      userId: req.user?.id || null,
      type: 'WHATSAPP',
      message: 'WhatsApp conversation initiated from Zobra',
    },
    include: { user: { select: { id: true, name: true, role: true } } },
  });

  return res.json({
    success: true,
    whatsappUrl,
    activity,
  });
};

export const downloadQuotePDF = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const quote = await prisma.quote.findUnique({
    where: { id },
    include: { customer: true, company: true, items: { include: { product: true } } },
  });

  if (!quote) return res.status(404).json({ success: false, message: 'Quote not found' });

  const pdfBuffer = await generateQuotePDFBuffer({
    quoteNumber: quote.quoteNumber,
    customerName: quote.customer.name,
    companyName: quote.company?.name,
    gstin: quote.company?.gstin || undefined,
    items: quote.items.map((i) => ({
      productName: i.product.name,
      printType: i.printType,
      color: i.color,
      size: i.size,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      totalPrice: i.totalPrice,
    })),
    subtotal: quote.subtotal,
    gstTotal: quote.gstTotal,
    discount: quote.discount,
    totalAmount: quote.totalAmount,
    validUntil: quote.validUntil.toLocaleDateString('en-IN'),
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=Quote_${quote.quoteNumber}.pdf`);
  return res.send(pdfBuffer);
};

export const emailQuote = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const quote = await prisma.quote.findUnique({
    where: { id },
    include: { customer: true, company: true, items: { include: { product: true } } },
  });

  if (!quote) return res.status(404).json({ success: false, message: 'Quote not found' });

  const pdfBuffer = await generateQuotePDFBuffer({
    quoteNumber: quote.quoteNumber,
    customerName: quote.customer.name,
    companyName: quote.company?.name,
    gstin: quote.company?.gstin || undefined,
    items: quote.items.map((i) => ({
      productName: i.product.name,
      printType: i.printType,
      color: i.color,
      size: i.size,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      totalPrice: i.totalPrice,
    })),
    subtotal: quote.subtotal,
    gstTotal: quote.gstTotal,
    discount: quote.discount,
    totalAmount: quote.totalAmount,
    validUntil: quote.validUntil.toLocaleDateString('en-IN'),
  });

  await sendQuoteEmail(quote.customer.email, quote.quoteNumber, pdfBuffer, quote.totalAmount);

  await prisma.quote.update({
    where: { id },
    data: {
      status: 'SENT',
      activities: {
        create: {
          userId: req.user?.id || null,
          type: 'QUOTE_SENT',
          message: `Official quotation email sent to ${quote.customer.email}`,
        },
      },
    },
  });

  return res.json({ success: true, message: `Quotation email successfully dispatched to ${quote.customer.email}` });
};

/**
 * POST /api/v1/quotes/:id/apply-coupon
 */
export const applyCoupon = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { couponCode } = req.body;

    if (!couponCode) return res.status(400).json({ success: false, message: 'Coupon code is required' });

    const quote = await prisma.quote.findUnique({
      where: { id },
      include: { items: { include: { product: true } } }
    });

    if (!quote) return res.status(404).json({ success: false, message: 'Quote not found' });

    // Customer security check
    if (req.user?.role === 'CUSTOMER' && quote.customerId !== req.user.id && quote.companyId !== req.user.companyId) {
       return res.status(403).json({ success: false, message: 'Unauthorized to apply coupon to this quote' });
    }

    if (quote.status !== 'DRAFT' && quote.status !== 'SENT') {
       return res.status(400).json({ success: false, message: 'Cannot apply coupon to an approved or rejected quote' });
    }

    const uppercaseCode = couponCode.toUpperCase().trim();
    const coupon = await prisma.coupon.findUnique({ where: { code: uppercaseCode } });

    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found or invalid' });

    // Validate Coupon
    if (coupon.status !== 'ACTIVE') return res.status(400).json({ success: false, message: 'Coupon is inactive or expired' });
    
    const now = new Date();
    if (now < coupon.startAt) return res.status(400).json({ success: false, message: 'Coupon is not valid yet' });
    if (now > coupon.endAt) return res.status(400).json({ success: false, message: 'Coupon has expired' });

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
       return res.status(400).json({ success: false, message: 'Coupon usage limit has been reached' });
    }

    if (coupon.minimumOrderAmount && quote.subtotal < coupon.minimumOrderAmount) {
       return res.status(400).json({ success: false, message: `Minimum order amount of ₹${coupon.minimumOrderAmount} not met` });
    }

    // Per-Customer Limit Validation (Optional feature, implementing safely)
    if (coupon.perCustomerLimit) {
       const userUsages = await prisma.couponUsage.count({
          where: { couponId: coupon.id, customerId: quote.customerId }
       });
       if (userUsages >= coupon.perCustomerLimit) {
          return res.status(400).json({ success: false, message: 'You have reached the maximum usage limit for this coupon' });
       }
    }

    // Server-side Discount Calculation
    let discountAmount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
       discountAmount = quote.subtotal * (coupon.discountValue / 100);
       if (coupon.maximumDiscount && discountAmount > coupon.maximumDiscount) {
          discountAmount = coupon.maximumDiscount;
       }
    } else if (coupon.discountType === 'FIXED_AMOUNT') {
       discountAmount = coupon.discountValue;
       if (discountAmount > quote.subtotal) discountAmount = quote.subtotal;
    }

    // Recalculate GST based on new subtotal
    const firstItem = quote.items[0];
    const gstRate = firstItem?.product?.gstRate || 5.0;
    
    const taxableAmount = quote.subtotal - discountAmount;
    const gstTotal = Math.round(taxableAmount * (gstRate / 100));
    const totalAmount = taxableAmount + gstTotal;

    // Update quote
    const updatedQuote = await prisma.quote.update({
       where: { id },
       data: {
          discount: discountAmount,
          gstTotal,
          totalAmount,
          couponId: coupon.id,
          activities: {
             create: {
                userId: req.user?.id || null,
                type: 'PRICE_UPDATE',
                message: `Applied coupon ${coupon.code}. Discount: ₹${discountAmount.toLocaleString('en-IN')}`
             }
          }
       },
       include: { customer: true, company: true, items: { include: { product: true } }, activities: { include: { user: true }, orderBy: { createdAt: 'asc' } } }
    });

    return res.json({ success: true, message: 'Coupon applied successfully', quote: updatedQuote });
  } catch (error: any) {
     return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/v1/quotes/:id/remove-coupon
 */
export const removeCoupon = async (req: AuthRequest, res: Response) => {
   try {
      const { id } = req.params;
  
      const quote = await prisma.quote.findUnique({
        where: { id },
        include: { items: { include: { product: true } } }
      });
  
      if (!quote) return res.status(404).json({ success: false, message: 'Quote not found' });
  
      if (req.user?.role === 'CUSTOMER' && quote.customerId !== req.user.id && quote.companyId !== req.user.companyId) {
         return res.status(403).json({ success: false, message: 'Unauthorized' });
      }
  
      if (quote.status !== 'DRAFT' && quote.status !== 'SENT') {
         return res.status(400).json({ success: false, message: 'Cannot modify an approved or rejected quote' });
      }

      if (!quote.couponId) {
         return res.status(400).json({ success: false, message: 'No coupon applied to this quote' });
      }
  
      // Recalculate original GST without discount
      const firstItem = quote.items[0];
      const gstRate = firstItem?.product?.gstRate || 5.0;
      
      const gstTotal = Math.round(quote.subtotal * (gstRate / 100));
      const totalAmount = quote.subtotal + gstTotal;
  
      const updatedQuote = await prisma.quote.update({
         where: { id },
         data: {
            discount: 0,
            gstTotal,
            totalAmount,
            couponId: null,
            activities: {
               create: {
                  userId: req.user?.id || null,
                  type: 'PRICE_UPDATE',
                  message: `Coupon removed. Totals restored.`
               }
            }
         },
         include: { customer: true, company: true, items: { include: { product: true } }, activities: { include: { user: true }, orderBy: { createdAt: 'asc' } } }
      });
  
      return res.json({ success: true, message: 'Coupon removed successfully', quote: updatedQuote });
    } catch (error: any) {
       return res.status(500).json({ success: false, message: error.message });
    }
};
