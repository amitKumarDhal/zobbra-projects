import { describe, expect, it } from 'vitest';
import {
  getCustomizerSideImage,
  getSideRecolor,
  hasTrimMask,
  isBackSideEnabled,
  applyCustomizerViews,
} from '../lib/customizerViews';
import {
  getReusableTemplateById,
  getCustomizerTemplate,
  getTemplateCapabilities,
} from '../lib/customizerTemplates';
import {
  getProductColors,
  getProductCollarColors,
} from '../lib/productConfig';
import {
  sanitizeCanvasJson,
  normalizeCanvasJsonForCORS,
} from '../components/customizer/CustomizerCanvas';

describe('Phase 5: Template-Based Customer Canvas & Design Integration', () => {
  // Test fixture: Template-based product (Polo)
  const templatePolo = {
    id: 'prod-phase5-polo',
    name: 'Executive Polo Shirt',
    slug: 'executive-polo-shirt',
    category: { id: 'cat-1', name: 'Polos', slug: 'polos' },
    customizationEnabled: true,
    customizerTemplateId: 'polo-v1',
    trimColorEnabled: true,
    backDesignEnabled: true,
    availableColors: [
      { name: 'Pure White', hex: '#FFFFFF' },
      { name: 'Navy Blue', hex: '#000080' },
    ],
    collarColors: [
      { name: 'Crimson Red', hex: '#DC2626' },
      { name: 'Gold', hex: '#F59E0B' },
    ],
    customizer: {
      enabled: true,
      trimColor: true,
      taping: false,
      back: true,
      embroidery: true,
    },
  };

  // Test fixture: Legacy product without template (customizerViews fallback)
  const legacyProductWithViews = {
    id: 'prod-phase5-legacy',
    name: 'Classic Vintage Tee',
    slug: 'classic-vintage-tee',
    category: { id: 'cat-2', name: 'T-Shirts', slug: 't-shirts' },
    customizationEnabled: true,
    customizerTemplateId: null,
    images: ['https://example.com/legacy-front.jpg', 'https://example.com/legacy-back.jpg'],
    customizerViews: {
      front: {
        image: 'https://example.com/view-front.jpg',
        area: { x: 0.25, y: 0.2, w: 0.5, h: 0.6 },
        bodyMask: 'https://example.com/view-front-body-mask.png',
        trimMask: 'https://example.com/view-front-trim-mask.png',
      },
      back: {
        enabled: true,
        image: 'https://example.com/view-back.jpg',
        area: { x: 0.25, y: 0.2, w: 0.5, h: 0.6 },
        bodyMask: 'https://example.com/view-back-body-mask.png',
        trimMask: null,
      },
    },
  };

  // Test fixture: Legacy plain product without views or template (SVG silhouette fallback)
  const legacyPlainProduct = {
    id: 'prod-phase5-plain',
    name: 'Plain T-Shirt',
    slug: 'plain-t-shirt',
    category: { id: 'cat-2', name: 'T-Shirts', slug: 't-shirts' },
    customizationEnabled: true,
    customizerTemplateId: null,
    images: [],
  };

  // =========================================================================
  // Requirement 1: Template-based products use assigned active template layers
  // =========================================================================
  describe('1. Template-based garment layer rendering', () => {
    it('uses FRONT base, BODY, and TRIM layers as the garment on the customer canvas', () => {
      const frontImage = getCustomizerSideImage(templatePolo, 'front');
      expect(frontImage).toContain('dev-polo-front-base.png');

      const frontRecolor = getSideRecolor(templatePolo, 'front');
      expect(frontRecolor).not.toBeNull();
      expect(frontRecolor?.base).toContain('dev-polo-front-base.png');
      expect(frontRecolor?.bodyMask).toContain('dev-polo-front-body-mask.png');
      expect(frontRecolor?.trimMask).toContain('dev-polo-front-trim-mask.png');
    });

    it('uses BACK base, BODY, and TRIM layers when viewing back of the garment', () => {
      const backImage = getCustomizerSideImage(templatePolo, 'back');
      expect(backImage).toContain('dev-polo-back-base.png');

      const backRecolor = getSideRecolor(templatePolo, 'back');
      expect(backRecolor).not.toBeNull();
      expect(backRecolor?.base).toContain('dev-polo-back-base.png');
      expect(backRecolor?.bodyMask).toContain('dev-polo-back-body-mask.png');
      expect(backRecolor?.trimMask).toContain('dev-polo-back-trim-mask.png');
    });
  });

  // =========================================================================
  // Requirement 2: Fabric.js design layer separation and free placement
  // =========================================================================
  describe('2. Design layer independence & free placement', () => {
    it('sanitizes and isolates user design objects without corrupting garment layers', () => {
      const canvasWithUserLogo = {
        version: '5.3.0',
        objects: [
          {
            type: 'image',
            src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
            left: 100,
            top: 150,
            scaleX: 0.5,
            scaleY: 0.5,
            angle: 45,
          },
          {
            type: 'i-text',
            text: 'ZOBBRA SPORT',
            left: 200,
            top: 250,
            fontSize: 24,
            fill: '#FFFFFF',
          },
        ],
      };

      const cdnArtworkUrl = 'https://res.cloudinary.com/zobra/image/upload/v12345/logo.png';
      const sanitized = sanitizeCanvasJson(JSON.stringify(canvasWithUserLogo), cdnArtworkUrl);

      // Must scrub base64 data URI and replace with CORS-safe CDN artwork URL
      expect(sanitized).not.toContain('data:image/');
      expect(sanitized).toContain(cdnArtworkUrl);

      const parsed = JSON.parse(sanitized);
      expect(parsed.objects).toHaveLength(2);
      expect(parsed.objects[0].crossOrigin).toBe('anonymous');
      expect(parsed.objects[1].text).toBe('ZOBBRA SPORT');
      // Design coordinates, scale, and rotation are preserved exactly
      expect(parsed.objects[0].left).toBe(100);
      expect(parsed.objects[0].angle).toBe(45);
    });

    it('enforces anonymous CORS on all remote design images to prevent canvas tainting', () => {
      const json = {
        objects: [
          { type: 'image', src: 'https://example.com/logo.png' },
        ],
      };
      const normalized = normalizeCanvasJsonForCORS(json);
      expect(normalized.objects[0].crossOrigin).toBe('anonymous');
    });
  });

  // =========================================================================
  // Requirement 3: Independent body & trim color rendering and design persistence
  // =========================================================================
  describe('3. Independent body & trim color rendering', () => {
    it('resolves body and trim colors independently from product color configuration', () => {
      const colors = getProductColors(templatePolo);
      const collarColors = getProductCollarColors(templatePolo);

      expect(colors).toHaveLength(2);
      expect(colors[0].name).toBe('Pure White');
      expect(colors[0].hex).toBe('#FFFFFF');

      expect(collarColors).toHaveLength(2);
      expect(collarColors[0].name).toBe('Crimson Red');
      expect(collarColors[0].hex).toBe('#DC2626');
    });

    it('omits trim mask when trimColorEnabled is disabled for the product', () => {
      const poloWithoutTrim = {
        ...templatePolo,
        trimColorEnabled: false,
        customizer: { ...templatePolo.customizer, trimColor: false },
      };

      expect(hasTrimMask(poloWithoutTrim)).toBe(false);

      const frontRecolor = getSideRecolor(poloWithoutTrim, 'front');
      expect(frontRecolor).not.toBeNull();
      expect(frontRecolor?.base).toBeDefined();
      expect(frontRecolor?.bodyMask).toBeDefined();
      // Trim mask is null when trim color is disabled
      expect(frontRecolor?.trimMask).toBeNull();

      const template = applyCustomizerViews(getCustomizerTemplate(poloWithoutTrim), poloWithoutTrim);
      expect(template.secondaryColorLabel).toBeUndefined();
    });
  });

  // =========================================================================
  // Requirement 4: Front/Back switching and state preservation
  // =========================================================================
  describe('4. Front/Back switching & side enablement', () => {
    it('correctly enables back design when supported by template and product', () => {
      expect(isBackSideEnabled(templatePolo)).toBe(true);
      const tmpl = getCustomizerTemplate(templatePolo);
      expect(tmpl.supportsBack).toBe(true);
      expect(tmpl.backPrintableArea).toBeDefined();
    });

    it('hides and disables back design when backDesignEnabled is false', () => {
      const poloNoBack = {
        ...templatePolo,
        backDesignEnabled: false,
        customizer: { ...templatePolo.customizer, back: false },
      };

      expect(isBackSideEnabled(poloNoBack)).toBe(false);
      expect(getCustomizerSideImage(poloNoBack, 'back')).toBeNull();
      expect(getSideRecolor(poloNoBack, 'back')).toBeNull();

      const tmpl = applyCustomizerViews(getCustomizerTemplate(poloNoBack), poloNoBack);
      expect(tmpl.supportsBack).toBe(false);
      expect(tmpl.backPrintableArea).toBeUndefined();
    });

    it('hides back view when template does not support back (e.g., front-only template)', () => {
      const frontOnlyTemplate = {
        id: 'cap-noback-v1',
        name: 'Single View Cap',
        description: 'Cap with single front embroidery view',
        version: '1.0',
        active: true,
        supportsBack: false,
        categoryCompatibility: ['caps'],
        colorGroups: [{ id: 'BODY', label: 'CROWN COLOR', defaultColor: 'Black' }],
        layers: [],
        printAreas: [
          {
            templateId: 'cap-noback-v1',
            side: 'front' as const,
            x: 0.34,
            y: 0.328,
            width: 0.32,
            height: 0.198,
            top: '32.8%',
            left: '34%',
            styleWidth: '32%',
            styleHeight: '19.8%',
            label: 'Front Crown',
            guideText: 'Add front logo',
          },
        ],
      };
      const capProduct = {
        id: 'prod-cap-1',
        name: 'Baseball Cap',
        slug: 'baseball-cap',
        category: { id: 'cat-3', name: 'Caps', slug: 'caps' },
        customizationEnabled: true,
        customizerTemplate: frontOnlyTemplate,
        backDesignEnabled: true,
      };

      expect(isBackSideEnabled(capProduct)).toBe(false);
      expect(getCustomizerSideImage(capProduct, 'back')).toBeNull();
      expect(getSideRecolor(capProduct, 'back')).toBeNull();

      const tmpl = getCustomizerTemplate(capProduct);
      expect(tmpl.supportsBack).toBe(false);
      expect(tmpl.backPrintableArea).toBeUndefined();
    });
  });

  // =========================================================================
  // Requirement 5: Normalized print-area guides
  // =========================================================================
  describe('5. Normalized print-area guides', () => {
    it('displays template-configured print-area dimensions and guide instructions', () => {
      const tmpl = getCustomizerTemplate(templatePolo);

      expect(tmpl.frontPrintableArea).toBeDefined();
      expect(tmpl.frontPrintableArea.width).toBeGreaterThan(0);
      expect(tmpl.frontPrintableArea.height).toBeGreaterThan(0);
      expect(tmpl.frontPrintableArea.top).toMatch(/^\d+(\.\d+)?%$/);
      expect(tmpl.frontPrintableArea.left).toMatch(/^\d+(\.\d+)?%$/);
      expect(tmpl.frontPrintableArea.styleWidth).toMatch(/^\d+(\.\d+)?%$/);
      expect(tmpl.frontPrintableArea.styleHeight).toMatch(/^\d+(\.\d+)?%$/);

      // Verify guide text from template is exposed
      expect(tmpl.frontPrintableArea.guideText).toBe('Add your logo, text or artwork');
      expect(tmpl.frontPrintableArea.subGuideText).toBe('Select an option from the design tools to begin');

      // Verify back printable area guide text
      expect(tmpl.backPrintableArea?.guideText).toBe('Add your back print artwork');
      expect(tmpl.backPrintableArea?.subGuideText).toBe('Choose a design tool to begin');
    });
  });

  // =========================================================================
  // Requirement 7: Legacy fallback for products without usable templates
  // =========================================================================
  describe('7. Legacy fallback behavior', () => {
    it('uses existing customizerViews when no template is assigned', () => {
      const frontRecolor = getSideRecolor(legacyProductWithViews, 'front');
      expect(frontRecolor).not.toBeNull();
      expect(frontRecolor?.base).toBe('https://example.com/view-front.jpg');
      expect(frontRecolor?.bodyMask).toBe('https://example.com/view-front-body-mask.png');
      expect(frontRecolor?.trimMask).toBe('https://example.com/view-front-trim-mask.png');

      const frontImg = getCustomizerSideImage(legacyProductWithViews, 'front');
      expect(frontImg).toBe('https://example.com/view-front.jpg');
    });

    it('falls back to legacy matcher and silhouette when template is deactivated (active: false)', () => {
      const inactiveTemplateProduct = {
        ...templatePolo,
        customizerTemplate: {
          id: 'inactive-polo',
          name: 'Inactive Polo',
          active: false,
          supportsBack: true,
          categoryCompatibility: ['polos'],
          colorGroups: [],
          layers: [],
          printAreas: [],
        },
        customizerTemplateId: 'inactive-polo',
      };

      // getCustomizerTemplate falls back to legacy category matcher
      const tmpl = getCustomizerTemplate(inactiveTemplateProduct);
      expect(tmpl.name).not.toBe('Inactive Polo');
      expect(tmpl.type).toBe('tshirt');

      // getSideRecolor falls back safely to null (no customizerViews)
      expect(getSideRecolor(inactiveTemplateProduct, 'front')).toBeNull();
    });

    it('falls back to category silhouette when product has no images or views', () => {
      expect(getCustomizerSideImage(legacyPlainProduct, 'front')).toBeNull();
      expect(getSideRecolor(legacyPlainProduct, 'front')).toBeNull();
      const tmpl = getCustomizerTemplate(legacyPlainProduct);
      expect(tmpl.type).toBe('tshirt');
    });
  });

  // =========================================================================
  // Requirement 8: Security & feature permission validation
  // =========================================================================
  describe('8. Feature permission safety & validation', () => {
    it('computes template capabilities independently from server/template definitions', () => {
      const poloTemplate = getReusableTemplateById('polo-v1');
      const caps = getTemplateCapabilities(poloTemplate);

      expect(caps.supportsTrimColor).toBe(true);
      expect(caps.supportsBack).toBe(true);
      expect(caps.supportsEmbroidery).toBe(true);

      const capTemplate = getReusableTemplateById('cap-v1');
      const capCaps = getTemplateCapabilities(capTemplate);
      expect(capCaps.supportsTapingColor).toBe(false);
    });

    it('returns legacy fallback capabilities when template is inactive (active: false)', () => {
      const inactiveTemplate = {
        id: 'inactive-test',
        name: 'Inactive Test',
        description: 'Inactive test template',
        version: '1.0',
        active: false,
        supportsBack: true,
        categoryCompatibility: [],
        colorGroups: [],
        layers: [],
        printAreas: [],
      };

      const caps = getTemplateCapabilities(inactiveTemplate, legacyProductWithViews);
      expect(caps.supportsBack).toBe(true);
      expect(caps.supportsTrimColor).toBe(true);
    });
  });
});
