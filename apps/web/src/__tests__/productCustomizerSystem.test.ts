import { describe, it, expect } from 'vitest';
import {
  listReusableTemplates,
  getReusableTemplateById,
  isValidCustomizerTemplate,
  getCustomizerTemplate,
} from '../lib/customizerTemplates';
import {
  getCustomizerSideImage,
  getSideRecolor,
  hasTrimMask,
  isBackSideEnabled,
} from '../lib/customizerViews';
import { canCustomize } from '../lib/productConfig';

describe('Product-Level Customizer System (Web)', () => {
  describe('Reusable Template Registry', () => {
    it('provides reusable templates with generic layers and color groups', () => {
      const templates = listReusableTemplates();
      expect(templates.length).toBeGreaterThanOrEqual(4);

      const polo = getReusableTemplateById('polo-v1');
      expect(polo).toBeDefined();
      expect(polo?.supportsBack).toBe(true);
      expect(polo?.colorGroups.map((g) => g.id)).toContain('BODY');
      expect(polo?.colorGroups.map((g) => g.id)).toContain('TRIM');
      expect(polo?.layers.length).toBe(6);
    });

    it('validates template IDs', () => {
      expect(isValidCustomizerTemplate('polo-v1')).toBe(true);
      expect(isValidCustomizerTemplate('tshirt-v1')).toBe(true);
      expect(isValidCustomizerTemplate('cap-v1')).toBe(true);
      expect(isValidCustomizerTemplate('unknown-id')).toBe(false);
      expect(isValidCustomizerTemplate(null)).toBe(false);
    });
  });

  describe('Template Resolution Priority (Step 9 & 11)', () => {
    it('prioritizes customizerTemplateId over category-based fallback', () => {
      const productWithTemplate = {
        id: 'prod-123',
        name: 'Corporate Mug',
        category: { slug: 'drinkware', name: 'Mugs' },
        customizerTemplateId: 'polo-v1', // Product has customizerTemplateId assigned
        customizationEnabled: true,
      };

      const resolved = getCustomizerTemplate(productWithTemplate);
      // Resolved to polo-v1 settings, NOT the category default mug
      expect(resolved.name).toBe('Polo T-Shirt');
      expect(resolved.colorLabel).toBe('BODY COLOR');
      expect(resolved.secondaryColorLabel).toBe('COLLAR & RIB COLOR');
      expect(resolved.supportsBack).toBe(true);
    });

    it('falls back to category-based template when customizerTemplateId is absent', () => {
      const legacyCap = {
        id: 'prod-cap',
        name: 'Classic Cap',
        category: { slug: 'caps', name: 'Headwear' },
        customizationEnabled: true,
      };

      const resolved = getCustomizerTemplate(legacyCap);
      expect(resolved.type).toBe('cap');
      expect(resolved.colorLabel).toBe('CROWN COLOR');
    });
  });

  describe('Layer and Mask Loading (Step 9 & 10)', () => {
    it('resolves base image and masks directly from template layers for template-based products', () => {
      const poloProduct = {
        id: 'polo-test-1',
        name: 'Performance Polo',
        images: ['https://example.com/gallery-thumbnail-1.png'], // Product Gallery photo
        customizerTemplateId: 'polo-v1',
        customizationEnabled: true,
      };

      // Base image MUST come from template, NOT product gallery image (Target Architecture requirement)
      const frontImage = getCustomizerSideImage(poloProduct, 'front');
      expect(frontImage).toContain('dev-polo-front-base.png');
      expect(frontImage).not.toContain('gallery-thumbnail-1.png');

      const backImage = getCustomizerSideImage(poloProduct, 'back');
      expect(backImage).toContain('dev-polo-back-base.png');

      // Recolor source comes from template layers
      const frontRecolor = getSideRecolor(poloProduct, 'front');
      expect(frontRecolor).not.toBeNull();
      expect(frontRecolor?.base).toContain('dev-polo-front-base.png');
      expect(frontRecolor?.bodyMask).toContain('dev-polo-front-body-mask.png');
      expect(frontRecolor?.trimMask).toContain('dev-polo-front-trim-mask.png');

      const backRecolor = getSideRecolor(poloProduct, 'back');
      expect(backRecolor).not.toBeNull();
      expect(backRecolor?.base).toContain('dev-polo-back-base.png');
      expect(backRecolor?.bodyMask).toContain('dev-polo-back-body-mask.png');
      expect(backRecolor?.trimMask).toContain('dev-polo-back-trim-mask.png');
    });

    it('identifies trim mask support on template products', () => {
      const poloProduct = {
        id: 'polo-test-2',
        customizerTemplateId: 'polo-v1',
      };
      expect(hasTrimMask(poloProduct)).toBe(true);
      expect(isBackSideEnabled(poloProduct)).toBe(true);
    });

    it('preserves legacy customizerViews fallback when customizerTemplateId is absent', () => {
      const legacyViewsProduct = {
        id: 'legacy-views-prod',
        images: ['https://example.com/front-photo.png', 'https://example.com/back-photo.png'],
        customizerViews: {
          front: {
            image: 'https://example.com/front-photo.png',
            area: { x: 0.2, y: 0.2, w: 0.5, h: 0.5 },
            bodyMask: 'https://example.com/body-mask.png',
            trimMask: null,
          },
          back: {
            enabled: false,
            image: null,
            area: null,
            bodyMask: null,
            trimMask: null,
          },
        },
      };

      expect(getCustomizerSideImage(legacyViewsProduct, 'front')).toBe('https://example.com/front-photo.png');
      const recolor = getSideRecolor(legacyViewsProduct, 'front');
      expect(recolor?.bodyMask).toBe('https://example.com/body-mask.png');
      expect(recolor?.trimMask).toBeNull();
      expect(isBackSideEnabled(legacyViewsProduct)).toBe(false);
    });
  });

  describe('Customization Availability Control (Phase 1)', () => {
    it('canCustomize strictly requires explicit customizationEnabled === true', () => {
      // 1. customizationEnabled = true → true
      expect(canCustomize({ customizationEnabled: true })).toBe(true);
      expect(canCustomize({ customizationEnabled: true, designerEnabled: true })).toBe(true);

      // 2. customizationEnabled = false → false
      expect(canCustomize({ customizationEnabled: false })).toBe(false);

      // 3. customizationEnabled = undefined → false
      expect(canCustomize({ customizationEnabled: undefined })).toBe(false);

      // 4. customizationEnabled omitted → false
      expect(canCustomize({})).toBe(false);
      expect(canCustomize({ customizable: false })).toBe(false);

      // Negative combinations
      expect(canCustomize({ customizationEnabled: true, designerEnabled: false })).toBe(false);
    });

    it('preserves template configuration when customization is disabled', () => {
      const product = {
        id: 'polo-1',
        name: 'Classic Polo',
        customizationEnabled: false,
        customizerTemplateId: 'polo-v1',
      };
      // Customizer is blocked
      expect(canCustomize(product)).toBe(false);
      // But template identity is retained for re-enabling
      expect(product.customizerTemplateId).toBe('polo-v1');
    });

    it('resolves valid template when customization is re-enabled', () => {
      const reEnabledProduct = {
        id: 'polo-1',
        name: 'Classic Polo',
        customizationEnabled: true,
        customizerTemplateId: 'polo-v1',
      };
      expect(canCustomize(reEnabledProduct)).toBe(true);
      const template = getCustomizerTemplate(reEnabledProduct);
      expect(template.name).toBe('Polo T-Shirt');
      const reusable = getReusableTemplateById(reEnabledProduct.customizerTemplateId);
      expect(reusable?.id).toBe('polo-v1');
    });
  });
});
