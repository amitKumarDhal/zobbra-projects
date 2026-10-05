/**
 * Product configuration: validation of the admin product form payload, the customer-facing
 * response shape, and internal stock deduction. Kept free of Express/Prisma calls so the rules
 * can be unit-tested.
 */

import { getCustomizerTemplateById, isValidCustomizerTemplate, getTemplateCapabilities } from './customizer-templates.js';

export const ORDER_MODES = ['SINGLE', 'BULK', 'BOTH'] as const;
export type OrderMode = (typeof ORDER_MODES)[number];

export const MAX_PRODUCT_IMAGES = 6;
export const MAX_ORDER_IMAGES = 12;
export const MAX_PRODUCT_VIDEOS = 6;
export const MAX_HIGHLIGHTS = 12;
/** Videos shown in the customer "Watch & Buy" section. */
export const WATCH_AND_BUY_LIMIT = 2;

export interface ProductColor {
  name: string;
  hex: string | null;
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
export interface FreeGift {
  enabled: boolean;
  title: string;
  description: string;
  minQuantity: number | null;
}
export interface OfferAddon {
  enabled: boolean;
  title: string;
  description: string;
  price: number;
  priceType: 'PER_ORDER' | 'PER_PIECE';
}
export interface StockPool {
  stockType: string;
  colors: string[];
  stock: number;
}
export interface StockDeduction {
  enabled: boolean;
  pools: StockPool[];
}

/** Print-area guide on a customizer photo, as fractions (0..1) of the photo box. */
export interface PrintArea {
  x: number;
  y: number;
  w: number;
  h: number;
}
/**
 * Recolouring masks for one side, aligned with its photo: white/opaque = recolour, black/transparent
 * = keep. bodyMask follows the body colour, trimMask the collar/rib colour. Either may be null.
 */
export interface ViewMasks {
  bodyMask: string | null;
  trimMask: string | null;
}
/**
 * Which uploaded photos the customizer shows behind the design. Null on older products, which keep
 * the legacy behaviour (first photo = front, second = back).
 */
export interface CustomizerViews {
  front: { image: string; area: PrintArea | null } & ViewMasks;
  back: { enabled: boolean; image: string | null; area: PrintArea | null } & ViewMasks;
}

export class ProductValidationError extends Error {}

const fail = (message: string): never => {
  throw new ProductValidationError(message);
};

const text = (value: unknown, max = 500) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

const isHttpUrl = (value: unknown): value is string =>
  typeof value === 'string' && /^(https?:\/\/|\/)[^\s]+$/i.test(value.trim()) && !value.includes('data:');

/** Non-negative integer, or null when blank. Rejects junk instead of silently storing 0. */
const optionalInt = (value: unknown, label: string, min = 0): number | null => {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n < min) fail(`${label} must be a whole number of at least ${min}.`);
  return n;
};

const rating = (value: unknown, label: string): number | null => {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 5) fail(`${label} must be between 0 and 5.`);
  return Math.round(n * 10) / 10;
};

const uniqueStrings = (value: unknown, max: number, itemMax = 60): string[] => {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of value) {
    const item = text(raw, itemMax);
    const key = item.toLowerCase();
    if (!item || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out.slice(0, max);
};

const urlList = (value: unknown, label: string, max: number): string[] => {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) fail(`${label} must be a list of URLs.`);
  const urls = (value as unknown[]).map((u) => (typeof u === 'string' ? u.trim() : u)).filter((u) => u !== '');
  if (urls.some((u) => !isHttpUrl(u))) fail(`${label} must contain valid image URLs.`);
  if (urls.length > max) fail(`${label}: at most ${max} are allowed.`);
  return urls as string[];
};

const ratedMedia = (
  value: unknown,
  label: string,
  max: number,
  textFields: Partial<Record<'keyword' | 'review' | 'description' | 'title', number>> = {}
): RatedMedia[] => {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) fail(`${label} must be a list.`);
  const items = (value as any[]).map((item) => {
    const url = typeof item === 'string' ? item : item?.url;
    if (!isHttpUrl(url)) fail(`${label} must contain valid URLs.`);
    const media: RatedMedia = { url: String(url).trim(), rating: rating(item?.rating, `${label} rating`) };
    for (const [field, maxLength] of Object.entries(textFields) as Array<['keyword' | 'review' | 'description' | 'title', number]>) {
      const value = text(item?.[field], maxLength);
      if (value) media[field] = value;
    }
    return media;
  });
  if (items.length > max) fail(`${label}: at most ${max} are allowed.`);
  return items;
};

const printArea = (value: any, label: string): PrintArea | null => {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'object') fail(`${label} print area is invalid.`);
  const [x, y, w, h] = (['x', 'y', 'w', 'h'] as const).map((key) => Number(value[key]));
  if ([x, y, w, h].some((n) => !Number.isFinite(n) || n < 0 || n > 1)) {
    fail(`${label} print area must use values between 0 and 1.`);
  }
  if (w < 0.02 || h < 0.02) fail(`${label} print area is too small.`);
  if (x + w > 1.001 || y + h > 1.001) fail(`${label} print area must stay inside the photo.`);
  const round = (n: number) => Math.round(n * 10000) / 10000;
  return { x: round(x), y: round(y), w: round(w), h: round(h) };
};

const maskUrl = (value: unknown, label: string): string | null => {
  if (value === undefined || value === null || value === '') return null;
  if (!isHttpUrl(value)) fail(`${label} must be a valid image URL.`);
  return String(value).trim();
};

const viewMasks = (side: any, label: string): ViewMasks => ({
  bodyMask: maskUrl(side?.bodyMask, `${label} body mask`),
  trimMask: maskUrl(side?.trimMask, `${label} collar/rib mask`),
});

const customizerViews = (value: any): CustomizerViews | null => {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'object') fail('Customizer views are invalid.');
  const frontImage = typeof value.front?.image === 'string' ? value.front.image.trim() : '';
  const backEnabled = Boolean(value.back?.enabled);
  const backImage = typeof value.back?.image === 'string' ? value.back.image.trim() : '';
  // No photo chosen: the product keeps the legacy photo order.
  if (!frontImage && !backImage) return null;
  if (!isHttpUrl(frontImage)) fail('Choose a valid front image for the customizer.');
  if (backEnabled && !isHttpUrl(backImage)) fail('Choose a back image for the customizer, or turn back printing off.');
  return {
    front: { image: frontImage, area: printArea(value.front?.area, 'Front'), ...viewMasks(value.front, 'Front') },
    back: backEnabled
      ? { enabled: true, image: backImage, area: printArea(value.back?.area, 'Back'), ...viewMasks(value.back, 'Back') }
      : { enabled: false, image: null, area: null, bodyMask: null, trimMask: null },
  };
};

const colorList = (value: unknown): ProductColor[] => {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) fail('Colors must be a list.');
  const seen = new Set<string>();
  const out: ProductColor[] = [];
  for (const item of value as any[]) {
    const name = text(typeof item === 'string' ? item : item?.name, 40);
    if (!name || seen.has(name.toLowerCase())) continue;
    const hex = text(item?.hex, 9);
    if (hex && !/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) fail(`Color "${name}" has an invalid colour value.`);
    seen.add(name.toLowerCase());
    out.push({ name, hex: hex ? hex.toUpperCase() : null });
  }
  return out.slice(0, 40);
};

const freeGift = (value: any): FreeGift | null => {
  if (!value || typeof value !== 'object') return null;
  const gift: FreeGift = {
    enabled: Boolean(value.enabled),
    title: text(value.title, 120),
    description: text(value.description, 500),
    minQuantity: optionalInt(value.minQuantity, 'Free gift minimum quantity', 1),
  };
  if (gift.enabled && !gift.title) fail('Free gift needs a title when it is enabled.');
  return gift.enabled || gift.title || gift.description ? gift : null;
};

const offerAddon = (value: any): OfferAddon | null => {
  if (!value || typeof value !== 'object') return null;
  const price = value.price === '' || value.price === undefined || value.price === null ? 0 : Number(value.price);
  if (!Number.isFinite(price) || price < 0) fail('Offer addon price must be zero or more.');
  const addon: OfferAddon = {
    enabled: Boolean(value.enabled),
    title: text(value.title, 120),
    description: text(value.description, 500),
    price,
    priceType: value.priceType === 'PER_PIECE' ? 'PER_PIECE' : 'PER_ORDER',
  };
  if (addon.enabled && (!addon.title || price <= 0)) fail('Offer addon needs a title and a price when it is enabled.');
  return addon.enabled || addon.title || addon.description ? addon : null;
};

const stockDeduction = (value: any): StockDeduction | null => {
  if (!value || typeof value !== 'object') return null;
  const pools: StockPool[] = (Array.isArray(value.pools) ? value.pools : [])
    .map((pool: any) => ({
      stockType: text(pool?.stockType, 80),
      colors: uniqueStrings(pool?.colors, 40, 40),
      stock: optionalInt(pool?.stock, 'Stock type quantity') ?? 0,
    }))
    .filter((pool: StockPool) => pool.stockType);
  const colorOwner = new Map<string, string>();
  for (const pool of pools) {
    for (const color of pool.colors) {
      const key = color.toLowerCase();
      if (colorOwner.has(key) && colorOwner.get(key) !== pool.stockType) {
        fail(`Color "${color}" is mapped to more than one stock type.`);
      }
      colorOwner.set(key, pool.stockType);
    }
  }
  const config = { enabled: Boolean(value.enabled), pools };
  return config.enabled || pools.length > 0 ? config : null;
};

/**
 * Validates the extended product fields of a create/update payload and returns only the keys the
 * request actually supplied, so a partial update never clears fields it did not send.
 * Throws ProductValidationError (→ 400) on invalid input rather than discarding it.
 */
export function normalizeProductConfig(body: Record<string, any>) {
  const data: Record<string, any> = {};
  const has = (key: string) => body[key] !== undefined;

  if (has('minOrderQty')) data.minOrderQty = optionalInt(body.minOrderQty, 'Min. order qty', 1);
  if (has('minSampleQty')) data.minSampleQty = optionalInt(body.minSampleQty, 'Min. sample qty', 1);
  if (has('stockCount')) data.stockCount = optionalInt(body.stockCount, 'Stock count') ?? 0;
  if (has('rating') || has('ratingOverride')) data.ratingOverride = rating(body.ratingOverride ?? body.rating, 'Rating');
  if (has('reviewCount') || has('reviewCountOverride')) {
    data.reviewCountOverride = optionalInt(body.reviewCountOverride ?? body.reviewCount, 'Review count');
  }
  if (has('orderMode')) {
    const mode = String(body.orderMode || '').toUpperCase();
    if (!ORDER_MODES.includes(mode as OrderMode)) fail('Order type must be Single Order, Bulk Order or Both Modes.');
    data.orderMode = mode;
  }
  if (has('customizerTemplateId')) {
    data.customizerTemplateId = body.customizerTemplateId ? String(body.customizerTemplateId).trim() : null;
  }
  if (has('customizationEnabled')) {
    data.customizationEnabled = Boolean(body.customizationEnabled);
    if (!has('designerEnabled')) {
      data.designerEnabled = data.customizationEnabled;
    }
  }
  if (has('designerEnabled')) data.designerEnabled = Boolean(body.designerEnabled);
  if (has('trimColorEnabled')) data.trimColorEnabled = Boolean(body.trimColorEnabled);
  if (has('tapingColorEnabled')) data.tapingColorEnabled = Boolean(body.tapingColorEnabled);
  if (has('backDesignEnabled')) data.backDesignEnabled = Boolean(body.backDesignEnabled);
  if (has('embroideryEnabled')) data.embroideryEnabled = Boolean(body.embroideryEnabled);
  if (has('zipperEnabled')) data.zipperEnabled = Boolean(body.zipperEnabled);

  // Template validation: if customizationEnabled is true, a valid customizer template must be assigned
  // (unless it's an existing legacy product with customizerViews)
  if (data.customizationEnabled === true) {
    const templateId = data.customizerTemplateId ?? body.customizerTemplateId;
    const hasTemplate = templateId && isValidCustomizerTemplate(templateId);
    const hasLegacyViews = Boolean(data.customizerViews?.front?.image || body.customizerViews?.front?.image);
    if (!hasTemplate && !hasLegacyViews) {
      fail('Select a customizer template before enabling customization.');
    }

    if (templateId) {
      const template = getCustomizerTemplateById(templateId);
      if (template) {
        const capabilities = getTemplateCapabilities(template);
        if (data.trimColorEnabled === true && !capabilities.supportsTrimColor) {
          fail(`The selected template '${template.name}' does not support collar & rib color customization.`);
        }
        if (data.tapingColorEnabled === true && !capabilities.supportsTapingColor) {
          fail(`The selected template '${template.name}' does not support taping color customization.`);
        }
        if (data.backDesignEnabled === true && !capabilities.supportsBack) {
          fail(`The selected template '${template.name}' does not support back design.`);
        }
        if (data.embroideryEnabled === true && !capabilities.supportsEmbroidery) {
          fail(`The selected template '${template.name}' does not support embroidery.`);
        }
        if (data.zipperEnabled === true && !capabilities.supportsZipper) {
          fail(`The selected template '${template.name}' does not support zipper option.`);
        }
      }
    }
  }
  if (has('sizes')) data.sizes = uniqueStrings(body.sizes, 20, 20);
  if (has('colors')) data.colors = colorList(body.colors);
  if (has('highlights')) data.highlights = uniqueStrings(body.highlights, MAX_HIGHLIGHTS, 200);
  if (has('images')) data.images = urlList(body.images, 'Product images', MAX_PRODUCT_IMAGES);
  if (has('orderImages')) data.orderImages = ratedMedia(body.orderImages, 'Recent order images', MAX_ORDER_IMAGES, { keyword: 60, review: 300, description: 200 });
  if (has('videos')) data.videos = ratedMedia(body.videos, 'Product videos', MAX_PRODUCT_VIDEOS, { title: 80 });
  if (has('freeGift')) data.freeGift = freeGift(body.freeGift);
  if (has('offerAddon')) data.offerAddon = offerAddon(body.offerAddon);
  if (has('stockDeduction')) data.stockDeduction = stockDeduction(body.stockDeduction);
  if (has('customizerViews')) data.customizerViews = customizerViews(body.customizerViews);

  // A view photo must be one of the product's own photos when both are sent together.
  if (data.customizerViews && data.images) {
    const views = data.customizerViews as CustomizerViews;
    for (const [label, url] of [['front', views.front.image], ['back', views.back.image]] as const) {
      if (url && !data.images.includes(url)) fail(`The customizer ${label} image must be one of the product images.`);
    }
  }

  if (
    data.minOrderQty != null &&
    data.minSampleQty != null &&
    data.minSampleQty > data.minOrderQty
  ) {
    fail('Min. sample qty cannot be more than the min. order qty.');
  }

  return data;
}

/** Validates quantity ranges: positive, ordered and non-overlapping. Returns undefined when not supplied. */
export function normalizePricingRanges(value: unknown) {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) fail('Quantity range pricing must be a list.');
  const ranges = (value as any[]).map((row) => {
    const minQuantity = Number(row?.minQuantity);
    const rawMax = row?.maxQuantity;
    const maxQuantity = rawMax === '' || rawMax === undefined || rawMax === null ? 999999 : Number(rawMax);
    const pricePerUnit = Number(row?.pricePerUnit);
    if (!Number.isInteger(minQuantity) || minQuantity < 1) fail('Each quantity range needs a Min Qty of at least 1.');
    if (!Number.isInteger(maxQuantity) || maxQuantity < minQuantity) {
      fail('Each quantity range needs a Max Qty that is not below its Min Qty.');
    }
    if (!Number.isFinite(pricePerUnit) || pricePerUnit <= 0) fail('Each quantity range needs a price per piece above zero.');
    return { minQuantity, maxQuantity, pricePerUnit, printType: text(row?.printType, 80) || 'Front Only' };
  });
  const sorted = [...ranges].sort((a, b) => a.minQuantity - b.minQuantity);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].minQuantity <= sorted[i - 1].maxQuantity) fail('Quantity ranges must not overlap.');
  }
  return sorted;
}

const asArray = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

/** Colours a customer may choose: the admin's list, or (older products) the distinct variant colours. */
export function getAvailableColors(product: any): ProductColor[] {
  const configured = asArray<ProductColor>(product.colors).filter((c) => c && c.name);
  if (configured.length > 0) return configured.map((c) => ({ name: c.name, hex: c.hex || null }));
  const names = uniqueStrings(asArray<any>(product.variants).map((v) => v.color), 40, 40);
  return names.map((name) => ({ name, hex: null }));
}

/** Sizes a customer may choose. Empty when the product does not ask for a size. */
export function getAvailableSizes(product: any): string[] {
  if (product.requiresSize === false) return [];
  const configured = asArray<string>(product.sizes).filter(Boolean);
  if (configured.length > 0) return configured;
  return uniqueStrings(asArray<any>(product.variants).map((v) => v.size), 20, 20);
}

/** Minimum order quantity: the admin's value, else the first quantity range, else 1. */
export function getMinOrderQty(product: any): number {
  if (Number.isInteger(product.minOrderQty) && product.minOrderQty > 0) return product.minOrderQty;
  const mins = asArray<any>(product.bulkPricing).map((t) => t.minQuantity).filter((n) => Number.isFinite(n) && n > 0);
  return mins.length > 0 ? Math.min(...mins) : 1;
}

/**
 * Smallest quantity a customer may request. Only enforced when the admin set a Min. Order Qty:
 * Single/Both products can be ordered from 1 piece, Bulk-only products from the sample qty (when
 * configured) or the MOQ.
 */
export function getMinAllowedQty(product: any): number {
  if (!(Number.isInteger(product.minOrderQty) && product.minOrderQty > 0)) return 1;
  if (product.orderMode === 'BULK') {
    return Number.isInteger(product.minSampleQty) && product.minSampleQty > 0 ? product.minSampleQty : product.minOrderQty;
  }
  return 1;
}

export interface ReviewStats {
  rating: number | null;
  reviewCount: number;
}

/** Listing social proof: admin override when supplied, otherwise real published reviews. */
export function resolveSocialProof(product: any, reviews?: ReviewStats): ReviewStats {
  const actual = reviews || { rating: null, reviewCount: 0 };
  return {
    rating: product.ratingOverride ?? actual.rating,
    reviewCount: product.reviewCountOverride ?? actual.reviewCount,
  };
}

const publicGift = (value: any): FreeGift | null => (value && value.enabled ? value : null);
const publicAddon = (value: any): OfferAddon | null => (value && value.enabled && Number(value.price) > 0 ? value : null);

/**
 * Customer-facing product. Internal operational data (stock deduction config, stock counts,
 * raw social-proof overrides) is removed; derived display fields are added.
 */
export function toPublicProduct(product: any, reviews?: ReviewStats) {
  const {
    stockDeduction: _stockDeduction,
    stockCount,
    ratingOverride: _ratingOverride,
    reviewCountOverride: _reviewCountOverride,
    variants,
    ...rest
  } = product;
  const publicVariants = asArray<any>(variants).map(({ stock: _stock, ...variant }) => variant);
  const variantStock = asArray<any>(variants).reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
  const tierPrices = asArray<any>(product.bulkPricing).map((t) => t.pricePerUnit).filter((p) => p > 0);
  const customizable = product.customizationEnabled !== false && product.designerEnabled !== false;

  const template = getCustomizerTemplateById(product.customizerTemplateId);
  const capabilities = getTemplateCapabilities(template);

  const trimColor = (product.trimColorEnabled ?? capabilities.supportsTrimColor) && capabilities.supportsTrimColor;
  const taping = (product.tapingColorEnabled ?? false) && capabilities.supportsTapingColor;
  const back = (product.backDesignEnabled ?? capabilities.supportsBack) && capabilities.supportsBack;
  const embroidery = (product.embroideryEnabled ?? false) && capabilities.supportsEmbroidery;
  const zipper = (product.zipperEnabled ?? false) && capabilities.supportsZipper;

  const customizer = {
    enabled: customizable,
    trimColor: customizable && trimColor,
    taping: customizable && taping,
    back: customizable && back,
    embroidery: customizable && embroidery,
    zipper: customizable && zipper,
  };

  return {
    ...rest,
    variants: publicVariants,
    ...resolveSocialProof(product, reviews),
    availableColors: getAvailableColors(product),
    availableSizes: getAvailableSizes(product),
    moq: getMinOrderQty(product),
    minAllowedQty: getMinAllowedQty(product),
    startingPrice: Math.min(product.basePrice, ...tierPrices),
    inStock: (Number(stockCount) || 0) > 0 || variantStock > 0,
    customizable,
    customizerTemplateId: product.customizerTemplateId ?? null,
    customizerTemplate: template,
    customizer,
    trimColorEnabled: trimColor,
    tapingColorEnabled: taping,
    backDesignEnabled: back,
    embroideryEnabled: embroidery,
    zipperEnabled: zipper,
    orderImages: asArray<RatedMedia>(product.orderImages),
    videos: asArray<RatedMedia>(product.videos),
    freeGift: publicGift(product.freeGift),
    offerAddon: publicAddon(product.offerAddon),
  };
}

/** Staff see the stored record plus the same derived fields customers get. */
export function toAdminProduct(product: any, reviews?: ReviewStats) {
  const { rating: effectiveRating, reviewCount: effectiveReviewCount } = resolveSocialProof(product, reviews);
  const template = getCustomizerTemplateById(product.customizerTemplateId);
  const capabilities = getTemplateCapabilities(template);

  return {
    ...product,
    customizerTemplateId: product.customizerTemplateId ?? null,
    customizerTemplate: template,
    templateCapabilities: capabilities,
    trimColorEnabled: product.trimColorEnabled ?? capabilities.supportsTrimColor,
    tapingColorEnabled: product.tapingColorEnabled ?? false,
    backDesignEnabled: product.backDesignEnabled ?? capabilities.supportsBack,
    embroideryEnabled: product.embroideryEnabled ?? false,
    zipperEnabled: product.zipperEnabled ?? false,
    customizer: {
      enabled: product.customizationEnabled !== false && product.designerEnabled !== false,
      trimColor: (product.trimColorEnabled ?? capabilities.supportsTrimColor) && capabilities.supportsTrimColor,
      taping: (product.tapingColorEnabled ?? false) && capabilities.supportsTapingColor,
      back: (product.backDesignEnabled ?? capabilities.supportsBack) && capabilities.supportsBack,
      embroidery: (product.embroideryEnabled ?? false) && capabilities.supportsEmbroidery,
      zipper: (product.zipperEnabled ?? false) && capabilities.supportsZipper,
    },
    rating: effectiveRating,
    reviewCount: effectiveReviewCount,
    availableColors: getAvailableColors(product),
    availableSizes: getAvailableSizes(product),
    moq: getMinOrderQty(product),
  };
}

export interface StockLine {
  color?: string | null;
  quantity: number;
}

/**
 * Internal stock deduction for an order: every ordered piece reduces the product stock count,
 * and each line's colour is matched (case-insensitively) to the stock type it is mapped to.
 * Stock never goes below zero. Returns the new values without touching the database.
 */
export function planStockDeduction(product: { stockCount?: number | null; stockDeduction?: unknown }, lines: StockLine[]) {
  const total = lines.reduce((sum, line) => sum + (Number(line.quantity) || 0), 0);
  const stockCount = Math.max(0, (Number(product.stockCount) || 0) - total);

  const config = product.stockDeduction as StockDeduction | null | undefined;
  if (!config || !config.enabled || !Array.isArray(config.pools)) {
    return { stockCount, stockDeduction: config ?? null, deducted: [] as Array<{ stockType: string; quantity: number }> };
  }

  const pools = config.pools.map((pool) => ({ ...pool, colors: [...(pool.colors || [])] }));
  const deducted: Array<{ stockType: string; quantity: number }> = [];
  for (const line of lines) {
    const color = (line.color || '').trim().toLowerCase();
    const quantity = Number(line.quantity) || 0;
    if (!color || quantity <= 0) continue;
    const pool = pools.find((p) => p.colors.some((c) => c.trim().toLowerCase() === color));
    if (!pool) continue;
    pool.stock = Math.max(0, (Number(pool.stock) || 0) - quantity);
    const entry = deducted.find((d) => d.stockType === pool.stockType);
    if (entry) entry.quantity += quantity;
    else deducted.push({ stockType: pool.stockType, quantity });
  }

  return { stockCount, stockDeduction: { ...config, pools }, deducted };
}
