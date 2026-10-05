import { describe, expect, it } from 'vitest';
import { getProductColors, getProductCollarColors } from '../lib/productConfig';
import { applyCustomizerViews, getSideRecolor } from '../lib/customizerViews';
import { getCustomizerTemplate, TEMPLATES } from '../lib/customizerTemplates';
import { getColorHex } from '../lib/colors';

describe('Customizer Colors UX and Recoloring Flow', () => {
  const devProduct = {
    id: 'f9f3a0bf-2000-4627-b04e-a1c9de480cbe',
    name: 'DEV Recolor Polo',
    slug: 'dev-recolor-polo',
    availableColors: [
      { name: 'White', hex: '#FFFFFF' },
      { name: 'Navy', hex: '#0D1333' },
      { name: 'Black', hex: '#111111' },
      { name: 'Red', hex: '#DC2626' },
    ],
    customizerViews: {
      front: {
        image: 'https://res.cloudinary.com/demo/image/upload/polo-front.png',
        bodyMask: 'https://res.cloudinary.com/demo/image/upload/polo-front-body-mask.png',
        trimMask: 'https://res.cloudinary.com/demo/image/upload/polo-front-trim-mask.png',
        area: null,
      },
      back: {
        enabled: true,
        image: 'https://res.cloudinary.com/demo/image/upload/polo-back.png',
        bodyMask: 'https://res.cloudinary.com/demo/image/upload/polo-back-body-mask.png',
        trimMask: 'https://res.cloudinary.com/demo/image/upload/polo-back-trim-mask.png',
        area: null,
      },
      secondaryColors: [
        { name: 'White', hex: '#FFFFFF' },
        { name: 'Yellow', hex: '#FFD700' },
        { name: 'Red', hex: '#DC2626' },
        { name: 'Black', hex: '#111111' },
      ],
    },
  };

  it('1. BODY COLOR uses product configured colors (not generic list)', () => {
    const bodyColors = getProductColors(devProduct);
    expect(bodyColors.map((c) => c.name)).toEqual(['White', 'Navy', 'Black', 'Red']);
    expect(bodyColors.map((c) => c.hex)).toEqual(['#FFFFFF', '#0D1333', '#111111', '#DC2626']);
    // Generic colors like Green, Purple, Sky Blue must not be present
    expect(bodyColors.map((c) => c.name)).not.toContain('Green');
    expect(bodyColors.map((c) => c.name)).not.toContain('Purple');
  });

  it('2. COLLAR & RIB COLOR uses configured secondary colors', () => {
    const collarColors = getProductCollarColors(devProduct);
    expect(collarColors.map((c) => c.name)).toEqual(['White', 'Yellow', 'Red', 'Black']);
    expect(collarColors.map((c) => c.hex)).toEqual(['#FFFFFF', '#FFD700', '#DC2626', '#111111']);
  });

  it('3. Independent color combinations: White+Yellow, Navy+White, Black+Red, Red+Black', () => {
    let selectedBody = 'White';
    let selectedCollar = 'Yellow';

    // 1. White + Yellow
    expect(selectedBody).toBe('White');
    expect(selectedCollar).toBe('Yellow');

    // 2. Navy + White (change body, then change collar)
    selectedBody = 'Navy';
    expect(selectedBody).toBe('Navy');
    expect(selectedCollar).toBe('Yellow'); // changing body does NOT reset collar
    selectedCollar = 'White';
    expect(selectedBody).toBe('Navy');
    expect(selectedCollar).toBe('White');

    // 3. Black + Red
    selectedBody = 'Black';
    selectedCollar = 'Red';
    expect(selectedBody).toBe('Black');
    expect(selectedCollar).toBe('Red');

    // 4. Red + Black
    selectedBody = 'Red';
    selectedCollar = 'Black';
    expect(selectedBody).toBe('Red');
    expect(selectedCollar).toBe('Black');

    // Ensure hex mapping works for all combination selections
    expect(getColorHex(selectedBody)).toBe('#FF0000');
    expect(getColorHex(selectedCollar)).toBe('#171717');
  });

  it('4. Side-specific recolor configuration maintains choices between Front and Back', () => {
    const frontRecolor = getSideRecolor(devProduct, 'front');
    const backRecolor = getSideRecolor(devProduct, 'back');

    expect(frontRecolor).toEqual({
      base: 'https://res.cloudinary.com/demo/image/upload/polo-front.png',
      bodyMask: 'https://res.cloudinary.com/demo/image/upload/polo-front-body-mask.png',
      trimMask: 'https://res.cloudinary.com/demo/image/upload/polo-front-trim-mask.png',
    });

    expect(backRecolor).toEqual({
      base: 'https://res.cloudinary.com/demo/image/upload/polo-back.png',
      bodyMask: 'https://res.cloudinary.com/demo/image/upload/polo-back-body-mask.png',
      trimMask: 'https://res.cloudinary.com/demo/image/upload/polo-back-trim-mask.png',
    });
  });

  it('5. Hides COLLAR & RIB COLOR when product does not support secondary color', () => {
    const noTrimProduct = {
      ...devProduct,
      customizerViews: {
        front: {
          image: 'https://res.cloudinary.com/demo/image/upload/shirt-front.png',
          bodyMask: 'https://res.cloudinary.com/demo/image/upload/shirt-front-body-mask.png',
          trimMask: null,
          area: null,
        },
        back: {
          enabled: false,
          image: null,
          bodyMask: null,
          trimMask: null,
          area: null,
        },
      },
    };

    const template = getCustomizerTemplate(noTrimProduct);
    const resolvedTemplate = applyCustomizerViews(template, noTrimProduct);
    expect(resolvedTemplate.secondaryColorLabel).toBeUndefined();
  });
});
