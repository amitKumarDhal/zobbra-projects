'use client';

import React from 'react';
import { X, Gift, BadgePlus, ShoppingCart, AlertCircle } from 'lucide-react';
import type { VariantData } from '@/components/shared/VariantBreakdownEntry';
import type { PricingState } from './OrderPanel';
import {
  allowsBulkOrder,
  formatAddonPrice,
  formatINR,
  getFreeGift,
  getMinAllowedQty,
  getMoq,
  getOfferAddon,
  getProductSizes,
  productRequiresSize,
} from '@/lib/productConfig';

interface OrderReviewSheetProps {
  product: any;
  selectedColor: string;
  colorHex: string;
  printType: string;
  quantity: number;
  variants: VariantData[];
  /** Quantity and its colour/size breakdown always change together. */
  onOrderChange: (quantity: number, variants: VariantData[]) => void;
  addonSelected: boolean;
  onAddonChange: (selected: boolean) => void;
  pricingState: PricingState;
  submitting: boolean;
  error: string | null;
  onConfirm: () => void;
  onClose: () => void;
  /** Phase 6 Customization features */
  collarColor?: string;
  collarColorHex?: string;
  showCollarColor?: boolean;
  tapingColor?: string;
  tapingColorHex?: string;
  showTapingColor?: boolean;
  brandingMethod?: 'Print' | 'Embroidery';
  showBrandingMethod?: boolean;
}

/**
 * Checkout step of the customizer: quantity, sizes, the product's free gift and offer addon, and
 * the server-calculated price. Every option shown comes from the product's admin configuration.
 */
export function OrderReviewSheet({
  product,
  selectedColor,
  colorHex,
  printType,
  quantity,
  variants,
  onOrderChange,
  addonSelected,
  onAddonChange,
  pricingState,
  submitting,
  error,
  onConfirm,
  onClose,
  collarColor,
  collarColorHex,
  showCollarColor,
  tapingColor,
  tapingColorHex,
  showTapingColor,
  brandingMethod = 'Print',
  showBrandingMethod,
}: OrderReviewSheetProps) {
  const sizes = getProductSizes(product);
  const asksSize = productRequiresSize(product) && sizes.length > 0;
  const bulk = allowsBulkOrder(product);
  const minQty = getMinAllowedQty(product);
  const moq = getMoq(product);
  const gift = getFreeGift(product, quantity);
  const addon = getOfferAddon(product);

  const sizeQty = (size: string) => variants.find((v) => v.size === size)?.quantity || 0;
  const selectedSize = variants[0]?.size || sizes[0];

  const setSizeQty = (size: string, value: number) => {
    const next = sizes
      .map((s) => ({ color: selectedColor, size: s, quantity: Math.max(0, Math.floor(s === size ? value : sizeQty(s)) || 0) }))
      .filter((v) => v.quantity > 0);
    onOrderChange(
      next.reduce((sum, v) => sum + v.quantity, 0),
      next
    );
  };

  const setSingleLine = (value: number, size: string) => {
    const qty = Math.max(0, Math.floor(value) || 0);
    onOrderChange(qty, [{ color: selectedColor, size, quantity: qty }]);
  };

  const belowMinimum = quantity < minQty;
  const pricing = pricingState.status === 'success' ? pricingState.data : null;
  const canConfirm = !submitting && quantity > 0 && !belowMinimum && pricingState.status === 'success';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Review your order"
    >
      <div
        id="customizer-review-sheet"
        className="bg-white w-full sm:max-w-md max-h-[92dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-black text-[#111111] font-heading">Review your order</h2>
            <p className="text-xs text-gray-500 truncate">{product.name}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 text-gray-400 hover:text-[#111111]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs font-semibold text-[#374151] bg-[#F9FAFB] p-2.5 rounded-xl border border-gray-100">
            {/* Body Color */}
            <div className="flex items-center gap-1.5" data-cy="review-body-color-wrapper">
              <span className="w-3.5 h-3.5 rounded-full border border-gray-300 shrink-0" style={{ backgroundColor: colorHex }} />
              <span data-cy="review-body-color">Body: <strong data-cy="review-color">{selectedColor}</strong></span>
            </div>

            {/* Collar / Rib Color (when enabled) */}
            {showCollarColor && collarColor && (
              <div className="flex items-center gap-1.5" data-cy="review-collar-color-wrapper">
                <span className="text-gray-300">•</span>
                <span className="w-3.5 h-3.5 rounded-full border border-gray-300 shrink-0" style={{ backgroundColor: collarColorHex || '#DC2626' }} />
                <span>Collar: <strong data-cy="review-collar-color">{collarColor}</strong></span>
              </div>
            )}

            {/* Taping Color (when enabled) */}
            {showTapingColor && tapingColor && (
              <div className="flex items-center gap-1.5" data-cy="review-taping-color-wrapper">
                <span className="text-gray-300">•</span>
                <span className="w-3.5 h-3.5 rounded-full border border-gray-300 shrink-0" style={{ backgroundColor: tapingColorHex || '#111111' }} />
                <span>Taping: <strong data-cy="review-taping-color">{tapingColor}</strong></span>
              </div>
            )}

            {/* Branding Method */}
            {(showBrandingMethod !== false || brandingMethod === 'Embroidery') && (
              <div className="flex items-center gap-1.5" data-cy="review-branding-wrapper">
                <span className="text-gray-300">•</span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    brandingMethod === 'Embroidery'
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'bg-blue-50 text-blue-800 border border-blue-200'
                  }`}
                  data-cy="review-branding-method"
                >
                  {brandingMethod || 'Print'}
                </span>
              </div>
            )}

            {/* Print Position */}
            <div className="flex items-center gap-1.5">
              <span className="text-gray-300">•</span>
              <span data-cy="review-print-type">{printType}</span>
            </div>
          </div>

          {/* Quantity / sizes */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-black text-gray-700 uppercase tracking-wider">
                {asksSize && bulk ? 'Quantity per size' : 'Quantity'}
              </h3>
              {bulk && <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">MOQ {moq}</span>}
            </div>

            {asksSize && bulk ? (
              <div className="grid grid-cols-3 gap-2" data-cy="review-size-grid">
                {sizes.map((size) => (
                  <label key={size} className="block">
                    <span className="block text-[10px] font-bold text-gray-500 mb-0.5">{size}</span>
                    <input
                      type="number"
                      min={0}
                      data-cy={`review-size-qty-${size}`}
                      value={sizeQty(size) || ''}
                      placeholder="0"
                      onChange={(e) => setSizeQty(size, Number(e.target.value))}
                      className="w-full px-2 py-1.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-sm font-black text-[#111111] outline-none focus:border-[#3B6FEB]"
                    />
                  </label>
                ))}
              </div>
            ) : (
              <>
                {asksSize && (
                  <div className="flex flex-wrap gap-1.5" data-cy="review-size-options">
                    {sizes.map((size) => (
                      <button
                        key={size}
                        type="button"
                        aria-pressed={selectedSize === size}
                        onClick={() => setSingleLine(quantity, size)}
                        className={`min-w-10 px-2.5 py-1.5 rounded-lg text-xs font-bold border ${
                          selectedSize === size ? 'bg-[#111111] text-white border-[#111111]' : 'bg-white text-gray-700 border-[#E5E7EB]'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                )}
                <input
                  id="customizer-quantity-input"
                  type="number"
                  min={minQty}
                  data-cy="review-quantity"
                  value={quantity || ''}
                  onChange={(e) => setSingleLine(Number(e.target.value), asksSize ? selectedSize : variants[0]?.size || 'Free Size')}
                  className="w-28 px-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-sm font-black text-[#111111] outline-none focus:border-[#3B6FEB]"
                />
              </>
            )}

            <p className={`text-[11px] ${belowMinimum ? 'text-red-600 font-bold' : 'text-gray-500'}`} data-cy="review-total-qty">
              Total: {quantity} pc{quantity === 1 ? '' : 's'}
              {belowMinimum ? ` — minimum is ${minQty}` : ''}
            </p>
          </section>

          {gift && (
            <section className="p-3 rounded-xl border border-emerald-200 bg-emerald-50 flex items-start gap-2.5" data-cy="review-free-gift">
              <Gift className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-black text-emerald-900">Free gift included: {gift.title}</p>
                {gift.description && <p className="text-emerald-800 mt-0.5">{gift.description}</p>}
              </div>
            </section>
          )}

          {addon && (
            <label
              className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-colors ${
                addonSelected ? 'border-[#3B6FEB] bg-[#EEF2FF]' : 'border-[#E5E7EB] bg-white'
              }`}
              data-cy="review-addon"
            >
              <input
                type="checkbox"
                data-cy="review-addon-checkbox"
                checked={addonSelected}
                onChange={(e) => onAddonChange(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-[#3B6FEB]"
              />
              <span className="text-xs flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="font-black text-[#111111] flex items-center gap-1.5">
                    <BadgePlus className="w-3.5 h-3.5 text-[#3B6FEB]" /> Add {addon.title}
                  </span>
                  <span className="font-black text-[#3B6FEB] whitespace-nowrap">{formatAddonPrice(addon)}</span>
                </span>
                {addon.description && <span className="block text-gray-600 mt-0.5">{addon.description}</span>}
              </span>
            </label>
          )}

          {/* Server-calculated price */}
          <section id="customizer-pricing-card" className="bg-[#F8F9FC] rounded-xl px-3.5 py-3 border border-[#E5E7EB] text-xs">
            {pricing ? (
              <div className="space-y-1.5">
                <div className="flex justify-between text-gray-600 font-medium">
                  <span>
                    Unit price × {quantity}
                    {pricing.printSurcharge ? ` (incl. ${formatINR(pricing.printSurcharge)} second-side print)` : ''}
                  </span>
                  <span className="font-bold text-[#111111]" data-cy="review-unit-price">
                    {formatINR(pricing.unitPrice)} / pc
                  </span>
                </div>
                {pricing.addonAmount ? (
                  <div className="flex justify-between text-gray-600 font-medium">
                    <span>{addon?.title || 'Addon'}</span>
                    <span className="font-bold text-[#111111]" data-cy="review-addon-amount">
                      {formatINR(pricing.addonAmount)}
                    </span>
                  </div>
                ) : null}
                <div className="flex justify-between text-gray-600 font-medium">
                  <span>Subtotal</span>
                  <span className="font-bold text-[#111111]" data-cy="review-subtotal">
                    {formatINR(pricing.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600 font-medium">
                  <span>GST ({pricing.gstRate}%)</span>
                  <span className="font-bold text-[#111111]">{formatINR(pricing.gstTotal)}</span>
                </div>
                <div className="pt-2 mt-1 border-t border-[#E5E7EB] flex justify-between items-baseline">
                  <span className="text-xs font-black text-[#111111] uppercase">Total</span>
                  <span className="text-lg font-black text-[#111111] font-heading" data-cy="review-total">
                    {formatINR(pricing.totalAmount)}
                  </span>
                </div>
              </div>
            ) : pricingState.status === 'error' ? (
              <p className="text-red-700 font-bold">{pricingState.message}</p>
            ) : belowMinimum || quantity <= 0 ? (
              <p className="text-gray-500">Enter a quantity of at least {minQty} to see the price.</p>
            ) : (
              <div className="py-1 flex items-center gap-2 text-gray-500">
                <div className="w-3.5 h-3.5 border-2 border-[#3B6FEB] border-t-transparent rounded-full animate-spin" />
                <span className="font-semibold">Calculating price…</span>
              </div>
            )}
          </section>

          {error && (
            <div role="alert" className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-xs font-bold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white px-5 py-3 border-t border-[#E5E7EB] flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 h-11 rounded-xl border border-[#E5E7EB] text-sm font-semibold text-[#374151] hover:bg-gray-50"
          >
            Keep editing
          </button>
          <button
            id="customizer-confirm-btn"
            type="button"
            onClick={onConfirm}
            disabled={!canConfirm}
            className="flex-1 h-11 bg-[#3B6FEB] hover:bg-[#2F5FD6] disabled:bg-gray-300 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Placing request…</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                <span>Request quote</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
