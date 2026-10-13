import { Response } from 'express';
import { prisma } from '../../config/index.js';
import { AuthRequest, customerOwnershipFilter, isCustomerOwner } from '../../middleware/auth.js';
import { generateQuotePDFBuffer } from '../../utils/pdfGenerator.js';
import { sendQuoteEmail } from '../../utils/email.js';
import { buildWhatsAppClickUrl, generateWhatsAppMessage, WhatsAppTemplateKey } from '../../utils/whatsappTemplates.js';
import { calculateServerPricing, resolveAddonAmount } from './quote-pricing.js';
import { getMinAllowedQty } from '../products/product-config.js';
import { getCustomizerTemplateById, getTemplateCapabilities } from '../products/customizer-templates.js';

// Re-export so existing imports from this module (including tests) still work
export { calculateServerPricing } from './quote-pricing.js';

// -----------------------------------------------------------------------
// NOTE: calculateServerPricing is now imported from ./quote-pricing.ts
//       and re-exported above. Do not duplicate the formula here.
// -----------------------------------------------------------------------

/** New quotes may only be raised against products that are live in the catalog. */
const ORDERABLE_PRODUCT = { isActive: true, NOT: { slug: { contains: '-deleted-' } } };

/** The free gift a product gives at this quantity, if any. */
const resolveFreeGiftTitle = (product: { freeGift?: unknown }, quantity: number): string | null => {
  const gift = product.freeGift as { enabled?: boolean; title?: string; minQuantity?: number | null } | null;
  if (!gift?.enabled || !gift.title) return null;
  if (gift.minQuantity && quantity < gift.minQuantity) return null;
  return gift.title;
};

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
        OR: customerOwnershipFilter(req.user)
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
        items: { include: { product: true, variants: true } },
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
    baseWhere.OR = customerOwnershipFilter(req.user);
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
      items: { include: { product: true, variants: true } },
      inquiry: { select: { id: true, inquiryNumber: true } },
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
  if (req.user?.role === 'CUSTOMER' && !isCustomerOwner(req.user, quote)) {
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

/**
 * Next quote number for this year. The row count alone repeats an existing (unique) number once
 * any quote has been deleted, so the sequence continues from the highest number already issued.
 */
async function nextQuoteNumber(): Promise<string> {
  const prefix = `ZQB-QT-${new Date().getFullYear()}-`;
  const [count, recent] = await Promise.all([
    prisma.quote.count(),
    prisma.quote.findMany({
      where: { quoteNumber: { startsWith: prefix } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { quoteNumber: true },
    }),
  ]);
  const highest = recent.reduce((max, q) => {
    const seq = parseInt(q.quoteNumber.slice(prefix.length), 10);
    return Number.isFinite(seq) ? Math.max(max, seq) : max;
  }, 0);
  return `${prefix}${String(Math.max(count + 1001, highest + 1)).padStart(4, '0')}`;
}

/**
 * Validates that customizer submission only uses features explicitly enabled for the product
 * and supported by the product's customizer template (Phase 3).
 */
export function validateProductCustomizerFeatures(itemProduct: any, payload: any, item: any = {}): string | null {
  if (!itemProduct || itemProduct.customizationEnabled === false) return null;

  const template = getCustomizerTemplateById(itemProduct.customizerTemplateId);
  const capabilities = getTemplateCapabilities(template, itemProduct);

  const trimEnabled = (itemProduct.trimColorEnabled ?? capabilities.supportsTrimColor) && capabilities.supportsTrimColor;
  const tapingEnabled = (itemProduct.tapingColorEnabled ?? false) && capabilities.supportsTapingColor;
  const backEnabled = (itemProduct.backDesignEnabled ?? capabilities.supportsBack) && capabilities.supportsBack;
  const embroideryEnabled = (itemProduct.embroideryEnabled ?? false) && capabilities.supportsEmbroidery;

  // 1. Trim / Collar / Rib color
  const sendsTrim = Boolean(
    (payload.collarColor && String(payload.collarColor).trim()) ||
    (payload.trimColor && String(payload.trimColor).trim()) ||
    (item.collarColor && String(item.collarColor).trim()) ||
    (item.trimColor && String(item.trimColor).trim())
  );
  if (!trimEnabled && sendsTrim) {
    return `Collar & rib color customization is disabled for '${itemProduct.name}'.`;
  }

  // 2. Taping color
  const sendsTaping = Boolean(
    (payload.tapingColor && String(payload.tapingColor).trim()) ||
    (item.tapingColor && String(item.tapingColor).trim())
  );
  if (!tapingEnabled && sendsTaping) {
    return `Taping color customization is disabled for '${itemProduct.name}'.`;
  }

  // 3. Back design / mockup / preview
  let hasBackCanvas = false;
  const canvasJson = item.canvasStateJson || payload.canvasStateJson;
  if (typeof canvasJson === 'string' && canvasJson.trim()) {
    try {
      const parsed = JSON.parse(canvasJson);
      if (parsed?.back && Array.isArray(parsed.back?.objects) && parsed.back.objects.length > 0) {
        hasBackCanvas = true;
      }
    } catch {}
  }
  const sendsBack = Boolean(
    (typeof payload.previewBackUrl === 'string' && payload.previewBackUrl.trim()) ||
    (typeof item.previewBackUrl === 'string' && item.previewBackUrl.trim()) ||
    hasBackCanvas
  );
  if (!backEnabled && sendsBack) {
    return `Back design is disabled for '${itemProduct.name}'.`;
  }

  // 4. Embroidery option
  const sendsEmbroidery = Boolean(
    payload.embroidery === true ||
    payload.embroideryOption === true ||
    payload.isEmbroidery === true ||
    item.embroidery === true ||
    item.embroideryOption === true ||
    (typeof payload.printingType === 'string' && /embroidery/i.test(payload.printingType)) ||
    (typeof payload.printType === 'string' && /embroidery/i.test(payload.printType)) ||
    (typeof item.printType === 'string' && /embroidery/i.test(item.printType))
  );
  if (!embroideryEnabled && sendsEmbroidery) {
    return `Embroidery option is disabled for '${itemProduct.name}'.`;
  }

  // Check structured customizationRequirements metadata if sent as JSON
  const rawReqs = item.customizationRequirements || payload.customizationRequirements;
  if (typeof rawReqs === 'string' && rawReqs.trim()) {
    try {
      const reqs = JSON.parse(rawReqs);
      if (!trimEnabled && reqs.collarColor && String(reqs.collarColor).trim()) {
        return `Collar & rib color customization is disabled for '${itemProduct.name}'.`;
      }
      if (!tapingEnabled && reqs.tapingColor && String(reqs.tapingColor).trim()) {
        return `Taping color customization is disabled for '${itemProduct.name}'.`;
      }
      if (!backEnabled && (reqs.hasBack === true || (typeof reqs.printPosition === 'string' && /back/i.test(reqs.printPosition)))) {
        return `Back design is disabled for '${itemProduct.name}'.`;
      }
      if (!embroideryEnabled && reqs.embroidery === true) {
        return `Embroidery option is disabled for '${itemProduct.name}'.`;
      }
    } catch {}
  }

  return null;
}

export const createQuote = async (req: AuthRequest, res: Response) => {
  const {
    customerId,
    companyId,
    productId,
    productCategory,
    items,
    quantity = 50,
    color,
    fabric,
    size,
    sizes,
    printingType,
    printPosition,
    printType,
    artworkUrl,
    previewFrontUrl,
    previewBackUrl,
    canvasStateJson,
    customizationRequirements,
    budget,
    deliveryDate,
    customerName,
    companyName,
    phone,
    email,
    location,
    address,
    gstin,
    message,
    notes,
    validDays = 15,
    status,
    addonSelected
  } = req.body;

  const isCustomer = req.user?.role === 'CUSTOMER';

  // A CUSTOMER's identity comes only from their verified JWT — body-supplied
  // customerId/companyId are honoured for staff only.
  let targetCustomerId = isCustomer ? req.user!.id : customerId;
  
  if (!targetCustomerId) {
    return res.status(400).json({ success: false, message: 'Customer ID is required' });
  }

  // Defensive validation: reject embedded base64 data URLs in quotes
  if (
    (typeof artworkUrl === 'string' && artworkUrl.includes('data:image/')) ||
    (typeof previewFrontUrl === 'string' && previewFrontUrl.includes('data:image/')) ||
    (typeof previewBackUrl === 'string' && previewBackUrl.includes('data:image/')) ||
    (typeof canvasStateJson === 'string' && canvasStateJson.includes('data:image/')) ||
    (typeof customizationRequirements === 'string' && customizationRequirements.includes('data:image/'))
  ) {
    return res.status(400).json({
      success: false,
      message: 'Base64 data URLs are not permitted in quotes. Artwork and previews must be uploaded to Cloudinary.',
    });
  }

  // Reject oversized customizationRequirements (> 50 KB)
  if (typeof customizationRequirements === 'string' && customizationRequirements.length > 50000) {
    return res.status(400).json({
      success: false,
      message: 'customizationRequirements payload exceeds the permitted size limit.',
    });
  }

  let resolvedCompanyId = isCustomer ? req.user!.companyId || null : companyId;

  // Update customer and company profile if updated contact details are supplied.
  // Only CUSTOMER records are enriched: staff phones are WhatsApp login identities
  // and may only be changed by an admin (PUT /agents/:id).
  const targetRole = targetCustomerId
    ? (await prisma.user.findUnique({ where: { id: targetCustomerId }, select: { role: true } }))?.role
    : undefined;
  if (targetCustomerId && targetRole === 'CUSTOMER') {
    try {
      const userUpdateData: any = {};
      if (customerName) userUpdateData.name = customerName;
      // Just-in-time profile completion: WhatsApp OTP accounts start without a
      // name; the quote form's contact name fills it in (never overwrites).
      if (!customerName && isCustomer && typeof req.body.name === 'string' && req.body.name.trim()) {
        const current = await prisma.user.findUnique({ where: { id: targetCustomerId }, select: { name: true } });
        if (current && !current.name.trim()) userUpdateData.name = req.body.name.trim().slice(0, 120);
      }
      if (phone) userUpdateData.phone = phone;
      if (location) userUpdateData.location = location;

      if (Object.keys(userUpdateData).length > 0) {
        await prisma.user.update({
          where: { id: targetCustomerId },
          data: userUpdateData,
        });
      }

      const existingUser = await prisma.user.findUnique({
        where: { id: targetCustomerId },
        include: { company: true },
      });

      if (existingUser?.companyId) {
        resolvedCompanyId = existingUser.companyId;

        if (companyName || gstin || address) {
          const companyUpdateData: any = {};
          if (companyName) companyUpdateData.name = companyName;
          if (address) companyUpdateData.address = address;
          if (gstin) {
            const existingWithGstin = await prisma.company.findUnique({ where: { gstin } });
            if (!existingWithGstin || existingWithGstin.id === existingUser.companyId) {
              companyUpdateData.gstin = gstin;
            }
          }

          if (Object.keys(companyUpdateData).length > 0) {
            await prisma.company.update({
              where: { id: existingUser.companyId },
              data: companyUpdateData,
            });
          }
        }
      }
    } catch (_err) {
      // Non-blocking profile enrichment
    }
  }

  const quoteNumber = await nextQuoteNumber();

  let product = null;
  const targetProductId = productId || (items && items[0]?.productId) || productCategory;

  if (targetProductId) {
    // Exact id/slug first; the loose name match only serves requests that send a product name.
    product =
      (await prisma.product.findFirst({
        where: { OR: [{ id: targetProductId }, { slug: targetProductId }] },
        include: { bulkPricing: true },
      })) ||
      (await prisma.product.findFirst({
        where: { ...ORDERABLE_PRODUCT, name: { contains: String(targetProductId), mode: 'insensitive' } },
        include: { bulkPricing: true },
      }));

    if (!product) {
      return res.status(400).json({
        success: false,
        message: `Product '${targetProductId}' could not be resolved in the catalog. Please select or configure a valid product.`,
      });
    }
    if (!product.isActive || product.slug.includes('-deleted-')) {
      return res.status(400).json({
        success: false,
        message: `'${product.name}' is not available for new quotes.`,
      });
    }
  } else {
    product = await prisma.product.findFirst({
      where: ORDERABLE_PRODUCT,
      orderBy: { createdAt: 'asc' },
      include: { bulkPricing: true },
    });

    if (!product) {
      return res.status(400).json({
        success: false,
        message: 'No active products found in the catalog. Please configure products before generating quotes.',
      });
    }
  }

  const hasCustomizerData = Boolean(
    (typeof artworkUrl === 'string' && artworkUrl.trim()) ||
    (typeof previewFrontUrl === 'string' && previewFrontUrl.trim()) ||
    (typeof previewBackUrl === 'string' && previewBackUrl.trim()) ||
    (typeof canvasStateJson === 'string' && canvasStateJson.trim()) ||
    (typeof customizationRequirements === 'string' && customizationRequirements.trim()) ||
    Boolean(req.body.isCustomized) ||
    req.body.source === 'customizer' ||
    Boolean(req.body.collarColor)
  );

  // Step 14 & 15: Server-side validation
  // If customizationEnabled = false, reject customizer-specific data for that product.
  if (product && product.customizationEnabled === false && hasCustomizerData) {
    return res.status(400).json({
      success: false,
      message: `Customization is not enabled for '${product.name}'. Customizer artwork or canvas data cannot be submitted for this product.`,
    });
  }

  // Phase 3: Validate feature flags for primary product
  const primaryFeatureError = validateProductCustomizerFeatures(product, req.body);
  if (primaryFeatureError) {
    return res.status(400).json({
      success: false,
      message: primaryFeatureError,
    });
  }

  const resolvedPrintType = printType || [printingType, printPosition].filter(Boolean).join(' - ') || 'Not provided';
  const resolvedSize = sizes || size || '';
  const resolvedColor = color || '';
  const resolvedQty = Number(quantity) || 50;

  const normalizedItems = Array.isArray(items) && items.length > 0 ? items : [
    {
      productId: product.id,
      printType: resolvedPrintType,
      color: resolvedColor,
      size: resolvedSize,
      quantity: resolvedQty,
    },
  ];

  let subtotal = 0;
  let totalGst = 0;
  let addonAmount = 0;
  let addonTitle: string | null = null;
  let freeGiftTitle: string | null = null;
  const quoteItemsData = [];

  for (const item of normalizedItems) {
    let itemProduct = product;
    if (item.productId && item.productId !== product.id && item.productId !== product.slug) {
       const found = await prisma.product.findFirst({
         where: { OR: [{ id: item.productId }, { slug: item.productId }] },
         include: { bulkPricing: true },
       });
       if (!found) {
         return res.status(400).json({ success: false, message: `Product '${item.productId}' could not be resolved in the catalog.` });
       }
       if (!found.isActive || found.slug.includes('-deleted-')) {
         return res.status(400).json({ success: false, message: `'${found.name}' is not available for new quotes.` });
       }
       itemProduct = found;
    }

    if (itemProduct.customizationEnabled === false) {
      const itemHasCustomizer = Boolean(
        (typeof item.artworkUrl === 'string' && item.artworkUrl.trim()) ||
        (typeof item.canvasStateJson === 'string' && item.canvasStateJson.trim()) ||
        hasCustomizerData
      );
      if (itemHasCustomizer) {
        return res.status(400).json({
          success: false,
          message: `Customization is not enabled for '${itemProduct.name}'. Customizer artwork or canvas data cannot be submitted for this product.`,
        });
      }
    }

    // Phase 3: Validate feature flags for item product
    const itemFeatureError = validateProductCustomizerFeatures(itemProduct, req.body, item);
    if (itemFeatureError) {
      return res.status(400).json({
        success: false,
        message: itemFeatureError,
      });
    }

    const itemQty = Number(item.quantity) || 50;
    const itemPrintType = item.printType || resolvedPrintType;

    // Customers must respect the product's configured minimum; staff may quote any quantity.
    const minAllowedQty = getMinAllowedQty(itemProduct);
    if (isCustomer && itemQty < minAllowedQty) {
      return res.status(400).json({
        success: false,
        message: `Minimum order quantity for '${itemProduct.name}' is ${minAllowedQty}.`,
      });
    }

    // The offer addon and free gift belong to the quote's primary product and are resolved from
    // the stored product configuration, never from client-supplied amounts.
    const isPrimary = quoteItemsData.length === 0;
    const itemAddonAmount = isPrimary ? resolveAddonAmount(itemProduct.offerAddon, Boolean(addonSelected), itemQty) : 0;
    if (isPrimary) {
      addonAmount = itemAddonAmount;
      addonTitle = itemAddonAmount > 0 ? String((itemProduct.offerAddon as any)?.title || 'Offer addon') : null;
      freeGiftTitle = resolveFreeGiftTitle(itemProduct, itemQty);
    }

    const pricing = calculateServerPricing(itemProduct.basePrice, itemQty, itemPrintType, itemProduct.gstRate, true, {
      tiers: itemProduct.bulkPricing,
      addonAmount: itemAddonAmount,
    });

    subtotal += pricing.subtotal;
    totalGst += pricing.gstTotal;

    const variants = Array.isArray(item.variants) && item.variants.length > 0 ? item.variants : [{
      color: item.color || resolvedColor,
      size: item.size || resolvedSize,
      quantity: itemQty
    }];

    const variantsTotal = variants.reduce((sum: number, v: any) => sum + (Number(v.quantity) || 0), 0);
    if (variantsTotal !== itemQty) {
      return res.status(400).json({ success: false, message: `Variants total (${variantsTotal}) does not match item quantity (${itemQty}).` });
    }

    quoteItemsData.push({
      productId: itemProduct.id,
      printType: itemPrintType,
      color: item.color || resolvedColor,
      size: item.size || resolvedSize,
      quantity: itemQty,
      unitPrice: pricing.unitPrice,
      totalPrice: pricing.unitPrice * itemQty,
      variants: {
        create: variants.map((v: any) => ({
          color: v.color || null,
          size: v.size || null,
          quantity: Number(v.quantity) || 0
        }))
      }
    });
  }

  const grandTotal = subtotal + totalGst;
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + validDays);
  
  const finalStatus = status || (req.user?.role === 'CUSTOMER' ? 'DRAFT' : 'SENT');

  // Build comprehensive structured specifications note
  const specs = [];
  if (fabric) specs.push(`Fabric: ${fabric}`);
  if (sizes) specs.push(`Sizes: ${sizes}`);
  if (printingType || printPosition) specs.push(`Print: ${[printingType, printPosition].filter(Boolean).join(' - ')}`);
  if (artworkUrl) specs.push(`Artwork: ${artworkUrl}`);
  if (budget) specs.push(`Budget: ${budget}`);
  if (deliveryDate) specs.push(`Delivery Date: ${new Date(deliveryDate).toLocaleDateString('en-IN')}`);
  if (address) specs.push(`Delivery Address: ${address}`);
  if (gstin) specs.push(`GSTIN: ${gstin}`);
  if (customizationRequirements) specs.push(`Customization: ${customizationRequirements}`);
  if (addonTitle) specs.push(`Offer Addon: ${addonTitle} (₹${addonAmount})`);
  if (freeGiftTitle) specs.push(`Free Gift: ${freeGiftTitle}`);
  if (message) specs.push(`Customer Message: ${message}`);
  if (notes && !specs.some(s => s.includes(notes))) specs.push(`Notes: ${notes}`);

  const combinedNotes = specs.length > 0 ? specs.join(' | ') : (notes || undefined);

  const quote = await prisma.quote.create({
    data: {
      quoteNumber,
      customerId: targetCustomerId,
      companyId: resolvedCompanyId,
      status: finalStatus,
      subtotal,
      gstTotal: totalGst,
      discount: 0,
      totalAmount: grandTotal,
      notes: combinedNotes,
      validUntil,
      artworkUrl: artworkUrl || null,
      previewFrontUrl: previewFrontUrl || null,
      previewBackUrl: previewBackUrl || null,
      canvasStateJson: canvasStateJson || null,
      addonTitle,
      addonAmount,
      freeGiftTitle,
      items: { create: quoteItemsData },
      activities: {
        create: {
          userId: req.user?.id || null,
          type: 'STATUS_CHANGE',
          message: 'Quote created via Customer Configurator',
        },
      },
    },
    include: {
      items: { include: { product: true, variants: true } },
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
      where: { id: item.productId },
      include: { bulkPricing: true },
    });

    if (!product) continue;

    const itemQty = Number(item.quantity) || 1;
    const pricing = calculateServerPricing(product.basePrice, itemQty, item.printType || 'Not provided', product.gstRate, true, {
      tiers: product.bulkPricing,
    });

    subtotal += pricing.subtotal;
    totalGst += pricing.gstTotal;

    calculatedItems.push({
      productId: product.id,
      printType: item.printType || 'Not provided',
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

  const quote = await prisma.quote.findUnique({ 
    where: { id },
    include: { items: true }
  });
  if (!quote) {
    return res.status(404).json({ success: false, message: 'Quote not found' });
  }

  if (req.user?.role === 'CUSTOMER') {
    if (!isCustomerOwner(req.user, quote)) {
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

  if (status === 'APPROVED') {
    if (!quote.items || quote.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cannot approve a quote with no items.' });
    }
    if (quote.totalAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Cannot approve a quote with zero total amount.' });
    }
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
      items: { include: { product: true, variants: true } },
      activities: { include: { user: { select: { id: true, name: true, role: true } } } },
    },
  });

  return res.json({ success: true, quote: updatedQuote });
};

export const editQuote = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { quantity, color, size, printType, notes, isGstApplied, gstRate: reqGstRate, variants } = req.body;

  const quote = await prisma.quote.findUnique({
    where: { id },
    include: { items: { include: { product: { include: { bulkPricing: true } }, variants: true } } },
  });

  if (!quote) return res.status(404).json({ success: false, message: 'Quote not found' });

  if (req.user?.role === 'CUSTOMER') {
    return res.status(403).json({ success: false, message: 'Only Admin/Sales users can edit quote specifications' });
  }

  const firstItem = quote.items[0];
  const newQty = quantity ? Number(quantity) : firstItem?.quantity || 50;
  const newColor = color !== undefined ? color : (firstItem?.color || '');
  const newSize = size !== undefined ? size : (firstItem?.size || '');
  const newPrintType = printType || firstItem?.printType || 'Not provided';

  const product = firstItem?.product;
  if (!product) {
    return res.status(400).json({
      success: false,
      message: 'Quote item does not have an associated product configured.',
    });
  }
  const basePrice = product.basePrice;
  
  // Resolve GST logic
  const finalIsGstApplied = isGstApplied !== undefined ? Boolean(isGstApplied) : quote.isGstApplied;
  let finalGstRate = reqGstRate !== undefined ? Number(reqGstRate) : quote.gstRate;
  if (finalGstRate === null || finalGstRate === undefined) {
    finalGstRate = product?.gstRate || 5.0;
  }

  // An addon the customer opted into stays on the quote; a per-piece addon follows the new quantity.
  const addonAmount = quote.addonAmount > 0 ? resolveAddonAmount(product.offerAddon, true, newQty) || quote.addonAmount : 0;
  const pricing = calculateServerPricing(basePrice, newQty, newPrintType, finalGstRate, finalIsGstApplied, {
    tiers: product.bulkPricing,
    addonAmount,
  });

  const finalVariants = Array.isArray(variants) ? variants : [];

  if (finalVariants.length > 0) {
    const variantsTotal = finalVariants.reduce((sum: number, v: any) => sum + (Number(v.quantity) || 0), 0);
    if (variantsTotal !== newQty) {
      return res.status(400).json({ success: false, message: `Variants total (${variantsTotal}) does not match item quantity (${newQty}).` });
    }
  }

  if (firstItem) {
    await prisma.quoteItem.update({
      where: { id: firstItem.id },
      data: {
        quantity: newQty,
        color: newColor,
        size: newSize,
        printType: newPrintType,
        unitPrice: pricing.unitPrice,
        totalPrice: pricing.unitPrice * newQty,
        variants: {
          deleteMany: {},
          ...(finalVariants.length > 0 ? {
            create: finalVariants.map((v: any) => ({
              color: v.color || null,
              size: v.size || null,
              quantity: Number(v.quantity) || 0
            }))
          } : {})
        }
      },
    });
  }

  const updatedQuote = await prisma.quote.update({
    where: { id },
    data: {
      subtotal: pricing.subtotal,
      addonAmount,
      isGstApplied: finalIsGstApplied,
      gstRate: finalGstRate,
      gstTotal: pricing.gstTotal,
      discount: 0,
      totalAmount: pricing.totalAmount,
      couponId: null,
      notes: notes || quote.notes,
      activities: {
        create: {
          userId: req.user?.id || null,
          type: 'PRICE_UPDATE',
          message: `Quote specs updated. Quantity: ${newQty}, Print: ${newPrintType}, GST: ${finalIsGstApplied ? finalGstRate+'%' : 'OFF'}. Server recalculated total: ₹${pricing.totalAmount.toLocaleString('en-IN')}`,
        },
      },
    },
    include: {
      customer: { select: { id: true, name: true, email: true, phone: true } },
      company: true,
      items: { include: { product: true, variants: true } },
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
    include: { customer: true, items: { include: { product: true, variants: true } } },
  });

  if (!quote) return res.status(404).json({ success: false, message: 'Quote not found' });

  if (req.user?.role === 'CUSTOMER') {
    return res.status(403).json({ success: false, message: 'Customers cannot trigger sales WhatsApp actions' });
  }

  const firstItem = quote.items[0];
  if (!quote.customer?.phone) {
    return res.status(400).json({
      success: false,
      message: 'Customer phone number is not available for WhatsApp dispatch.',
    });
  }
  const customerPhone = quote.customer.phone;
  const customerName = quote.customer.name;
  const productName = firstItem?.product.name || 'Polo T-Shirts';
  const quantity = firstItem?.quantity || 50;

  const messageText = generateWhatsAppMessage(template as WhatsAppTemplateKey, {
    customerName,
    salesUserName: req.user?.name || 'Zobra Sales',
    quoteNumber: quote.quoteNumber,
    productName,
    quantity,
    printType: firstItem?.printType,
    color: firstItem?.color,
    size: firstItem?.size,
    subtotal: quote.subtotal,
    discount: quote.discount,
    isGstApplied: quote.isGstApplied,
    gstRate: quote.gstRate ?? undefined,
    gstTotal: quote.gstTotal,
    totalAmount: quote.totalAmount,
  });

  if (quote.status === 'DRAFT') {
    await prisma.quote.update({
      where: { id: quote.id },
      data: { status: 'SENT' }
    });
  }

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
    include: { customer: true, company: true, items: { include: { product: true, variants: true } } },
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
    include: { customer: true, company: true, items: { include: { product: true, variants: true } } },
  });

  if (!quote) return res.status(404).json({ success: false, message: 'Quote not found' });

  const customerEmail = quote.customer.email;
  if (!customerEmail) {
    // WhatsApp OTP customers may not have shared an email yet
    return res.status(400).json({
      success: false,
      message: 'This customer has no email address on file. Share the quote via WhatsApp instead.',
    });
  }

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

  await sendQuoteEmail(customerEmail, quote.quoteNumber, pdfBuffer, quote.totalAmount);

  await prisma.quote.update({
    where: { id },
    data: {
      status: 'SENT',
      activities: {
        create: {
          userId: req.user?.id || null,
          type: 'QUOTE_SENT',
          message: `Official quotation email sent to ${customerEmail}`,
        },
      },
    },
  });

  return res.json({ success: true, message: `Quotation email successfully dispatched to ${customerEmail}` });
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
      include: { items: { include: { product: true, variants: true } } }
    });

    if (!quote) return res.status(404).json({ success: false, message: 'Quote not found' });

    // Customer security check
    if (req.user?.role === 'CUSTOMER' && !isCustomerOwner(req.user, quote)) {
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
       include: { customer: true, company: true, items: { include: { product: true, variants: true } }, activities: { include: { user: true }, orderBy: { createdAt: 'asc' } } }
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
        include: { items: { include: { product: true, variants: true } } }
      });
  
      if (!quote) return res.status(404).json({ success: false, message: 'Quote not found' });
  
      if (req.user?.role === 'CUSTOMER' && !isCustomerOwner(req.user, quote)) {
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
         include: { customer: true, company: true, items: { include: { product: true, variants: true } }, activities: { include: { user: true }, orderBy: { createdAt: 'asc' } } }
      });
  
      return res.json({ success: true, message: 'Coupon removed successfully', quote: updatedQuote });
    } catch (error: any) {
       return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * POST /api/v1/quotes/pricing-preview
 *
 * Live server-side pricing estimate for the customer Create Quote form.
 * Accessible to CUSTOMER, ADMIN, and SALES roles (authenticateJWT, no role restriction).
 *
 * The client must NOT use these numbers as final authoritative prices.
 * The actual quote creation recalculates everything from the database.
 */
export const pricingPreview = async (req: AuthRequest, res: Response) => {
  try {
    const { productId, quantity, variants, printType, addonSelected } = req.body;

    if (!productId || typeof productId !== 'string' || !productId.trim()) {
      return res.status(400).json({ success: false, message: 'productId is required' });
    }

    const parsedQty = Number(quantity);
    if (!parsedQty || parsedQty <= 0 || !Number.isInteger(parsedQty)) {
      return res.status(400).json({ success: false, message: 'quantity must be a positive integer greater than zero' });
    }

    if (variants !== undefined && variants !== null) {
      if (!Array.isArray(variants)) {
        return res.status(400).json({ success: false, message: 'variants must be an array' });
      }
      if (variants.length > 0) {
        const variantSum = variants.reduce((sum, v) => sum + (Number(v.quantity) || 0), 0);
        if (variantSum !== parsedQty) {
          return res.status(400).json({
            success: false,
            message: `Variant quantities sum (${variantSum}) must equal total quantity (${parsedQty})`,
          });
        }
      }
    }

    const product = await prisma.product.findFirst({
      where: {
        OR: [
          { id: productId.trim() },
          { slug: productId.trim() },
        ],
        ...ORDERABLE_PRODUCT,
      },
      include: { bulkPricing: true },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product not found or is not active: ${productId}`,
      });
    }

    const minAllowedQty = getMinAllowedQty(product);
    if (req.user?.role === 'CUSTOMER' && parsedQty < minAllowedQty) {
      return res.status(400).json({
        success: false,
        message: `Minimum order quantity for '${product.name}' is ${minAllowedQty}.`,
      });
    }

    if (product.customizationEnabled === false && (req.body.customizationRequirements || req.body.canvasStateJson || req.body.artworkUrl)) {
      return res.status(400).json({
        success: false,
        message: `Customization is not enabled for '${product.name}'.`,
      });
    }

    const pricing = calculateServerPricing(
      product.basePrice,
      parsedQty,
      printType || 'Front Only',
      product.gstRate,
      true,
      {
        tiers: product.bulkPricing,
        addonAmount: resolveAddonAmount(product.offerAddon, Boolean(addonSelected), parsedQty),
      }
    );

    return res.json({
      success: true,
      data: {
        productId: product.id,
        productName: product.name,
        unitPrice: pricing.unitPrice,
        productUnitPrice: pricing.productUnitPrice,
        printSurcharge: pricing.printSurcharge,
        addonAmount: pricing.addonAmount,
        freeGiftTitle: resolveFreeGiftTitle(product, parsedQty),
        subtotal: pricing.subtotal,
        discount: pricing.discount,
        gstRate: pricing.gstRate,
        gstTotal: pricing.gstTotal,
        totalAmount: pricing.totalAmount,
      },
    });
  } catch (error) {
    console.error('[pricingPreview] Error:', error instanceof Error ? error.message : String(error));
    return res.status(500).json({ success: false, message: 'Failed to calculate pricing estimate' });
  }
};
