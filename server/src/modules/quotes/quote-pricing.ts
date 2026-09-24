/**
 * ZOBBRA Quote Pricing Utility
 *
 * This is the SINGLE authoritative server-side pricing engine.
 *
 * Both:
 *   - POST /api/v1/quotes/pricing-preview  (live estimate for customer UI)
 *   - POST /api/v1/quotes                  (final quote creation)
 *   - PUT  /api/v1/quotes/:id              (admin quote edit)
 *
 * ...MUST call calculateServerPricing() from this module.
 *
 * Never duplicate this formula in React components or elsewhere.
 * The server calculation is authoritative; client-supplied prices are ignored.
 */

export interface PricingResult {
  unitPrice: number;
  subtotal: number;
  discount: number;
  gstRate: number;
  gstTotal: number;
  totalAmount: number;
}

/**
 * Calculate server-authoritative pricing for a single quote item.
 *
 * @param basePrice    Product base price from database (INR)
 * @param quantity     Total quantity ordered
 * @param printType    Print position string (e.g. "Front Only", "Back Only", "Front & Back")
 * @param gstRate      GST percentage from product record (default 5.0)
 * @param isGstApplied Whether GST should be applied (default true)
 * @returns PricingResult with all computed fields
 */
export function calculateServerPricing(
  basePrice: number,
  quantity: number,
  printType: string = 'Front Only',
  gstRate: number = 5.0,
  isGstApplied: boolean = true
): PricingResult {
  // Print position surcharge
  let positionAddon = 20;
  const printLower = printType.toLowerCase();
  if (printLower.includes('front') && printLower.includes('back')) {
    positionAddon = 40;
  } else if (printLower.includes('embroidery') || printLower.includes('back')) {
    positionAddon = 30;
  }

  // Volume discount tier (price per unit before print surcharge)
  let volumePrice = basePrice;
  if (quantity >= 500) {
    volumePrice = Math.max(100, basePrice - 60);
  } else if (quantity >= 100) {
    volumePrice = Math.max(120, basePrice - 30);
  } else if (quantity >= 50) {
    volumePrice = Math.max(140, basePrice - 10);
  }

  const unitPrice = volumePrice + positionAddon;
  const subtotal = unitPrice * quantity;
  const gstTotal = isGstApplied ? Math.round(subtotal * (gstRate / 100)) : 0;
  const totalAmount = subtotal + gstTotal;

  return {
    unitPrice,
    subtotal,
    discount: 0,
    gstRate,
    gstTotal,
    totalAmount,
  };
}
