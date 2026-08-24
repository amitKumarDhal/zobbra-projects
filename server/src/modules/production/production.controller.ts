import { Response } from 'express';
import { prisma } from '../../config/index.js';
import { AuthRequest } from '../../middleware/auth.js';

export const getKanbanJobs = async (req: AuthRequest, res: Response) => {
  const jobs = await prisma.productionJob.findMany({
    include: {
      order: {
        include: {
          customer: { select: { id: true, name: true, email: true } },
          company: { select: { id: true, name: true } },
          items: { include: { product: true } },
        },
      },
      assignedTo: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const kanban = {
    PENDING: jobs.filter(j => j.stage === 'PENDING'),
    PRINTING: jobs.filter(j => j.stage === 'PRINTING'),
    QUALITY_CHECK: jobs.filter(j => j.stage === 'QUALITY_CHECK'),
    PACKING: jobs.filter(j => j.stage === 'PACKING'),
    READY_TO_DISPATCH: jobs.filter(j => j.stage === 'READY_TO_DISPATCH'),
  };

  return res.json({ success: true, kanban });
};

export const updateJobStage = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { stage, assignedToId, notes } = req.body;

  const data: any = { stage };
  if (assignedToId !== undefined) data.assignedToId = assignedToId;
  if (notes !== undefined) data.notes = notes;

  if (stage === 'PRINTING' && !data.startedAt) data.startedAt = new Date();
  if (stage === 'READY_TO_DISPATCH') data.completedAt = new Date();

  const job = await prisma.productionJob.update({
    where: { id },
    data,
    include: { order: true },
  });

  // If moved to READY_TO_DISPATCH, auto-update order status
  if (stage === 'READY_TO_DISPATCH') {
    await prisma.order.update({
      where: { id: job.orderId },
      data: { status: 'READY_FOR_DISPATCH' },
    });
  }

  return res.json({ success: true, job });
};
