import type { VariantData } from '@/components/shared/VariantBreakdownEntry';

const sameColor = (a?: string, b?: string) =>
  (a || '').trim().toLowerCase() === (b || '').trim().toLowerCase();

/**
 * Applies a main product color change to the variant breakdown.
 *
 * Only the auto-created default row follows the main color: a single row whose color still equals
 * the previous main color. Any breakdown the customer configured (multiple rows, or a row with a
 * different color) is returned unchanged, so manually entered colors are never overwritten.
 */
export function applyMainColorToVariants(
  variants: VariantData[],
  previousColor: string,
  nextColor: string
): VariantData[] {
  if (variants.length === 1 && sameColor(variants[0].color, previousColor)) {
    return [{ ...variants[0], color: nextColor }];
  }
  return variants;
}
