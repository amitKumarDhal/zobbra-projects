/**
 * Phase 7 tests: CustomizerSpecificationsCard
 *
 * Covers:
 * - Complete specifications (all 5 fields)
 * - Missing collar color
 * - Missing taping color
 * - Missing branding method (defaults to Print)
 * - Missing template
 * - Malformed JSON in notes
 * - Legacy order without customization metadata (returns null)
 * - Embroidery detection via printType fallback
 * - templateId from product vs. from JSON
 */
import { describe, expect, it } from 'vitest';
import {
  extractCustomizerSpecs,
  CustomizerSpecs,
} from '../components/customizer/CustomizerSpecificationsCard';

const FULL_JSON = JSON.stringify({
  templateId: 'polo-v1',
  selectedColor: 'Navy Blue',
  collarColor: 'White',
  tapingColor: 'Charcoal Black',
  brandingMethod: 'Embroidery',
  embroidery: true,
});

const buildNotes = (json: string) =>
  `Fabric: Cotton | Sizes: S,M,L | Customization: ${json} | Budget: 50000`;

describe('extractCustomizerSpecs', () => {
  // ---------------------------------------------------------
  // 1. Complete specification
  // ---------------------------------------------------------
  it('returns all 5 fields when notes contain complete JSON', () => {
    const specs = extractCustomizerSpecs({ notes: buildNotes(FULL_JSON) });
    expect(specs).not.toBeNull();
    const s = specs!;
    expect(s.templateId).toBe('polo-v1');
    expect(s.bodyColor).toBe('Navy Blue');
    expect(s.collarColor).toBe('White');
    expect(s.tapingColor).toBe('Charcoal Black');
    expect(s.brandingMethod).toBe('Embroidery');
  });

  // ---------------------------------------------------------
  // 2. Missing collar color
  // ---------------------------------------------------------
  it('returns null collarColor when not present in JSON or fallbacks', () => {
    const json = JSON.stringify({
      templateId: 'polo-v1',
      selectedColor: 'Red',
      tapingColor: 'Black',
      brandingMethod: 'Print',
    });
    const specs = extractCustomizerSpecs({ notes: buildNotes(json) });
    expect(specs).not.toBeNull();
    expect(specs!.collarColor).toBeNull();
  });

  it('uses itemCollarColor fallback when JSON is absent', () => {
    const specs = extractCustomizerSpecs({
      notes: buildNotes(JSON.stringify({ templateId: 'polo-v1', selectedColor: 'Red' })),
      itemCollarColor: 'Bottle Green',
    });
    expect(specs).not.toBeNull();
    expect(specs!.collarColor).toBe('Bottle Green');
  });

  // ---------------------------------------------------------
  // 3. Missing taping color
  // ---------------------------------------------------------
  it('returns null tapingColor when not in JSON or fallbacks', () => {
    const json = JSON.stringify({
      templateId: 'polo-v1',
      selectedColor: 'Red',
      collarColor: 'White',
      brandingMethod: 'Print',
    });
    const specs = extractCustomizerSpecs({ notes: buildNotes(json) });
    expect(specs).not.toBeNull();
    expect(specs!.tapingColor).toBeNull();
  });

  // ---------------------------------------------------------
  // 4. Missing brandingMethod — defaults to Print
  // ---------------------------------------------------------
  it('defaults brandingMethod to Print when neither JSON nor printType indicates embroidery', () => {
    const json = JSON.stringify({ templateId: 'polo-v1', selectedColor: 'Blue' });
    const specs = extractCustomizerSpecs({ notes: buildNotes(json) });
    expect(specs).not.toBeNull();
    expect(specs!.brandingMethod).toBe('Print');
  });

  // ---------------------------------------------------------
  // 5. Embroidery detected via printType fallback
  // ---------------------------------------------------------
  it('detects Embroidery from printType fallback when JSON has no brandingMethod', () => {
    const json = JSON.stringify({ templateId: 'polo-v1', selectedColor: 'Blue' });
    const specs = extractCustomizerSpecs({
      notes: buildNotes(json),
      printType: 'Embroidery - Front Chest',
    });
    expect(specs).not.toBeNull();
    expect(specs!.brandingMethod).toBe('Embroidery');
  });

  // ---------------------------------------------------------
  // 6. Missing template
  // ---------------------------------------------------------
  it('returns null templateId when template not in JSON and not supplied', () => {
    // Still returns a specs object because collarColor is present (not null)
    const json = JSON.stringify({
      selectedColor: 'Red',
      collarColor: 'White',
    });
    const specs = extractCustomizerSpecs({ notes: buildNotes(json) });
    expect(specs).not.toBeNull();
    expect(specs!.templateId).toBeNull();
  });

  it('uses templateId prop over JSON templateId', () => {
    const specs = extractCustomizerSpecs({
      notes: buildNotes(JSON.stringify({ templateId: 'from-json', collarColor: 'Red' })),
      templateId: 'from-prop',
    });
    expect(specs!.templateId).toBe('from-prop');
  });

  // ---------------------------------------------------------
  // 7. Malformed JSON -- must not throw, must not return partial state
  // ---------------------------------------------------------
  it('does not throw on malformed JSON in notes', () => {
    expect(() =>
      extractCustomizerSpecs({
        notes: 'Fabric: Cotton | Customization: {this is not json | Budget: 1000',
      })
    ).not.toThrow();
  });

  it('returns null when notes contain only malformed JSON and no fallbacks', () => {
    const specs = extractCustomizerSpecs({
      notes: 'Fabric: Cotton | Customization: {this is not json | Budget: 1000',
    });
    expect(specs).toBeNull();
  });

  it('returns specs when notes contain malformed JSON but fallback collarColor is provided', () => {
    const specs = extractCustomizerSpecs({
      notes: 'Fabric: Cotton | Customization: {bad json} | Budget: 1000',
      itemCollarColor: 'Red',
    });
    // Should return specs because itemCollarColor is not null
    expect(specs).not.toBeNull();
    expect(specs!.collarColor).toBe('Red');
  });

  // ---------------------------------------------------------
  // 8. Legacy order -- null notes, no fallbacks
  // ---------------------------------------------------------
  it('returns null for a legacy order with no customization metadata', () => {
    const specs = extractCustomizerSpecs({ notes: null });
    expect(specs).toBeNull();
  });

  it('returns null for a legacy order with empty string notes', () => {
    const specs = extractCustomizerSpecs({ notes: '' });
    expect(specs).toBeNull();
  });

  it('returns null when notes have pipe-separated entries but no Customization segment', () => {
    const specs = extractCustomizerSpecs({
      notes: 'Fabric: Cotton | Sizes: M | Budget: 5000',
    });
    expect(specs).toBeNull();
  });

  // ---------------------------------------------------------
  // 9. Body color fallback from itemColor
  // ---------------------------------------------------------
  it('falls back to itemColor when selectedColor is not in JSON', () => {
    const json = JSON.stringify({ templateId: 'polo-v1', collarColor: 'White' });
    const specs = extractCustomizerSpecs({
      notes: buildNotes(json),
      itemColor: 'Charcoal Black',
    });
    expect(specs!.bodyColor).toBe('Charcoal Black');
  });

  // ---------------------------------------------------------
  // 10. embroidery flag in JSON
  // ---------------------------------------------------------
  it('detects Embroidery from embroidery:true in JSON', () => {
    const json = JSON.stringify({
      templateId: 'polo-v1',
      embroidery: true,
    });
    // templateId is set so it won't be null, though collarColor etc. are null
    const specs = extractCustomizerSpecs({ notes: buildNotes(json) });
    expect(specs).not.toBeNull();
    expect(specs!.brandingMethod).toBe('Embroidery');
  });
});
