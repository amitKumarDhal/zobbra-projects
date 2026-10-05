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
 *
 * Pricing rules (the admin's product configuration is authoritative):
 *   1. Unit price = the product's quantity-range price for the ordered quantity
 *      (the range with the highest Min Qty that the quantity reaches).
 *   2. Below the first range, or with no ranges configured, unit price = Base Price.
 *   3. The price covers one print side. Printing on both sides adds
 *      SECOND_SIDE_SURCHARGE per piece — the only surcharge on top of admin pricing.
 *   4. An opted-in product offer addon is added to the subtotal before GST.
 */

/** Per-piece surcharge when the design is printed on both front and back. */
export const SECOND_SIDE_SURCHARGE = 20;

export interface PricingTier {
  minQuantity: number;
  maxQuantity?: number | null;
  pricePerUnit: number;
}

export interface PricingOptions {
  /** The product's quantity-range pricing (BulkPricing rows). */
  tiers?: PricingTier[] | null;
  /** Server-resolved offer addon charge for the whole line (see resolveAddonAmount). */
  addonAmount?: number;
}

export interface PricingResult {
  unitPrice: number;
  /** Admin-configured price per piece before the print surcharge. */
  productUnitPrice: number;
  /** Per-piece print surcharge included in unitPrice (0 for single-side prints). */
  printSurcharge: number;
  addonAmount: number;
  subtotal: number;
  discount: number;
  gstRate: number;
  gstTotal: number;
  totalAmount: number;
}

/** Admin price per piece for a quantity: matching quantity range, else the base price. */
export function resolveProductUnitPrice(
  basePrice: number,
  quantity: number,
  tiers?: PricingTier[] | null
): number {
  const valid = (tiers || []).filter(
    (t) => Number.isFinite(t.minQuantity) && Number.isFinite(t.pricePerUnit) && t.pricePerUnit > 0
  );
  const reached = valid.filter((t) => quantity >= t.minQuantity).sort((a, b) => b.minQuantity - a.minQuantity)[0];
  return reached ? reached.pricePerUnit : basePrice;
}

/** Per-piece surcharge for the print position. Only two-sided printing costs extra. */
export function resolvePrintSurcharge(printType: string = ''): number {
  const print = printType.toLowerCase();
  return print.includes('front') && print.includes('back') ? SECOND_SIDE_SURCHARGE : 0;
}

export interface OfferAddonConfig {
  enabled?: boolean;
  title?: string;
  description?: string;
  price?: number;
  priceType?: 'PER_ORDER' | 'PER_PIECE';
}

/** Charge for a product's offer addon. Zero unless the product offers it and the customer opted in. */
export function resolveAddonAmount(addon: unknown, selected: boolean, quantity: number): number {
  const cfg = (addon || {}) as OfferAddonConfig;
  const price = Number(cfg.price);
  if (!selected || !cfg.enabled || !Number.isFinite(price) || price <= 0) return 0;
  return cfg.priceType === 'PER_PIECE' ? price * quantity : price;
}

/**
 * Calculate server-authoritative pricing for a single quote item.
 *
 * @param basePrice    Product base price from database (INR)
 * @param quantity     Total quantity ordered
 * @param printType    Print position string (e.g. "Front Only", "Back Only", "Front & Back")
 * @param gstRate      GST percentage from product record (default 5.0)
 * @param isGstApplied Whether GST should be applied (default true)
 * @param options      Product quantity-range pricing and resolved addon charge
 * @returns PricingResult with all computed fields
 */
export function calculateServerPricing(
  basePrice: number,
  quantity: number,
  printType: string = 'Front Only',
  gstRate: number = 5.0,
  isGstApplied: boolean = true,
  options: PricingOptions = {}
): PricingResult {
  const productUnitPrice = resolveProductUnitPrice(basePrice, quantity, options.tiers);
  const printSurcharge = resolvePrintSurcharge(printType);
  const addonAmount = Math.max(0, Number(options.addonAmount) || 0);

  const unitPrice = productUnitPrice + printSurcharge;
  const subtotal = unitPrice * quantity + addonAmount;
  const gstTotal = isGstApplied ? Math.round(subtotal * (gstRate / 100)) : 0;
  const totalAmount = subtotal + gstTotal;

  return {
    unitPrice,
    productUnitPrice,
    printSurcharge,
    addonAmount,
    subtotal,
    discount: 0,
    gstRate,
    gstTotal,
    totalAmount,
  };
}
