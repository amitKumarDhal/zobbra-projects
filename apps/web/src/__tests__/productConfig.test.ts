import { describe, expect, it } from 'vitest';
import {
  allowsBulkOrder,
  canCustomize,
  getDefaultQuantity,
  getFreeGift,
  getMoq,
  getOfferAddon,
  getProductColors,
  getProductCollarColors,
  getProductSizes,
  getSocialProof,
  getStartingPrice,
  getUnitPrice,
  getVideoPoster,
  getWatchAndBuyVideos,
  productRequiresSize,
} from '../lib/productConfig';

/** A product as the customer API returns it for an admin-configured cap. */
const cap = {
  id: 'p1',
  name: 'DEV FULL PRODUCT TEST',
  basePrice: 299,
  requiresSize: false,
  orderMode: 'BOTH',
  customizationEnabled: true,
  designerEnabled: true,
  customizable: true,
  moq: 10,
  minAllowedQty: 1,
  availableColors: [
    { name: 'Matte Black', hex: '#1C1C1E' },
    { name: 'Classic White', hex: '#F9FAFB' },
    { name: 'Navy Blue', hex: '#0D1333' },
  ],
  availableSizes: [],
  bulkPricing: [
    { minQuantity: 10, maxQuantity: 49, pricePerUnit: 299 },
    { minQuantity: 50, maxQuantity: 99, pricePerUnit: 279 },
    { minQuantity: 100, maxQuantity: 999999, pricePerUnit: 259 },
  ],
  rating: 4.8,
  reviewCount: 154,
};

describe('product colours reach the customizer', () => {
  it('returns exactly the colours configured for the product, with their colour values', () => {
    expect(getProductColors(cap)).toEqual([
      { name: 'Matte Black', hex: '#1C1C1E' },
      { name: 'Classic White', hex: '#F9FAFB' },
      { name: 'Navy Blue', hex: '#0D1333' },
    ]);
  });

  it('never adds colours the product does not have', () => {
    const names = getProductColors(cap).map((c) => c.name);
    for (const unrelated of ['Lime', 'Hot Pink', 'Purple', 'Yellow']) expect(names).not.toContain(unrelated);
  });

  it('older products without a colour list use their distinct variant colours', () => {
    const legacy = { variants: [{ color: 'Black', size: 'M' }, { color: 'black', size: 'L' }, { color: 'Red', size: 'M' }] };
    expect(getProductColors(legacy).map((c) => c.name)).toEqual(['Black', 'Red']);
  });

  it('a colour without a value falls back to the name lookup', () => {
    expect(getProductColors({ availableColors: [{ name: 'Navy Blue', hex: null }] })[0].hex).toBe('#0D1333');
  });

  it('resolves collar colors from secondaryColors or falls back to product colors', () => {
    const withCustomSecondary = {
      availableColors: [{ name: 'White', hex: '#FFFFFF' }, { name: 'Navy', hex: '#0D1333' }],
      customizerViews: {
        secondaryColors: [{ name: 'Yellow', hex: '#FFD700' }, { name: 'White', hex: '#FFFFFF' }],
      },
    };
    expect(getProductCollarColors(withCustomSecondary)).toEqual([
      { name: 'Yellow', hex: '#FFD700' },
      { name: 'White', hex: '#FFFFFF' },
    ]);

    const fallbackToMain = {
      availableColors: [{ name: 'White', hex: '#FFFFFF' }, { name: 'Red', hex: '#FF0000' }],
    };
    expect(getProductCollarColors(fallbackToMain)).toEqual([
      { name: 'White', hex: '#FFFFFF' },
      { name: 'Red', hex: '#FF0000' },
    ]);

    expect(getProductCollarColors(null)).toEqual([]);
  });
});

describe('product sizes and requiresSize', () => {
  const tee = { requiresSize: true, availableSizes: ['S', 'M', 'XL'] };

  it('returns the configured sizes when the product asks for a size', () => {
    expect(productRequiresSize(tee)).toBe(true);
    expect(getProductSizes(tee)).toEqual(['S', 'M', 'XL']);
  });

  it('requiresSize = false means no size selection, whatever sizes or variants exist', () => {
    expect(productRequiresSize(cap)).toBe(false);
    expect(getProductSizes({ requiresSize: false, sizes: ['S', 'M'], variants: [{ size: 'Free Size' }] })).toEqual([]);
  });

  it('comes from the product, not from the category template: a sized product in a one-size category still asks', () => {
    const sizedCap = { requiresSize: true, availableSizes: ['S/M', 'L/XL'], category: { slug: 'caps' } };
    expect(productRequiresSize(sizedCap)).toBe(true);
    expect(getProductSizes(sizedCap)).toEqual(['S/M', 'L/XL']);
  });
});

describe('customization availability', () => {
  it('strictly requires explicit customizationEnabled === true', () => {
    // 1. customizationEnabled = true → true
    expect(canCustomize({ customizationEnabled: true })).toBe(true);
    expect(canCustomize(cap)).toBe(true);

    // 2. customizationEnabled = false → false
    expect(canCustomize({ customizationEnabled: false })).toBe(false);
    expect(canCustomize({ customizationEnabled: false, designerEnabled: true })).toBe(false);

    // 3. customizationEnabled = undefined → false
    expect(canCustomize({ customizationEnabled: undefined })).toBe(false);
    expect(canCustomize({ customizationEnabled: undefined, designerEnabled: true })).toBe(false);

    // 4. customizationEnabled omitted → false
    expect(canCustomize({})).toBe(false);
    expect(canCustomize({ id: 'legacy' })).toBe(false);
    expect(canCustomize({ designerEnabled: true })).toBe(false);

    // Extra safety guards
    expect(canCustomize({ customizationEnabled: true, designerEnabled: false })).toBe(false);
    expect(canCustomize({ customizable: false, customizationEnabled: true, designerEnabled: true })).toBe(false);
    expect(canCustomize(null)).toBe(false);
  });
});

describe('pricing follows the admin quantity ranges', () => {
  it('uses the reached range, the base price below the first range, and the last range above it', () => {
    expect(getUnitPrice(cap, 1)).toBe(299);
    expect(getUnitPrice(cap, 10)).toBe(299);
    expect(getUnitPrice(cap, 50)).toBe(279);
    expect(getUnitPrice(cap, 99)).toBe(279);
    expect(getUnitPrice(cap, 100)).toBe(259);
    expect(getUnitPrice(cap, 5000)).toBe(259);
  });

  it('uses the base price when no ranges are configured', () => {
    expect(getUnitPrice({ basePrice: 80 }, 500)).toBe(80);
  });

  it('starting price and MOQ come from the product', () => {
    expect(getStartingPrice(cap)).toBe(259);
    expect(getMoq(cap)).toBe(10);
    expect(getMoq({ bulkPricing: [{ minQuantity: 25, pricePerUnit: 10 }] })).toBe(25);
  });
});

describe('order mode', () => {
  it('single-only products start at 1 piece and hide bulk controls', () => {
    const single = { ...cap, orderMode: 'SINGLE' };
    expect(allowsBulkOrder(single)).toBe(false);
    expect(getDefaultQuantity(single)).toBe(1);
  });

  it('bulk and both-mode products start at the MOQ', () => {
    expect(allowsBulkOrder(cap)).toBe(true);
    expect(getDefaultQuantity(cap)).toBe(10);
    expect(getDefaultQuantity({ ...cap, orderMode: 'BULK', minAllowedQty: 10 })).toBe(10);
  });
});

describe('customer-facing content', () => {
  it('social proof is hidden when the product has no rating', () => {
    expect(getSocialProof(cap)).toEqual({ rating: 4.8, reviewCount: 154 });
    expect(getSocialProof({ rating: null, reviewCount: 0 })).toBeNull();
  });

  it('Watch & Buy shows the first two videos in admin order', () => {
    const videos = ['a', 'b', 'c'].map((v) => ({ url: `https://res.cloudinary.com/x/video/upload/v1/${v}.mp4`, rating: 5 }));
    expect(getWatchAndBuyVideos({ videos }).map((v) => v.url)).toEqual([videos[0].url, videos[1].url]);
    expect(getVideoPoster(videos[0].url)).toBe('https://res.cloudinary.com/x/video/upload/v1/a.jpg');
    expect(getVideoPoster('https://example.com/a.mp4')).toBeUndefined();
  });

  it('free gift and addon are only offered when enabled', () => {
    expect(getFreeGift({ freeGift: { enabled: false, title: 'x' } })).toBeNull();
    expect(getFreeGift({ freeGift: { enabled: true, title: 'Stickers', minQuantity: 50 } }, 10)).toBeNull();
    expect(getFreeGift({ freeGift: { enabled: true, title: 'Stickers', minQuantity: 50 } }, 50)?.title).toBe('Stickers');
    expect(getOfferAddon({ offerAddon: { enabled: false, title: 'Box', price: 15 } })).toBeNull();
    expect(getOfferAddon({ offerAddon: { enabled: true, title: 'Box', price: 15, priceType: 'PER_PIECE' } })).toMatchObject({
      price: 15,
      priceType: 'PER_PIECE',
    });
  });
});
