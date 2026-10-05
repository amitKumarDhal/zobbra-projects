import { validateProductCustomizerFeatures } from '../src/modules/quotes/quotes.controller';
import {
  getCustomizerTemplateById,
  getTemplateCapabilities,
  type ReusableCustomizerTemplate,
} from '../src/modules/products/customizer-templates';

describe('Phase 6 Server: Branding Method, Taping Color & Feature Enforcement', () => {
  const poloProductWithAllFeatures = {
    id: 'prod-server-polo-all',
    name: 'Executive Polo Pro',
    customizationEnabled: true,
    customizerTemplateId: 'polo-v1',
    trimColorEnabled: true,
    tapingColorEnabled: true,
    backDesignEnabled: true,
    embroideryEnabled: true,
    zipperEnabled: false,
  };

  const poloRestricted = {
    ...poloProductWithAllFeatures,
    id: 'prod-server-polo-restricted',
    name: 'Restricted Polo',
    embroideryEnabled: false,
    tapingColorEnabled: false,
  };

  const mugProduct = {
    id: 'prod-server-mug',
    name: 'Ceramic Mug',
    customizationEnabled: true,
    customizerTemplateId: 'mug-v1',
    embroideryEnabled: true, // Product tries to enable, but template does not support
    tapingColorEnabled: true,
  };

  // =========================================================================
  // 1. Valid Phase 6 Quote Submissions
  // =========================================================================
  it('1. accepts valid quote with Embroidery and Taping color when features are enabled', () => {
    const payload = {
      printingType: 'Embroidery',
      printType: 'Embroidery Logo',
      embroidery: true,
      collarColor: 'Red',
      tapingColor: 'Navy',
      previewFrontUrl: 'https://res.cloudinary.com/zobra/image/upload/v1/preview-front.png',
      canvasStateJson: JSON.stringify({
        front: { objects: [{ type: 'i-text', text: 'ZOBBRA EMBROIDERY' }] },
      }),
      customizationRequirements: JSON.stringify({
        selectedColor: 'White',
        collarColor: 'Red',
        tapingColor: 'Navy',
        brandingMethod: 'Embroidery',
        embroidery: true,
      }),
    };

    const err = validateProductCustomizerFeatures(poloProductWithAllFeatures, payload);
    expect(err).toBeNull();
  });

  it('2. accepts valid quote with Standard Print and Taping color when features are enabled', () => {
    const payload = {
      printingType: 'Custom Online Design',
      printType: 'Front Only',
      embroidery: false,
      collarColor: 'Gold',
      tapingColor: 'White',
      previewFrontUrl: 'https://res.cloudinary.com/zobra/image/upload/v1/preview-front.png',
      canvasStateJson: JSON.stringify({
        front: { objects: [{ type: 'i-text', text: 'ZOBBRA PRINT' }] },
      }),
      customizationRequirements: JSON.stringify({
        selectedColor: 'Navy',
        collarColor: 'Gold',
        tapingColor: 'White',
        brandingMethod: 'Print',
        embroidery: false,
      }),
    };

    const err = validateProductCustomizerFeatures(poloProductWithAllFeatures, payload);
    expect(err).toBeNull();
  });

  // =========================================================================
  // 2. Server-Side Enforcement for Embroidery
  // =========================================================================
  it('3. blocks embroidery submission via boolean flag when embroideryEnabled is false', () => {
    const payload = {
      embroidery: true,
    };

    const err = validateProductCustomizerFeatures(poloRestricted, payload);
    expect(err).toBe("Embroidery option is disabled for 'Restricted Polo'.");
  });

  it('4. blocks embroidery submission via printingType or printType string when embroideryEnabled is false', () => {
    const payloadWithPrintingType = {
      printingType: 'Embroidery',
    };
    const err1 = validateProductCustomizerFeatures(poloRestricted, payloadWithPrintingType);
    expect(err1).toBe("Embroidery option is disabled for 'Restricted Polo'.");

    const payloadWithPrintType = {
      printType: 'Embroidery Logo',
    };
    const err2 = validateProductCustomizerFeatures(poloRestricted, payloadWithPrintType);
    expect(err2).toBe("Embroidery option is disabled for 'Restricted Polo'.");
  });

  it('5. blocks embroidery submission when template does not support embroidery (e.g. Mug)', () => {
    const caps = getTemplateCapabilities(getCustomizerTemplateById('mug-v1'), mugProduct);
    expect(caps.supportsEmbroidery).toBe(false);

    const payload = {
      embroidery: true,
      printingType: 'Embroidery',
    };

    const err = validateProductCustomizerFeatures(mugProduct, payload);
    expect(err).toBe("Embroidery option is disabled for 'Ceramic Mug'.");
  });

  // =========================================================================
  // 3. Server-Side Enforcement for Taping Color
  // =========================================================================
  it('6. blocks taping color submission via top-level payload when tapingColorEnabled is false', () => {
    const payload = {
      tapingColor: 'Navy',
    };

    const err = validateProductCustomizerFeatures(poloRestricted, payload);
    expect(err).toBe("Taping color customization is disabled for 'Restricted Polo'.");
  });

  it('7. blocks taping color submission via items array when tapingColorEnabled is false', () => {
    const item = {
      tapingColor: '#000080',
    };

    const err = validateProductCustomizerFeatures(poloRestricted, {}, item);
    expect(err).toBe("Taping color customization is disabled for 'Restricted Polo'.");
  });

  it('8. blocks taping color submission when template does not support taping (e.g. Mug or Cap)', () => {
    const caps = getTemplateCapabilities(getCustomizerTemplateById('mug-v1'), mugProduct);
    expect(caps.supportsTapingColor).toBe(false);

    const payload = {
      tapingColor: 'White',
    };

    const err = validateProductCustomizerFeatures(mugProduct, payload);
    expect(err).toBe("Taping color customization is disabled for 'Ceramic Mug'.");
  });

  // =========================================================================
  // 4. Protection Against Spoofed or Hidden Payloads
  // =========================================================================
  it('9. intercepts hidden taping color inside JSON customizationRequirements metadata', () => {
    const payload = {
      customizationRequirements: JSON.stringify({
        tapingColor: '#FFCC00',
      }),
    };

    const err = validateProductCustomizerFeatures(poloRestricted, payload);
    expect(err).toBe("Taping color customization is disabled for 'Restricted Polo'.");
  });

  it('10. intercepts hidden embroidery flag inside JSON customizationRequirements metadata', () => {
    const payload = {
      customizationRequirements: JSON.stringify({
        embroidery: true,
      }),
    };

    const err = validateProductCustomizerFeatures(poloRestricted, payload);
    expect(err).toBe("Embroidery option is disabled for 'Restricted Polo'.");
  });

  it('11. ignores client-spoofed capabilities in request payload and enforces authoritative server rules', () => {
    const spoofedPayload = {
      capabilities: {
        supportsEmbroidery: true,
        supportsTapingColor: true,
      },
      templateCapabilities: {
        supportsEmbroidery: true,
        supportsTapingColor: true,
      },
      embroidery: true,
      tapingColor: 'Red',
    };

    const err = validateProductCustomizerFeatures(poloRestricted, spoofedPayload);
    // Server rejects because authoritative product setting is checked, spoofed capabilities are ignored
    expect(err).not.toBeNull();
    expect(err).toContain('disabled');
  });
});
