// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getOrderDesignAssets,
  getOptimizedThumbnailUrl,
  getAssetExtension,
  downloadDesignAsset,
} from '../components/orders/OrderDesignAssets';

describe('OrderDesignAssets Helper and Resolution Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // A. Order with original artwork
  it('A. Resolves customer-uploaded artwork when present', () => {
    const order = {
      orderNumber: 'ZQB-ORD-2026-5015',
      artworkUrl: 'https://res.cloudinary.com/e3sasmyr/image/upload/v1790249747/zobbra/artwork.jpg',
      customer: { name: 'Ajay Singh' },
      items: [{ product: { name: 'Polo Shirt' } }],
    };

    const assets = getOrderDesignAssets(order);
    expect(assets).toHaveLength(1);
    expect(assets[0]).toEqual({
      type: 'artwork',
      label: 'Artwork',
      title: 'Customer Artwork',
      url: 'https://res.cloudinary.com/e3sasmyr/image/upload/v1790249747/zobbra/artwork.jpg',
      orderNumber: 'ZQB-ORD-2026-5015',
      productName: 'Polo Shirt',
      customerName: 'Ajay Singh',
    });
  });

  // B. Order with front preview
  it('B. Resolves front design preview when present', () => {
    const order = {
      orderNumber: 'ZQB-ORD-2026-5015',
      previewFrontUrl: 'https://res.cloudinary.com/e3sasmyr/image/upload/v1790249754/zobbra/front.png',
      customer: { name: 'Ajay Singh' },
      items: [{ product: { name: 'Polo Shirt' } }],
    };

    const assets = getOrderDesignAssets(order);
    expect(assets).toHaveLength(1);
    expect(assets[0].type).toBe('front');
    expect(assets[0].label).toBe('Front');
    expect(assets[0].url).toContain('front.png');
  });

  // C. Order with back preview
  it('C. Resolves back design preview when present', () => {
    const order = {
      orderNumber: 'ZQB-ORD-2026-5015',
      previewBackUrl: 'https://res.cloudinary.com/e3sasmyr/image/upload/v1790249755/zobbra/back.png',
      customer: { name: 'Ajay Singh' },
      items: [{ product: { name: 'Polo Shirt' } }],
    };

    const assets = getOrderDesignAssets(order);
    expect(assets).toHaveLength(1);
    expect(assets[0].type).toBe('back');
    expect(assets[0].label).toBe('Back');
    expect(assets[0].url).toContain('back.png');
  });

  // D. Order without artwork
  it('D. Returns empty array for orders without any artwork or previews (no placeholder)', () => {
    const plainOrder = {
      orderNumber: 'ZQB-ORD-2026-5014',
      artworkUrl: null,
      previewFrontUrl: null,
      previewBackUrl: null,
      customer: { name: 'Customer A' },
      items: [{ product: { name: 'Standard Polo', images: ['https://catalog.image.jpg'] } }],
    };

    const assets = getOrderDesignAssets(plainOrder);
    expect(assets).toEqual([]);
  });

  // E. Multiple order items
  it('E. Maintains item-level isolation so each item has its own artwork in multi-item orders', () => {
    const multiItemOrder = {
      orderNumber: 'ZQB-ORD-2026-9999',
      items: [
        {
          id: 'item-1',
          artworkUrl: 'https://res.cloudinary.com/e3sasmyr/image/upload/v1/item1_logo.png',
          product: { name: 'Custom Hoodie' },
        },
        {
          id: 'item-2',
          customizationDetails: 'Artwork: https://res.cloudinary.com/e3sasmyr/image/upload/v1/item2_badge.jpg',
          product: { name: 'Custom Cap' },
        },
        {
          id: 'item-3',
          product: { name: 'Plain T-Shirt' }, // No artwork
        },
      ],
    };

    const item1Assets = getOrderDesignAssets(multiItemOrder, multiItemOrder.items[0]);
    expect(item1Assets).toHaveLength(1);
    expect(item1Assets[0].url).toContain('item1_logo.png');

    const item2Assets = getOrderDesignAssets(multiItemOrder, multiItemOrder.items[1]);
    expect(item2Assets).toHaveLength(1);
    expect(item2Assets[0].url).toContain('item2_badge.jpg');

    const item3Assets = getOrderDesignAssets(multiItemOrder, multiItemOrder.items[2]);
    expect(item3Assets).toHaveLength(0); // Item 3 has NO artwork
  });

  // H. Catalog product image remains separate from customer artwork
  it('H. Never substitutes catalog product image for customer artwork', () => {
    const orderWithCatalogOnly = {
      orderNumber: 'ZQB-ORD-2026-1234',
      items: [
        {
          product: {
            name: 'Pique Polo',
            images: ['https://res.cloudinary.com/catalog/polo_black.jpg'],
          },
        },
      ],
    };

    const assets = getOrderDesignAssets(orderWithCatalogOnly);
    expect(assets).toEqual([]);
    expect(assets.some((a) => a.url.includes('polo_black.jpg'))).toBe(false);
  });

  // All 3 assets present
  it('Resolves all three assets (Artwork, Front, Back) when all are present', () => {
    const completeOrder = {
      orderNumber: 'ZQB-ORD-2026-5015',
      artworkUrl: 'https://res.cloudinary.com/zobbra/art.jpg',
      previewFrontUrl: 'https://res.cloudinary.com/zobbra/front.png',
      previewBackUrl: 'https://res.cloudinary.com/zobbra/back.png',
      customer: { name: 'Ajay Singh' },
      items: [{ product: { name: 'Corporate Polo' } }],
    };

    const assets = getOrderDesignAssets(completeOrder);
    expect(assets).toHaveLength(3);
    expect(assets.map((a) => a.type)).toEqual(['artwork', 'front', 'back']);
  });

  // Cloudinary thumbnail optimization
  it('Generates optimized Cloudinary thumbnail URLs', () => {
    const cdnUrl = 'https://res.cloudinary.com/e3sasmyr/image/upload/v1790249747/zobbra/cq39d0dcahdhoyfgobli.jpg';
    const thumb = getOptimizedThumbnailUrl(cdnUrl, 80);
    expect(thumb).toContain('/upload/c_scale,w_80,q_auto,f_auto/');
  });

  // File extension detection
  it('Extracts correct file extensions including pdf, png, jpg, webp', () => {
    expect(getAssetExtension('https://cdn.com/art.PNG?foo=bar')).toBe('png');
    expect(getAssetExtension('https://cdn.com/logo.jpeg')).toBe('jpg');
    expect(getAssetExtension('https://cdn.com/vector.svg')).toBe('svg');
    expect(getAssetExtension('https://cdn.com/brief.pdf#page=1')).toBe('pdf');
  });

  // G. Download artwork
  it('G. Triggers browser download with expected filename format', async () => {
    const fakeBlob = new Blob(['image data'], { type: 'image/png' });
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: async () => fakeBlob,
    } as any);

    const mockCreateObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    const mockRevokeObjectURL = vi.fn();
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    const clickedElements: any[] = [];
    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const el = origCreateElement(tagName);
      if (tagName === 'a') {
        el.click = vi.fn(() => clickedElements.push(el));
      }
      return el;
    });

    const success = await downloadDesignAsset(
      'https://res.cloudinary.com/e3sasmyr/image/upload/v1/art.png',
      'ZQB-ORD-2026-5015',
      'artwork'
    );

    expect(success).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://res.cloudinary.com/e3sasmyr/image/upload/v1/art.png',
      { mode: 'cors' }
    );
    expect(mockCreateObjectURL).toHaveBeenCalledWith(fakeBlob);
    expect(clickedElements).toHaveLength(1);
    expect(clickedElements[0].download).toBe('ZOBBRA-ZQB-ORD-2026-5015-artwork.png');
  });
});
