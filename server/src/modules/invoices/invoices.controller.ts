import { Response } from 'express';
import { prisma } from '../../config/index.js';
import { AuthRequest } from '../../middleware/auth.js';
import { generateInvoicePDFBuffer } from '../../utils/pdfGenerator.js';

/**
 * 1. List Invoices with Role-Based Access Control & Filters
 * GET /api/v1/invoices
 */
export const getInvoices = async (req: AuthRequest, res: Response) => {
  try {
    const { status, search, page = '1', pageSize = '10' } = req.query;

    const where: any = {};
    if (status && status !== 'All Status') where.status = String(status);

    if (search) {
      const searchStr = String(search);
      where.OR = [
        { invoiceNumber: { contains: searchStr, mode: 'insensitive' } },
        { order: { orderNumber: { contains: searchStr, mode: 'insensitive' } } },
        { order: { customer: { name: { contains: searchStr, mode: 'insensitive' } } } },
        { company: { name: { contains: searchStr, mode: 'insensitive' } } },
      ];
    }

    // Role-based security check for CUSTOMER role
    if (req.user?.role === 'CUSTOMER') {
      const customerFilter = [
        { order: { customerId: req.user.id } },
        ...(req.user.companyId
          ? [
              { companyId: req.user.companyId },
              { order: { companyId: req.user.companyId } },
            ]
          : []),
      ];

      if (where.OR) {
        where.AND = [{ OR: customerFilter }];
      } else {
        where.OR = customerFilter;
      }
    }

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.max(1, parseInt(String(pageSize), 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              status: true,
              paymentStatus: true,
              customerId: true,
              customer: {
                select: { id: true, name: true, email: true, phone: true },
              },
            },
          },
          company: {
            select: { id: true, name: true, gstin: true, address: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.invoice.count({ where }),
    ]);

    return res.json({
      success: true,
      invoices,
      data: invoices,
      pagination: {
        page: pageNum,
        pageSize: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error('Error fetching invoices:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch invoices' });
  }
};

/**
 * 2. Get Single Invoice by ID with Ownership Verification
 * GET /api/v1/invoices/:id
 */
export const getInvoiceById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            customer: true,
            company: true,
            items: { include: { product: true } },
          },
        },
        company: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Role-based security check
    if (req.user?.role === 'CUSTOMER') {
      const isOwner =
        invoice.order?.customerId === req.user.id ||
        (req.user.companyId && invoice.companyId === req.user.companyId) ||
        (req.user.companyId && invoice.order?.companyId === req.user.companyId);

      if (!isOwner) {
        return res.status(403).json({ success: false, message: 'Unauthorized to view this invoice' });
      }
    }

    return res.json({ success: true, invoice });
  } catch (error: any) {
    console.error('Error fetching invoice by ID:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch invoice' });
  }
};

/**
 * 3. Download Official Tax Invoice PDF
 * GET /api/v1/invoices/:id/pdf
 */
export const downloadInvoicePdf = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            customer: true,
            company: true,
            items: { include: { product: true } },
          },
        },
        company: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Role-based security check
    if (req.user?.role === 'CUSTOMER') {
      const isOwner =
        invoice.order?.customerId === req.user.id ||
        (req.user.companyId && invoice.companyId === req.user.companyId) ||
        (req.user.companyId && invoice.order?.companyId === req.user.companyId);

      if (!isOwner) {
        return res.status(403).json({ success: false, message: 'Unauthorized to download this invoice' });
      }
    }

    const pdfData = {
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: new Date(invoice.createdAt).toLocaleDateString('en-IN'),
      dueDate: invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-IN') : undefined,
      status: invoice.status,
      orderNumber: invoice.order.orderNumber,
      customerName: invoice.order.customer.name,
      companyName: invoice.company?.name || invoice.order.company?.name || undefined,
      phone: invoice.order.customer.phone || undefined,
      email: invoice.order.customer.email || undefined,
      gstin: invoice.company?.gstin || invoice.order.company?.gstin || undefined,
      address: invoice.company?.address || invoice.order.company?.address || undefined,
      items: invoice.order.items.map((item) => ({
        productName: item.product?.name || 'Custom Merchandise',
        printType: item.printType,
        color: item.color,
        size: item.size,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      })),
      taxableValue: invoice.amount,
      gstRate: invoice.order.items[0]?.product?.gstRate ?? (invoice.amount > 0 ? Math.round((invoice.gstAmount / invoice.amount) * 100) : 5),
      gstAmount: invoice.gstAmount,
      grandTotal: invoice.totalAmount,
    };

    const pdfBuffer = await generateInvoicePDFBuffer(pdfData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Invoice-${invoice.invoiceNumber}.pdf"`);
    return res.send(pdfBuffer);
  } catch (error: any) {
    console.error('Invoice PDF generation error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate invoice PDF' });
  }
};
