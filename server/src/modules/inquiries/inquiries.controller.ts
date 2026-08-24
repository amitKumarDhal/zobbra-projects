import { Request, Response } from 'express';
import { InquiryService } from './inquiries.service.js';
import { InquiryStatus, InquirySource, InquiryActivityType } from '@prisma/client';

export class InquiryController {
  
  static async getAll(req: Request, res: Response) {
    try {
      const result = await InquiryService.getAllInquiries({
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        search: req.query.search as string,
        status: req.query.status as InquiryStatus,
        source: req.query.source as InquirySource,
        assignedToId: req.query.assignedToId as string,
        customerId: req.query.customerId as string,
      });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const inquiry = await InquiryService.getInquiryById(req.params.id);
      if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });
      res.json(inquiry);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getStats(req: Request, res: Response) {
    try {
      const stats = await InquiryService.getStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      // Assuming userId is available in req.user from auth middleware
      const userId = (req as any).user?.id;
      const data = req.body;
      const inquiry = await InquiryService.createInquiry(data, userId);
      res.status(201).json(inquiry);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async updateStatus(req: Request, res: Response) {
    try {
      const { status } = req.body;
      const userId = (req as any).user?.id;
      if (!status) return res.status(400).json({ message: 'Status is required' });
      
      const inquiry = await InquiryService.updateStatus(req.params.id, status, userId);
      res.json(inquiry);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async assign(req: Request, res: Response) {
    try {
      const { assignedToId } = req.body;
      const userId = (req as any).user?.id;
      if (!assignedToId) return res.status(400).json({ message: 'assignedToId is required' });
      
      const inquiry = await InquiryService.assignInquiry(req.params.id, assignedToId, userId);
      res.json(inquiry);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async addActivity(req: Request, res: Response) {
    try {
      const { type, message } = req.body;
      const userId = (req as any).user?.id;
      if (!type || !message) return res.status(400).json({ message: 'Type and message are required' });
      
      const activity = await InquiryService.addActivity(req.params.id, type, message, userId);
      res.status(201).json(activity);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async convertToQuote(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });
      
      const result = await InquiryService.convertToQuote(req.params.id, userId);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  // Generate WhatsApp Link
  static async generateWhatsappLink(req: Request, res: Response) {
    try {
      const inquiry = await InquiryService.getInquiryById(req.params.id);
      if (!inquiry || !inquiry.customer?.phone) {
        return res.status(400).json({ message: 'Customer phone number not available' });
      }

      // Clean phone number
      const phone = inquiry.customer.phone.replace(/\D/g, '');
      const text = encodeURIComponent(`Hi ${inquiry.customer.name}, this is regarding your inquiry ${inquiry.inquiryNumber} for ${inquiry.productInterest || 'our products'}.`);
      
      const link = `https://wa.me/${phone}?text=${text}`;
      
      // Optionally log that whatsapp was initiated
      const userId = (req as any).user?.id;
      await InquiryService.addActivity(req.params.id, InquiryActivityType.WHATSAPP, 'WhatsApp initiated', userId);
      
      res.json({ link });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}
