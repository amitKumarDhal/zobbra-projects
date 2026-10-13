import { describe, it, expect } from 'vitest';
import { getCustomizerTemplate } from '../lib/customizerTemplates';

describe('Customizer Template Resolver Suite', () => {
  it('correctly resolves T-Shirt / Polo product to tshirt template', () => {
    const poloProduct = {
      id: 'a12f4ddf-68c0-4aed-9666-03b656008b21',
      name: 'Classic Corporate Polo T-Shirt',
      slug: 'classic-corporate-polo-tshirt',
      category: {
        id: 'cat-1',
        name: 'T-Shirts & Polos',
        slug: 't-shirts',
      },
    };

    const template = getCustomizerTemplate(poloProduct);
    expect(template.type).toBe('tshirt');
    expect(template.supportsBack).toBe(true);
    expect(template.colorLabel).toBe('BODY COLOR');
    expect(template.secondaryColorLabel).toBe('COLLAR & RIB COLOR');
    expect(template.frontPrintableArea.width).toBe(210);
    expect(template.frontPrintableArea.height).toBe(300);
    expect(template.backPrintableArea).toBeDefined();
    expect(template.backPrintableArea?.width).toBe(210);
  });

  it('correctly resolves Cap / Headwear product to cap template', () => {
    const capProduct = {
      id: 'b28f9bbf-1eec-4ee6-bbb0-0b1a2f616812',
      name: 'Classic Promotional Structured Cotton Cap',
      slug: 'classic-promotional-cotton-cap',
      category: {
        id: 'cat-2',
        name: 'Caps & Headwear',
        slug: 'caps',
      },
    };

    const template = getCustomizerTemplate(capProduct);
    expect(template.type).toBe('cap');
    expect(template.supportsBack).toBe(true);
    expect(template.colorLabel).toBe('CROWN COLOR');
    expect(template.secondaryColorLabel).toBe('VISOR / BRIM COLOR');
    expect(template.addTextButtonLabel).toBe('+ Add Text to Cap');
    expect(template.frontPrintableArea.label).toContain('Embroidery Area');
    expect(template.frontPrintableArea.width).toBe(200);
    expect(template.frontPrintableArea.height).toBe(115);
  });

  it('falls back to the generic template for discontinued categories (mugs, bags, hoodies)', () => {
    const discontinued = [
      { name: 'Classic Corporate Ceramic Coffee Mug', slug: 'classic-corporate-ceramic-mug', category: { name: 'Mugs & Bottles', slug: 'drinkware' } },
      { name: 'Executive Corporate Laptop Backpack', slug: 'executive-corporate-laptop-backpack', category: { name: 'Bags & Backpacks', slug: 'bags' } },
      { name: 'Premium Heavyweight Pullover Hoodie', slug: 'premium-heavyweight-pullover-hoodie', category: { name: 'Hoodies & Sweatshirts', slug: 'hoodies' } },
    ];
    for (const product of discontinued) {
      expect(getCustomizerTemplate(product).type, product.name).toBe('generic');
    }
  });

  it('provides safe, non-crashing generic template for unmapped products', () => {
    const customPen = {
      id: 'prod-pen-1',
      name: 'Executive Metallic Rollerball Pen',
      slug: 'executive-metallic-pen',
      category: {
        name: 'Stationery',
        slug: 'stationery',
      },
    };

    const template = getCustomizerTemplate(customPen);
    expect(template).toBeDefined();
    expect(template.type).toBe('generic');
    expect(template.frontPrintableArea.width).toBeGreaterThan(0);
    expect(template.frontPrintableArea.height).toBeGreaterThan(0);
  });
});

describe('Customizer Template Resolver - false positive guards', () => {
  it('does not treat substrings such as "capacity" as caps', () => {
    const t = getCustomizerTemplate({
      name: 'High Capacity Notebook',
      slug: 'high-capacity-notebook',
      category: { name: 'Stationery', slug: 'stationery' },
    });
    expect(t.type).toBe('generic');
  });

  it('prefers the category over ambiguous product names', () => {
    const t = getCustomizerTemplate({
      name: 'Cap Sleeve Tee',
      slug: 'cap-sleeve-tee',
      category: { name: 'T-Shirts', slug: 't-shirts' },
    });
    expect(t.type).toBe('tshirt');
  });
});
