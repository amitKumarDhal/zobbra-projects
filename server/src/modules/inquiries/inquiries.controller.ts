import { Request, Response } from 'express';
import { InquiryService } from './inquiries.service.js';
import { InquiryStatus, InquirySource, InquiryActivityType } from '@prisma/client';

export class InquiryController {
  
  static async getAll(req: Request, res: Response) {
    try {
      let customerId = req.query.customerId as string;
      if ((req as any).user?.role === 'CUSTOMER') {
        customerId = (req as any).user.id;
      }

      const result = await InquiryService.getAllInquiries({
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        search: req.query.search as string,
        status: req.query.status as InquiryStatus,
        source: req.query.source as InquirySource,
        assignedToId: req.query.assignedToId as string,
        customerId: customerId,
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

      if ((req as any).user?.role === 'CUSTOMER') {
        if (inquiry.customerId !== (req as any).user.id && inquiry.companyId !== (req as any).user.companyId) {
          return res.status(403).json({ message: 'Unauthorized' });
        }
      }

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
      const userId = (req as any).user?.id;
      const data = req.body;

      let customerName = data.customerName || data.name;
      let companyName = data.companyName || data.company;
      let phone = data.phone;
      let email = data.email;
      const productInterest = data.productInterest || data.category || 'Custom Merchandise';
      const quantity = Number(data.quantity);

      const userRole = (req as any).user?.role;
      let effectiveCustomerId = data.customerId;
      
      if (!effectiveCustomerId && userRole === 'CUSTOMER') {
        effectiveCustomerId = userId;
      }

      if (effectiveCustomerId) {
        const user = await InquiryService.getUserById(effectiveCustomerId);
        if (user) {
          customerName = customerName || user.name;
          companyName = companyName || user.company?.name || 'Individual';
          phone = phone || user.phone || '9999999999';
          // Important constraint: Do NOT fallback to user.email if the inquiry didn't provide it
          // Wait, if it's a registered user, they have an email. But the prompt says "Do NOT automatically display the logged-in account email unless that email was explicitly stored as part of the inquiry/request."
          // So we should only use `data.email`.
          email = data.email || undefined;
        }
      }

      if (!customerName || !phone || !quantity || quantity <= 0) {
        return res.status(400).json({
          message: 'Missing or invalid required fields (Name, Phone, Quantity).'
        });
      }

      // Handle Reference Files
      let finalArtworkUrl = data.artworkUrl || data.artwork || undefined;
      if (Array.isArray(data.referenceFiles) && data.referenceFiles.length > 0) {
        finalArtworkUrl = data.referenceFiles.map((f: any) => f.url || f).join(', ');
      }

      const inquiry = await InquiryService.createInquiry({
        companyName: companyName || 'Individual',
        customerName,
        phone,
        email: email || undefined,
        productId: data.productId || undefined,
        productInterest,
        quantity,
        location: data.location || undefined,
        colors: data.colors || data.color || undefined,
        sizes: data.sizes || data.size || undefined,
        printingType: data.printingType || undefined,
        printPosition: data.printPosition || undefined,
        budget: data.budget || undefined,
        customizationRequirements: data.customizationRequirements || data.message || undefined,
        artworkUrl: finalArtworkUrl,
        deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : undefined,
        source: data.source || InquirySource.WEBSITE,
        variants: data.variants || undefined,
        customerId: effectiveCustomerId || undefined,
        message: data.message || undefined,
      }, userId);

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
      console.error('Error in convertToQuote:', error);
      res.status(400).json({ message: error.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const updated = await InquiryService.updateInquiry(req.params.id, req.body, userId);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  static async approve(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });
      const inquiry = await InquiryService.approveInquiry(req.params.id, userId);
      res.json(inquiry);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  static async reject(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { reason } = req.body;
      const inquiry = await InquiryService.rejectInquiry(req.params.id, reason, userId);
      res.json(inquiry);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  // Generate WhatsApp Link
  static async generateWhatsappLink(req: Request, res: Response) {
    try {
      const inquiry = await InquiryService.getInquiryById(req.params.id);
      const phone = inquiry?.customer?.phone || inquiry?.phone;
      if (!inquiry || !phone) {
        return res.status(400).json({ message: 'Customer phone number not available' });
      }

      // Clean phone number
      const cleanPhone = phone.replace(/\D/g, '');
      const name = inquiry.customerName || inquiry.customer?.name || 'there';
      let message = `Hi ${name}, this is regarding your inquiry ${inquiry.inquiryNumber} on ZOBBRA for ${inquiry.product?.name || inquiry.productInterest || 'our custom merchandise'}.`;
      if (inquiry.quote) {
        message += ` Your quote ${inquiry.quote.quoteNumber} for ₹${inquiry.quote.totalAmount.toLocaleString('en-IN')} has been prepared.`;
      }
      
      const link = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
      
      // Optionally log that whatsapp was initiated
      const userId = (req as any).user?.id;
      await InquiryService.addActivity(req.params.id, InquiryActivityType.WHATSAPP, 'WhatsApp initiated', userId);
      
      res.json({ link, whatsappUrl: link });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}
