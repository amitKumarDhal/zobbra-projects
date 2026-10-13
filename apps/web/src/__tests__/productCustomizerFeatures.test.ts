import { describe, it, expect } from 'vitest';
import {
  canCustomize,
  getCustomizerFeatures,
} from '@/lib/productConfig';
import {
  getReusableTemplateById,
  getTemplateCapabilities,
} from '@/lib/customizerTemplates';
import {
  isBackSideEnabled,
  hasTrimMask,
  applyCustomizerViews,
} from '@/lib/customizerViews';

describe('Phase 3: Product-Specific Customizer Features (Web)', () => {
  describe('Template Capabilities', () => {
    it('polo-v1 supports trim, taping, back and embroidery', () => {
      const polo = getReusableTemplateById('polo-v1');
      expect(polo).not.toBeNull();
      const caps = getTemplateCapabilities(polo);
      expect(caps.supportsTrimColor).toBe(true);
      expect(caps.supportsTapingColor).toBe(true);
      expect(caps.supportsBack).toBe(true);
      expect(caps.supportsEmbroidery).toBe(true);
    });

    it('cap-v1 supports embroidery but not taping', () => {
      const cap = getReusableTemplateById('cap-v1');
      expect(cap).not.toBeNull();
      const caps = getTemplateCapabilities(cap);
      expect(caps.supportsEmbroidery).toBe(true);
      expect(caps.supportsTapingColor).toBe(false);
    });

    it('preserves capabilities for legacy products without a template', () => {
      const caps = getTemplateCapabilities(null);
      expect(caps.supportsBack).toBe(true);
      expect(caps.supportsTrimColor).toBe(true);
      expect(caps.supportsEmbroidery).toBe(true);
    });
  });

  describe('getCustomizerFeatures resolver', () => {
    it('returns all features disabled when customizationEnabled is false', () => {
      const product = {
        id: 'p-off',
        name: 'Plain Product',
        customizationEnabled: false,
        customizerTemplateId: 'polo-v1',
        trimColorEnabled: true,
        backDesignEnabled: true,
      };
      const features = getCustomizerFeatures(product);
      expect(features.enabled).toBe(false);
      expect(features.trimColor).toBe(false);
      expect(features.back).toBe(false);
      expect(features.embroidery).toBe(false);
    });

    it('returns product-specific enabled features when customization is enabled', () => {
      const product = {
        id: 'p-polo-1',
        name: 'Custom Polo 1',
        customizationEnabled: true,
        customizerTemplateId: 'polo-v1',
        trimColorEnabled: true,
        tapingColorEnabled: false,
        backDesignEnabled: true,
        embroideryEnabled: false,
      };
      const features = getCustomizerFeatures(product);
      expect(features.enabled).toBe(true);
      expect(features.trimColor).toBe(true);
      expect(features.taping).toBe(false);
      expect(features.back).toBe(true);
      expect(features.embroidery).toBe(false);
    });

    it('honors pre-resolved customizer object from server API response', () => {
      const product = {
        id: 'p-pre-resolved',
        customizationEnabled: true,
        customizer: {
          enabled: true,
          trimColor: false,
          taping: true,
          back: false,
          embroidery: true,
        },
      };
      const features = getCustomizerFeatures(product);
      expect(features.enabled).toBe(true);
      expect(features.trimColor).toBe(false);
      expect(features.taping).toBe(true);
      expect(features.back).toBe(false);
      expect(features.embroidery).toBe(true);
    });
  });

  describe('Back and Trim view helpers', () => {
    it('isBackSideEnabled returns false when product has backDesignEnabled: false', () => {
      const product = {
        id: 'p-noback',
        customizationEnabled: true,
        customizerTemplateId: 'polo-v1',
        backDesignEnabled: false,
      };
      expect(isBackSideEnabled(product)).toBe(false);
    });

    it('hasTrimMask returns false when product has trimColorEnabled: false', () => {
      const product = {
        id: 'p-notrim',
        customizationEnabled: true,
        customizerTemplateId: 'polo-v1',
        trimColorEnabled: false,
      };
      expect(hasTrimMask(product)).toBe(false);
    });

    it('applyCustomizerViews removes secondaryColorLabel when trimColorEnabled is false', () => {
      const poloTemplate = getReusableTemplateById('polo-v1');
      const product = {
        id: 'p-notrim',
        customizationEnabled: true,
        customizerTemplateId: 'polo-v1',
        trimColorEnabled: false,
        backDesignEnabled: true,
      };
      const resolved = applyCustomizerViews(poloTemplate as any, product);
      expect(resolved.secondaryColorLabel).toBeUndefined();
      expect(resolved.supportsBack).toBe(true);
    });

    it('applyCustomizerViews removes backPrintableArea when backDesignEnabled is false', () => {
      const poloTemplate = getReusableTemplateById('polo-v1');
      const product = {
        id: 'p-noback',
        customizationEnabled: true,
        customizerTemplateId: 'polo-v1',
        trimColorEnabled: true,
        backDesignEnabled: false,
      };
      const resolved = applyCustomizerViews(poloTemplate as any, product);
      expect(resolved.supportsBack).toBe(false);
      expect(resolved.backPrintableArea).toBeUndefined();
    });
  });
});
