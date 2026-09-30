import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/index.js';
import type { AuthRequest } from '../../middleware/auth.js';

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
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'A product with this slug/SKU already exists. Please use a different SKU or name.',
      });
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

  return res.json({
    success: true,
    data: products,
    products,
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

  return res.json({ success: true, data: product, product });
};

export const createProduct = async (req: Request, res: Response) => {
  const { name, slug, hsnCode, gstRate, description, basePrice, images, categoryId, bulkPricing, variants, isActive, requiresSize, requiresColor } = req.body;

  const cleanedPricing = bulkPricing && bulkPricing.length > 0 ? bulkPricing.map((p: any) => ({
    minQuantity: parseInt(p.minQuantity, 10),
    maxQuantity: parseInt(p.maxQuantity, 10),
    pricePerUnit: parseFloat(p.pricePerUnit),
    printType: p.printType || 'Front Only',
  })) : undefined;

  const price = parseFloat(basePrice);
  const finalSlug = resolveProductSlug(slug, name);
  const cleanedVariants = cleanVariants(variants, finalSlug);
  if (!name || !String(name).trim() || !categoryId || !finalSlug || !Number.isFinite(price)) {
    return res.status(400).json({
      success: false,
      message: 'Product name, category and a valid base price are required.',
    });
  }

  try {
    const product = await prisma.product.create({
      data: {
        name,
        slug: finalSlug,
        hsnCode: hsnCode || '6109',
        gstRate: gstRate ? parseFloat(gstRate) : 5.0,
        description: description ?? '',
        basePrice: price,
        images: images || [],
        categoryId,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        requiresSize: requiresSize !== undefined ? Boolean(requiresSize) : true,
        requiresColor: requiresColor !== undefined ? Boolean(requiresColor) : true,
        bulkPricing: cleanedPricing ? { createMany: { data: cleanedPricing } } : undefined,
        variants: cleanedVariants ? { createMany: { data: cleanedVariants } } : undefined,
      },
      include: { category: true, bulkPricing: true, variants: true },
    });

    return res.status(201).json({ success: true, product });
  } catch (err) {
    return sendProductWriteError(res, err, 'create');
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, slug, hsnCode, gstRate, description, basePrice, images, categoryId, bulkPricing, variants, isActive, requiresSize, requiresColor } = req.body;

  const cleanedPricing = bulkPricing && bulkPricing.length > 0 ? bulkPricing.map((p: any) => ({
    minQuantity: parseInt(p.minQuantity, 10),
    maxQuantity: parseInt(p.maxQuantity, 10),
    pricePerUnit: parseFloat(p.pricePerUnit),
    printType: p.printType || 'Front Only',
  })) : undefined;

  if (slug !== undefined && !String(slug).trim()) {
    return res.status(400).json({ success: false, message: 'Slug/SKU cannot be empty.' });
  }

  try {
    // Nested lists are replaced (delete + recreate). One transaction, so a failed update
    // (e.g. slug conflict) cannot leave the product without its variants/pricing.
    const product = await prisma.$transaction(async (tx) => {
      let cleanedVariants: ReturnType<typeof cleanVariants>;
      if (variants) {
        const skuSlug =
          slug !== undefined
            ? String(slug).trim()
            : (await tx.product.findUniqueOrThrow({ where: { id }, select: { slug: true } })).slug;
        cleanedVariants = cleanVariants(variants, skuSlug);
        await tx.productVariant.deleteMany({ where: { productId: id } });
      }
      if (bulkPricing) await tx.bulkPricing.deleteMany({ where: { productId: id } });

      return tx.product.update({
        where: { id },
        data: {
          name,
          slug: slug !== undefined ? String(slug).trim() : undefined,
          hsnCode,
          description,
          basePrice: basePrice ? parseFloat(basePrice) : undefined,
          gstRate: gstRate ? parseFloat(gstRate) : undefined,
          images,
          categoryId,
          isActive: isActive !== undefined ? Boolean(isActive) : undefined,
          requiresSize: requiresSize !== undefined ? Boolean(requiresSize) : undefined,
          requiresColor: requiresColor !== undefined ? Boolean(requiresColor) : undefined,
          bulkPricing: cleanedPricing ? { createMany: { data: cleanedPricing } } : undefined,
          variants: cleanedVariants ? { createMany: { data: cleanedVariants } } : undefined,
        },
        include: { category: true, bulkPricing: true, variants: true }
      });
    });

    return res.json({ success: true, product });
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
