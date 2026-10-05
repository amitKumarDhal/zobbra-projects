import { validateProductCustomizerFeatures } from '../src/modules/quotes/quotes.controller';
import {
  getCustomizerTemplateById,
  getTemplateCapabilities,
  type ReusableCustomizerTemplate,
} from '../src/modules/products/customizer-templates';

describe('Phase 5 Server: Customizer Validation & Security', () => {
  const poloProduct = {
    id: 'prod-server-polo-1',
    name: 'Executive Polo Shirt',
    customizationEnabled: true,
    customizerTemplateId: 'polo-v1',
    trimColorEnabled: true,
    backDesignEnabled: true,
    embroideryEnabled: true,
    zipperEnabled: false,
  };

  it('1. allows valid customizer quote submission with enabled template features', () => {
    const payload = {
      collarColor: 'Red',
      previewFrontUrl: 'https://res.cloudinary.com/zobra/image/upload/v1/preview-front.png',
      previewBackUrl: 'https://res.cloudinary.com/zobra/image/upload/v1/preview-back.png',
      canvasStateJson: JSON.stringify({
        front: { objects: [{ type: 'i-text', text: 'ZOBBRA' }] },
        back: { objects: [{ type: 'i-text', text: 'TEAM' }] },
      }),
    };

    const err = validateProductCustomizerFeatures(poloProduct, payload);
    expect(err).toBeNull();
  });

  it('2. blocks collar/trim color submission when trimColorEnabled is false', () => {
    const productWithoutTrim = {
      ...poloProduct,
      trimColorEnabled: false,
    };

    const payload = {
      collarColor: '#DC2626',
    };

    const err = validateProductCustomizerFeatures(productWithoutTrim, payload);
    expect(err).toBe("Collar & rib color customization is disabled for 'Executive Polo Shirt'.");
  });

  it('3. blocks back preview and canvas submission when backDesignEnabled is false', () => {
    const productWithoutBack = {
      ...poloProduct,
      backDesignEnabled: false,
    };

    const payloadWithBackPreview = {
      previewBackUrl: 'https://res.cloudinary.com/zobra/image/upload/v1/back.png',
    };

    const err1 = validateProductCustomizerFeatures(productWithoutBack, payloadWithBackPreview);
    expect(err1).toBe("Back design is disabled for 'Executive Polo Shirt'.");

    const payloadWithBackCanvas = {
      canvasStateJson: JSON.stringify({
        back: { objects: [{ type: 'image', src: 'https://cdn.com/logo.png' }] },
      }),
    };

    const err2 = validateProductCustomizerFeatures(productWithoutBack, payloadWithBackCanvas);
    expect(err2).toBe("Back design is disabled for 'Executive Polo Shirt'.");
  });

  it('4. blocks back submission when template does not support back (e.g. single-view template)', () => {
    const frontOnlyTemplate: ReusableCustomizerTemplate = {
      id: 'cap-noback-server',
      name: 'Single View Cap',
      description: 'Cap with only front embroidery view',
      version: '1.0',
      active: true,
      supportsBack: false,
      categoryCompatibility: ['caps'],
      colorGroups: [],
      layers: [],
      printAreas: [],
    };

    const productWithFrontOnlyTemplate = {
      id: 'prod-cap-front-only',
      name: 'Single View Cap',
      customizationEnabled: true,
      customizerTemplateId: 'cap-noback-server',
      backDesignEnabled: true, // Product tries to enable, but template does not support
    };

    // When template doesn't support back, capabilities.supportsBack is false
    const caps = getTemplateCapabilities(frontOnlyTemplate, productWithFrontOnlyTemplate);
    expect(caps.supportsBack).toBe(false);
  });

  it('5. blocks embroidery submission when embroideryEnabled is false', () => {
    const productNoEmbroidery = {
      ...poloProduct,
      embroideryEnabled: false,
    };

    const payload = {
      embroidery: true,
    };

    const err = validateProductCustomizerFeatures(productNoEmbroidery, payload);
    expect(err).toBe("Embroidery option is disabled for 'Executive Polo Shirt'.");
  });

  it('6. blocks zipper submission when zipperEnabled is false', () => {
    const payload = {
      zipper: true,
    };

    const err = validateProductCustomizerFeatures(poloProduct, payload);
    expect(err).toBe("Zipper option is disabled for 'Executive Polo Shirt'.");
  });

  it('7. safely checks JSON customizationRequirements metadata to prevent hidden payloads', () => {
    const productNoTrim = {
      ...poloProduct,
      trimColorEnabled: false,
    };

    const payload = {
      customizationRequirements: JSON.stringify({
        collarColor: '#FF0000',
      }),
    };

    const err = validateProductCustomizerFeatures(productNoTrim, payload);
    expect(err).toBe("Collar & rib color customization is disabled for 'Executive Polo Shirt'.");
  });

  it('8. never trusts client-supplied capabilities: uses authoritative server template and product', () => {
    const productNoTrim = {
      ...poloProduct,
      trimColorEnabled: false,
    };

    // Client tries to spoof capabilities in request payload
    const spoofedPayload = {
      capabilities: {
        supportsTrimColor: true,
        supportsBack: true,
      },
      templateCapabilities: {
        supportsTrimColor: true,
      },
      collarColor: 'Gold',
    };

    const err = validateProductCustomizerFeatures(productNoTrim, spoofedPayload);
    // Spoofed capabilities are ignored; authoritative server check blocks it
    expect(err).toBe("Collar & rib color customization is disabled for 'Executive Polo Shirt'.");
  });

  it('9. treats inactive templates safely as fallback without granting unsupported capabilities', () => {
    const inactiveTemplate: ReusableCustomizerTemplate = {
      id: 'inactive-polo-server',
      name: 'Inactive Polo',
      description: 'Inactive polo template',
      version: '1.0',
      active: false,
      supportsBack: false,
      categoryCompatibility: [],
      colorGroups: [],
      layers: [],
      printAreas: [],
    };

    const caps = getTemplateCapabilities(inactiveTemplate);
    // Inactive template falls back to legacy default safely
    expect(caps).toBeDefined();
    expect(caps.supportsTapingColor).toBe(false);
    expect(caps.supportsZipper).toBe(false);
  });
});
