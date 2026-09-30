import { describe, it, expect } from 'vitest';
import { applyMainColorToVariants } from '../lib/customizerVariants';

const sum = (vs: { quantity: number }[]) => vs.reduce((s, v) => s + v.quantity, 0);

describe('applyMainColorToVariants', () => {
  it('keeps every row color when the customer configured multiple colors', () => {
    const rows = [
      { color: 'White', size: 'M', quantity: 10 },
      { color: 'Navy Blue', size: 'L', quantity: 15 },
      { color: 'Red', size: 'XL', quantity: 25 },
    ];
    const next = applyMainColorToVariants(rows, 'White', 'Royal Blue');
    expect(next).toEqual(rows);
    expect(next.map((v) => v.color)).toEqual(['White', 'Navy Blue', 'Red']);
    expect(sum(next)).toBe(50);
  });

  it('keeps a single manually chosen row color that differs from the main color', () => {
    const rows = [{ color: 'Navy Blue', size: 'L', quantity: 50 }];
    expect(applyMainColorToVariants(rows, 'White', 'Red')).toEqual(rows);
  });

  it('still syncs the untouched default row to the new main color', () => {
    const rows = [{ color: 'White', size: 'L', quantity: 50 }];
    const next = applyMainColorToVariants(rows, 'White', 'Red');
    expect(next).toEqual([{ color: 'Red', size: 'L', quantity: 50 }]);
    expect(rows[0].color).toBe('White'); // input not mutated
  });

  it('matches the default row case-insensitively', () => {
    const next = applyMainColorToVariants([{ color: 'white ', size: 'L', quantity: 20 }], 'White', 'Red');
    expect(next[0].color).toBe('Red');
  });

  it('leaves an empty breakdown empty', () => {
    expect(applyMainColorToVariants([], 'White', 'Red')).toEqual([]);
  });
});
