import { Request, Response } from 'express';
import { prisma } from '../../config/index.js';

export const getProducts = async (req: Request, res: Response) => {
  const { category, search, status, page = '1', pageSize = '10' } = req.query;

  const where: any = {};
  if (status && status !== 'All Status') {
    where.isActive = status === 'Active';
  }
  if (category && category !== 'All Categories') {
    where.category = { slug: String(category) };
  }
  if (search) {
    const searchStr = String(search);
    where.OR = [
      { name: { contains: searchStr, mode: 'insensitive' } },
      { description: { contains: searchStr, mode: 'insensitive' } },
      { slug: { contains: searchStr, mode: 'insensitive' } },
      { variants: { some: { sku: { contains: searchStr, mode: 'insensitive' } } } },
    ];
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
      OR: [
        { slug },
        { id: slug },
      ],
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
  const { name, slug, hsnCode, gstRate, description, basePrice, images, categoryId, bulkPricing, variants } = req.body;

  const product = await prisma.product.create({
    data: {
      name,
      slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      hsnCode: hsnCode || '6109',
      gstRate: gstRate || 5.0,
      description,
      basePrice: parseFloat(basePrice),
      images: images || [],
      categoryId,
      bulkPricing: bulkPricing ? { createMany: { data: bulkPricing } } : undefined,
      variants: variants ? { createMany: { data: variants } } : undefined,
    },
    include: { category: true, bulkPricing: true, variants: true },
  });

  return res.status(201).json({ success: true, product });
};

export const updateProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, slug, hsnCode, gstRate, description, basePrice, images, categoryId, bulkPricing, variants, isActive } = req.body;

  // For nested updates: Delete all existing and recreate them
  if (variants || bulkPricing) {
    await prisma.$transaction([
       ...(variants ? [prisma.productVariant.deleteMany({ where: { productId: id } })] : []),
       ...(bulkPricing ? [prisma.bulkPricing.deleteMany({ where: { productId: id } })] : [])
    ]);
  }

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
      isActive: isActive !== undefined ? isActive : undefined,
      bulkPricing: bulkPricing ? { createMany: { data: bulkPricing } } : undefined,
      variants: variants ? { createMany: { data: variants } } : undefined,
    },
    include: { category: true, bulkPricing: true, variants: true }
  });

  return res.json({ success: true, product });
};

export const deleteProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.product.update({
    where: { id },
    data: { isActive: false },
  });
  return res.json({ success: true, message: 'Product deactivated' });
};

export const getCategories = async (req: Request, res: Response) => {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
  });
  return res.json({ success: true, categories });
};

export const getProductStats = async (req: Request, res: Response) => {
  const [totalProducts, activeProducts, draftProducts, categories, variants] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.count({ where: { isActive: false } }),
    prisma.category.count(),
    prisma.productVariant.count(),
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
