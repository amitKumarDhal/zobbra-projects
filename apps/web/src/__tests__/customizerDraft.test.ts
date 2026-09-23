// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveCustomizerDraft,
  getCustomizerDraft,
  clearCustomizerDraft,
  sanitizeReturnUrl,
  CustomizerDraft,
} from '../lib/customizerDraft';
import { getColorHex, isLightColor } from '../components/customizer/GarmentBackdrop';

describe('customizerDraft helper suite', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('correctly saves and recovers a valid customizer draft', () => {
    const draft: CustomizerDraft = {
      draftId: 'draft_12345',
      productId: 'prod_polo_001',
      productName: 'Classic Polo T-Shirt',
      selectedColor: 'Navy Blue',
      quantity: 100,
      printPosition: 'Front & Back',
      variants: [
        { color: 'Navy Blue', size: 'M', quantity: 50 },
        { color: 'Navy Blue', size: 'L', quantity: 50 },
      ],
      previewFrontUrl: 'https://res.cloudinary.com/test/front.png',
      previewBackUrl: 'https://res.cloudinary.com/test/back.png',
      timestamp: Date.now(),
    };

    saveCustomizerDraft(draft);

    const recovered = getCustomizerDraft('prod_polo_001');
    expect(recovered).not.toBeNull();
    expect(recovered?.productId).toBe('prod_polo_001');
    expect(recovered?.selectedColor).toBe('Navy Blue');
    expect(recovered?.quantity).toBe(100);
    expect(recovered?.variants).toHaveLength(2);
  });

  it('clears customizer draft correctly', () => {
    const draft: CustomizerDraft = {
      draftId: 'draft_999',
      productId: 'prod_polo_002',
      productName: 'Round Neck Tee',
      selectedColor: 'Black',
      quantity: 50,
      printPosition: 'Front Only',
      variants: [{ color: 'Black', size: 'XL', quantity: 50 }],
      timestamp: Date.now(),
    };

    saveCustomizerDraft(draft);
    expect(getCustomizerDraft('prod_polo_002')).not.toBeNull();

    clearCustomizerDraft('prod_polo_002');
    expect(getCustomizerDraft('prod_polo_002')).toBeNull();
  });

  it('sanitizes returnUrl against open redirect vulnerabilities', () => {
    // Valid internal URLs
    expect(sanitizeReturnUrl('/products/123/customize?resume=1')).toBe('/products/123/customize?resume=1');
    expect(sanitizeReturnUrl('/customer/quotes')).toBe('/customer/quotes');

    // Invalid external URLs & malicious injections
    expect(sanitizeReturnUrl('https://evil.com')).toBeNull();
    expect(sanitizeReturnUrl('http://attacker.org')).toBeNull();
    expect(sanitizeReturnUrl('//evil.com')).toBeNull();
    expect(sanitizeReturnUrl('javascript:alert(1)')).toBeNull();
    expect(sanitizeReturnUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
    expect(sanitizeReturnUrl('')).toBeNull();
    expect(sanitizeReturnUrl(null)).toBeNull();
  });
});

describe('Garment color helpers', () => {
  it('correctly maps known colors to hex values', () => {
    expect(getColorHex('Black')).toBe('#171717');
    expect(getColorHex('Navy Blue')).toBe('#0D1333');
    expect(getColorHex('White')).toBe('#FFFFFF');
    expect(getColorHex('#123456')).toBe('#123456');
  });

  it('correctly identifies light vs dark colors for contrast', () => {
    expect(isLightColor('#F9FAFB')).toBe(true);
    expect(isLightColor('#FFFFFF')).toBe(true);
    expect(isLightColor('#171717')).toBe(false);
    expect(isLightColor('#1E293B')).toBe(false);
  });
});
