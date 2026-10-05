'use client';

/**
 * CustomizerSpecificationsCard  (Phase 7)
 *
 * Reusable component that parses and displays garment customizer specifications
 * extracted from a Quote's `notes` string or an OrderItem's `customizationDetails`
 * string (both use the same pipe-separated "Label: value" format, with the
 * structured JSON embedded in the "Customization: {...}" segment).
 *
 * Data flow:
 *   Quote path  -> quote.notes                   -> extractCustomizerSpecs()
 *   Order path  -> OrderItem.customizationDetails -> extractCustomizerSpecs()
 *
 * The component renders nothing (returns null) for legacy orders that predate
 * the customizer -- it never throws when data is absent or malformed.
 */

import React from 'react';
import { Palette } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CustomizerSpecs {
  templateId: string | null;
  bodyColor: string | null;
  collarColor: string | null;
  tapingColor: string | null;
  brandingMethod: 'Print' | 'Embroidery';
}

// ---------------------------------------------------------------------------
// Parsing helper -- pure function, never throws
// ---------------------------------------------------------------------------

/**
 * Extract structured customizer specifications from a notes/customizationDetails
 * string. The string uses a pipe-delimited format produced by the server:
 *
 *   "Fabric: Cotton | Sizes: M-XL | Customization: {"selectedColor":"Black",...} | ..."
 *
 * The "Customization:" segment contains a JSON blob with all Customizer Studio
 * choices. Additionally, some legacy paths write collarColor/tapingColor directly
 * on item fields rather than inside the JSON; callers may supply those as fallbacks.
 *
 * Returns null when there is no evidence this is a customized order.
 */
export function extractCustomizerSpecs(opts: {
  /** Quote.notes or OrderItem.customizationDetails */
  notes?: string | null;
  /** Product customizerTemplateId (from item.product.customizerTemplateId) */
  templateId?: string | null;
  /** Fallback body color from item.color */
  itemColor?: string | null;
  /** Fallback collar color from item.collarColor (if DB item carries it) */
  itemCollarColor?: string | null;
  /** Fallback taping color from item.tapingColor (if DB item carries it) */
  itemTapingColor?: string | null;
  /** Fallback printType (used to detect embroidery when JSON absent) */
  printType?: string | null;
}): CustomizerSpecs | null {
  const { notes, templateId, itemColor, itemCollarColor, itemTapingColor, printType } = opts;

  // Parse the structured Customization JSON blob from the notes string
  let parsed: Record<string, unknown> | null = null;
  if (typeof notes === 'string' && notes.length > 0) {
    const parts = notes.split('|');
    const seg = parts.find((p) => p.trim().startsWith('Customization:'));
    if (seg) {
      const rawJson = seg.trim().replace(/^Customization:\s*/, '');
      try {
        const candidate = JSON.parse(rawJson);
        if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
          parsed = candidate as Record<string, unknown>;
        }
      } catch {
        // Malformed JSON -- ignore silently, do not rethrow
      }
    }
  }

  const resolvedTemplateId: string | null =
    (typeof templateId === 'string' && templateId) ||
    (typeof parsed?.templateId === 'string' && parsed.templateId ? parsed.templateId : null);

  const bodyColor: string | null =
    (typeof parsed?.selectedColor === 'string' && parsed.selectedColor
      ? parsed.selectedColor
      : null) ||
    (typeof itemColor === 'string' && itemColor ? itemColor : null);

  const collarColor: string | null =
    (typeof parsed?.collarColor === 'string' && parsed.collarColor
      ? parsed.collarColor
      : null) ||
    (typeof itemCollarColor === 'string' && itemCollarColor ? itemCollarColor : null);

  const tapingColor: string | null =
    (typeof parsed?.tapingColor === 'string' && parsed.tapingColor
      ? parsed.tapingColor
      : null) ||
    (typeof itemTapingColor === 'string' && itemTapingColor ? itemTapingColor : null);

  const isEmbroidery =
    parsed?.embroidery === true ||
    parsed?.brandingMethod === 'Embroidery' ||
    (typeof printType === 'string' && /embroidery/i.test(printType));

  const brandingMethod: 'Print' | 'Embroidery' =
    parsed?.brandingMethod === 'Print' || parsed?.brandingMethod === 'Embroidery'
      ? (parsed.brandingMethod as 'Print' | 'Embroidery')
      : isEmbroidery
      ? 'Embroidery'
      : 'Print';

  // No evidence of a customized order -- return null so callers skip the card
  if (!resolvedTemplateId && !parsed && !collarColor && !tapingColor) {
    return null;
  }

  return { templateId: resolvedTemplateId, bodyColor, collarColor, tapingColor, brandingMethod };
}

// ---------------------------------------------------------------------------
// Spec cell (internal)
// ---------------------------------------------------------------------------

function SpecCell({
  label,
  children,
  cy,
}: {
  label: string;
  children: React.ReactNode;
  cy?: string;
}) {
  return (
    <div className="bg-[#F9FAFB] p-3 rounded-xl border border-[#E5E7EB]" data-cy={cy}>
      <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] block mb-1">
        {label}
      </span>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main exported component
// ---------------------------------------------------------------------------

export interface CustomizerSpecificationsCardProps {
  specs: CustomizerSpecs;
  /** data-cy attribute on outer container. Defaults to "order-customizer-specifications". */
  dataCy?: string;
}

export function CustomizerSpecificationsCard({
  specs,
  dataCy = 'order-customizer-specifications',
}: CustomizerSpecificationsCardProps) {
  return (
    <div
      className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm p-6 space-y-4"
      data-cy={dataCy}
    >
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wider flex items-center gap-2">
          <Palette className="w-4 h-4 text-[#3B6FEB]" /> Customizer Specifications
        </h3>
        <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full font-bold">
          Online Customizer Studio
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        <SpecCell label="Template" cy="spec-template">
          <span className="text-[#111111] font-bold text-xs">
            {specs.templateId || 'Standard Garment'}
          </span>
        </SpecCell>

        <SpecCell label="Body Color" cy="spec-body-color">
          <span className="text-[#111111] font-bold text-xs">
            {specs.bodyColor || 'Standard'}
          </span>
        </SpecCell>

        <SpecCell label="Collar / Rib Color" cy="spec-collar-color">
          <span className="text-[#111111] font-bold text-xs">
            {specs.collarColor || 'None / Not Configured'}
          </span>
        </SpecCell>

        <SpecCell label="Taping Color" cy="spec-taping-color">
          <span className="text-[#111111] font-bold text-xs">
            {specs.tapingColor || 'None / Not Configured'}
          </span>
        </SpecCell>

        <SpecCell label="Branding Method" cy="spec-branding-method">
          <span
            className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
              specs.brandingMethod === 'Embroidery'
                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                : 'bg-blue-50 text-blue-800 border border-blue-200'
            }`}
          >
            {specs.brandingMethod}
          </span>
        </SpecCell>
      </div>
    </div>
  );
}
