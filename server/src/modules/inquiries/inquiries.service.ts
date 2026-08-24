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

  // 3. Create a new inquiry
  static async createInquiry(data: {
    customerId?: string;
    companyId?: string;
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
      const inquiry = await tx.inquiry.create({
        data: {
          inquiryNumber,
          ...data,
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
    const [total, newInq, contacted, quoted, converted] = await Promise.all([
      prisma.inquiry.count(),
      prisma.inquiry.count({ where: { status: InquiryStatus.NEW } }),
      prisma.inquiry.count({ where: { status: InquiryStatus.CONTACTED } }),
      prisma.inquiry.count({ where: { status: InquiryStatus.QUOTED } }),
      prisma.inquiry.count({ where: { status: InquiryStatus.CONVERTED } }),
    ]);

    return {
      total,
      new: newInq,
      contacted,
      quoted,
      converted,
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
    if (!customerId) {
      const defaultCustomer = await prisma.user.findFirst({ where: { role: 'CUSTOMER' } });
      customerId = defaultCustomer ? defaultCustomer.id : userId;
    }

    // Generate Quote Number
    const count = await prisma.quote.count();
    const quoteNumber = `ZQB-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 7); // Default valid for 7 days

    return prisma.$transaction(async (tx) => {
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

      // 2. If product is linked, add it as a QuoteItem
      if (inquiry.productId) {
        await tx.quoteItem.create({
          data: {
            quoteId: quote.id,
            productId: inquiry.productId,
            printType: inquiry.printingType || 'Front Only',
            color: inquiry.colors || 'Standard',
            size: 'M', // Default or parse from details
            quantity: inquiry.quantity || 1,
            unitPrice: inquiry.product?.basePrice || 0,
            totalPrice: (inquiry.quantity || 1) * (inquiry.product?.basePrice || 0)
          }
        });
        
        // Update quote totals based on the item
        const amount = (inquiry.quantity || 1) * (inquiry.product?.basePrice || 0);
        const gst = amount * 0.05; // 5% GST default
        await tx.quote.update({
          where: { id: quote.id },
          data: {
            subtotal: amount,
            gstTotal: gst,
            totalAmount: amount + gst
          }
        });
      }

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
