/**
 * ZOBBRA WhatsApp Utilities
 * Robust phone normalization and WhatsApp click URL generator
 */

/**
 * Normalizes any phone string into an international WhatsApp-ready numeric string.
 * Example Indian formats:
 * - "+91 98765 43210" -> "919876543210"
 * - "9876543210"      -> "919876543210"
 * - "09876543210"     -> "919876543210"
 * - "+919876543210"   -> "919876543210"
 * - "919876543210"    -> "919876543210"
 * - "9123456789"      -> "919123456789"
 */
export function normalizePhoneForWhatsApp(phone: string | null | undefined): string | null {
  if (!phone || typeof phone !== 'string') return null;

  // Remove all non-numeric characters (+, spaces, -, (, ), etc.)
  const digits = phone.replace(/\D/g, '');
  if (!digits || digits.length < 10) return null;

  // 10 digits -> Indian mobile number (e.g. 9876543210) -> prepend 91
  if (digits.length === 10) {
    return `91${digits}`;
  }

  // 11 digits starting with 0 (e.g. 09876543210) -> replace leading 0 with 91
  if (digits.length === 11 && digits.startsWith('0')) {
    return `91${digits.substring(1)}`;
  }

  // 12 digits starting with 91 (e.g. 919876543210) -> already normalized
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits;
  }

  // 13 digits starting with 091 (e.g. 0919876543210) -> strip leading 0
  if (digits.length === 13 && digits.startsWith('091')) {
    return digits.substring(1);
  }

  // Other international formats (e.g. > 10 digits)
  return digits;
}

/**
 * Builds a direct, user-clickable WhatsApp URL with URL-encoded message
 */
export function buildWhatsAppUrl(phone: string | null | undefined, message: string): string | null {
  const normalized = normalizePhoneForWhatsApp(phone);
  if (!normalized) return null;
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${normalized}?text=${encodedText}`;
}

/**
 * Generates the official ZOBBRA order discussion message
 */
export function getOrderWhatsAppMessage(params: {
  customerName?: string;
  orderNumber: string;
  totalAmount: number;
}): string {
  const name = params.customerName?.trim() || 'Customer';
  const formattedAmount = params.totalAmount.toLocaleString('en-IN');
  return `Hello ${name},

This is ZOBBRA Sales regarding your order ${params.orderNumber}.

Order Amount: ₹${formattedAmount}

We would like to coordinate payment and the next steps for your order.

Thank you,
ZOBBRA Team`;
}

/**
 * Generates the official ZOBBRA quotation follow-up message
 */
export function getQuoteWhatsAppMessage(params: {
  customerName?: string;
  quoteNumber: string;
  productName?: string;
  quantity?: number;
  totalAmount?: number;
}): string {
  const name = params.customerName?.trim() || 'Customer';
  const amountStr = params.totalAmount ? `\n• Total Amount: ₹${params.totalAmount.toLocaleString('en-IN')}` : '';
  const prodStr = params.productName ? `\n• Product: ${params.productName}` : '';
  const qtyStr = params.quantity ? `\n• Quantity: ${params.quantity} units` : '';

  return `Hello ${name},

This is ZOBBRA Sales regarding quotation #${params.quoteNumber}.${prodStr}${qtyStr}${amountStr}

We would like to coordinate your requirements and next steps.

Thank you,
ZOBBRA Team`;
}
