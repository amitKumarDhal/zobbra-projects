'use client';

import React, { useRef, useState } from 'react';
import { Check, Eraser, Loader2, UploadCloud, X } from 'lucide-react';
import type { PrintArea } from '@/lib/customizerViews';
import { uploadToCloudinary } from '@/lib/upload';
import { RecoloredPhoto } from '@/components/customizer/RecoloredPhoto';

export type CustomizerSide = 'front' | 'back';
type MaskKey = 'bodyMask' | 'trimMask';

interface SideForm {
  image: string;
  area: PrintArea | null;
  /** Recolouring masks for this side's photo ('' = none). */
  bodyMask: string;
  trimMask: string;
}

export interface CustomizerViewsForm {
  front: SideForm;
  back: SideForm & { enabled: boolean };
}

const EMPTY_SIDE: SideForm = { image: '', area: null, bodyMask: '', trimMask: '' };

export const EMPTY_VIEWS: CustomizerViewsForm = {
  front: EMPTY_SIDE,
  back: { ...EMPTY_SIDE, enabled: true },
};

const sideFromProduct = (raw: any): SideForm => ({
  image: raw?.image || '',
  area: raw?.area ?? null,
  bodyMask: raw?.bodyMask || '',
  trimMask: raw?.trimMask || '',
});

/** Form state from a stored product (null / missing = not configured yet). */
export function viewsFromProduct(raw: any): CustomizerViewsForm {
  if (!raw?.front?.image) return EMPTY_VIEWS;
  return {
    front: sideFromProduct(raw.front),
    back: { ...sideFromProduct(raw.back), enabled: Boolean(raw.back?.enabled) },
  };
}

const sidePayload = (side: SideForm) => ({
  image: side.image,
  area: side.area,
  bodyMask: side.bodyMask || null,
  trimMask: side.trimMask || null,
});

/** API payload: null until a photo is chosen, so older products keep their legacy behaviour. */
export function viewsPayload(views: CustomizerViewsForm) {
  if (!views.front.image && !views.back.image) return null;
  return {
    front: sidePayload(views.front),
    back: views.back.enabled
      ? { enabled: true, ...sidePayload(views.back) }
      : { enabled: false, image: null, area: null, bodyMask: null, trimMask: null },
  };
}

/** Choosing another photo for a side drops its guide and masks, which were made for the old photo. */
const withPhoto = <T extends SideForm>(side: T, url: string): T =>
  url === side.image ? side : { ...side, image: url, area: null, bodyMask: '', trimMask: '' };

/** Drops selections that point at photos no longer in the product's image list. */
export function pruneViews(views: CustomizerViewsForm, images: string[]): CustomizerViewsForm {
  const keep = (url: string) => (url && images.includes(url) ? url : '');
  const front = keep(views.front.image);
  const back = keep(views.back.image);
  if (front === views.front.image && back === views.back.image) return views;
  return { front: withPhoto(views.front, front), back: withPhoto(views.back, back) };
}

const clamp = (n: number) => Math.min(1, Math.max(0, n));
const MIN_AREA = 0.02;

/**
 * The photo with the print-area guide. Drag on the photo to draw the guide. The box has the same
 * aspect ratio and fit as the customizer stage, so fractions map 1:1 onto the customer's canvas.
 */
function AreaPicker({
  side,
  image,
  area,
  onChange,
}: {
  side: CustomizerSide;
  image: string;
  area: PrintArea | null;
  onChange: (area: PrintArea | null) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<PrintArea | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);

  const point = (e: React.PointerEvent) => {
    const rect = boxRef.current!.getBoundingClientRect();
    return { x: clamp((e.clientX - rect.left) / rect.width), y: clamp((e.clientY - rect.top) / rect.height) };
  };
  const rectFrom = (a: { x: number; y: number }, b: { x: number; y: number }): PrintArea => ({
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    w: Math.abs(a.x - b.x),
    h: Math.abs(a.y - b.y),
  });

  const shown = draft || area;

  return (
    <div className="space-y-1.5">
      <div
        ref={boxRef}
        data-cy={`view-area-${side}`}
        className="relative w-full aspect-[522/608] bg-white rounded-xl border border-[#E5E7EB] overflow-hidden cursor-crosshair touch-none select-none"
        onPointerDown={(e) => {
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch {
            // Capture only keeps the drag alive outside the box; drawing works without it.
          }
          start.current = point(e);
          setDraft(null);
        }}
        onPointerMove={(e) => {
          if (start.current) setDraft(rectFrom(start.current, point(e)));
        }}
        onPointerUp={(e) => {
          if (!start.current) return;
          const next = rectFrom(start.current, point(e));
          start.current = null;
          setDraft(null);
          if (next.w >= MIN_AREA && next.h >= MIN_AREA) onChange(next);
        }}
      >
        <img src={image} alt={`${side} view`} draggable={false} className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
        {shown && (
          <div
            data-cy={`view-area-box-${side}`}
            className="absolute border-2 border-dashed border-[#3B6FEB] bg-[#3B6FEB]/10 pointer-events-none"
            style={{
              left: `${shown.x * 100}%`,
              top: `${shown.y * 100}%`,
              width: `${shown.w * 100}%`,
              height: `${shown.h * 100}%`,
            }}
          />
        )}
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] text-gray-400">
          {area ? 'Print-area guide set. Drag again to redraw.' : 'Optional: drag on the photo to mark the print area.'}
        </p>
        {area && (
          <button
            type="button"
            data-cy={`view-area-clear-${side}`}
            onClick={() => onChange(null)}
            className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold text-gray-500 hover:text-red-600"
          >
            <Eraser className="w-3 h-3" /> Clear
          </button>
        )}
      </div>
    </div>
  );
}

function PhotoChoice({
  side,
  images,
  selected,
  onSelect,
}: {
  side: CustomizerSide;
  images: string[];
  selected: string;
  onSelect: (url: string) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-1.5" role="radiogroup" aria-label={`${side} image`}>
      {images.map((url, i) => {
        const active = url === selected;
        return (
          <button
            key={url}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={`Use image ${i + 1} as ${side}`}
            data-cy={`view-pick-${side}`}
            onClick={() => onSelect(url)}
            className={`relative aspect-square rounded-lg border-2 bg-gray-50 overflow-hidden transition-all ${
              active ? 'border-[#3B6FEB] ring-2 ring-[#3B6FEB]/20' : 'border-[#E5E7EB] hover:border-[#9CA3AF]'
            }`}
          >
            <img src={url} alt="" className="w-full h-full object-contain p-1" />
            {active && (
              <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-[#3B6FEB] text-white flex items-center justify-center">
                <Check className="w-2.5 h-2.5" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

const MASK_LABELS: Record<MaskKey, string> = { bodyMask: 'Body mask', trimMask: 'Collar / rib mask' };
const MASK_TYPES = /^image\/(png|webp|jpe?g)$/;

/** Upload slot for one recolouring mask. */
function MaskSlot({
  side,
  kind,
  url,
  onChange,
  onUploading,
}: {
  side: CustomizerSide;
  kind: MaskKey;
  url: string;
  onChange: (url: string) => void;
  onUploading?: (busy: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cy = `view-mask-${side}-${kind === 'bodyMask' ? 'body' : 'trim'}`;

  const upload = async (file: File | undefined) => {
    if (!file) return;
    if (!MASK_TYPES.test(file.type)) return setError('Use a PNG, WEBP or JPG mask.');
    setError(null);
    setBusy(true);
    onUploading?.(true);
    try {
      onChange(await uploadToCloudinary(file));
    } catch (err: any) {
      setError(err?.message || 'Upload failed.');
    } finally {
      setBusy(false);
      onUploading?.(false);
    }
  };

  return (
    <div className="space-y-1">
      <p className="text-[11px] font-bold text-[#374151]">{MASK_LABELS[kind]}</p>
      <div className="relative aspect-square rounded-lg border border-dashed border-[#D1D5DB] bg-[repeating-conic-gradient(#F3F4F6_0%_25%,#FFFFFF_0%_50%)] bg-[length:12px_12px] overflow-hidden">
        {url ? (
          <>
            <img src={url} alt={MASK_LABELS[kind]} data-cy={`${cy}-thumb`} className="w-full h-full object-contain" />
            <button
              type="button"
              aria-label={`Remove ${MASK_LABELS[kind].toLowerCase()}`}
              data-cy={`${cy}-remove`}
              onClick={() => onChange('')}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 shadow-sm"
            >
              <X className="w-3 h-3" />
            </button>
          </>
        ) : (
          <label className="absolute inset-0 flex flex-col items-center justify-center gap-1 cursor-pointer text-[10px] font-bold text-gray-500 hover:text-[#3B6FEB]">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
            {busy ? 'Uploading…' : 'Upload'}
            <input
              type="file"
              accept="image/png, image/webp, image/jpeg"
              data-cy={cy}
              className="sr-only"
              disabled={busy}
              onChange={(e) => {
                upload(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </label>
        )}
      </div>
      {error && <p className="text-[10px] text-red-600">{error}</p>}
    </div>
  );
}

/** Masks for one side plus a live recolour preview in the product's own colours. */
function SideMasks({
  side,
  value,
  colors,
  onChange,
  onUploading,
}: {
  side: CustomizerSide;
  value: SideForm;
  colors: Array<{ name: string; hex: string }>;
  onChange: (patch: Partial<SideForm>) => void;
  onUploading?: (busy: boolean) => void;
}) {
  const [body, setBody] = useState(0);
  const [trim, setTrim] = useState(colors.length > 1 ? 1 : 0);
  const hasMask = Boolean(value.bodyMask || value.trimMask);
  const swatches = (selected: number, pick: (i: number) => void, label: string) => (
    <div className="flex items-center gap-1 flex-wrap" role="group" aria-label={`${label} preview colour`}>
      <span className="text-[10px] text-gray-500 w-12">{label}</span>
      {colors.map((c, i) => (
        <button
          key={c.name}
          type="button"
          title={c.name}
          aria-label={`${label} ${c.name}`}
          aria-pressed={i === selected}
          onClick={() => pick(i)}
          className={`w-4 h-4 rounded-full border ${i === selected ? 'ring-2 ring-[#3B6FEB] ring-offset-1 border-white' : 'border-[#D1D5DB]'}`}
          style={{ backgroundColor: c.hex }}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-2 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] p-3" data-cy={`view-masks-${side}`}>
      <p className="text-[11px] font-bold text-[#374151]">Colour masks (optional)</p>
      <p className="text-[10px] text-gray-500 leading-snug">
        Same size as the photo. White (or opaque) = recolour, black (or transparent) = keep. Works best on a white or
        light-grey product photo.
      </p>
      <div className="grid grid-cols-2 gap-2">
        {(['bodyMask', 'trimMask'] as const).map((kind) => (
          <MaskSlot
            key={kind}
            side={side}
            kind={kind}
            url={value[kind]}
            onChange={(url) => onChange({ [kind]: url })}
            onUploading={onUploading}
          />
        ))}
      </div>
      {hasMask && colors.length > 0 && (
        <div className="space-y-1.5 pt-1" data-cy={`view-recolor-preview-${side}`}>
          <div className="relative w-full aspect-[522/608] bg-white rounded-lg border border-[#E5E7EB] overflow-hidden">
            <RecoloredPhoto
              source={{ base: value.image, bodyMask: value.bodyMask || null, trimMask: value.trimMask || null }}
              bodyHex={colors[body]?.hex}
              trimHex={colors[trim]?.hex}
              alt={`${side} recolour preview`}
              className="w-full h-full object-contain"
            />
          </div>
          {value.bodyMask && swatches(body, setBody, 'Body')}
          {value.trimMask && swatches(trim, setTrim, 'Collar')}
        </div>
      )}
      {hasMask && colors.length === 0 && (
        <p className="text-[10px] text-gray-400">Add product colours above to preview the recolouring.</p>
      )}
    </div>
  );
}

export function CustomizerViewsEditor({
  images,
  value,
  onChange,
  colors = [],
  onUploading,
}: {
  images: string[];
  value: CustomizerViewsForm;
  onChange: (next: CustomizerViewsForm) => void;
  /** The product's colours, used for the recolour preview. */
  colors?: Array<{ name: string; hex: string }>;
  onUploading?: (busy: boolean) => void;
}) {
  if (images.length === 0) {
    return <p className="text-xs text-gray-500">Upload product images first, then choose which one is the front and which is the back.</p>;
  }

  const setFront = (patch: Partial<SideForm>) => onChange({ ...value, front: { ...value.front, ...patch } });
  const setBack = (patch: Partial<CustomizerViewsForm['back']>) => onChange({ ...value, back: { ...value.back, ...patch } });

  return (
    <div className="space-y-5">
      {!value.front.image && (
        <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2" data-cy="views-not-set">
          Not set: the customizer uses the first image as the front and the second as the back.
        </p>
      )}

      <div className="space-y-2" data-cy="view-front">
        <p className="text-xs font-bold text-[#374151]">Front: base product photo</p>
        <PhotoChoice
          side="front"
          images={images}
          selected={value.front.image}
          onSelect={(url) => onChange({ ...value, front: withPhoto(value.front, url) })}
        />
        {value.front.image && (
          <>
            <AreaPicker side="front" image={value.front.image} area={value.front.area} onChange={(area) => setFront({ area })} />
            <SideMasks side="front" value={value.front} colors={colors} onChange={setFront} onUploading={onUploading} />
          </>
        )}
      </div>

      <div className="space-y-2 pt-4 border-t border-[#F1F3F7]" data-cy="view-back">
        <label className="flex items-center justify-between gap-3 cursor-pointer">
          <span>
            <span className="block text-xs font-bold text-[#374151]">Back printing</span>
            <span className="block text-[10px] text-gray-400">
              {value.back.enabled ? 'Customers can design the back.' : 'Customers only see the front.'}
            </span>
          </span>
          <input
            type="checkbox"
            data-cy="view-back-enabled"
            checked={value.back.enabled}
            onChange={(e) => setBack({ enabled: e.target.checked })}
            className="w-4 h-4 accent-[#3B6FEB]"
          />
        </label>
        {value.back.enabled && (
          <>
            <p className="text-xs font-bold text-[#374151]">Back: base product photo</p>
            <PhotoChoice
              side="back"
              images={images}
              selected={value.back.image}
              onSelect={(url) => onChange({ ...value, back: withPhoto(value.back, url) })}
            />
            {value.back.image ? (
              <>
                <AreaPicker side="back" image={value.back.image} area={value.back.area} onChange={(area) => setBack({ area })} />
                <SideMasks side="back" value={value.back} colors={colors} onChange={setBack} onUploading={onUploading} />
              </>
            ) : (
              <p className="text-[10px] text-gray-400">Choose the photo that shows the back of the product.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
