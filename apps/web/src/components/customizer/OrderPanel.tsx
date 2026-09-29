'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';
import VariantBreakdownEntry, { VariantData } from '@/components/shared/VariantBreakdownEntry';
import type { CustomizerTemplate } from '@/lib/customizerTemplates';

export interface PricingData {
  productId: string;
  productName: string;
  unitPrice: number;
  subtotal: number;
  discount: number;
  gstRate: number;
  gstTotal: number;
  totalAmount: number;
}

export type PricingState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: PricingData }
  | { status: 'error'; message: string };

export const QUANTITY_TIERS = [50, 100, 250, 500];

interface OrderPanelProps {
  template: CustomizerTemplate;
  quantity: number;
  moq: number;
  onQuantityChange: (qty: number) => void;
  variants: VariantData[];
  onVariantsChange: (variants: VariantData[]) => void;
  requiresColor: boolean;
  requiresSize: boolean;
  variantSum: number;
  hasVariantMismatch: boolean;
  variantsOpen: boolean;
  onVariantsOpenChange: (open: boolean) => void;
  pricingState: PricingState;
  printType: string;
}

export function OrderPanel({
  template,
  quantity,
  moq,
  onQuantityChange,
  variants,
  onVariantsChange,
  requiresColor,
  requiresSize,
  variantSum,
  hasVariantMismatch,
  variantsOpen,
  onVariantsOpenChange,
  pricingState,
  printType,
}: OrderPanelProps) {
  const showVariants = requiresColor || requiresSize;

  return (
    <div className="space-y-3">
      {/* Quantity */}
      <section className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="customizer-quantity-input" className="text-[11px] font-black text-gray-700 uppercase tracking-wider">
            Quantity
          </label>
          <span className="flex items-center gap-1.5">
            {template.requiresSize === false && (
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">One size</span>
            )}
            <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">MOQ {moq}</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <input
            id="customizer-quantity-input"
            type="number"
            min={moq}
            value={quantity}
            onChange={(e) => onQuantityChange(Number(e.target.value))}
            className="w-16 shrink-0 px-2 py-1.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-sm font-black text-[#111111] outline-none focus:border-[#3B6FEB]"
          />
          <div className="flex flex-1 gap-1">
            {QUANTITY_TIERS.map((tier) => (
              <button
                key={tier}
                type="button"
                onClick={() => onQuantityChange(tier)}
                className={`flex-1 min-w-0 px-0 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                  quantity === tier
                    ? 'bg-[#111111] text-white border-[#111111]'
                    : 'bg-white text-gray-600 border-[#E5E7EB] hover:border-gray-300'
                }`}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Variant breakdown (collapsed by default) */}
      {showVariants && (
        <section className="border border-[#E5E7EB] rounded-xl bg-[#F8F9FC]">
          <button
            id="variant-section-toggle"
            type="button"
            aria-expanded={variantsOpen}
            onClick={() => onVariantsOpenChange(!variantsOpen)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left"
          >
            <span className="text-xs font-bold text-[#374151]">
              {requiresSize ? 'Sizes & colors' : 'Colors'}
            </span>
            <span className="flex items-center gap-2">
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold tabular-nums ${
                  hasVariantMismatch ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {variantSum} / {quantity}
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${variantsOpen ? 'rotate-180' : ''}`} />
            </span>
          </button>
          {variantsOpen && (
            <div className="px-2 pb-2">
              <VariantBreakdownEntry
                compact
                totalQuantity={quantity}
                requiresColor={requiresColor}
                requiresSize={requiresSize}
                variants={variants}
                onChange={onVariantsChange}
              />
            </div>
          )}
        </section>
      )}

      {/* Pricing */}
      <section id="customizer-pricing-card" className="bg-[#F8F9FC] rounded-xl px-3 py-2.5 border border-[#E5E7EB] text-xs">
        {pricingState.status === 'loading' ? (
          <div className="py-3 flex items-center justify-center gap-2 text-gray-500">
            <div className="w-3.5 h-3.5 border-2 border-[#3B6FEB] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold">Calculating estimate…</span>
          </div>
        ) : pricingState.status === 'success' ? (
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-gray-400">
              <span>Estimate</span>
              <span className="text-[#3B6FEB]">{printType}</span>
            </div>
            <div className="flex justify-between text-gray-600 font-medium">
              <span>Unit Rate ({quantity} pcs)</span>
              <span className="font-bold text-[#111111]">₹{pricingState.data.unitPrice} / pc</span>
            </div>
            <div className="flex justify-between text-gray-600 font-medium">
              <span>Subtotal</span>
              <span className="font-bold text-[#111111]">₹{pricingState.data.subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-gray-600 font-medium">
              <span>GST ({pricingState.data.gstRate}%)</span>
              <span className="font-bold text-[#111111]">₹{pricingState.data.gstTotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="pt-1.5 mt-1 border-t border-[#E5E7EB] flex justify-between items-baseline">
              <span className="text-xs font-black text-[#111111] uppercase">Total Estimate</span>
              <span className="text-base font-black text-[#111111] font-heading">
                ₹{pricingState.data.totalAmount.toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-[10px] text-gray-500 italic pt-1">
              Estimated price. Final quotation may be adjusted after sales review.
            </p>
          </div>
        ) : hasVariantMismatch ? (
          <div className="text-amber-800">
            <p className="font-bold">Variant Mismatch</p>
            <p className="text-[11px] mt-0.5">
              Variant quantities ({variantSum}) must equal total quantity ({quantity}) to calculate price.
            </p>
            {!variantsOpen && showVariants && (
              <button
                type="button"
                onClick={() => onVariantsOpenChange(true)}
                className="mt-1 text-[11px] font-bold text-[#3B6FEB] hover:underline"
              >
                Fix quantities
              </button>
            )}
          </div>
        ) : pricingState.status === 'error' ? (
          <div className="text-red-700">
            <p className="font-bold">Pricing Estimate</p>
            <p className="text-[11px] mt-0.5">{pricingState.message}</p>
          </div>
        ) : (
          <div className="py-2 text-center text-gray-500">Select quantity and options to calculate estimated price.</div>
        )}
      </section>
    </div>
  );
}
