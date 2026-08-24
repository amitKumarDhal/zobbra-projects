import { Request, Response } from 'express';
import { prisma } from '../../config/index.js';
import { AuthRequest } from '../../middleware/auth.js';

export const createDispatch = async (req: AuthRequest, res: Response) => {
  const { orderId, courierName, trackingNumber, trackingUrl, notes } = req.body;

  const count = await prisma.dispatch.count();
  const shipmentNumber = `SHP-ZB-${new Date().getFullYear()}-${String(count + 1001).padStart(4, '0')}`;

  const dispatch = await prisma.dispatch.create({
    data: {
      orderId,
      shipmentNumber,
      courierName: courierName || 'BlueDart Express',
      trackingNumber,
      trackingUrl: trackingUrl || `https://www.bluedart.com/tracking/${trackingNumber}`,
      status: 'DISPATCHED',
      notes,
    },
    include: { order: true },
  });

  // Update order status
  await prisma.order.update({
    where: { id: orderId },
    data: { status: 'DISPATCHED' },
  });

  return res.status(201).json({ success: true, dispatch });
};

export const getDispatches = async (req: AuthRequest, res: Response) => {
  const dispatches = await prisma.dispatch.findMany({
    include: {
      order: {
        include: {
          customer: { select: { name: true, email: true } },
          company: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return res.json({ success: true, dispatches });
};

export const trackShipment = async (req: Request, res: Response) => {
  const { shipmentNumber } = req.params;

  const dispatch = await prisma.dispatch.findUnique({
    where: { shipmentNumber },
    include: {
      order: {
        include: {
          customer: { select: { name: true } },
          company: { select: { name: true } },
          items: { include: { product: true } },
        },
      },
    },
  });

  if (!dispatch) return res.status(404).json({ success: false, message: 'Shipment tracking not found' });

  return res.json({ success: true, dispatch });
};
