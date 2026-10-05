import { describe, expect, it } from 'vitest';
import { dye, parseHex } from '../lib/photoRecolor';
import { getSideRecolor, applyCustomizerViews } from '../lib/customizerViews';
import { TEMPLATES } from '../lib/customizerTemplates';

const img = (n: string) => `https://res.cloudinary.com/demo/image/upload/${n}.png`;
const lum = (rgb: number[]) => 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
const dyeRgb = (l: number, ref: number, hex: string) => {
  const c = parseHex(hex)!;
  const weight = lum(c);
  return c.map((ch) => dye(l, ref, ch, weight));
};

const REF = 0.9; // typical brightness of a white shirt photo
const SHADOW = 0.6;
const HIGHLIGHT = 0.98;

describe('photo recolouring (per-pixel dye)', () => {
  it('parses product colour values', () => {
    expect(parseHex('#FF0000')).toEqual([1, 0, 0]);
    expect(parseHex('0d1333')?.map((v) => Math.round(v * 255))).toEqual([13, 19, 51]);
    expect(parseHex('#fff')).toEqual([1, 1, 1]);
    expect(parseHex('red')).toBeNull();
    expect(parseHex(undefined)).toBeNull();
  });

  it('gives the fabric the chosen colour at its typical tone', () => {
    for (const hex of ['#111111', '#FFFFFF', '#0D1333', '#FF0000']) {
      const target = parseHex(hex)!;
      dyeRgb(REF, REF, hex).forEach((v, i) => expect(v).toBeCloseTo(target[i], 5));
    }
  });

  it('keeps shadows darker and highlights lighter for light, mid and dark colours', () => {
    for (const hex of ['#FFFFFF', '#FF0000', '#0D1333', '#111111']) {
      const shadow = lum(dyeRgb(SHADOW, REF, hex));
      const base = lum(dyeRgb(REF, REF, hex));
      const highlight = lum(dyeRgb(HIGHLIGHT, REF, hex));
      expect(shadow, `${hex} shadow`).toBeLessThan(base);
      if (hex !== '#FFFFFF') expect(highlight, `${hex} highlight`).toBeGreaterThan(base);
    }
  });

  it('keeps folds visible on black (not a flat fill)', () => {
    const fold = lum(dyeRgb(0.8, REF, '#111111'));
    const flat = lum(dyeRgb(REF, REF, '#111111'));
    const sheen = lum(dyeRgb(0.97, REF, '#111111'));
    expect(flat - fold).toBeGreaterThan(0.03);
    expect(sheen - flat).toBeGreaterThan(0.03);
  });

  it('stays within 0..1', () => {
    for (const l of [0, 0.2, 0.5, 1]) for (const hex of ['#000000', '#FFFFFF', '#FF0000']) {
      for (const v of dyeRgb(l, REF, hex)) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe('recolour configuration per side', () => {
  const product = (front: any, back: any) => ({ images: [img('f'), img('b')], customizerViews: { front, back } });

  it('recolours a side only when it has a mask, using that side’s own assets', () => {
    const p = product(
      { image: img('f'), bodyMask: img('fb'), trimMask: img('ft') },
      { enabled: true, image: img('b'), bodyMask: null, trimMask: img('bt') }
    );
    expect(getSideRecolor(p, 'front')).toEqual({ base: img('f'), bodyMask: img('fb'), trimMask: img('ft') });
    expect(getSideRecolor(p, 'back')).toEqual({ base: img('b'), bodyMask: null, trimMask: img('bt') });
    expect(getSideRecolor(product({ image: img('f') }, { enabled: false }), 'front')).toBeNull();
  });

  it('ignores back masks when the back is disabled, and legacy products never recolour', () => {
    const p = product({ image: img('f') }, { enabled: false, image: img('b'), bodyMask: img('bb') });
    expect(getSideRecolor(p, 'back')).toBeNull();
    expect(getSideRecolor({ images: [img('f'), img('b')] }, 'front')).toBeNull();
  });

  it('offers a collar/rib colour when a trim mask exists, even on templates without one', () => {
    const p = product({ image: img('f'), trimMask: img('ft') }, { enabled: false });
    expect(applyCustomizerViews(TEMPLATES.generic, p).secondaryColorLabel).toBe('COLLAR & RIB COLOR');
    expect(applyCustomizerViews(TEMPLATES.tshirt, p).secondaryColorLabel).toBe(TEMPLATES.tshirt.secondaryColorLabel);
    const noTrim = product({ image: img('f'), bodyMask: img('fb') }, { enabled: false });
    expect(applyCustomizerViews(TEMPLATES.generic, noTrim).secondaryColorLabel).toBeUndefined();
    expect(applyCustomizerViews(TEMPLATES.tshirt, noTrim).secondaryColorLabel).toBeUndefined();
  });

  it('correctly calculates independent dyes for required color combinations', () => {
    // 1. White Body (#FFFFFF) + Yellow Collar (#FFD700)
    const whiteBody = dyeRgb(REF, REF, '#FFFFFF');
    const yellowCollar = dyeRgb(REF, REF, '#FFD700');
    expect(whiteBody).toEqual([1, 1, 1]);
    expect(yellowCollar[0]).toBeCloseTo(1, 2); // Red channel ~ 1
    expect(yellowCollar[1]).toBeCloseTo(0.84, 2); // Green channel ~ 0.84
    expect(yellowCollar[2]).toBeCloseTo(0, 2); // Blue channel ~ 0

    // 2. Navy Body (#0D1333) + White Collar (#FFFFFF)
    const navyBody = dyeRgb(REF, REF, '#0D1333');
    expect(navyBody[0]).toBeCloseTo(13 / 255, 2);
    expect(navyBody[1]).toBeCloseTo(19 / 255, 2);
    expect(navyBody[2]).toBeCloseTo(51 / 255, 2);

    // 3. Black Body (#111111) + Red Collar (#FF0000)
    const blackBody = dyeRgb(REF, REF, '#111111');
    const redCollar = dyeRgb(REF, REF, '#FF0000');
    expect(lum(blackBody)).toBeLessThan(0.1);
    expect(redCollar).toEqual([1, 0, 0]);

    // 4. Red Body (#FF0000) + Black Collar (#111111)
    const redBody = dyeRgb(REF, REF, '#FF0000');
    const blackCollar = dyeRgb(REF, REF, '#111111');
    expect(redBody).toEqual([1, 0, 0]);
    expect(lum(blackCollar)).toBeLessThan(0.1);
  });
});
