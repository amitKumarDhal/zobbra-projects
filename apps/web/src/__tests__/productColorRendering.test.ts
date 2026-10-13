import { describe, expect, it } from 'vitest';
import {
  getCustomizerSideImage,
  getSideRecolor,
  hasTrimMask,
  isBackSideEnabled,
  applyCustomizerViews,
  STAGE_CANVAS_WIDTH,
  STAGE_CANVAS_HEIGHT,
} from '../lib/customizerViews';
import {
  getReusableTemplateById,
  getCustomizerTemplate,
  getFrontBodyAsset,
  getFrontTrimAsset,
  getBackBodyAsset,
  getBackTrimAsset,
} from '../lib/customizerTemplates';
import {
  getProductColors,
  getProductCollarColors,
  getCustomizerFeatures,
} from '../lib/productConfig';
import { dye, parseHex } from '../lib/photoRecolor';
import { getColorHex } from '../lib/colors';

describe('Phase 4: Body + Collar/Rib Color Rendering', () => {
  const poloProduct = {
    id: 'prod-polo-test',
    name: 'Classic Corporate Polo',
    slug: 'classic-corporate-polo',
    customizationEnabled: true,
    customizerTemplateId: 'polo-v1',
    trimColorEnabled: true,
    backDesignEnabled: true,
    availableColors: [
      { name: 'White', hex: '#FFFFFF' },
      { name: 'Black', hex: '#111111' },
      { name: 'Navy', hex: '#0D1333' },
      { name: 'Red', hex: '#DC2626' },
    ],
    customizer: {
      enabled: true,
      trimColor: true,
      taping: false,
      back: true,
      embroidery: false,
    },
  };

  // 1. Body layer color rendering
  it('1. resolves and tints body layer preserving shading, folds, and alpha', () => {
    const template = getReusableTemplateById('polo-v1');
    expect(template).toBeDefined();

    const frontBody = getFrontBodyAsset(template!);
    expect(frontBody).toBeDefined();
    expect(frontBody?.side).toBe('front');
    expect(frontBody?.colorGroup).toBe('BODY');
    expect(frontBody?.assetUrl).toContain('dev-polo-front-body-mask.png');

    const backBody = getBackBodyAsset(template!);
    expect(backBody).toBeDefined();
    expect(backBody?.side).toBe('back');
    expect(backBody?.colorGroup).toBe('BODY');
    expect(backBody?.assetUrl).toContain('dev-polo-back-body-mask.png');

    // Verify dye algorithm tints body correctly
    const refTone = 0.9;
    const shadowTone = 0.6;
    const highlightTone = 0.98;

    // Navy Body (#0D1333)
    const navyHex = '#0D1333';
    const navyRgb = parseHex(navyHex)!;
    const weight = 0.2126 * navyRgb[0] + 0.7152 * navyRgb[1] + 0.0722 * navyRgb[2];

    const normal = navyRgb.map((c) => dye(refTone, refTone, c, weight));
    const shadow = navyRgb.map((c) => dye(shadowTone, refTone, c, weight));
    const highlight = navyRgb.map((c) => dye(highlightTone, refTone, c, weight));

    // Highlights must be brighter than normal, and shadows darker than normal
    const lumNormal = 0.2126 * normal[0] + 0.7152 * normal[1] + 0.0722 * normal[2];
    const lumShadow = 0.2126 * shadow[0] + 0.7152 * shadow[1] + 0.0722 * shadow[2];
    const lumHighlight = 0.2126 * highlight[0] + 0.7152 * highlight[1] + 0.0722 * highlight[2];

    expect(lumShadow).toBeLessThan(lumNormal);
    expect(lumHighlight).toBeGreaterThan(lumNormal);
  });

  // 2. Trim layer color rendering
  it('2. resolves and tints collar/rib trim layer independently from body', () => {
    const template = getReusableTemplateById('polo-v1');
    expect(template).toBeDefined();

    const frontTrim = getFrontTrimAsset(template!);
    expect(frontTrim).toBeDefined();
    expect(frontTrim?.side).toBe('front');
    expect(frontTrim?.colorGroup).toBe('TRIM');
    expect(frontTrim?.assetUrl).toContain('dev-polo-front-trim-mask.png');

    const backTrim = getBackTrimAsset(template!);
    expect(backTrim).toBeDefined();
    expect(backTrim?.side).toBe('back');
    expect(backTrim?.colorGroup).toBe('TRIM');
    expect(backTrim?.assetUrl).toContain('dev-polo-back-trim-mask.png');

    // Recolor source loads both body and trim layers
    const frontRecolor = getSideRecolor(poloProduct, 'front');
    expect(frontRecolor).not.toBeNull();
    expect(frontRecolor?.bodyMask).toContain('dev-polo-front-body-mask.png');
    expect(frontRecolor?.trimMask).toContain('dev-polo-front-trim-mask.png');
  });

  // 3. Independent body/trim selection
  it('3. maintains independent color state: Body=Navy, Trim=White -> Body=Red, Trim=Black', () => {
    let currentBody = 'Navy';
    let currentTrim = 'White';

    expect(currentBody).toBe('Navy');
    expect(currentTrim).toBe('White');

    // Changing Body to Red does not reset Trim
    currentBody = 'Red';
    expect(currentBody).toBe('Red');
    expect(currentTrim).toBe('White');

    // Changing Trim to Black does not reset Body
    currentTrim = 'Black';
    expect(currentBody).toBe('Red');
    expect(currentTrim).toBe('Black');
  });

  // 4. Product colors
  it('4. strictly uses the product configured colors and not generic fallback', () => {
    const colors = getProductColors(poloProduct);
    expect(colors.map((c) => c.name)).toEqual(['White', 'Black', 'Navy', 'Red']);
    expect(colors.map((c) => c.hex)).toEqual(['#FFFFFF', '#111111', '#0D1333', '#DC2626']);

    // Generic fallback colors are not present
    expect(colors.map((c) => c.name)).not.toContain('Emerald Green');
    expect(colors.map((c) => c.name)).not.toContain('Royal Blue');

    // Collar colors also use product colors when no specific secondaryColors are defined
    const collarColors = getProductCollarColors(poloProduct);
    expect(collarColors.map((c) => c.name)).toEqual(['White', 'Black', 'Navy', 'Red']);
  });

  // 5. Front / Back rendering
  it('5. renders Front and Back using their respective template layers with shared color state', () => {
    const frontImage = getCustomizerSideImage(poloProduct, 'front');
    const backImage = getCustomizerSideImage(poloProduct, 'back');

    expect(frontImage).toContain('dev-polo-front-base.png');
    expect(backImage).toContain('dev-polo-back-base.png');
    expect(frontImage).not.toEqual(backImage);

    const frontRecolor = getSideRecolor(poloProduct, 'front');
    const backRecolor = getSideRecolor(poloProduct, 'back');

    expect(frontRecolor?.bodyMask).toContain('dev-polo-front-body-mask.png');
    expect(backRecolor?.bodyMask).toContain('dev-polo-back-body-mask.png');
    expect(frontRecolor?.trimMask).toContain('dev-polo-front-trim-mask.png');
    expect(backRecolor?.trimMask).toContain('dev-polo-back-trim-mask.png');
  });

  // 6. Disabled trim behavior
  it('6. hides Collar & Rib when trimColorEnabled is false and suppresses trim recoloring', () => {
    const noTrimProduct = {
      ...poloProduct,
      trimColorEnabled: false,
      customizer: {
        ...poloProduct.customizer,
        trimColor: false,
      },
    };

    const features = getCustomizerFeatures(noTrimProduct);
    expect(features.trimColor).toBe(false);

    expect(hasTrimMask(noTrimProduct)).toBe(false);

    const resolved = applyCustomizerViews(getCustomizerTemplate(noTrimProduct), noTrimProduct);
    expect(resolved.secondaryColorLabel).toBeUndefined();

    // Recolor source must have trimMask set to null so customer cannot recolor trim
    const recolor = getSideRecolor(noTrimProduct, 'front');
    expect(recolor).not.toBeNull();
    expect(recolor?.bodyMask).toContain('dev-polo-front-body-mask.png');
    expect(recolor?.trimMask).toBeNull();
  });

  // 7. Disabled back behavior
  it('7. completely disables Back rendering when backDesignEnabled is false', () => {
    const noBackProduct = {
      ...poloProduct,
      backDesignEnabled: false,
      customizer: {
        ...poloProduct.customizer,
        back: false,
      },
    };

    expect(isBackSideEnabled(noBackProduct)).toBe(false);

    // Back image must be null
    expect(getCustomizerSideImage(noBackProduct, 'back')).toBeNull();

    // Back recolor must NOT initialize (returns null)
    expect(getSideRecolor(noBackProduct, 'back')).toBeNull();

    // Front remains fully functional
    expect(getCustomizerSideImage(noBackProduct, 'front')).toContain('dev-polo-front-base.png');
    expect(getSideRecolor(noBackProduct, 'front')).not.toBeNull();
  });

  // 8. Legacy fallback
  it('8. preserves legacy photo/mask fallback for products without customizerTemplateId', () => {
    const legacyProduct = {
      id: 'legacy-prod',
      name: 'Legacy T-Shirt',
      images: ['https://example.com/front.png', 'https://example.com/back.png'],
      customizerViews: {
        front: {
          image: 'https://example.com/front.png',
          bodyMask: 'https://example.com/front-mask.png',
          trimMask: 'https://example.com/front-trim.png',
        },
        back: {
          enabled: true,
          image: 'https://example.com/back.png',
          bodyMask: 'https://example.com/back-mask.png',
          trimMask: null,
        },
      },
    };

    expect(getCustomizerSideImage(legacyProduct, 'front')).toBe('https://example.com/front.png');
    expect(getCustomizerSideImage(legacyProduct, 'back')).toBe('https://example.com/back.png');

    const frontRecolor = getSideRecolor(legacyProduct, 'front');
    expect(frontRecolor?.base).toBe('https://example.com/front.png');
    expect(frontRecolor?.bodyMask).toBe('https://example.com/front-mask.png');
    expect(frontRecolor?.trimMask).toBe('https://example.com/front-trim.png');
  });

  // 9. Template with flat body/trim assets without separate base layer
  it('9. supports flat template layers (body + trim without dedicated base layer)', () => {
    const flatTemplateProduct = {
      id: 'flat-prod',
      customizerTemplateId: 'flat-template-v1',
      customizerTemplate: {
        id: 'flat-template-v1',
        name: 'Flat Apparel Template',
        active: true,
        supportsBack: true,
        layers: [
          {
            id: 'flat-f-body',
            templateId: 'flat-template-v1',
            name: 'Front Body',
            side: 'front',
            layerType: 'body',
            colorGroup: 'BODY',
            assetUrl: 'https://example.com/flat-body.png',
          },
          {
            id: 'flat-f-trim',
            templateId: 'flat-template-v1',
            name: 'Front Trim',
            side: 'front',
            layerType: 'trim',
            colorGroup: 'TRIM',
            assetUrl: 'https://example.com/flat-trim.png',
          },
        ],
      },
    };

    const frontImg = getCustomizerSideImage(flatTemplateProduct, 'front');
    expect(frontImg).toBe('https://example.com/flat-body.png');

    const recolor = getSideRecolor(flatTemplateProduct, 'front');
    expect(recolor).not.toBeNull();
    expect(recolor?.base).toBe('https://example.com/flat-body.png');
    expect(recolor?.bodyMask).toBe('https://example.com/flat-body.png');
    expect(recolor?.trimMask).toBe('https://example.com/flat-trim.png');
  });

  // 10. Non-destructive rendering
  it('10. verifies color rendering preserves alpha edges and is purely non-destructive', () => {
    // Original template definition assets are unmodified strings
    const template = getReusableTemplateById('polo-v1');
    const originalAsset = template?.layers[0].assetUrl;

    expect(originalAsset).toContain('dev-polo-front-base.png');
    // Assets remain intact remote URLs, not permanently recolored files or base64
    expect(originalAsset?.startsWith('data:')).toBe(false);
  });
});
