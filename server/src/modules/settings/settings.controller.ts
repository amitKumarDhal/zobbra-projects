import { Response } from 'express';
import { prisma, config } from '../../config/index.js';
import { AuthRequest } from '../../middleware/auth.js';
import fs from 'fs';
import path from 'path';

export const getSettings = async (req: AuthRequest, res: Response) => {
  const settings = await prisma.systemSetting.findMany();
  return res.json({
    success: true,
    company: config.company,
    cloudinaryConfigured: !!config.cloudinary.cloudName,
    resendConfigured: config.resendApiKey !== 're_mock_key',
    razorpayConfigured: true, // Typically loaded from env
    settings,
  });
};

export const updateSettings = async (req: AuthRequest, res: Response) => {
  const { key, value } = req.body;
  const setting = await prisma.systemSetting.upsert({
    where: { key },
    update: { value: JSON.stringify(value) },
    create: { key, value: JSON.stringify(value) },
  });

  // Log activity
  if (req.user) {
    await prisma.systemActivity.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE_SETTING',
        entityType: 'SystemSetting',
        entityId: setting.id,
        message: `Updated system setting: ${key}`,
      }
    });
  }

  return res.json({ success: true, setting });
};

export const getUsers = async (req: AuthRequest, res: Response) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, phone: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  return res.json({ success: true, users });
};

export const getSystemInfo = async (req: AuthRequest, res: Response) => {
  // Read version from package.json
  let version = 'v1.0.0';
  try {
    const pkgPath = path.resolve(process.cwd(), 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      version = pkg.version ? `v${pkg.version}` : version;
    }
  } catch (err) {}

  return res.json({
    success: true,
    info: {
      version,
      environment: process.env.NODE_ENV || 'Development',
      lastUpdated: new Date().toISOString(),
      serverTime: new Date().toISOString(),
      nodeVersion: process.version,
      database: 'PostgreSQL',
      orm: 'Prisma'
    }
  });
};

export const getHealth = async (req: AuthRequest, res: Response) => {
  try {
    // Ping DB
    await prisma.$queryRaw`SELECT 1`;
    return res.json({
      success: true,
      health: {
        api: 'Healthy',
        database: 'Connected'
      }
    });
  } catch (err) {
    return res.status(503).json({
      success: false,
      health: {
        api: 'Healthy',
        database: 'Disconnected'
      }
    });
  }
};

export const getActivityLog = async (req: AuthRequest, res: Response) => {
  const { page = '1', pageSize = '20' } = req.query;
  const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
  const limitNum = Math.max(1, parseInt(String(pageSize), 10) || 20);
  const skip = (pageNum - 1) * limitNum;

  const [activities, total] = await Promise.all([
    prisma.systemActivity.findMany({
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } }
      }
    }),
    prisma.systemActivity.count()
  ]);

  return res.json({
    success: true,
    activities,
    pagination: {
      page: pageNum,
      pageSize: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  });
};
