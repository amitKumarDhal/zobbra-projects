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

  it('correctly resolves Mug / Drinkware product to mug template', () => {
    const mugProduct = {
      id: 'f973411d-2eca-46df-9fd1-8881b485423c',
      name: 'Classic Corporate Ceramic Coffee Mug',
      slug: 'classic-corporate-ceramic-mug',
      category: {
        id: 'cat-3',
        name: 'Mugs & Bottles',
        slug: 'drinkware',
      },
    };

    const template = getCustomizerTemplate(mugProduct);
    expect(template.type).toBe('mug');
    expect(template.supportsBack).toBe(true);
    expect(template.colorLabel).toBe('MUG COLOR');
    expect(template.addTextButtonLabel).toBe('+ Add Text to Mug');
    expect(template.frontPrintableArea.label).toContain('Print Area');
    expect(template.frontPrintableArea.width).toBe(190);
    expect(template.frontPrintableArea.height).toBe(190);
  });

  it('correctly resolves Bag / Backpack product to bag template', () => {
    const bagProduct = {
      id: '2ecf1df7-8183-4331-a873-29b315d3f63a',
      name: 'Executive Corporate Laptop Backpack',
      slug: 'executive-corporate-laptop-backpack',
      category: {
        id: 'cat-4',
        name: 'Bags & Backpacks',
        slug: 'bags',
      },
    };

    const template = getCustomizerTemplate(bagProduct);
    expect(template.type).toBe('bag');
    expect(template.supportsBack).toBe(true);
    expect(template.colorLabel).toBe('BAG COLOR');
    expect(template.addTextButtonLabel).toBe('+ Add Text to Bag');
    expect(template.frontPrintableArea.label).toContain('Branding Area');
    expect(template.frontPrintableArea.width).toBe(190);
    expect(template.frontPrintableArea.height).toBe(170);
  });

  it('correctly resolves future/other categories like Hoodie', () => {
    const hoodieProduct = {
      id: 'prod-hoodie-1',
      name: 'Premium Heavyweight Pullover Hoodie',
      slug: 'premium-heavyweight-pullover-hoodie',
      category: {
        name: 'Hoodies & Sweatshirts',
        slug: 'hoodies',
      },
    };

    const template = getCustomizerTemplate(hoodieProduct);
    expect(template.type).toBe('hoodie');
    expect(template.supportsBack).toBe(true);
    expect(template.addTextButtonLabel).toBe('+ Add Text to Hoodie');
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
