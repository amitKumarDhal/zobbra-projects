import { PrismaClient, Inquiry, InquiryActivity, InquiryStatus, InquirySource, InquiryActivityType, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export class InquiryService {
  
  // 1. Get all inquiries with search, filter, and pagination
  static async getAllInquiries(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: InquiryStatus;
    source?: InquirySource;
    assignedToId?: string;
    customerId?: string;
  }) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 25;
    const skip = (page - 1) * limit;

    const where: Prisma.InquiryWhereInput = {};

    if (params.status) where.status = params.status;
    if (params.source) where.source = params.source;
    if (params.assignedToId) where.assignedToId = params.assignedToId;
    if (params.customerId) where.customerId = params.customerId;

    if (params.search) {
      where.OR = [
        { inquiryNumber: { contains: params.search, mode: 'insensitive' } },
        { message: { contains: params.search, mode: 'insensitive' } },
        { customer: { name: { contains: params.search, mode: 'insensitive' } } },
        { customer: { email: { contains: params.search, mode: 'insensitive' } } },
        { customer: { phone: { contains: params.search, mode: 'insensitive' } } },
        { company: { name: { contains: params.search, mode: 'insensitive' } } },
      ];
    }

    const [inquiries, total] = await Promise.all([
      prisma.inquiry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true, email: true, phone: true } },
          company: { select: { id: true, name: true } },
          product: { select: { id: true, name: true, slug: true } },
          assignedTo: { select: { id: true, name: true } },
        },
      }),
      prisma.inquiry.count({ where }),
    ]);

    return {
      data: inquiries,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // 2. Get single inquiry by ID
  static async getInquiryById(id: string) {
    return prisma.inquiry.findUnique({
      where: { id },
      include: {
        customer: true,
        company: true,
        product: true,
        assignedTo: { select: { id: true, name: true } },
        quote: { select: { id: true, quoteNumber: true } },
        activities: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  static async createInquiry(data: {
    customerId?: string;
    companyId?: string;
    customerName?: string;
    companyName?: string;
    email?: string;
    phone?: string;
    productId?: string;
    productInterest?: string;
    quantity?: number;
    printingType?: string;
    printPosition?: string;
    colors?: string;
    deliveryDate?: Date;
    budget?: string;
    source?: InquirySource;
    message?: string;
    assignedToId?: string;
    nextFollowUpAt?: Date;
  }, userId?: string) {
    // Generate unique inquiry number
    const count = await prisma.inquiry.count();
    const inquiryNumber = `INQ-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

    return prisma.$transaction(async (tx) => {
      const isRegistered = !!userId || !!data.customerId;
      
      const inquiry = await tx.inquiry.create({
        data: {
          inquiryNumber,
          ...data,
          customerId: data.customerId || userId || null,
          customerType: isRegistered ? 'REGISTERED' : 'GUEST',
          status: InquiryStatus.NEW,
        },
      });

      await tx.inquiryActivity.create({
        data: {
          inquiryId: inquiry.id,
          type: InquiryActivityType.CREATED,
          message: 'Inquiry created.',
          userId,
        },
      });

      return inquiry;
    });
  }

  // 4. Update status
  static async updateStatus(id: string, status: InquiryStatus, userId?: string) {
    return prisma.$transaction(async (tx) => {
      const inquiry = await tx.inquiry.update({
        where: { id },
        data: { status },
      });

      await tx.inquiryActivity.create({
        data: {
          inquiryId: id,
          type: InquiryActivityType.STATUS_CHANGE,
          message: `Status changed to ${status}`,
          userId,
        },
      });

      return inquiry;
    });
  }

  // 5. Assign to a sales rep
  static async assignInquiry(id: string, assignedToId: string, userId?: string) {
    return prisma.$transaction(async (tx) => {
      const inquiry = await tx.inquiry.update({
        where: { id },
        data: { assignedToId },
      });
      
      const assignee = await tx.user.findUnique({ where: { id: assignedToId }});

      await tx.inquiryActivity.create({
        data: {
          inquiryId: id,
          type: InquiryActivityType.NOTE,
          message: `Inquiry assigned to ${assignee?.name || assignedToId}`,
          userId,
        },
      });

      return inquiry;
    });
  }

  // 6. Add activity log (Note, Call, WhatsApp, etc)
  static async addActivity(id: string, type: InquiryActivityType, message: string, userId?: string) {
    return prisma.inquiryActivity.create({
      data: {
        inquiryId: id,
        type,
        message,
        userId,
      },
      include: {
        user: { select: { id: true, name: true } }
      }
    });
  }

  // 7. Stats for KPI Dashboard
  static async getStats() {
    const [total, newInq, contacted, quoted, converted, registered, guest] = await Promise.all([
      prisma.inquiry.count(),
      prisma.inquiry.count({ where: { status: InquiryStatus.NEW } }),
      prisma.inquiry.count({ where: { status: InquiryStatus.CONTACTED } }),
      prisma.inquiry.count({ where: { status: InquiryStatus.QUOTED } }),
      prisma.inquiry.count({ where: { status: InquiryStatus.CONVERTED } }),
      prisma.inquiry.count({ where: { customerType: 'REGISTERED' } }),
      prisma.inquiry.count({ where: { customerType: 'GUEST' } }),
    ]);

    return {
      total,
      new: newInq,
      contacted,
      quoted,
      converted,
      registered,
      guest
    };
  }

  // 8. CONVERT TO QUOTE
  static async convertToQuote(inquiryId: string, userId: string) {
    const inquiry = await prisma.inquiry.findUnique({
      where: { id: inquiryId },
      include: { customer: true, company: true, product: true }
    });

    if (!inquiry) throw new Error('Inquiry not found');
    if (inquiry.status === InquiryStatus.CONVERTED) throw new Error('Inquiry already converted to Quote');
    
    let customerId = inquiry.customerId;
    let companyId = inquiry.companyId;

    // Generate Quote Number
    const count = await prisma.quote.count();
    const quoteNumber = `ZQB-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 7); // Default valid for 7 days

    return prisma.$transaction(async (tx) => {
      // 0. Guest to Registered Customer conversion
      if (inquiry.customerType === 'GUEST' && !customerId) {
        let emailToUse = inquiry.email;
        if (!emailToUse) {
           emailToUse = `guest-${inquiry.phone || inquiry.id.substring(0, 8)}@zobbra.guest`;
        }
        
        let existingUser = await tx.user.findUnique({ where: { email: emailToUse }});
        if (!existingUser) {
           existingUser = await tx.user.create({
             data: {
               email: emailToUse,
               name: inquiry.customerName || 'Guest Customer',
               phone: inquiry.phone,
               passwordHash: 'GENERATED_NO_PASSWORD', // They will have to reset password to login
               role: 'CUSTOMER',
               isActive: true
             }
           });
        }
        customerId = existingUser.id;
        
        // Update inquiry to reflect it's now registered
        await tx.inquiry.update({
          where: { id: inquiry.id },
          data: { customerId: existingUser.id, customerType: 'REGISTERED' }
        });
      }

      if (!customerId) {
        const defaultCustomer = await tx.user.findFirst({ where: { role: 'CUSTOMER' } });
        customerId = defaultCustomer ? defaultCustomer.id : userId;
      }

      // 1. Create the Quote
      const quote = await tx.quote.create({
        data: {
          quoteNumber,
          customerId: customerId!,
          companyId: inquiry.companyId,
          status: 'DRAFT',
          subtotal: 0, // Placeholder, can be calculated based on product logic if needed
          gstTotal: 0,
          totalAmount: 0,
          validUntil,
          notes: `Converted from Inquiry ${inquiry.inquiryNumber}`,
        }
      });

      // 2. Resolve Product (Fallback to first available product if not linked)
      let product = inquiry.product;
      let productId = inquiry.productId;
      if (!product || !productId) {
        const fallbackProduct = await tx.product.findFirst({
          orderBy: { createdAt: 'asc' }
        });
        if (!fallbackProduct) throw new Error("No products available in the system to create a Quote.");
        product = fallbackProduct;
        productId = fallbackProduct.id;
      }

      const qty = inquiry.quantity || 50;
      const basePrice = product.basePrice || 249;
      const printType = inquiry.printingType || 'Front Only';
      
      // Basic price calculation (similar to calculateServerPricing)
      let volumePrice = basePrice;
      if (qty >= 500) volumePrice = Math.max(100, basePrice - 60);
      else if (qty >= 100) volumePrice = Math.max(120, basePrice - 30);
      else if (qty >= 50) volumePrice = Math.max(140, basePrice - 10);
      
      let positionAddon = 20;
      if (printType.toLowerCase().includes('front') && printType.toLowerCase().includes('back')) positionAddon = 40;
      else if (printType.toLowerCase().includes('embroidery') || printType.toLowerCase().includes('back')) positionAddon = 30;
      
      const unitPrice = volumePrice + positionAddon;
      const amount = unitPrice * qty;
      const gst = Math.round(amount * (product.gstRate / 100));

      await tx.quoteItem.create({
        data: {
          quoteId: quote.id,
          productId: productId,
          printType: printType,
          color: inquiry.colors || 'Navy Blue',
          size: 'L',
          quantity: qty,
          unitPrice: unitPrice,
          totalPrice: amount
        }
      });
      
      // Update quote totals based on the item
      await tx.quote.update({
        where: { id: quote.id },
        data: {
          subtotal: amount,
          gstTotal: gst,
          totalAmount: amount + gst
        }
      });

      // 3. Mark Inquiry as Converted and link Quote
      const updatedInquiry = await tx.inquiry.update({
        where: { id: inquiry.id },
        data: { 
          status: InquiryStatus.CONVERTED,
          quoteId: quote.id 
        }
      });

      // 4. Log Activity in Inquiry
      await tx.inquiryActivity.create({
        data: {
          inquiryId: inquiry.id,
          type: InquiryActivityType.QUOTE_CREATED,
          message: `Converted to Quote ${quote.quoteNumber}`,
          userId
        }
      });

      // 5. Log Activity in Quote
      await tx.quoteActivity.create({
        data: {
          quoteId: quote.id,
          userId,
          type: 'NOTE',
          message: `Quote generated from Inquiry ${inquiry.inquiryNumber}`
        }
      });

      return { inquiry: updatedInquiry, quote };
    });
  }
}
