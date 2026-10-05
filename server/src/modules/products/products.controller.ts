import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/index.js';
import type { AuthRequest } from '../../middleware/auth.js';
import {
  ProductValidationError,
  ReviewStats,
  normalizePricingRanges,
  normalizeProductConfig,
  toAdminProduct,
  toPublicProduct,
} from './product-config.js';
import {
  listCustomizerTemplates,
  listCustomizerTemplatesAsync,
  getCustomizerTemplateByIdAsync,
  createCustomizerTemplate,
  updateCustomizerTemplate,
  setCustomizerTemplateActive,
} from './customizer-templates.js';

/** Only staff may see hidden (isActive=false) products; guests and customers see active ones only. */
const canSeeHiddenProducts = (req: Request) => {
  const role = (req as AuthRequest).user?.role;
  return role === 'ADMIN' || role === 'SALES';
};

/** URL-safe slug derived from a product name: lowercase, hyphen-separated, no edge hyphens. */
export const slugFromName = (value: string) =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/**
 * An explicit slug/SKU keeps the admin's casing (e.g. "PL-RN345"); whitespace becomes hyphens.
 * Without one, the slug is derived from the name.
 */
export const resolveProductSlug = (slug: unknown, name: unknown) => {
  const explicit = typeof slug === 'string' ? slug.trim().replace(/\s+/g, '-') : '';
  return explicit || slugFromName(String(name ?? ''));
};

/** A slug is part of the product URL: letters, digits, dot, underscore and hyphen only. */
const assertValidSlug = (slug: string) => {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(slug) || slug.includes('-deleted-')) {
    throw new ProductValidationError('Slug may only contain letters, numbers and hyphens (e.g. classic-cotton-cap).');
  }
};

/** Slugs are unique regardless of casing, so "Cap-1" and "cap-1" cannot both exist. */
const slugTaken = async (slug: string, exceptId?: string) =>
  Boolean(
    await prisma.product.findFirst({
      where: { slug: { equals: slug, mode: 'insensitive' }, ...(exceptId ? { id: { not: exceptId } } : {}) },
      select: { id: true },
    })
  );

const SLUG_CONFLICT_MESSAGE = 'A product with this slug/SKU already exists. Please use a different SKU or name.';

/** One variant per colour (and per size when the product asks for a size), for products configured by colours/sizes. */
const variantsFromOptions = (colors: any, sizes: any, requiresSize: boolean) => {
  const colorNames: string[] = (Array.isArray(colors) ? colors : []).map((c: any) => c?.name).filter(Boolean);
  if (colorNames.length === 0) return undefined;
  const sizeNames: string[] = requiresSize && Array.isArray(sizes) && sizes.length > 0 ? sizes : ['Free Size'];
  return colorNames.flatMap((color) => sizeNames.map((size) => ({ color, size, sku: '', stock: 0 })));
};

/** Average rating and count of PUBLISHED testimonials per product (the "actual reviews"). */
const loadReviewStats = async (productIds: string[]): Promise<Map<string, ReviewStats>> => {
  const stats = new Map<string, ReviewStats>();
  if (productIds.length === 0) return stats;
  const rows = await prisma.testimonial.groupBy({
    by: ['productId'],
    where: { productId: { in: productIds }, status: 'PUBLISHED' },
    _avg: { rating: true },
    _count: { _all: true },
  });
  for (const row of rows) {
    if (!row.productId) continue;
    stats.set(row.productId, {
      rating: row._avg.rating != null ? Math.round(row._avg.rating * 10) / 10 : null,
      reviewCount: row._count._all,
    });
  }
  return stats;
};

/** Staff get the stored record; everyone else gets the customer-facing shape without internal fields. */
const serializeFor = (req: Request, product: any, reviews?: ReviewStats) =>
  canSeeHiddenProducts(req) ? toAdminProduct(product, reviews) : toPublicProduct(product, reviews);

/**
 * Variant SKUs are globally unique. A blank SKU is generated from the product slug + color + size,
 * so two products can share a variant template (e.g. "Charcoal Black / Free Size") without clashing.
 * Explicit SKUs are kept as entered.
 */
export const cleanVariants = (variants: any[] | undefined, productSlug: string) => {
  if (!variants || variants.length === 0) return undefined;
  const seen = new Set<string>();
  return variants.map((v: any) => {
    let sku = typeof v.sku === 'string' ? v.sku.trim() : '';
    if (!sku) {
      const base = `${productSlug}-${v.color ?? ''}-${v.size ?? ''}`
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      sku = base;
      for (let n = 2; seen.has(sku); n++) sku = `${base}-${n}`;
    }
    seen.add(sku);
    return { color: v.color, size: v.size, sku, stock: parseInt(v.stock, 10) || 0 };
  });
};

/** Maps Prisma write failures to a JSON response instead of leaving the request hanging. */
const sendProductWriteError = (res: Response, err: unknown, action: string) => {
  if (err instanceof ProductValidationError) {
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({ success: false, message: SLUG_CONFLICT_MESSAGE });
    }
    if (err.code === 'P2003') {
      return res.status(400).json({ success: false, message: 'Invalid category selected.' });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
  }
  console.error(`[products] Failed to ${action} product:`, err);
  return res.status(500).json({ success: false, message: `Failed to ${action} product` });
};

export const getProducts = async (req: Request, res: Response) => {
  const { category, search, status, page = '1', pageSize = '10' } = req.query;

  const where: any = {
    AND: [
      { slug: { not: { contains: '-deleted-' } } }
    ]
  };

  if (!canSeeHiddenProducts(req)) {
    // Public catalog: the status filter is an admin-only control.
    where.isActive = true;
  } else if (status === 'All Status') {
    // Do not filter by isActive
  } else if (status === 'Draft') {
    where.isActive = false;
  } else {
    // Default to 'Active'
    where.isActive = true;
  }

  if (category && category !== 'All Categories' && category !== 'all') {
    let catSlug = String(category);
    if (catSlug === 'custom-t-shirts') catSlug = 't-shirts';
    if (catSlug === 'headwear') catSlug = 'caps';
    where.category = { slug: catSlug };
  }

  if (search) {
    const searchStr = String(search);
    where.AND.push({
      OR: [
        { name: { contains: searchStr, mode: 'insensitive' } },
        { description: { contains: searchStr, mode: 'insensitive' } },
        { slug: { contains: searchStr, mode: 'insensitive' } },
        { variants: { some: { sku: { contains: searchStr, mode: 'insensitive' } } } },
      ]
    });
  }

  const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
  const limitNum = Math.max(1, parseInt(String(pageSize), 10) || 10);
  const skip = (pageNum - 1) * limitNum;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limitNum,
      include: {
        category: true,
        bulkPricing: { orderBy: { minQuantity: 'asc' } },
        variants: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.count({ where }),
  ]);

  const reviews = await loadReviewStats(products.map((p) => p.id));
  const data = products.map((p) => serializeFor(req, p, reviews.get(p.id)));

  return res.json({
    success: true,
    data,
    products: data,
    pagination: {
      page: pageNum,
      pageSize: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  });
};

export const getProductBySlug = async (req: Request, res: Response) => {
  const { slug } = req.params;

  const product = await prisma.product.findFirst({
    where: {
      AND: [
        { slug: { not: { contains: '-deleted-' } } },
        // Staff can open hidden products (e.g. the admin edit form); the public cannot.
        ...(canSeeHiddenProducts(req) ? [] : [{ isActive: true }]),
        {
          OR: [
            { slug },
            { id: slug },
          ]
        }
      ]
    },
    include: {
      category: true,
      bulkPricing: { orderBy: { minQuantity: 'asc' } },
      variants: true,
    },
  });

  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  const reviews = await loadReviewStats([product.id]);
  const data = serializeFor(req, product, reviews.get(product.id));
  return res.json({ success: true, data, product: data });
};

export const createProduct = async (req: Request, res: Response) => {
  const { name, slug, hsnCode, gstRate, description, basePrice, categoryId, bulkPricing, variants, isActive, requiresSize, requiresColor } = req.body;

  try {
    const price = parseFloat(basePrice);
    const finalSlug = resolveProductSlug(slug, name);
    if (!name || !String(name).trim() || !categoryId || !finalSlug || !Number.isFinite(price) || price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Product name, category and a valid base price are required.',
      });
    }
    assertValidSlug(finalSlug);
    if (await slugTaken(finalSlug)) {
      return res.status(409).json({ success: false, message: SLUG_CONFLICT_MESSAGE });
    }

    const config = normalizeProductConfig(req.body);
    const pricingRanges = normalizePricingRanges(bulkPricing);
    const needsSize = requiresSize !== undefined ? Boolean(requiresSize) : true;
    // Explicit variants win; otherwise they are derived from the configured colours and sizes.
    const cleanedVariants = cleanVariants(
      Array.isArray(variants) && variants.length > 0 ? variants : variantsFromOptions(config.colors, config.sizes, needsSize),
      finalSlug
    );

    // One nested create = one transaction: the product and all its related rows are saved together or not at all.
    const product = await prisma.product.create({
      data: {
        name: String(name).trim(),
        slug: finalSlug,
        hsnCode: hsnCode || '6109',
        gstRate: gstRate ? parseFloat(gstRate) : 5.0,
        description: description ?? '',
        basePrice: price,
        categoryId,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        requiresSize: needsSize,
        requiresColor: requiresColor !== undefined ? Boolean(requiresColor) : true,
        ...config,
        freeGift: config.freeGift ?? Prisma.JsonNull,
        offerAddon: config.offerAddon ?? Prisma.JsonNull,
        stockDeduction: config.stockDeduction ?? Prisma.JsonNull,
        customizerViews: config.customizerViews ?? Prisma.JsonNull,
        bulkPricing: pricingRanges && pricingRanges.length > 0 ? { createMany: { data: pricingRanges } } : undefined,
        variants: cleanedVariants ? { createMany: { data: cleanedVariants } } : undefined,
      },
      include: { category: true, bulkPricing: { orderBy: { minQuantity: 'asc' } }, variants: true },
    });

    return res.status(201).json({ success: true, product: toAdminProduct(product) });
  } catch (err) {
    return sendProductWriteError(res, err, 'create');
  }
};

/** Prisma needs an explicit JsonNull to clear a nullable JSON column. */
const nullableJson = (config: Record<string, any>, key: string) =>
  key in config ? { [key]: config[key] ?? Prisma.JsonNull } : {};

export const updateProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, slug, hsnCode, gstRate, description, basePrice, categoryId, bulkPricing, variants, isActive, requiresSize, requiresColor } = req.body;

  if (slug !== undefined && !String(slug).trim()) {
    return res.status(400).json({ success: false, message: 'Slug/SKU cannot be empty.' });
  }

  try {
    const newSlug = slug !== undefined ? resolveProductSlug(slug, '') : undefined;
    if (newSlug !== undefined) {
      assertValidSlug(newSlug);
      if (await slugTaken(newSlug, id)) {
        return res.status(409).json({ success: false, message: SLUG_CONFLICT_MESSAGE });
      }
    }
    if (name !== undefined && !String(name).trim()) {
      return res.status(400).json({ success: false, message: 'Product name cannot be empty.' });
    }
    let price: number | undefined;
    if (basePrice !== undefined && basePrice !== null && basePrice !== '') {
      price = parseFloat(basePrice);
      if (!Number.isFinite(price) || price <= 0) {
        return res.status(400).json({ success: false, message: 'Base price must be above zero.' });
      }
    }

    const config = normalizeProductConfig(req.body);
    const pricingRanges = normalizePricingRanges(bulkPricing);

    // Nested lists are replaced (delete + recreate). One transaction, so a failed update
    // (e.g. slug conflict) cannot leave the product without its variants/pricing.
    const product = await prisma.$transaction(async (tx) => {
      const existing = await tx.product.findUniqueOrThrow({
        where: { id },
        select: { slug: true, colors: true, sizes: true, requiresSize: true, minOrderQty: true, minSampleQty: true },
      });

      const minOrderQty = config.minOrderQty !== undefined ? config.minOrderQty : existing.minOrderQty;
      const minSampleQty = config.minSampleQty !== undefined ? config.minSampleQty : existing.minSampleQty;
      if (minOrderQty != null && minSampleQty != null && minSampleQty > minOrderQty) {
        throw new ProductValidationError('Min. sample qty cannot be more than the min. order qty.');
      }

      // Variants follow the colour/size configuration unless the request lists them explicitly.
      const needsSize = requiresSize !== undefined ? Boolean(requiresSize) : existing.requiresSize;
      const optionsChanged = config.colors !== undefined || config.sizes !== undefined;
      const nextVariants = Array.isArray(variants)
        ? variants
        : optionsChanged
          ? variantsFromOptions(config.colors ?? existing.colors, config.sizes ?? existing.sizes, needsSize)
          : undefined;

      let cleanedVariants: ReturnType<typeof cleanVariants>;
      if (nextVariants) {
        cleanedVariants = cleanVariants(nextVariants, newSlug ?? existing.slug);
        await tx.productVariant.deleteMany({ where: { productId: id } });
      }
      if (pricingRanges) await tx.bulkPricing.deleteMany({ where: { productId: id } });

      return tx.product.update({
        where: { id },
        data: {
          name: name !== undefined ? String(name).trim() : undefined,
          slug: newSlug,
          hsnCode,
          description,
          basePrice: price,
          gstRate: gstRate ? parseFloat(gstRate) : undefined,
          categoryId,
          isActive: isActive !== undefined ? Boolean(isActive) : undefined,
          requiresSize: requiresSize !== undefined ? Boolean(requiresSize) : undefined,
          requiresColor: requiresColor !== undefined ? Boolean(requiresColor) : undefined,
          ...config,
          ...nullableJson(config, 'freeGift'),
          ...nullableJson(config, 'offerAddon'),
          ...nullableJson(config, 'stockDeduction'),
          ...nullableJson(config, 'customizerViews'),
          bulkPricing: pricingRanges && pricingRanges.length > 0 ? { createMany: { data: pricingRanges } } : undefined,
          variants: cleanedVariants ? { createMany: { data: cleanedVariants } } : undefined,
        },
        include: { category: true, bulkPricing: { orderBy: { minQuantity: 'asc' } }, variants: true }
      });
    });

    return res.json({ success: true, product: toAdminProduct(product) });
  } catch (err) {
    return sendProductWriteError(res, err, 'update');
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  const { id } = req.params;

  // 1. Check if it's referenced by any restricted relation (historical records)
  const [quotes, orders, inquiries] = await Promise.all([
    prisma.quoteItem.count({ where: { productId: id } }),
    prisma.orderItem.count({ where: { productId: id } }),
    prisma.inquiry.count({ where: { productId: id } }),
  ]);

  const isReferenced = quotes > 0 || orders > 0 || inquiries > 0;

  if (!isReferenced) {
    // Safe to physically delete
    await prisma.product.delete({ where: { id } });
    return res.json({ success: true, message: 'Product permanently deleted' });
  } else {
    // Fallback: Soft delete by identifying with -deleted- in slug
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    // Only append if not already there
    const newSlug = product.slug.includes('-deleted-')
      ? product.slug
      : `${product.slug}-deleted-${Date.now()}`;

    await prisma.product.update({
      where: { id },
      data: {
        isActive: false,
        slug: newSlug
      },
    });
    return res.json({ success: true, message: 'Product archived (referenced by historical records)' });
  }
};

export const getCategories = async (req: Request, res: Response) => {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
  });
  return res.json({ success: true, categories });
};

export const getProductStats = async (req: Request, res: Response) => {
  const baseWhere = { slug: { not: { contains: '-deleted-' } } };

  const [totalProducts, activeProducts, draftProducts, categories, variants] = await Promise.all([
    prisma.product.count({ where: baseWhere }),
    prisma.product.count({ where: { ...baseWhere, isActive: true } }),
    prisma.product.count({ where: { ...baseWhere, isActive: false } }),
    prisma.category.count(),
    prisma.productVariant.count({ where: { product: baseWhere } }),
  ]);

  return res.json({
    success: true,
    stats: {
      totalProducts,
      activeProducts,
      draftProducts,
      categories,
      variants
    }
  });
};

export const duplicateProduct = async (req: Request, res: Response) => {
  const { id } = req.params;

  const original = await prisma.product.findUnique({
    where: { id },
    include: { bulkPricing: true, variants: true }
  });

  if (!original) return res.status(404).json({ success: false, message: 'Not found' });

  const newSlug = `${original.slug}-copy-${Date.now()}`;

  const product = await prisma.product.create({
    data: {
      name: `${original.name} (Copy)`,
      slug: newSlug,
      hsnCode: original.hsnCode,
      gstRate: original.gstRate,
      description: original.description,
      basePrice: original.basePrice,
      images: original.images,
      categoryId: original.categoryId,
      isActive: false, // Default duplicates to draft
      requiresSize: original.requiresSize,
      requiresColor: original.requiresColor,
      minOrderQty: original.minOrderQty,
      minSampleQty: original.minSampleQty,
      stockCount: original.stockCount,
      ratingOverride: original.ratingOverride,
      reviewCountOverride: original.reviewCountOverride,
      orderMode: original.orderMode,
      customizationEnabled: original.customizationEnabled,
      designerEnabled: original.designerEnabled,
      sizes: original.sizes,
      colors: original.colors ?? [],
      highlights: original.highlights,
      orderImages: original.orderImages ?? [],
      videos: original.videos ?? [],
      freeGift: original.freeGift ?? Prisma.JsonNull,
      offerAddon: original.offerAddon ?? Prisma.JsonNull,
      stockDeduction: original.stockDeduction ?? Prisma.JsonNull,
      customizerViews: original.customizerViews ?? Prisma.JsonNull,
      bulkPricing: original.bulkPricing.length > 0 ? {
        createMany: {
           data: original.bulkPricing.map(bp => ({
              minQuantity: bp.minQuantity,
              maxQuantity: bp.maxQuantity,
              pricePerUnit: bp.pricePerUnit,
              printType: bp.printType
           }))
        }
      } : undefined,
      variants: original.variants.length > 0 ? {
        createMany: {
           data: original.variants.map(v => ({
              color: v.color,
              size: v.size,
              sku: `${v.sku}-COPY-${Math.floor(Math.random()*1000)}`,
              stock: v.stock
           }))
        }
      } : undefined
    }
  });

  return res.json({ success: true, product });
};

export const bulkDeleteProducts = async (req: Request, res: Response) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, message: 'No product IDs provided' });
  }

  try {
    // 1. Batched aggregate: which products are referenced?
    const productCounts = await prisma.product.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        slug: true,
        _count: {
          select: {
            quoteItems: true,
            orderItems: true,
            inquiries: true,
          },
        },
      },
    });

    const deletable: string[] = [];
    const toArchive: { id: string; slug: string }[] = [];

    for (const p of productCounts) {
      const refs = p._count.quoteItems + p._count.orderItems + p._count.inquiries;
      if (refs === 0) {
        deletable.push(p.id);
      } else {
        const newSlug = p.slug.includes('-deleted-') ? p.slug : `${p.slug}-deleted-${Date.now()}`;
        toArchive.push({ id: p.id, slug: newSlug });
      }
    }

    // 2. Batch hard delete
    if (deletable.length > 0) {
      await prisma.product.deleteMany({ where: { id: { in: deletable } } });
    }

    // 3. Batch soft delete
    for (const { id, slug } of toArchive) {
      await prisma.product.update({
        where: { id },
        data: { isActive: false, slug },
      });
    }

    return res.json({
      success: true,
      message: `Deleted ${deletable.length}, Archived ${toArchive.length}`,
      deleted: deletable.length,
      archived: toArchive.length,
      count: deletable.length + toArchive.length,
    });
  } catch (error: any) {
    console.error('Bulk delete error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete products' });
  }
};

export const getCustomizerTemplatesHandler = async (req: Request, res: Response) => {
  const includeInactive = req.query.all === 'true' || canSeeHiddenProducts(req);
  const templates = await listCustomizerTemplatesAsync({ includeInactive });
  return res.json({
    success: true,
    data: templates,
  });
};

export const getCustomizerTemplateByIdHandler = async (req: Request, res: Response) => {
  const { id } = req.params;
  const template = await getCustomizerTemplateByIdAsync(id);
  if (!template) {
    return res.status(404).json({ success: false, message: `Template with ID '${id}' not found.` });
  }
  return res.json({
    success: true,
    data: template,
  });
};

export const createCustomizerTemplateHandler = async (req: Request, res: Response) => {
  try {
    const { id, name } = req.body;
    if (!id || typeof id !== 'string' || !id.trim()) {
      return res.status(400).json({ success: false, message: 'Template ID is required.' });
    }
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Template name is required.' });
    }

    const created = await createCustomizerTemplate(req.body);
    return res.status(201).json({
      success: true,
      message: 'Template created successfully',
      data: created,
    });
  } catch (err: any) {
    const status = err.message?.includes('already exists') ? 409 : 400;
    return res.status(status).json({ success: false, message: err.message || 'Failed to create template' });
  }
};

export const updateCustomizerTemplateHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await updateCustomizerTemplate(id, req.body);
    return res.json({
      success: true,
      message: 'Template updated successfully',
      data: updated,
    });
  } catch (err: any) {
    const status = err.message?.includes('not found') ? 404 : 400;
    return res.status(status).json({ success: false, message: err.message || 'Failed to update template' });
  }
};

export const setCustomizerTemplateStatusHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { active } = req.body;
    if (typeof active !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Field "active" must be a boolean.' });
    }
    const updated = await setCustomizerTemplateActive(id, active);
    return res.json({
      success: true,
      message: `Template ${active ? 'activated' : 'deactivated'} successfully`,
      data: updated,
    });
  } catch (err: any) {
    const status = err.message?.includes('not found') ? 404 : 400;
    return res.status(status).json({ success: false, message: err.message || 'Failed to update template status' });
  }
};

