export function normalizePhoneForWhatsApp(phone: string | null | undefined): string {
  if (!phone) return '919876543210';
  let cleaned = phone.replace(/[^\d]/g, '');
  if (cleaned.length === 10) {
    cleaned = `91${cleaned}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('0')) {
    cleaned = `91${cleaned.substring(1)}`;
  }
  return cleaned;
}

export type WhatsAppTemplateKey = 'NEW_QUOTE' | 'QUOTE_UPDATED' | 'QUOTE_READY' | 'FOLLOW_UP' | 'APPROVED_QUOTE';

export function generateWhatsAppMessage(
  template: WhatsAppTemplateKey,
  params: {
    customerName: string;
    salesUserName?: string;
    quoteNumber: string;
    productName: string;
    quantity: number;
    totalAmount?: number;
  }
): string {
  const { customerName, salesUserName = 'Zobra Sales', quoteNumber, productName, quantity, totalAmount } = params;

  switch (template) {
    case 'NEW_QUOTE':
      return `Hi ${customerName},\n\nThis is ${salesUserName} from Zobra.\n\nWe received your merchandise quotation request:\n• Quote: #${quoteNumber}\n• Product: ${productName}\n• Quantity: ${quantity} units\n\nI'd like to discuss the requirements and finalize the quotation with you.\n\nRegards,\nZOBBRA Team`;

    case 'QUOTE_UPDATED':
      return `Hi ${customerName},\n\nYour quotation #${quoteNumber} for ${productName} (${quantity} units) has been revised.\n• New Total: ₹${(totalAmount || 0).toLocaleString('en-IN')}\n\nPlease review the updated quotation details in your Zobra portal.\n\nRegards,\nZOBBRA Team`;

    case 'QUOTE_READY':
      return `Hi ${customerName},\n\nYour official quotation #${quoteNumber} is ready.\n• Total Amount: ₹${(totalAmount || 0).toLocaleString('en-IN')}\n\nPlease review the quote and let us know if you would like to proceed.\n\nRegards,\nZOBBRA Team`;

    case 'FOLLOW_UP':
      return `Hi ${customerName},\n\nJust following up regarding quotation #${quoteNumber} for ${productName} (${quantity} units).\n\nPlease let us know if you would like to proceed or if you'd like us to revise any specifications.\n\nRegards,\nZOBBRA Team`;

    case 'APPROVED_QUOTE':
      return `Hi ${customerName},\n\nThank you for approving quotation #${quoteNumber}!\n\nOur team is converting your quote into an active production order. We will keep you updated on progress.\n\nRegards,\nZOBBRA Team`;

    default:
      return `Hi ${customerName}, following up regarding quotation #${quoteNumber}.`;
  }
}

export function buildWhatsAppClickUrl(phone: string, text: string): string {
  const normalized = normalizePhoneForWhatsApp(phone);
  const encoded = encodeURIComponent(text);
  return `https://wa.me/${normalized}?text=${encoded}`;
}
