import PDFDocument from 'pdfkit';
import { config } from '../config/index.js';

export interface QuotePDFData {
  quoteNumber: string;
  customerName: string;
  companyName?: string;
  gstin?: string;
  items: Array<{
    productName: string;
    printType: string;
    color: string;
    size: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  subtotal: number;
  gstTotal: number;
  discount: number;
  totalAmount: number;
  validUntil: string;
}

export interface InvoicePDFData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  status: string;
  orderNumber: string;
  customerName: string;
  companyName?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  address?: string;
  items: Array<{
    productName: string;
    printType: string;
    color: string;
    size: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  taxableValue: number;
  gstRate: number;
  gstAmount: number;
  grandTotal: number;
}

export const generateQuotePDFBuffer = (data: QuotePDFData): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40 });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Header
      doc.fontSize(22).fillColor('#111111').text(config.company.name, { align: 'left' });
      doc.fontSize(10).fillColor('#64748b').text(`GSTIN: ${config.company.gstin} | Phone: ${config.company.phone}`);
      doc.text(`Email: ${config.company.email} | Address: ${config.company.address}`);
      doc.moveDown(1.5);

      // Quote Title
      doc.fontSize(16).fillColor('#2563eb').text(`OFFICIAL QUOTATION: ${data.quoteNumber}`);
      doc.fontSize(10).fillColor('#475569').text(`Date: ${new Date().toLocaleDateString('en-IN')} | Valid Until: ${data.validUntil}`);
      doc.moveDown(1);

      // Customer Info Box
      doc.fontSize(12).fillColor('#0f172a').text(`Billed To:`, { underline: true });
      doc.fontSize(10).text(`Customer: ${data.customerName}`);
      if (data.companyName) doc.text(`Company: ${data.companyName}`);
      if (data.gstin) doc.text(`GSTIN: ${data.gstin}`);
      doc.moveDown(1.5);

      // Table Header
      const tableTop = doc.y;
      doc.fontSize(10).fillColor('#1e293b');
      doc.text('Item Description', 40, tableTop);
      doc.text('Qty', 260, tableTop, { width: 40, align: 'right' });
      doc.text('Unit Rate (₹)', 310, tableTop, { width: 90, align: 'right' });
      doc.text('Total (₹)', 410, tableTop, { width: 100, align: 'right' });

      doc.moveTo(40, tableTop + 15).lineTo(530, tableTop + 15).stroke('#cbd5e1');

      let yPos = tableTop + 25;
      data.items.forEach((item) => {
        doc.fontSize(9).fillColor('#334155');
        doc.text(`${item.productName} (${item.printType}, ${item.color}/${item.size})`, 40, yPos, { width: 210 });
        doc.text(`${item.quantity}`, 260, yPos, { width: 40, align: 'right' });
        doc.text(`₹${item.unitPrice.toFixed(2)}`, 310, yPos, { width: 90, align: 'right' });
        doc.text(`₹${item.totalPrice.toFixed(2)}`, 410, yPos, { width: 100, align: 'right' });
        yPos += 25;
      });

      doc.moveTo(40, yPos).lineTo(530, yPos).stroke('#cbd5e1');
      yPos += 15;

      // Summary
      doc.fontSize(10).fillColor('#0f172a');
      doc.text(`Subtotal: ₹${data.subtotal.toFixed(2)}`, 350, yPos, { align: 'right' });
      yPos += 18;
      doc.text(`GST (5% HSN 6109): ₹${data.gstTotal.toFixed(2)}`, 350, yPos, { align: 'right' });
      if (data.discount > 0) {
        yPos += 18;
        doc.text(`Discount: -₹${data.discount.toFixed(2)}`, 350, yPos, { align: 'right' });
      }
      yPos += 22;
      doc.fontSize(13).fillColor('#2563eb').text(`Grand Total: ₹${data.totalAmount.toFixed(2)}`, 350, yPos, { align: 'right' });

      // Footer
      doc.fontSize(8).fillColor('#94a3b8').text('Thank you for choosing ZOBBRA! For questions, email hello@zobbra.com or call +91 91244 49666.', 40, 720, { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

export const generateInvoicePDFBuffer = (data: InvoicePDFData): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // 1. Header Banner
      doc.fontSize(22).fillColor('#111111').font('Helvetica-Bold').text('ZOBBRA', 40, 40);
      doc.fontSize(9).fillColor('#3B6FEB').font('Helvetica-Bold').text('WEAR YOUR BRAND — B2B CUSTOM MERCHANDISE', 40, 68);
      
      doc.fontSize(9).fillColor('#64748b').font('Helvetica').text(`GSTIN: ${config.company.gstin}`, 40, 84);
      doc.text(`Phone: ${config.company.phone} | Email: ${config.company.email}`, 40, 96);
      doc.text(`Registered Address: ${config.company.address}`, 40, 108);

      // Invoice Badge / Meta on Right
      doc.fontSize(16).fillColor('#111111').font('Helvetica-Bold').text('TAX INVOICE', 350, 40, { align: 'right' });
      doc.fontSize(10).fillColor('#3B6FEB').font('Helvetica-Bold').text(data.invoiceNumber, 350, 60, { align: 'right' });
      doc.fontSize(9).fillColor('#475569').font('Helvetica').text(`Invoice Date: ${data.invoiceDate}`, 350, 76, { align: 'right' });
      doc.text(`Order Ref: ${data.orderNumber}`, 350, 88, { align: 'right' });
      doc.text(`Payment Status: ${data.status}`, 350, 100, { align: 'right' });

      doc.moveTo(40, 126).lineTo(550, 126).stroke('#E2E8F0');

      // 2. Bill To & Ship To Details
      const billToY = 138;
      doc.fontSize(10).fillColor('#111111').font('Helvetica-Bold').text('BILLED & SHIPPED TO:', 40, billToY);
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e293b').text(data.companyName || data.customerName, 40, billToY + 16);
      doc.fontSize(9).font('Helvetica').fillColor('#475569');
      doc.text(`Attn: ${data.customerName}`, 40, billToY + 30);
      if (data.phone) doc.text(`Phone: ${data.phone}`, 40, billToY + 42);
      if (data.email) doc.text(`Email: ${data.email}`, 40, billToY + 54);
      if (data.gstin) doc.text(`Buyer GSTIN: ${data.gstin}`, 40, billToY + 66);
      if (data.address) doc.text(`Delivery Address: ${data.address}`, 40, billToY + 78, { width: 260 });

      doc.fontSize(10).fillColor('#111111').font('Helvetica-Bold').text('INVOICE SUMMARY:', 350, billToY);
      doc.fontSize(9).font('Helvetica').fillColor('#475569');
      doc.text(`Place of Supply: Odisha (21)`, 350, billToY + 16);
      doc.text(`Reverse Charge: No`, 350, billToY + 30);
      doc.text(`HSN / SAC Code: 6109 (Apparel)`, 350, billToY + 42);
      doc.text(`Due Date: ${data.dueDate || 'Immediate'}`, 350, billToY + 54);

      doc.moveTo(40, billToY + 102).lineTo(550, billToY + 102).stroke('#E2E8F0');

      // 3. Line Items Table
      const tableTop = billToY + 115;
      doc.rect(40, tableTop - 6, 510, 20).fill('#F8FAFC');
      doc.fontSize(9).fillColor('#1e293b').font('Helvetica-Bold');
      doc.text('#', 48, tableTop);
      doc.text('Description / Specifications', 70, tableTop);
      doc.text('HSN', 270, tableTop, { width: 40, align: 'center' });
      doc.text('Qty', 315, tableTop, { width: 35, align: 'right' });
      doc.text('Unit Rate', 355, tableTop, { width: 85, align: 'right' });
      doc.text('Amount (₹)', 445, tableTop, { width: 95, align: 'right' });

      let yPos = tableTop + 24;
      data.items.forEach((item, index) => {
        doc.fontSize(9).fillColor('#334155').font('Helvetica');
        doc.text(`${index + 1}`, 48, yPos);
        doc.text(`${item.productName}`, 70, yPos, { width: 195 });
        doc.fontSize(8).fillColor('#64748b').text(`${item.printType} | ${item.color} | Size ${item.size}`, 70, yPos + 11, { width: 195 });
        
        doc.fontSize(9).fillColor('#334155');
        doc.text('6109', 270, yPos, { width: 40, align: 'center' });
        doc.text(`${item.quantity}`, 315, yPos, { width: 35, align: 'right' });
        doc.text(`₹${item.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 355, yPos, { width: 85, align: 'right' });
        doc.font('Helvetica-Bold').text(`₹${item.totalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 445, yPos, { width: 95, align: 'right' });
        
        yPos += 28;
      });

      doc.moveTo(40, yPos).lineTo(550, yPos).stroke('#E2E8F0');
      yPos += 14;

      // 4. Financial Calculations & Tax Breakdown
      const subtotalFormatted = `₹${data.taxableValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
      const gstFormatted = `₹${data.gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
      const grandTotalFormatted = `₹${data.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

      doc.fontSize(9).font('Helvetica').fillColor('#475569');
      doc.text('Taxable Subtotal:', 340, yPos, { width: 100, align: 'right' });
      doc.font('Helvetica-Bold').fillColor('#111111').text(subtotalFormatted, 445, yPos, { width: 95, align: 'right' });
      yPos += 16;

      doc.font('Helvetica').fillColor('#475569').text(`Combined GST (${data.gstRate}%):`, 310, yPos, { width: 130, align: 'right' });
      doc.font('Helvetica-Bold').fillColor('#111111').text(gstFormatted, 445, yPos, { width: 95, align: 'right' });
      yPos += 18;

      doc.rect(310, yPos - 4, 240, 26).fill('#EEF2FF');
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#3B6FEB').text('Total Invoice Amount:', 320, yPos + 3);
      doc.text(grandTotalFormatted, 445, yPos + 3, { width: 95, align: 'right' });
      yPos += 36;

      // 5. Bank Account & Terms
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#111111').text('Bank Account Details for NEFT/RTGS Transfer:', 40, yPos);
      doc.fontSize(8).font('Helvetica').fillColor('#475569');
      doc.text('Beneficiary Name: ZOBBRA APPARELS PRIVATE LIMITED', 40, yPos + 12);
      doc.text('Account Number: 50200088991122 | IFSC: HDFC0001234', 40, yPos + 22);
      doc.text('Bank: HDFC Bank, Infocity Branch, Bhubaneswar', 40, yPos + 32);

      // Signatory
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#111111').text('For ZOBBRA APPARELS PVT LTD', 400, yPos, { align: 'right' });
      doc.fontSize(8).font('Helvetica-Oblique').fillColor('#64748b').text('Authorized Signatory', 400, yPos + 32, { align: 'right' });

      // Footer
      doc.fontSize(8).font('Helvetica').fillColor('#94a3b8').text(
        'This is a computer-generated tax invoice issued by ZOBBRA. Registered under GST Act 2017.',
        40,
        770,
        { align: 'center', width: 510 }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
