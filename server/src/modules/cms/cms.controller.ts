import { Request, Response } from 'express';
import { prisma } from '../../config/index.js';
import { AuthRequest } from '../../middleware/auth.js';

export const getCMSContent = async (req: Request, res: Response) => {
  const { type } = req.query;

  const where: any = { isPublished: true };
  if (type) where.type = String(type);

  const contents = await prisma.cMSContent.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return res.json({ success: true, contents });
};

export const createCMSContent = async (req: AuthRequest, res: Response) => {
  const { type, title, content, author, image } = req.body;

  const cms = await prisma.cMSContent.create({
    data: {
      type,
      title,
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      content,
      author: author || req.user?.name,
      image,
    },
  });

  return res.status(201).json({ success: true, cms });
};
