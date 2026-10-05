/**
 * Customer-side view of a product's admin configuration.
 *
 * The catalog, product detail and customizer all read a product through these helpers so they
 * agree on its colours, sizes, minimums, pricing and whether it can be customized. Values come
 * from the product API; nothing here is a hardcoded product list.
 */
import { getColorHex } from './colors';
import { getReusableTemplateById, getTemplateCapabilities } from './customizerTemplates';

export type OrderMode = 'SINGLE' | 'BULK' | 'BOTH';

export interface ProductColor {
  name: string;
  hex: string;
}

export interface RatedMedia {
  url: string;
  rating: number | null;
  /** Order photos: short tag, the customer's words and a caption. Videos: a title. All optional. */
  keyword?: string;
  review?: string;
  description?: string;
  title?: string;
}

export interface PricingTier {
  minQuantity: number;
  maxQuantity?: number | null;
  pricePerUnit: number;
  printType?: string;
}

/** Per-piece surcharge the server adds for two-sided printing (see server quote-pricing.ts). */
export const SECOND_SIDE_SURCHARGE = 20;
/** Videos shown in the "Watch & Buy" section. */
export const WATCH_AND_BUY_LIMIT = 2;

const list = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

const distinct = (values: Array<string | undefined | null>): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    const value = (raw || '').trim();
    if (!value || seen.has(value.toLowerCase())) continue;
    seen.add(value.toLowerCase());
    out.push(value);
  }
  return out;
};

/** The colours configured for THIS product (admin list; older products: their variant colours). */
export function getProductColors(product: any): ProductColor[] {
  if (!product) return [];
  const configured = list<any>(product.availableColors).length > 0 ? list<any>(product.availableColors) : list<any>(product.colors);
  const named = configured.filter((c) => c && c.name);
  const source =
    named.length > 0
      ? named
      : distinct(list<any>(product.variants).map((v) => v.color)).map((name) => ({ name, hex: null }));
  return source.map((c) => ({ name: c.name, hex: c.hex || getColorHex(c.name) }));
}

/** The collar/rib/secondary colours configured for this product, falling back to product colors if not specified. */
export function getProductCollarColors(product: any): ProductColor[] {
  if (!product) return [];
  const secondary =
    list<any>(product.customizerViews?.secondaryColors).length > 0
      ? list<any>(product.customizerViews.secondaryColors)
      : list<any>(product.secondaryColors).length > 0
      ? list<any>(product.secondaryColors)
      : list<any>(product.availableSecondaryColors).length > 0
      ? list<any>(product.availableSecondaryColors)
      : list<any>(product.collarColors).length > 0
      ? list<any>(product.collarColors)
      : [];
  if (secondary.length > 0) {
    const named = secondary.filter((c) => c && c.name);
    return named.map((c) => ({ name: c.name, hex: c.hex || getColorHex(c.name) }));
  }
  // If product doesn't define separate secondary colors, use the product's configured colors
  return getProductColors(product);
}

/** Whether the customer must pick a size. Comes from the product, not from the customizer template. */
export function productRequiresSize(product: any): boolean {
  return !!product && product.requiresSize !== false;
}

/** The sizes configured for this product; empty when no size is required. */
export function getProductSizes(product: any): string[] {
  if (!productRequiresSize(product)) return [];
  const configured = list<string>(product.availableSizes).length > 0 ? list<string>(product.availableSizes) : list<string>(product.sizes);
  if (configured.length > 0) return configured;
  return distinct(list<any>(product.variants).map((v) => v.size));
}

/** The canvas designer is offered only when customizationEnabled is explicitly true. */
export function canCustomize(product: any): boolean {
  if (!product) return false;
  if (product.customizationEnabled !== true) return false;
  if (product.designerEnabled === false) return false;
  if (product.customizable === false) return false;
  return true;
}

export interface CustomizerFeatures {
  enabled: boolean;
  trimColor: boolean;
  taping: boolean;
  back: boolean;
  embroidery: boolean;
  zipper: boolean;
}

/** Product-level customization feature configuration (Phase 3). */
export function getCustomizerFeatures(product: any): CustomizerFeatures {
  if (!canCustomize(product)) {
    return {
      enabled: false,
      trimColor: false,
      taping: false,
      back: false,
      embroidery: false,
      zipper: false,
    };
  }

  // If server already provided the resolved customizer object
  if (product.customizer && typeof product.customizer === 'object') {
    return {
      enabled: Boolean(product.customizer.enabled),
      trimColor: Boolean(product.customizer.trimColor),
      taping: Boolean(product.customizer.taping),
      back: Boolean(product.customizer.back),
      embroidery: Boolean(product.customizer.embroidery),
      zipper: Boolean(product.customizer.zipper),
    };
  }

  const templateId = product.customizerTemplateId || product.customizerTemplate?.id;
  const template = templateId ? getReusableTemplateById(templateId) : null;
  const caps = getTemplateCapabilities(template);

  return {
    enabled: true,
    trimColor: (product.trimColorEnabled ?? caps.supportsTrimColor) && caps.supportsTrimColor,
    taping: (product.tapingColorEnabled ?? false) && caps.supportsTapingColor,
    back: (product.backDesignEnabled ?? caps.supportsBack) && caps.supportsBack,
    embroidery: (product.embroideryEnabled ?? false) && caps.supportsEmbroidery,
    zipper: (product.zipperEnabled ?? false) && caps.supportsZipper,
  };
}

export function getOrderMode(product: any): OrderMode {
  return product?.orderMode === 'SINGLE' || product?.orderMode === 'BULK' ? product.orderMode : 'BOTH';
}

/** Bulk controls (MOQ, quantity ranges, colour/size breakdown) apply unless the product is single-order only. */
export function allowsBulkOrder(product: any): boolean {
  return getOrderMode(product) !== 'SINGLE';
}

export function getPricingTiers(product: any): PricingTier[] {
  return list<PricingTier>(product?.bulkPricing)
    .filter((t) => t && t.pricePerUnit > 0)
    .sort((a, b) => a.minQuantity - b.minQuantity);
}

/** Minimum order quantity shown to customers. */
export function getMoq(product: any): number {
  if (!product) return 1;
  if (Number.isInteger(product.moq) && product.moq > 0) return product.moq;
  if (Number.isInteger(product.minOrderQty) && product.minOrderQty > 0) return product.minOrderQty;
  const tiers = getPricingTiers(product);
  return tiers.length > 0 ? tiers[0].minQuantity : 1;
}

/** Smallest quantity the server accepts from a customer for this product. */
export function getMinAllowedQty(product: any): number {
  return Number.isInteger(product?.minAllowedQty) && product.minAllowedQty > 0 ? product.minAllowedQty : 1;
}

/** Quantity the order form starts at: 1 for single-order products, otherwise the MOQ. */
export function getDefaultQuantity(product: any): number {
  return getOrderMode(product) === 'SINGLE' ? 1 : Math.max(getMoq(product), getMinAllowedQty(product));
}

/**
 * Display estimate of the admin price per piece for a quantity (same rule the server applies:
 * the reached quantity range, else the base price). The server recalculates every quote.
 */
export function getUnitPrice(product: any, quantity: number): number {
  const reached = getPricingTiers(product)
    .filter((t) => quantity >= t.minQuantity)
    .pop();
  return reached ? reached.pricePerUnit : Number(product?.basePrice) || 0;
}

export function getStartingPrice(product: any): number {
  if (!product) return 0;
  if (typeof product.startingPrice === 'number') return product.startingPrice;
  const prices = getPricingTiers(product).map((t) => t.pricePerUnit);
  return Math.min(Number(product.basePrice) || 0, ...prices);
}

/** Rating/review count to show, or null when the product has neither an override nor real reviews. */
export function getSocialProof(product: any): { rating: number; reviewCount: number } | null {
  const rating = Number(product?.rating);
  if (!product || product.rating == null || !Number.isFinite(rating) || rating <= 0) return null;
  return { rating, reviewCount: Number(product.reviewCount) || 0 };
}

export function getHighlights(product: any): string[] {
  return list<string>(product?.highlights).filter(Boolean);
}

export function getOrderImages(product: any): RatedMedia[] {
  return list<RatedMedia>(product?.orderImages).filter((m) => m && m.url);
}

export function getVideos(product: any): RatedMedia[] {
  return list<RatedMedia>(product?.videos).filter((m) => m && m.url);
}

/** The first videos in admin order, shown as "Watch & Buy". */
export function getWatchAndBuyVideos(product: any): RatedMedia[] {
  return getVideos(product).slice(0, WATCH_AND_BUY_LIMIT);
}

/** Poster frame for a Cloudinary-hosted video; undefined for other hosts. */
export function getVideoPoster(url: string): string | undefined {
  if (!/res\.cloudinary\.com\/.+\/video\/upload\//.test(url)) return undefined;
  return url.replace(/\.(mp4|mov|webm|m4v|avi|mkv)(\?.*)?$/i, '.jpg');
}

export interface FreeGift {
  title: string;
  description?: string;
  minQuantity?: number | null;
}

/** The free gift offered at this quantity, or null when none applies. */
export function getFreeGift(product: any, quantity?: number): FreeGift | null {
  const gift = product?.freeGift;
  if (!gift || !gift.enabled || !gift.title) return null;
  if (quantity !== undefined && gift.minQuantity && quantity < gift.minQuantity) return null;
  return gift;
}

export interface OfferAddon {
  title: string;
  description?: string;
  price: number;
  priceType: 'PER_ORDER' | 'PER_PIECE';
}

export function getOfferAddon(product: any): OfferAddon | null {
  const addon = product?.offerAddon;
  if (!addon || !addon.enabled || !(Number(addon.price) > 0) || !addon.title) return null;
  return { ...addon, price: Number(addon.price), priceType: addon.priceType === 'PER_PIECE' ? 'PER_PIECE' : 'PER_ORDER' };
}

export function formatAddonPrice(addon: OfferAddon): string {
  const price = `₹${addon.price.toLocaleString('en-IN')}`;
  return addon.priceType === 'PER_PIECE' ? `+${price} / pc` : `+${price} one-time`;
}

export function formatINR(value: number): string {
  return '₹' + Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}
