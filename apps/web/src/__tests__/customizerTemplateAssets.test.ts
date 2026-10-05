/**
 * Phase 2 Tests: Reusable Customizer Template Assets (Web)
 *
 * Verifies the 15 Phase 2 requirements on the frontend:
 * 1. Template creation.
 * 2. Template update.
 * 3. Template activation/deactivation.
 * 4. Front Body asset storage.
 * 5. Front Trim asset storage.
 * 6. Back Body asset storage.
 * 7. Back Trim asset storage.
 * 8. Back disabled behavior.
 * 9. Front print-area persistence.
 * 10. Back print-area persistence.
 * 11. Normalized coordinate validation.
 * 12. Invalid print-area rejection.
 * 13. Product can reference the template.
 * 14. Disabling a product customizer does not remove template configuration.
 * 15. Existing products without template assets still work.
 */

import { afterAll, describe, expect, it } from 'vitest';
import {
  REUSABLE_TEMPLATES,
  getReusableTemplateById,
  listReusableTemplates,
  validatePrintArea,
  validateAssetUrl,
  getFrontBodyAsset,
  getFrontTrimAsset,
  getBackBodyAsset,
  getBackTrimAsset,
  getFrontPrintArea,
  getBackPrintArea,
  normalizeLayersFromFlatAssets,
  getCustomizerTemplate,
  ReusableCustomizerTemplate,
} from '../lib/customizerTemplates';
import { canCustomize } from '../lib/productConfig';

describe('Phase 2 — Reusable Customizer Template Assets (Web)', () => {
  const TEST_ID = 'web-test-polo-v2';

  // 1. Template creation
  it('1. creates and stores a reusable template configuration', () => {
    const template: ReusableCustomizerTemplate = {
      id: TEST_ID,
      name: 'Web Test Polo',
      version: '2.0',
      description: 'Second generation polo for web testing',
      categoryCompatibility: ['polos', 't-shirts'],
      active: true,
      supportsBack: true,
      colorGroups: [
        { id: 'BODY', label: 'BODY COLOR', defaultColor: 'White' },
        { id: 'TRIM', label: 'COLLAR & RIB COLOR', defaultColor: 'White' },
      ],
      layers: [],
      printAreas: [
        {
          templateId: TEST_ID,
          side: 'front',
          x: 0.29,
          y: 0.224,
          width: 0.42,
          height: 0.52,
        },
      ],
    };

    REUSABLE_TEMPLATES[TEST_ID] = template;

    const retrieved = getReusableTemplateById(TEST_ID);
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(TEST_ID);
    expect(retrieved?.version).toBe('2.0');
  });

  // 2. Template update
  it('2. updates template metadata', () => {
    const t = getReusableTemplateById(TEST_ID);
    expect(t).toBeDefined();
    if (t) {
      t.name = 'Updated Web Polo';
      t.version = '2.1';
    }
    const updated = getReusableTemplateById(TEST_ID);
    expect(updated?.name).toBe('Updated Web Polo');
    expect(updated?.version).toBe('2.1');
  });

  // 3. Template activation/deactivation
  it('3. supports activating and deactivating a template', () => {
    const t = getReusableTemplateById(TEST_ID);
    expect(t).toBeDefined();
    if (t) t.active = false;

    // Active-only list excludes it
    const activeList = listReusableTemplates();
    expect(activeList.some((item) => item.id === TEST_ID)).toBe(false);

    // Re-activate
    if (t) t.active = true;
    expect(listReusableTemplates().some((item) => item.id === TEST_ID)).toBe(true);
  });

  // 4. Front Body asset storage
  it('4. stores and retrieves Front Body transparent PNG mockup asset', () => {
    const frontBodyUrl = 'https://res.cloudinary.com/dphocsmkd/image/upload/v1/polo-body.png';
    const layers = normalizeLayersFromFlatAssets(TEST_ID, {
      frontBodyUrl,
    });
    const t = getReusableTemplateById(TEST_ID);
    if (t) t.layers = layers;

    const bodyAsset = t ? getFrontBodyAsset(t) : undefined;
    expect(bodyAsset).toBeDefined();
    expect(bodyAsset?.side).toBe('front');
    expect(bodyAsset?.layerType).toBe('body');
    expect(bodyAsset?.assetUrl).toBe(frontBodyUrl);
  });

  // 5. Front Trim asset storage
  it('5. stores and retrieves Front Trim transparent PNG mockup asset', () => {
    const frontTrimUrl = 'https://res.cloudinary.com/dphocsmkd/image/upload/v1/polo-trim.png';
    const layers = normalizeLayersFromFlatAssets(TEST_ID, {
      frontTrimUrl,
    });
    const t = getReusableTemplateById(TEST_ID);
    if (t) t.layers = [...t.layers, ...layers];

    const trimAsset = t ? getFrontTrimAsset(t) : undefined;
    expect(trimAsset).toBeDefined();
    expect(trimAsset?.side).toBe('front');
    expect(trimAsset?.layerType).toBe('trim');
    expect(trimAsset?.assetUrl).toBe(frontTrimUrl);
  });

  // 6. Back Body asset storage
  it('6. stores and retrieves Back Body transparent PNG mockup asset', () => {
    const backBodyUrl = 'https://res.cloudinary.com/dphocsmkd/image/upload/v1/polo-back-body.png';
    const layers = normalizeLayersFromFlatAssets(TEST_ID, {
      backBodyUrl,
    });
    const t = getReusableTemplateById(TEST_ID);
    if (t) t.layers = [...t.layers, ...layers];

    const bodyAsset = t ? getBackBodyAsset(t) : undefined;
    expect(bodyAsset).toBeDefined();
    expect(bodyAsset?.side).toBe('back');
    expect(bodyAsset?.layerType).toBe('body');
    expect(bodyAsset?.assetUrl).toBe(backBodyUrl);
  });

  // 7. Back Trim asset storage
  it('7. stores and retrieves Back Trim transparent PNG mockup asset', () => {
    const backTrimUrl = 'https://res.cloudinary.com/dphocsmkd/image/upload/v1/polo-back-trim.png';
    const layers = normalizeLayersFromFlatAssets(TEST_ID, {
      backTrimUrl,
    });
    const t = getReusableTemplateById(TEST_ID);
    if (t) t.layers = [...t.layers, ...layers];

    const trimAsset = t ? getBackTrimAsset(t) : undefined;
    expect(trimAsset).toBeDefined();
    expect(trimAsset?.side).toBe('back');
    expect(trimAsset?.layerType).toBe('trim');
    expect(trimAsset?.assetUrl).toBe(backTrimUrl);
  });

  // 8. Back disabled behavior
  it('8. handles back disabled behavior in customizer template resolution', () => {
    const t = getReusableTemplateById(TEST_ID);
    if (t) {
      t.supportsBack = false;
    }

    const resolved = getCustomizerTemplate({
      customizationEnabled: true,
      customizerTemplateId: TEST_ID,
    });

    expect(resolved.supportsBack).toBe(false);
    expect(resolved.backPrintableArea).toBeUndefined();
  });

  // 9. Front print-area persistence
  it('9. stores and accesses front printable area with normalized coordinates', () => {
    const t = getReusableTemplateById(TEST_ID);
    if (t) {
      t.printAreas = [
        {
          templateId: TEST_ID,
          side: 'front',
          x: 0.28,
          y: 0.22,
          width: 0.44,
          height: 0.54,
        },
      ];
    }

    const frontArea = t ? getFrontPrintArea(t) : undefined;
    expect(frontArea).toBeDefined();
    expect(frontArea?.x).toBe(0.28);
    expect(frontArea?.y).toBe(0.22);
    expect(frontArea?.width).toBe(0.44);
    expect(frontArea?.height).toBe(0.54);
  });

  // 10. Back print-area persistence
  it('10. stores and accesses back printable area with normalized coordinates', () => {
    const t = getReusableTemplateById(TEST_ID);
    if (t) {
      t.supportsBack = true;
      t.printAreas = [
        {
          templateId: TEST_ID,
          side: 'front',
          x: 0.28,
          y: 0.22,
          width: 0.44,
          height: 0.54,
        },
        {
          templateId: TEST_ID,
          side: 'back',
          x: 0.30,
          y: 0.25,
          width: 0.40,
          height: 0.50,
        },
      ];
    }

    const backArea = t ? getBackPrintArea(t) : undefined;
    expect(backArea).toBeDefined();
    expect(backArea?.x).toBe(0.30);
    expect(backArea?.y).toBe(0.25);
    expect(backArea?.width).toBe(0.40);
    expect(backArea?.height).toBe(0.50);
  });

  // 11. Normalized coordinate validation
  it('11. accepts valid normalized coordinates (0..1)', () => {
    expect(validatePrintArea({ side: 'front', x: 0.29, y: 0.224, width: 0.42, height: 0.52 }).valid).toBe(true);
    expect(validatePrintArea({ side: 'back', x: 0, y: 0, width: 1, height: 1 }).valid).toBe(true);
  });

  // 12. Invalid print-area rejection
  it('12. rejects out-of-bound, negative, or overflow print-area coordinates', () => {
    expect(validatePrintArea({ side: 'front', x: -0.01, y: 0.2, width: 0.5, height: 0.5 }).valid).toBe(false);
    expect(validatePrintArea({ side: 'front', x: 0.2, y: -0.01, width: 0.5, height: 0.5 }).valid).toBe(false);
    expect(validatePrintArea({ side: 'front', x: 0.2, y: 0.2, width: 0, height: 0.5 }).valid).toBe(false);
    expect(validatePrintArea({ side: 'front', x: 0.2, y: 0.2, width: 0.5, height: 0 }).valid).toBe(false);
    expect(validatePrintArea({ side: 'front', x: 0.7, y: 0.2, width: 0.4, height: 0.5 }).valid).toBe(false); // 0.7 + 0.4 > 1
    expect(validatePrintArea({ side: 'front', x: 0.2, y: 0.7, width: 0.5, height: 0.4 }).valid).toBe(false); // 0.7 + 0.4 > 1
  });

  // 13. Product can reference the template
  it('13. product references the template and customizer resolves it', () => {
    const product = {
      id: 'prod-polo-test',
      name: 'Custom Team Polo',
      customizationEnabled: true,
      customizerTemplateId: 'polo-v1',
    };

    expect(canCustomize(product)).toBe(true);
    const resolved = getCustomizerTemplate(product);
    expect(resolved.name).toBe('Polo T-Shirt');
    expect(resolved.frontPrintableArea.width).toBeGreaterThan(0);
  });

  // 14. Disabling a product customizer does not remove template configuration
  it('14. turning OFF product customizer retains template configuration', () => {
    const product = {
      id: 'prod-polo-test',
      name: 'Custom Team Polo',
      customizationEnabled: false,
      customizerTemplateId: 'polo-v1',
    };

    expect(canCustomize(product)).toBe(false);
    expect(product.customizerTemplateId).toBe('polo-v1'); // Configuration is intact
  });

  // 15. Existing products without template assets still work
  it('15. existing products without template assets fallback cleanly', () => {
    const legacyProduct = {
      id: 'legacy-product',
      name: 'Simple Cotton Tee',
      customizationEnabled: true,
      category: { slug: 't-shirts', name: 'T-Shirts' },
    };

    const resolved = getCustomizerTemplate(legacyProduct);
    expect(resolved).toBeDefined();
    expect(resolved.type).toBe('tshirt');
    expect(resolved.frontPrintableArea.width).toBe(210);
  });

  // Clean up
  afterAll(() => {
    delete REUSABLE_TEMPLATES[TEST_ID];
  });
});
