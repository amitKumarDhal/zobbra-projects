/**
 * Phase 2 Tests: Reusable Customizer Template Assets
 *
 * Tests the 15 Phase 2 requirements:
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

import {
  createCustomizerTemplate,
  updateCustomizerTemplate,
  setCustomizerTemplateActive,
  getCustomizerTemplateById,
  listCustomizerTemplates,
  validatePrintArea,
  validateAssetUrl,
  getFrontBodyAsset,
  getFrontTrimAsset,
  getBackBodyAsset,
  getBackTrimAsset,
  getFrontPrintArea,
  getBackPrintArea,
  REUSABLE_TEMPLATES,
} from '../src/modules/products/customizer-templates';
import { normalizeProductConfig, toPublicProduct } from '../src/modules/products/product-config';

describe('Phase 2 — Reusable Customizer Template Assets (Server)', () => {
  const TEST_TEMPLATE_ID = 'test-hoodie-v1';

  afterAll(() => {
    delete REUSABLE_TEMPLATES[TEST_TEMPLATE_ID];
    delete REUSABLE_TEMPLATES['test-polo-v2'];
  });

  // 1. Template creation
  it('1. creates a new reusable template with versioning and configuration', async () => {
    const created = await createCustomizerTemplate({
      id: TEST_TEMPLATE_ID,
      name: 'Test Custom Hoodie',
      version: '1.0',
      description: 'Test hoodie mockup configuration',
      categoryCompatibility: ['hoodies', 'apparel'],
      active: true,
      supportsBack: true,
      colorGroups: [
        { id: 'BODY', label: 'HOODIE COLOR', defaultColor: 'Black' },
        { id: 'TRIM', label: 'HOOD LINING', defaultColor: 'Black' },
      ],
      layers: [],
      printAreas: [
        {
          templateId: TEST_TEMPLATE_ID,
          side: 'front',
          x: 0.28,
          y: 0.24,
          width: 0.44,
          height: 0.52,
        },
      ],
    });

    expect(created.id).toBe(TEST_TEMPLATE_ID);
    expect(created.name).toBe('Test Custom Hoodie');
    expect(created.version).toBe('1.0');
    expect(created.active).toBe(true);

    const retrieved = getCustomizerTemplateById(TEST_TEMPLATE_ID);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe(TEST_TEMPLATE_ID);
  });

  // 2. Template update
  it('2. updates template metadata and configuration', async () => {
    const updated = await updateCustomizerTemplate(TEST_TEMPLATE_ID, {
      name: 'Premium Custom Hoodie',
      description: 'Updated description for hoodie',
      version: '1.1',
    });

    expect(updated.name).toBe('Premium Custom Hoodie');
    expect(updated.description).toBe('Updated description for hoodie');
    expect(updated.version).toBe('1.1');
  });

  // 3. Template activation/deactivation
  it('3. deactivates and re-activates a template', async () => {
    const deactivated = await setCustomizerTemplateActive(TEST_TEMPLATE_ID, false);
    expect(deactivated.active).toBe(false);

    // Active-only list excludes it
    const activeList = listCustomizerTemplates();
    expect(activeList.some((t) => t.id === TEST_TEMPLATE_ID)).toBe(false);

    // Full list includes it
    const allList = listCustomizerTemplates({ includeInactive: true });
    expect(allList.some((t) => t.id === TEST_TEMPLATE_ID)).toBe(true);

    // Re-activate
    const reactivated = await setCustomizerTemplateActive(TEST_TEMPLATE_ID, true);
    expect(reactivated.active).toBe(true);
    expect(listCustomizerTemplates().some((t) => t.id === TEST_TEMPLATE_ID)).toBe(true);
  });

  // 4. Front Body asset storage
  it('4. stores and retrieves Front Body transparent PNG mockup asset', async () => {
    const frontBodyUrl = 'https://res.cloudinary.com/dphocsmkd/image/upload/v1775200010/zobbra/hoodie-front-body.png';
    const updated = await updateCustomizerTemplate(TEST_TEMPLATE_ID, {
      frontBodyUrl,
    });

    const bodyAsset = getFrontBodyAsset(updated);
    expect(bodyAsset).toBeDefined();
    expect(bodyAsset?.side).toBe('front');
    expect(bodyAsset?.layerType).toBe('body');
    expect(bodyAsset?.assetUrl).toBe(frontBodyUrl);
  });

  // 5. Front Trim asset storage
  it('5. stores and retrieves Front Trim / Accent transparent PNG mockup asset', async () => {
    const frontTrimUrl = 'https://res.cloudinary.com/dphocsmkd/image/upload/v1775200011/zobbra/hoodie-front-trim.png';
    const updated = await updateCustomizerTemplate(TEST_TEMPLATE_ID, {
      frontTrimUrl,
    });

    const trimAsset = getFrontTrimAsset(updated);
    expect(trimAsset).toBeDefined();
    expect(trimAsset?.side).toBe('front');
    expect(trimAsset?.layerType).toBe('trim');
    expect(trimAsset?.assetUrl).toBe(frontTrimUrl);
  });

  // 6. Back Body asset storage
  it('6. stores and retrieves Back Body transparent PNG mockup asset', async () => {
    const backBodyUrl = 'https://res.cloudinary.com/dphocsmkd/image/upload/v1775200012/zobbra/hoodie-back-body.png';
    const updated = await updateCustomizerTemplate(TEST_TEMPLATE_ID, {
      backBodyUrl,
    });

    const bodyAsset = getBackBodyAsset(updated);
    expect(bodyAsset).toBeDefined();
    expect(bodyAsset?.side).toBe('back');
    expect(bodyAsset?.layerType).toBe('body');
    expect(bodyAsset?.assetUrl).toBe(backBodyUrl);
  });

  // 7. Back Trim asset storage
  it('7. stores and retrieves Back Trim / Accent transparent PNG mockup asset', async () => {
    const backTrimUrl = 'https://res.cloudinary.com/dphocsmkd/image/upload/v1775200013/zobbra/hoodie-back-trim.png';
    const updated = await updateCustomizerTemplate(TEST_TEMPLATE_ID, {
      backTrimUrl,
    });

    const trimAsset = getBackTrimAsset(updated);
    expect(trimAsset).toBeDefined();
    expect(trimAsset?.side).toBe('back');
    expect(trimAsset?.layerType).toBe('trim');
    expect(trimAsset?.assetUrl).toBe(backTrimUrl);
  });

  // 8. Back disabled behavior
  it('8. handles back disabled behavior cleanly', async () => {
    const backDisabled = await updateCustomizerTemplate(TEST_TEMPLATE_ID, {
      supportsBack: false,
    });

    expect(backDisabled.supportsBack).toBe(false);
  });

  // 9. Front print-area persistence
  it('9. persists and retrieves front printable area with normalized coordinates', async () => {
    const updated = await updateCustomizerTemplate(TEST_TEMPLATE_ID, {
      printAreas: [
        {
          templateId: TEST_TEMPLATE_ID,
          side: 'front',
          x: 0.285,
          y: 0.22,
          width: 0.43,
          height: 0.55,
        },
      ],
    });

    const frontArea = getFrontPrintArea(updated);
    expect(frontArea).toBeDefined();
    expect(frontArea?.x).toBe(0.285);
    expect(frontArea?.y).toBe(0.22);
    expect(frontArea?.width).toBe(0.43);
    expect(frontArea?.height).toBe(0.55);
  });

  // 10. Back print-area persistence
  it('10. persists and retrieves back printable area with normalized coordinates', async () => {
    const updated = await updateCustomizerTemplate(TEST_TEMPLATE_ID, {
      supportsBack: true,
      printAreas: [
        {
          templateId: TEST_TEMPLATE_ID,
          side: 'front',
          x: 0.285,
          y: 0.22,
          width: 0.43,
          height: 0.55,
        },
        {
          templateId: TEST_TEMPLATE_ID,
          side: 'back',
          x: 0.30,
          y: 0.25,
          width: 0.40,
          height: 0.50,
        },
      ],
    });

    const backArea = getBackPrintArea(updated);
    expect(backArea).toBeDefined();
    expect(backArea?.x).toBe(0.30);
    expect(backArea?.y).toBe(0.25);
    expect(backArea?.width).toBe(0.40);
    expect(backArea?.height).toBe(0.50);
  });

  // 11. Normalized coordinate validation
  it('11. validates normalized coordinates (0..1) successfully', () => {
    const validArea = {
      side: 'front' as const,
      x: 0.25,
      y: 0.20,
      width: 0.50,
      height: 0.60,
    };
    expect(validatePrintArea(validArea).valid).toBe(true);

    const cornerArea = {
      side: 'back' as const,
      x: 0.0,
      y: 0.0,
      width: 1.0,
      height: 1.0,
    };
    expect(validatePrintArea(cornerArea).valid).toBe(true);
  });

  // 12. Invalid print-area rejection
  it('12. rejects invalid print-area coordinates and dimensions', () => {
    // Negative x
    expect(validatePrintArea({ side: 'front', x: -0.05, y: 0.2, width: 0.4, height: 0.4 }).valid).toBe(false);
    // Negative y
    expect(validatePrintArea({ side: 'front', x: 0.2, y: -0.1, width: 0.4, height: 0.4 }).valid).toBe(false);
    // Zero width
    expect(validatePrintArea({ side: 'front', x: 0.2, y: 0.2, width: 0, height: 0.4 }).valid).toBe(false);
    // Zero height
    expect(validatePrintArea({ side: 'front', x: 0.2, y: 0.2, width: 0.4, height: 0 }).valid).toBe(false);
    // Exceeds right boundary (x + width > 1)
    expect(validatePrintArea({ side: 'front', x: 0.8, y: 0.2, width: 0.3, height: 0.4 }).valid).toBe(false);
    // Exceeds bottom boundary (y + height > 1)
    expect(validatePrintArea({ side: 'front', x: 0.2, y: 0.7, width: 0.4, height: 0.4 }).valid).toBe(false);
    // Invalid side
    expect(validatePrintArea({ side: 'top' as any, x: 0.2, y: 0.2, width: 0.4, height: 0.4 }).valid).toBe(false);
  });

  // 13. Product can reference the template
  it('13. product references the template and resolves configuration', () => {
    const productConfig = normalizeProductConfig({
      name: 'Custom Polo Shirt',
      customizationEnabled: true,
      customizerTemplateId: 'polo-v1',
    });

    expect(productConfig.customizerTemplateId).toBe('polo-v1');
    const template = getCustomizerTemplateById(productConfig.customizerTemplateId);
    expect(template).toBeDefined();
    expect(template?.name).toBe('Polo T-Shirt');
  });

  // 14. Disabling a product customizer does not remove template configuration
  it('14. disabling product customizer retains template configuration', () => {
    const disabledConfig = normalizeProductConfig({
      name: 'Standard Polo Shirt',
      customizationEnabled: false,
      customizerTemplateId: 'polo-v1',
    });

    expect(disabledConfig.customizationEnabled).toBe(false);
    expect(disabledConfig.designerEnabled).toBe(false);
    expect(disabledConfig.customizerTemplateId).toBe('polo-v1'); // Preserved in payload
  });

  // 15. Existing products without template assets still work
  it('15. legacy/existing products without template assets still work with fallbacks', () => {
    const legacyProd = {
      id: 'legacy-cap',
      name: 'Classic Vintage Cap',
      slug: 'classic-vintage-cap',
      customizationEnabled: false,
      images: ['https://res.cloudinary.com/demo/image/upload/cap.png'],
      category: { slug: 'caps', name: 'Caps' },
    };

    const pub = toPublicProduct(legacyProd);
    expect(pub.customizable).toBe(false);
    expect(pub.id).toBe('legacy-cap');
  });

  // Versioning separation check
  it('distinguishes Polo v1 and Polo v2 without overwriting previous version', async () => {
    const poloV1Before = getCustomizerTemplateById('polo-v1');
    expect(poloV1Before?.version).toBe('1.0');

    // Create Polo v2
    const poloV2 = await createCustomizerTemplate({
      id: 'test-polo-v2',
      name: 'Polo T-Shirt v2',
      version: '2.0',
      description: 'Second generation polo template',
      active: true,
      supportsBack: true,
      colorGroups: poloV1Before?.colorGroups || [],
      layers: poloV1Before?.layers || [],
      printAreas: poloV1Before?.printAreas || [],
    });

    expect(poloV2.id).toBe('test-polo-v2');
    expect(poloV2.version).toBe('2.0');

    // Polo v1 is unaffected
    const poloV1After = getCustomizerTemplateById('polo-v1');
    expect(poloV1After?.id).toBe('polo-v1');
    expect(poloV1After?.version).toBe('1.0');
  });

  // Asset URL validation check
  it('rejects invalid or unauthorized asset URLs', () => {
    // Base64 rejected
    expect(validateAssetUrl('data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==').valid).toBe(false);
    // Insecure HTTP rejected
    expect(validateAssetUrl('http://insecure.com/asset.png').valid).toBe(false);
    // Non-Cloudinary domain rejected
    expect(validateAssetUrl('https://untrusted-external-site.com/image.png').valid).toBe(false);
    // Valid Cloudinary HTTPS URL accepted
    expect(validateAssetUrl('https://res.cloudinary.com/dphocsmkd/image/upload/v1/zobbra/image.png').valid).toBe(true);
    // Empty/null allowed (when asset not set yet)
    expect(validateAssetUrl('').valid).toBe(true);
    expect(validateAssetUrl(null).valid).toBe(true);
  });
});
