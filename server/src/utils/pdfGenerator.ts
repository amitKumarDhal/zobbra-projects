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
      doc.text(`GST (Combined): ₹${data.gstTotal.toFixed(2)}`, 350, yPos, { align: 'right' });
      if (data.discount > 0) {
        yPos += 18;
        doc.text(`Discount: -₹${data.discount.toFixed(2)}`, 350, yPos, { align: 'right' });
      }
      yPos += 22;
      doc.fontSize(13).fillColor('#2563eb').text(`Grand Total: ₹${data.totalAmount.toFixed(2)}`, 350, yPos, { align: 'right' });

      // Footer
      doc.fontSize(8).fillColor('#94a3b8').text('Thank you for choosing Zobra Prints! For questions, email hello@zobbra.com or call +91 91244 96665.', 40, 720, { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
