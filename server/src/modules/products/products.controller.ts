import { Request, Response } from 'express';
import { prisma } from '../../config/index.js';

export const getProducts = async (req: Request, res: Response) => {
  const { category, search, status, page = '1', pageSize = '10' } = req.query;

  const where: any = {
    AND: [
      { slug: { not: { contains: '-deleted-' } } }
    ]
  };

  if (status === 'All Status') {
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
        { isActive: true },
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

  const cleanedVariants = variants && variants.length > 0 ? variants.map((v: any) => ({
    color: v.color,
    size: v.size,
    sku: v.sku,
    stock: parseInt(v.stock, 10) || 0,
  })) : undefined;

  const cleanedPricing = bulkPricing && bulkPricing.length > 0 ? bulkPricing.map((p: any) => ({
    minQuantity: parseInt(p.minQuantity, 10),
    maxQuantity: parseInt(p.maxQuantity, 10),
    pricePerUnit: parseFloat(p.pricePerUnit),
    printType: p.printType || 'Front Only',
  })) : undefined;

  const product = await prisma.product.create({
    data: {
      name,
      slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      hsnCode: hsnCode || '6109',
      gstRate: gstRate ? parseFloat(gstRate) : 5.0,
      description,
      basePrice: parseFloat(basePrice),
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
};

export const updateProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, slug, hsnCode, gstRate, description, basePrice, images, categoryId, bulkPricing, variants, isActive, requiresSize, requiresColor } = req.body;

  // For nested updates: Delete all existing and recreate them
  if (variants || bulkPricing) {
    await prisma.$transaction([
       ...(variants ? [prisma.productVariant.deleteMany({ where: { productId: id } })] : []),
       ...(bulkPricing ? [prisma.bulkPricing.deleteMany({ where: { productId: id } })] : [])
    ]);
  }

  const cleanedVariants = variants && variants.length > 0 ? variants.map((v: any) => ({
    color: v.color,
    size: v.size,
    sku: v.sku,
    stock: parseInt(v.stock, 10) || 0,
  })) : undefined;

  const cleanedPricing = bulkPricing && bulkPricing.length > 0 ? bulkPricing.map((p: any) => ({
    minQuantity: parseInt(p.minQuantity, 10),
    maxQuantity: parseInt(p.maxQuantity, 10),
    pricePerUnit: parseFloat(p.pricePerUnit),
    printType: p.printType || 'Front Only',
  })) : undefined;

  const product = await prisma.product.update({
    where: { id },
    data: {
      name,
      slug,
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

  return res.json({ success: true, product });
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
