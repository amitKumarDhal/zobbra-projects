import { Request, Response } from 'express';
import { prisma } from '../../config/index.js';
import { Prisma } from '@prisma/client';

export const getTestimonials = async (req: Request, res: Response) => {
  const { page = '1', pageSize = '10', search, status, rating, productId } = req.query;
  
  const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
  const limitNum = Math.max(1, parseInt(String(pageSize), 10) || 10);
  const skip = (pageNum - 1) * limitNum;
  
  const where: Prisma.TestimonialWhereInput = {};
  
  if (status && status !== 'All Status') {
     where.status = status as any;
  }
  
  if (rating && rating !== 'All Ratings') {
     where.rating = parseInt(String(rating), 10);
  }
  
  if (productId && productId !== 'All Products/Services') {
     where.productId = String(productId);
  }
  
  if (search) {
    const s = String(search);
    where.OR = [
      { customerName: { contains: s, mode: 'insensitive' } },
      { companyName: { contains: s, mode: 'insensitive' } },
      { content: { contains: s, mode: 'insensitive' } }
    ];
  }
  
  try {
    const [testimonials, total] = await Promise.all([
      prisma.testimonial.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { name: true } }
        }
      }),
      prisma.testimonial.count({ where })
    ]);
    
    return res.json({
      success: true,
      data: testimonials,
      pagination: {
        page: pageNum,
        pageSize: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getTestimonialStats = async (req: Request, res: Response) => {
  try {
    const [total, published, pending, inactive] = await Promise.all([
      prisma.testimonial.count(),
      prisma.testimonial.count({ where: { status: 'PUBLISHED' } }),
      prisma.testimonial.count({ where: { status: 'PENDING' } }),
      prisma.testimonial.count({ where: { status: 'INACTIVE' } })
    ]);
    
    const aggregations = await prisma.testimonial.aggregate({
      _avg: { rating: true }
    });
    
    // Rating distribution
    const groupedRatings = await prisma.testimonial.groupBy({
      by: ['rating'],
      _count: { rating: true }
    });
    
    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    groupedRatings.forEach(g => {
       ratingDistribution[g.rating] = g._count.rating;
    });
    
    return res.json({
      success: true,
      stats: {
        total,
        published,
        pending,
        inactive,
        averageRating: aggregations._avg.rating || 0,
        ratingDistribution
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getTestimonialById = async (req: Request, res: Response) => {
  try {
    const testimonial = await prisma.testimonial.findUnique({
      where: { id: req.params.id },
      include: {
        customer: { select: { name: true, email: true } },
        company: { select: { name: true } },
        product: { select: { name: true } }
      }
    });
    
    if (!testimonial) {
      return res.status(404).json({ success: false, message: 'Testimonial not found' });
    }
    
    return res.json({ success: true, testimonial });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const createTestimonial = async (req: Request, res: Response) => {
  try {
    const { customerName, companyName, designation, rating, content, avatarUrl, status, isFeatured, customerId, companyId, productId } = req.body;
    
    if (!customerName || !rating || !content) {
      return res.status(400).json({ success: false, message: 'Customer name, rating, and content are required' });
    }
    
    const testimonial = await prisma.testimonial.create({
      data: {
        customerName,
        companyName,
        designation,
        rating: Number(rating),
        content,
        avatarUrl,
        status: status || 'PENDING',
        isFeatured: isFeatured || false,
        customerId: customerId || null,
        companyId: companyId || null,
        productId: productId || null,
        publishedAt: status === 'PUBLISHED' ? new Date() : null,
      }
    });
    
    return res.status(201).json({ success: true, testimonial });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updateTestimonial = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { customerName, companyName, designation, rating, content, avatarUrl, status, isFeatured, customerId, companyId, productId } = req.body;
    
    const existing = await prisma.testimonial.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Testimonial not found' });
    }
    
    const updateData: any = {
      customerName,
      companyName,
      designation,
      rating: rating !== undefined ? Number(rating) : undefined,
      content,
      avatarUrl,
      status,
      isFeatured,
      customerId: customerId || null,
      companyId: companyId || null,
      productId: productId || null,
    };
    
    if (status === 'PUBLISHED' && existing.status !== 'PUBLISHED') {
       updateData.publishedAt = new Date();
    }
    
    const testimonial = await prisma.testimonial.update({
      where: { id },
      data: updateData
    });
    
    return res.json({ success: true, testimonial });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updateTestimonialStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['PENDING', 'PUBLISHED', 'INACTIVE'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    
    const existing = await prisma.testimonial.findUnique({ where: { id } });
    if (!existing) {
       return res.status(404).json({ success: false, message: 'Testimonial not found' });
    }
    
    const updateData: any = { status };
    if (status === 'PUBLISHED' && existing.status !== 'PUBLISHED') {
       updateData.publishedAt = new Date();
    }
    
    const testimonial = await prisma.testimonial.update({
      where: { id },
      data: updateData
    });
    
    return res.json({ success: true, testimonial });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteTestimonial = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.testimonial.delete({ where: { id } });
    return res.json({ success: true, message: 'Testimonial deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
