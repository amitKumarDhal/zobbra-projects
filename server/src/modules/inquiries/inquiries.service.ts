import { Inquiry, InquiryActivity, InquiryStatus, InquirySource, InquiryActivityType, Prisma } from '@prisma/client';
import { prisma } from '../../config/index.js';

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

    const where: Prisma.InquiryWhereInput = {
      AND: [
        // Exclude inquiries that have already been converted to an order
        {
          OR: [
            { quoteId: null },
            { quote: { order: null } },
          ],
        },
      ],
    };

    if (params.status) where.status = params.status;
    if (params.source) where.source = params.source;
    if (params.assignedToId) where.assignedToId = params.assignedToId;
    if (params.customerId) where.customerId = params.customerId;

    if (params.search) {
      (where.AND as Prisma.InquiryWhereInput[]).push({
        OR: [
          { inquiryNumber: { contains: params.search, mode: 'insensitive' } },
          { message: { contains: params.search, mode: 'insensitive' } },
          { customer: { name: { contains: params.search, mode: 'insensitive' } } },
          { customer: { email: { contains: params.search, mode: 'insensitive' } } },
          { customer: { phone: { contains: params.search, mode: 'insensitive' } } },
          { company: { name: { contains: params.search, mode: 'insensitive' } } },
        ],
      });
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
          product: { select: { id: true, name: true, slug: true, category: { select: { name: true } } } },
          assignedTo: { select: { id: true, name: true } },
          quote: { select: { id: true, status: true, order: { select: { id: true, orderNumber: true } } } },
          variants: true,
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
        product: { include: { category: true } },
        assignedTo: { select: { id: true, name: true, email: true, phone: true } },
        quote: {
          include: {
            order: { select: { id: true, orderNumber: true, status: true } },
            items: {
              include: {
                product: true,
                variants: true,
              },
            },
            activities: {
              orderBy: { createdAt: 'desc' },
              include: {
                user: { select: { id: true, name: true } },
              },
            },
          },
        },
        variants: true,
        activities: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  static async getUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { company: true }
    });
  }

  static async createInquiry(data: {
    customerId?: string;
    companyId?: string;
    customerName?: string;
    companyName?: string;
    email?: string;
    phone?: string;
    location?: string;
    productId?: string;
    productInterest?: string;
    quantity?: number;
    printingType?: string;
    printPosition?: string;
    colors?: string;
    sizes?: string;
    artworkUrl?: string;
    deliveryDate?: Date;
    budget?: string;
    customizationRequirements?: string;
    source?: InquirySource;
    message?: string;
    assignedToId?: string;
    nextFollowUpAt?: Date;
    variants?: { color?: string; size?: string; quantity: number }[];
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
          variants: data.variants ? {
            create: data.variants.map((v) => ({
              color: v.color || null,
              size: v.size || null,
              quantity: v.quantity
            }))
          } : undefined,
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
    const baseWhere: Prisma.InquiryWhereInput = {
      OR: [
        { quoteId: null },
        { quote: { order: null } },
      ],
    };

    const [total, newInq, contacted, quoted, converted, registered, guest] = await Promise.all([
      prisma.inquiry.count({ where: baseWhere }),
      prisma.inquiry.count({ where: { ...baseWhere, status: InquiryStatus.NEW } }),
      prisma.inquiry.count({ where: { ...baseWhere, status: InquiryStatus.CONTACTED } }),
      prisma.inquiry.count({ where: { ...baseWhere, status: InquiryStatus.QUOTED } }),
      prisma.inquiry.count({ where: { ...baseWhere, status: InquiryStatus.CONVERTED } }),
      prisma.inquiry.count({ where: { ...baseWhere, customerType: 'REGISTERED' } }),
      prisma.inquiry.count({ where: { ...baseWhere, customerType: 'GUEST' } }),
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
      include: { customer: true, company: true, product: true, variants: true }
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
        throw new Error('Cannot convert inquiry to quote: Customer account could not be resolved.');
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
          artworkUrl: inquiry.artworkUrl || null,
        }
      });

      // 2. Resolve Product (Match by productInterest or fallback to first available product)
      let product = inquiry.product;
      let productId = inquiry.productId;
      if (!product || !productId) {
        if (inquiry.productInterest) {
          const matchingProduct = await tx.product.findFirst({
            where: {
              OR: [
                { name: { contains: inquiry.productInterest, mode: 'insensitive' } },
                { slug: { contains: inquiry.productInterest.toLowerCase().replace(/[^a-z0-9]/g, '-'), mode: 'insensitive' } },
                { category: { name: { contains: inquiry.productInterest, mode: 'insensitive' } } }
              ]
            }
          });
          if (matchingProduct) {
            product = matchingProduct;
            productId = matchingProduct.id;
          }
        }

        if (!product || !productId) {
          throw new Error(`Cannot convert inquiry to quote: Product '${inquiry.productInterest || 'Not specified'}' could not be resolved from catalog. Please configure or link a product.`);
        }
      }

      const qty = inquiry.quantity || 50;
      const basePrice = product.basePrice;
      const printType = inquiry.printPosition 
        ? `${inquiry.printingType || 'Standard Print'} (${inquiry.printPosition})`
        : (inquiry.printingType || 'Not provided');
      
      // Volume pricing calculation
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

      const quoteItem = await tx.quoteItem.create({
        data: {
          quoteId: quote.id,
          productId: productId,
          printType: printType,
          color: inquiry.colors || '',
          size: inquiry.sizes || '',
          quantity: qty,
          unitPrice: unitPrice,
          totalPrice: amount
        }
      });

      if (inquiry.variants && inquiry.variants.length > 0) {
        await tx.quoteItemVariant.createMany({
          data: inquiry.variants.map((v: any) => ({
            quoteItemId: quoteItem.id,
            color: v.color || null,
            size: v.size || null,
            quantity: Number(v.quantity) || 0,
          })),
        });
      }
      
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
    }, { maxWait: 15000, timeout: 30000 });
  }

  // 9. Update Inquiry Specifications and Linked Quote
  static async updateInquiry(id: string, data: any, userId?: string) {
    const existing = await prisma.inquiry.findUnique({
      where: { id },
      include: {
        quote: {
          include: {
            items: {
              include: { product: true }
            }
          }
        },
        variants: true
      }
    });
    if (!existing) throw new Error('Inquiry not found');

    const qty = data.quantity !== undefined ? Number(data.quantity) : existing.quantity;

    // Validate variants total if provided
    if (data.variants && Array.isArray(data.variants) && data.variants.length > 0) {
      const vSum = data.variants.reduce((acc: number, v: any) => acc + (Number(v.quantity) || 0), 0);
      if (qty && vSum !== qty) {
        throw new Error(`Variant breakdown sum (${vSum}) must match total quantity (${qty}).`);
      }
    }

    await prisma.$transaction(async (tx) => {
      // 0. Update Product Name if provided
      const resolvedProductName = data.productName ? data.productName.trim() : undefined;
      let effectiveProductId = existing.productId;

      if (resolvedProductName) {
        if (effectiveProductId) {
          await tx.product.update({
            where: { id: effectiveProductId },
            data: { name: resolvedProductName }
          });
        } else {
          // If no product linked yet, check if one matches or create one
          const matchingProduct = await tx.product.findFirst({
            where: {
              OR: [
                { name: { equals: resolvedProductName, mode: 'insensitive' } },
                { slug: { equals: resolvedProductName.toLowerCase().replace(/[^a-z0-9]/g, '-'), mode: 'insensitive' } }
              ]
            }
          });
          if (matchingProduct) {
            effectiveProductId = matchingProduct.id;
          } else {
            const firstCategory = await tx.category.findFirst();
            if (firstCategory) {
              const newProd = await tx.product.create({
                data: {
                  name: resolvedProductName,
                  slug: resolvedProductName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now().toString().slice(-4),
                  description: resolvedProductName,
                  categoryId: firstCategory.id,
                  basePrice: Number(data.unitPrice) || 249,
                  gstRate: 5.0,
                }
              });
              effectiveProductId = newProd.id;
            }
          }
        }

        // Also update linked quote item product if it has a different product ID
        if (existing.quote?.items?.[0]?.productId && existing.quote.items[0].productId !== effectiveProductId) {
          await tx.product.update({
            where: { id: existing.quote.items[0].productId },
            data: { name: resolvedProductName }
          });
        }
      }

      // 1. Update Inquiry Core Fields
      await tx.inquiry.update({
        where: { id },
        data: {
          productId: effectiveProductId || existing.productId,
          productInterest: resolvedProductName || (data.productInterest !== undefined ? data.productInterest : existing.productInterest),
          quantity: qty,
          printingType: data.printPosition !== undefined ? (data.printPosition || null) : (data.printingType !== undefined ? data.printingType : existing.printingType),
          printPosition: data.printPosition !== undefined ? (data.printPosition || null) : existing.printPosition,
          colors: data.colors !== undefined ? data.colors : existing.colors,
          sizes: data.sizes !== undefined ? data.sizes : existing.sizes,
          budget: data.budget !== undefined ? data.budget : existing.budget,
          message: data.message !== undefined ? data.message : existing.message,
          customizationRequirements: data.customizationRequirements !== undefined ? data.customizationRequirements : existing.customizationRequirements,
          customerName: data.customerName !== undefined ? data.customerName : existing.customerName,
          companyName: data.companyName !== undefined ? data.companyName : existing.companyName,
          phone: data.phone !== undefined ? data.phone : existing.phone,
          email: data.email !== undefined ? data.email : existing.email,
          location: data.location !== undefined ? data.location : existing.location,
          status: data.status !== undefined ? data.status : existing.status,
        },
      });

      // 2. Update Inquiry Variants
      if (data.variants && Array.isArray(data.variants)) {
        await tx.inquiryVariant.deleteMany({ where: { inquiryId: id } });
        if (data.variants.length > 0) {
          await tx.inquiryVariant.createMany({
            data: data.variants.map((v: any) => ({
              inquiryId: id,
              color: v.color || null,
              size: v.size || null,
              quantity: Number(v.quantity) || 0,
            })),
          });
        }
      }

      // 3. If linked quote exists, synchronize quote item and pricing
      if (existing.quoteId && existing.quote && existing.quote.items.length > 0) {
        const quoteItem = existing.quote.items[0];
        const isGstApplied = data.isGstApplied !== undefined ? Boolean(data.isGstApplied) : existing.quote.isGstApplied;
        const gstRate = data.gstRate !== undefined ? Number(data.gstRate) : (existing.quote.gstRate || quoteItem.product?.gstRate || 5.0);
        const unitPrice = data.unitPrice !== undefined ? Number(data.unitPrice) : quoteItem.unitPrice;
        const itemQuantity = qty || quoteItem.quantity;
        const subtotal = itemQuantity * unitPrice;
        const gstTotal = isGstApplied ? Math.round(subtotal * (gstRate / 100)) : 0;
        const totalAmount = subtotal + gstTotal;

        await tx.quoteItem.update({
          where: { id: quoteItem.id },
          data: {
            productId: effectiveProductId || quoteItem.productId,
            quantity: itemQuantity,
            unitPrice: unitPrice,
            totalPrice: subtotal,
            printType: data.printPosition !== undefined ? (data.printPosition || 'Not provided') : (data.printingType || quoteItem.printType),
            color: data.colors || quoteItem.color,
            size: data.sizes || quoteItem.size,
          },
        });

        // Update quote variants
        if (data.variants && Array.isArray(data.variants)) {
          await tx.quoteItemVariant.deleteMany({ where: { quoteItemId: quoteItem.id } });
          if (data.variants.length > 0) {
            await tx.quoteItemVariant.createMany({
              data: data.variants.map((v: any) => ({
                quoteItemId: quoteItem.id,
                color: v.color || null,
                size: v.size || null,
                quantity: Number(v.quantity) || 0,
              })),
            });
          }
        }

        await tx.quote.update({
          where: { id: existing.quoteId },
          data: {
            subtotal,
            gstTotal,
            totalAmount,
            isGstApplied,
            gstRate,
          },
        });
      }

      // 4. Activity Log
      await tx.inquiryActivity.create({
        data: {
          inquiryId: id,
          type: InquiryActivityType.NOTE,
          message: `Inquiry details updated by admin`,
          userId,
        },
      });
    }, { maxWait: 15000, timeout: 30000 });

    return this.getInquiryById(id);
  }

  // 10. One-click Approve Inquiry
  static async approveInquiry(id: string, userId: string) {
    let inquiry = await prisma.inquiry.findUnique({
      where: { id },
      include: { quote: true },
    });
    if (!inquiry) throw new Error('Inquiry not found');

    if (!inquiry.quoteId) {
      await this.convertToQuote(id, userId);
      inquiry = await prisma.inquiry.findUnique({
        where: { id },
        include: { quote: true },
      });
    }

    if (inquiry?.quoteId) {
      await prisma.quote.update({
        where: { id: inquiry.quoteId },
        data: { status: 'APPROVED' },
      });
    }

    await prisma.inquiry.update({
      where: { id },
      data: { status: InquiryStatus.CONVERTED },
    });

    await prisma.inquiryActivity.create({
      data: {
        inquiryId: id,
        type: InquiryActivityType.STATUS_CHANGE,
        message: 'Inquiry and Quote approved by Admin',
        userId,
      },
    });

    return this.getInquiryById(id);
  }

  // 11. One-click Reject Inquiry
  static async rejectInquiry(id: string, reason?: string, userId?: string) {
    const inquiry = await prisma.inquiry.findUnique({
      where: { id },
      include: { quote: true },
    });
    if (!inquiry) throw new Error('Inquiry not found');

    if (inquiry.quoteId) {
      await prisma.quote.update({
        where: { id: inquiry.quoteId },
        data: { status: 'REJECTED' },
      });
    }

    await prisma.inquiry.update({
      where: { id },
      data: { status: InquiryStatus.LOST },
    });

    await prisma.inquiryActivity.create({
      data: {
        inquiryId: id,
        type: InquiryActivityType.STATUS_CHANGE,
        message: `Inquiry rejected${reason ? ': ' + reason : ''}`,
        userId,
      },
    });

    return this.getInquiryById(id);
  }
}
