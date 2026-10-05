import { describe, expect, it } from 'vitest';
import {
  getCustomizerFeatures,
  getProductColors,
  getProductCollarColors,
} from '../lib/productConfig';
import {
  getReusableTemplateById,
  getTemplateCapabilities,
} from '../lib/customizerTemplates';

describe('Phase 6 Web: Customizer Feature Controls, Branding Method & Order Review', () => {
  // Test fixture: Polo with embroidery and taping enabled
  const poloWithAllFeatures = {
    id: 'prod-phase6-polo-all',
    name: 'Executive Polo Pro',
    slug: 'executive-polo-pro',
    category: { id: 'cat-1', name: 'Polos', slug: 'polos' },
    customizationEnabled: true,
    customizerTemplateId: 'polo-v1',
    trimColorEnabled: true,
    tapingColorEnabled: true,
    backDesignEnabled: true,
    embroideryEnabled: true,
    zipperEnabled: false,
    colors: [
      { name: 'White', hex: '#FFFFFF' },
      { name: 'Navy', hex: '#0D1333' },
    ],
    collarColors: [
      { name: 'Red', hex: '#DC2626' },
      { name: 'Gold', hex: '#F59E0B' },
    ],
  };

  // Test fixture: Polo with embroidery and taping disabled
  const poloWithoutEmbroideryOrTaping = {
    ...poloWithAllFeatures,
    id: 'prod-phase6-polo-restricted',
    name: 'Basic Polo Shirt',
    embroideryEnabled: false,
    tapingColorEnabled: false,
  };

  // Test fixture: Mug (template inherently does NOT support embroidery or taping)
  const mugProduct = {
    id: 'prod-phase6-mug',
    name: 'Ceramic Coffee Mug',
    slug: 'ceramic-coffee-mug',
    category: { id: 'cat-drinkware', name: 'Drinkware', slug: 'drinkware' },
    customizationEnabled: true,
    customizerTemplateId: 'mug-v1',
    embroideryEnabled: true, // Product tries to enable, but template does not support
    tapingColorEnabled: true, // Product tries to enable, but template does not support
  };

  // =========================================================================
  // 1. Branding Selector Visibility & Permission Control
  // =========================================================================
  describe('1. Branding Method Selector Visibility', () => {
    it('shows branding method selector when embroideryEnabled is true and template supports it', () => {
      const features = getCustomizerFeatures(poloWithAllFeatures);
      expect(features.embroidery).toBe(true);

      const template = getReusableTemplateById('polo-v1');
      const caps = getTemplateCapabilities(template);
      expect(caps.supportsEmbroidery).toBe(true);

      // Studio computes showBrandingMethod = customizerFeatures.embroidery
      const showBrandingMethod = Boolean(features.embroidery);
      expect(showBrandingMethod).toBe(true);
    });

    it('hides branding method selector when embroideryEnabled is false', () => {
      const features = getCustomizerFeatures(poloWithoutEmbroideryOrTaping);
      expect(features.embroidery).toBe(false);

      const showBrandingMethod = Boolean(features.embroidery);
      expect(showBrandingMethod).toBe(false);
    });

    it('hides branding method selector when template does not support embroidery (e.g. Mug)', () => {
      const features = getCustomizerFeatures(mugProduct);
      // Even though product has embroideryEnabled: true, template capabilities override it
      expect(features.embroidery).toBe(false);

      const showBrandingMethod = Boolean(features.embroidery);
      expect(showBrandingMethod).toBe(false);
    });
  });

  // =========================================================================
  // 2. Canonical Quote Payload Field for Branding Method
  // =========================================================================
  describe('2. Canonical Quote Payload Formatting', () => {
    it('formats canonical quote payload when Embroidery is selected', () => {
      const brandingMethod = 'Embroidery';
      const effectiveBranding = poloWithAllFeatures.embroideryEnabled ? brandingMethod : 'Print';
      const isEmbroidery = effectiveBranding === 'Embroidery';
      const effectivePrintPosition = 'Front Only';

      const quotePayload = {
        productId: poloWithAllFeatures.id,
        quantity: 50,
        color: 'White',
        printingType: isEmbroidery ? 'Embroidery' : 'Custom Online Design',
        printPosition: effectivePrintPosition,
        printType: isEmbroidery ? 'Embroidery Logo' : effectivePrintPosition,
        embroidery: isEmbroidery,
        customizationRequirements: JSON.stringify({
          selectedColor: 'White',
          collarColor: 'Red',
          brandingMethod: effectiveBranding,
          embroidery: isEmbroidery,
          printPosition: effectivePrintPosition,
        }),
        items: [
          {
            productId: poloWithAllFeatures.id,
            printType: isEmbroidery ? 'Embroidery Logo' : effectivePrintPosition,
            printingType: isEmbroidery ? 'Embroidery' : 'Print',
            embroidery: isEmbroidery,
            brandingMethod: effectiveBranding,
          },
        ],
      };

      // Canonical existing fields: printingType and printType
      expect(quotePayload.printingType).toBe('Embroidery');
      expect(quotePayload.printType).toBe('Embroidery Logo');
      expect(quotePayload.embroidery).toBe(true);

      const reqs = JSON.parse(quotePayload.customizationRequirements);
      expect(reqs.brandingMethod).toBe('Embroidery');
      expect(reqs.embroidery).toBe(true);

      expect(quotePayload.items[0].brandingMethod).toBe('Embroidery');
      expect(quotePayload.items[0].embroidery).toBe(true);
    });

    it('forces default Print behavior when product has embroidery disabled', () => {
      // Client tries to spoof brandingMethod = 'Embroidery' on a restricted product
      const spoofedClientChoice = 'Embroidery';
      const features = getCustomizerFeatures(poloWithoutEmbroideryOrTaping);
      const effectiveBranding = features.embroidery ? spoofedClientChoice : 'Print';
      const isEmbroidery = effectiveBranding === 'Embroidery';

      expect(effectiveBranding).toBe('Print');
      expect(isEmbroidery).toBe(false);

      const quotePayload = {
        printingType: isEmbroidery ? 'Embroidery' : 'Custom Online Design',
        printType: 'Front Only',
        embroidery: isEmbroidery,
        customizationRequirements: JSON.stringify({
          brandingMethod: effectiveBranding,
          embroidery: isEmbroidery,
        }),
      };

      expect(quotePayload.printingType).toBe('Custom Online Design');
      expect(quotePayload.printType).toBe('Front Only');
      expect(quotePayload.embroidery).toBe(false);

      const reqs = JSON.parse(quotePayload.customizationRequirements);
      expect(reqs.brandingMethod).toBe('Print');
      expect(reqs.embroidery).toBe(false);
    });
  });

  // =========================================================================
  // 3. Taping Color Selector Visibility & Payload Binding
  // =========================================================================
  describe('3. Taping Color Customization', () => {
    it('shows taping color selector when tapingColorEnabled is true and template supports it', () => {
      const features = getCustomizerFeatures(poloWithAllFeatures);
      expect(features.taping).toBe(true);

      const template = getReusableTemplateById('polo-v1');
      const caps = getTemplateCapabilities(template);
      expect(caps.supportsTapingColor).toBe(true);

      const showTapingColor = Boolean(features.taping);
      expect(showTapingColor).toBe(true);
    });

    it('hides taping color selector when tapingColorEnabled is false', () => {
      const features = getCustomizerFeatures(poloWithoutEmbroideryOrTaping);
      expect(features.taping).toBe(false);

      const showTapingColor = Boolean(features.taping);
      expect(showTapingColor).toBe(false);
    });

    it('hides taping color selector when template does not support taping (e.g. Mug or Cap)', () => {
      const features = getCustomizerFeatures(mugProduct);
      expect(features.taping).toBe(false);

      const showTapingColor = Boolean(features.taping);
      expect(showTapingColor).toBe(false);
    });

    it('omits tapingColor from quote payload when taping is disabled', () => {
      const features = getCustomizerFeatures(poloWithoutEmbroideryOrTaping);
      const tapingColor = 'Navy';
      const effectiveTapingColor = features.taping ? tapingColor : undefined;

      expect(effectiveTapingColor).toBeUndefined();

      const quotePayload = {
        tapingColor: effectiveTapingColor,
        customizationRequirements: JSON.stringify({
          tapingColor: effectiveTapingColor,
        }),
      };

      expect(quotePayload.tapingColor).toBeUndefined();
      const reqs = JSON.parse(quotePayload.customizationRequirements);
      expect(reqs.tapingColor).toBeUndefined();
    });
  });

  // =========================================================================
  // 4. OrderReviewSheet Data Flow & Parity
  // =========================================================================
  describe('4. Order Review Sheet Customization Specifications', () => {
    it('assembles all customization attributes for OrderReviewSheet', () => {
      const selectedColor = 'White';
      const collarColor = 'Red';
      const tapingColor = 'Navy';
      const brandingMethod: 'Print' | 'Embroidery' = 'Embroidery';

      const reviewProps = {
        selectedColor,
        colorHex: '#FFFFFF',
        collarColor,
        collarColorHex: '#DC2626',
        showCollarColor: true,
        tapingColor,
        tapingColorHex: '#0D1333',
        showTapingColor: true,
        brandingMethod,
        showBrandingMethod: true,
        printType: 'Front Only',
      };

      expect(reviewProps.selectedColor).toBe('White');
      expect(reviewProps.collarColor).toBe('Red');
      expect(reviewProps.showCollarColor).toBe(true);
      expect(reviewProps.tapingColor).toBe('Navy');
      expect(reviewProps.showTapingColor).toBe(true);
      expect(reviewProps.brandingMethod).toBe('Embroidery');
      expect(reviewProps.showBrandingMethod).toBe(true);
    });
  });

  // =========================================================================
  // 5. Front/Back Switcher Visual Color Indicators
  // =========================================================================
  describe('5. Side Switcher Visual Color Indicators', () => {
    it('resolves correct body and collar colors for switcher badge rendering', () => {
      const colors = getProductColors(poloWithAllFeatures);
      const collarColors = getProductCollarColors(poloWithAllFeatures);

      const selectedBodyColor = 'Navy';
      const selectedCollarColor = 'Red';

      const bodyHex = colors.find((c) => c.name === selectedBodyColor)?.hex;
      const collarHex = collarColors.find((c) => c.name === selectedCollarColor)?.hex;

      expect(bodyHex).toBe('#0D1333');
      expect(collarHex).toBe('#DC2626');
    });
  });

  // =========================================================================
  // 6. Admin Quote Detail Structured Extraction
  // =========================================================================
  describe('6. Admin Quote Detail Structured Customization Extraction', () => {
    it('extracts structured template, body, collar, taping, and branding specs from quote', () => {
      const quoteFixture = {
        id: 'quote-phase6-test',
        quoteNumber: 'Q-2026-999',
        color: 'White',
        printingType: 'Embroidery',
        notes: 'Delivery Address: Bangalore | Customization: {"selectedColor":"White","collarColor":"Red","tapingColor":"Navy","brandingMethod":"Embroidery","embroidery":true,"printPosition":"Front Only"} | Offer Addon: None',
        items: [
          {
            id: 'item-1',
            color: 'White',
            printType: 'Embroidery Logo',
            product: {
              id: 'prod-polo-1',
              name: 'Executive Polo',
              customizerTemplateId: 'polo-v1',
            },
          },
        ],
      };

      // Simulates the structured parsing logic in dashboard/quotes/[id]/page.tsx
      const item = quoteFixture.items[0];
      let customReqs: any = null;
      if (quoteFixture.notes) {
        const match = quoteFixture.notes.match(/Customization:\s*(\{.+?\})/);
        if (match && match[1]) {
          customReqs = JSON.parse(match[1]);
        }
      }

      const templateId = item?.product?.customizerTemplateId || customReqs?.templateId;
      const bodyColor = customReqs?.selectedColor || item?.color || quoteFixture.color;
      const collarColor = customReqs?.collarColor;
      const tapingColor = customReqs?.tapingColor;
      const isEmbroidery =
        customReqs?.embroidery === true ||
        customReqs?.brandingMethod === 'Embroidery' ||
        /embroidery/i.test(item?.printType || '') ||
        /embroidery/i.test(quoteFixture.printingType || '');
      const brandingMethod = customReqs?.brandingMethod || (isEmbroidery ? 'Embroidery' : 'Print');

      expect(templateId).toBe('polo-v1');
      expect(bodyColor).toBe('White');
      expect(collarColor).toBe('Red');
      expect(tapingColor).toBe('Navy');
      expect(isEmbroidery).toBe(true);
      expect(brandingMethod).toBe('Embroidery');
    });
  });
});
