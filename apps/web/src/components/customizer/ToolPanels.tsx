'use client';

import React from 'react';
import {
  Palette,
  ImagePlus,
  Type,
  Layers,
  UploadCloud,
  Check,
  Trash2,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ArrowUp,
  ArrowDown,
  AlignHorizontalJustifyCenter,
  AlignVerticalJustifyCenter,
} from 'lucide-react';
import type { CustomizerTemplate } from '@/lib/customizerTemplates';
import { BODY_COLORS, COLLAR_RIB_COLORS, FONTS, TEXT_COLORS } from './customizerOptions';

export type ToolKey = 'logo' | 'text' | 'colors' | 'layers';

export const TOOL_ITEMS: Array<{ key: ToolKey; id: string; label: string; Icon: React.ElementType }> = [
  { key: 'colors', id: 'tab-tool-colors', label: 'Colors', Icon: Palette },
  { key: 'logo', id: 'tab-tool-logo', label: 'Logo', Icon: ImagePlus },
  { key: 'text', id: 'tab-tool-text', label: 'Text', Icon: Type },
  { key: 'layers', id: 'tab-tool-layers', label: 'Layers', Icon: Layers },
];

export const TOOL_TITLES: Record<ToolKey, string> = {
  logo: 'Logo',
  text: 'Text',
  colors: 'Colors',
  layers: 'Selected element',
};

/** Section heading used inside the tool panels (e.g. "BODY COLOR"). */
export const PANEL_HEADING = 'text-[13px] font-semibold uppercase tracking-wide text-gray-500';

/* -------------------------------------------------------------------------- */
/* Tool rail / bottom navigation                                              */
/* -------------------------------------------------------------------------- */

interface ToolRailProps {
  active: ToolKey | null;
  onSelect: (key: ToolKey) => void;
  hasSelection: boolean;
  /** Which tools to show (kept in TOOL_ITEMS order). Defaults to all of them. */
  tools?: ToolKey[];
  /** `panel`: tab row at the top of the desktop side panel. `bar`: mobile bottom navigation. */
  variant: 'panel' | 'bar';
}

export function ToolRail({ active, onSelect, hasSelection, tools, variant }: ToolRailProps) {
  const items = tools ? TOOL_ITEMS.filter((t) => tools.includes(t.key)) : TOOL_ITEMS;
  const panel = variant === 'panel';
  return (
    <nav aria-label="Design tools" className={`flex items-stretch gap-1 ${panel ? 'p-2.5' : 'px-2 py-1.5'}`}>
      {items.map(({ key, id, label, Icon }) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            id={id}
            type="button"
            onClick={() => onSelect(key)}
            aria-pressed={isActive}
            className={`relative flex flex-1 flex-col items-center justify-center rounded-xl font-medium transition-colors ${
              panel ? 'gap-1 py-2.5 text-sm' : 'gap-0.5 py-1.5 text-[11px]'
            } ${isActive ? 'bg-[#EEF2FF] text-[#3B6FEB]' : 'text-gray-600 hover:text-[#111111] hover:bg-gray-50'}`}
          >
            <Icon className={panel ? 'w-5 h-5' : 'w-[18px] h-[18px]'} strokeWidth={1.75} />
            <span>{label}</span>
            {key === 'layers' && hasSelection && (
              <span className="absolute top-1.5 right-3 w-1.5 h-1.5 rounded-full bg-[#3B6FEB]" />
            )}
          </button>
        );
      })}
    </nav>
  );
}

/* -------------------------------------------------------------------------- */
/* Upload                                                                     */
/* -------------------------------------------------------------------------- */

interface UploadPanelProps {
  side: 'front' | 'back';
  isUploading: boolean;
  hasArtworkOnSide: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function UploadPanel({ side, isUploading, hasArtworkOnSide, fileInputRef, onFileChange }: UploadPanelProps) {
  return (
    <div className="space-y-2.5">
      <p className="text-[11px] text-gray-500">
        Add a logo or image to the <span className="font-bold text-[#111111]">{side}</span>, then drag, resize or rotate it.
      </p>

      <label className="flex items-center gap-3 border border-[#CBD5E1] hover:border-[#3B6FEB] bg-[#F8F9FC] rounded-xl px-3 py-2.5 cursor-pointer transition-colors">
        <span className="w-8 h-8 shrink-0 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[#3B6FEB]">
          <UploadCloud className="w-4 h-4" />
        </span>
        <span className="min-w-0">
          <span className="block text-xs font-bold text-[#111111]">
            {isUploading ? 'Uploading artwork…' : 'Choose logo or image'}
          </span>
          <span className="block text-[10px] text-gray-400">PNG, JPG, SVG or WebP</span>
        </span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp"
          onChange={onFileChange}
          className="sr-only"
          disabled={isUploading}
        />
      </label>

      {hasArtworkOnSide && (
        <div className="flex items-center justify-between px-2.5 py-1.5 bg-blue-50/60 border border-blue-200/60 rounded-lg">
          <span className="text-[11px] font-bold text-blue-900 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-[#3B6FEB]" />
            Artwork on {side}
          </span>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-[11px] font-bold text-[#3B6FEB] hover:underline"
          >
            Add another
          </button>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Text                                                                       */
/* -------------------------------------------------------------------------- */

export interface TextValue {
  text: string;
  font: string;
  size: number;
  color: string;
  bold: boolean;
  italic: boolean;
  align: 'left' | 'center' | 'right';
}

interface TextPanelProps {
  value: TextValue;
  onChange: (patch: Partial<TextValue>) => void;
  onSubmit: () => void;
  addLabel: string;
}

const segBtn = (on: boolean) =>
  `p-1.5 rounded transition-all ${on ? 'bg-white text-black shadow-2xs' : 'text-gray-400 hover:text-gray-600'}`;

export function TextPanel({ value, onChange, onSubmit, addLabel }: TextPanelProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="space-y-2.5"
    >
      <input
        type="text"
        value={value.text}
        onChange={(e) => onChange({ text: e.target.value })}
        placeholder="Enter brand or text..."
        aria-label="Your text"
        className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-xs font-semibold outline-none focus:border-[#3B6FEB]"
      />

      <div className="flex items-center gap-2">
        <select
          value={value.font}
          onChange={(e) => onChange({ font: e.target.value })}
          aria-label="Font family"
          className="flex-1 min-w-0 px-2 py-1.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-xs font-semibold outline-none focus:border-[#3B6FEB]"
        >
          {FONTS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.name}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 shrink-0">
          Size
          <input
            type="range"
            min={12}
            max={72}
            value={value.size}
            onChange={(e) => onChange({ size: Number(e.target.value) })}
            aria-label="Font size"
            className="w-16 accent-[#3B6FEB]"
          />
          <span className="w-5 text-right tabular-nums text-[#111111]">{value.size}</span>
        </label>
      </div>

      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Text color">
        {TEXT_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={`Text color ${c}`}
            onClick={() => onChange({ color: c })}
            className={`w-6 h-6 shrink-0 rounded-full border transition-all ${
              value.color.toLowerCase() === c.toLowerCase()
                ? 'ring-2 ring-[#3B6FEB] ring-offset-1 scale-110'
                : 'border-gray-300 hover:scale-105'
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-0.5 bg-[#F1F3F7] p-0.5 rounded-lg">
          <button type="button" aria-label="Bold" onClick={() => onChange({ bold: !value.bold })} className={segBtn(value.bold)}>
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button type="button" aria-label="Italic" onClick={() => onChange({ italic: !value.italic })} className={segBtn(value.italic)}>
            <Italic className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-0.5 bg-[#F1F3F7] p-0.5 rounded-lg">
          <button type="button" aria-label="Align left" onClick={() => onChange({ align: 'left' })} className={segBtn(value.align === 'left')}>
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button type="button" aria-label="Align center" onClick={() => onChange({ align: 'center' })} className={segBtn(value.align === 'center')}>
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button type="button" aria-label="Align right" onClick={() => onChange({ align: 'right' })} className={segBtn(value.align === 'right')}>
            <AlignRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={!value.text.trim()}
        className="w-full py-2 bg-[#111111] hover:bg-[#2563EB] disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-lg text-xs font-bold transition-all"
      >
        {addLabel}
      </button>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Colors                                                                     */
/* -------------------------------------------------------------------------- */

interface SwatchGridProps {
  colors: Array<{ name: string; hex: string }>;
  selected: string;
  onPick: (name: string) => void;
}

function SwatchGrid({ colors, selected, onPick }: SwatchGridProps) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(36px,1fr))] gap-3 justify-items-center">
      {colors.map((col) => {
        const isSelected = selected.toLowerCase() === col.name.toLowerCase();
        return (
          <button
            key={col.name}
            type="button"
            title={col.name}
            aria-pressed={isSelected}
            onClick={() => onPick(col.name)}
            className={`w-9 h-9 shrink-0 rounded-full transition-all duration-150 ${
              isSelected
                ? 'ring-[3px] ring-[#3B6FEB] ring-offset-2'
                : 'border-[3px] border-white shadow-[0_0_0_1px_rgba(0,0,0,0.12)] hover:scale-105'
            }`}
            style={{ backgroundColor: col.hex }}
          >
            <span className="sr-only">{col.name}</span>
          </button>
        );
      })}
    </div>
  );
}

interface ColorPanelProps {
  template: CustomizerTemplate;
  selectedColor: string;
  collarColor: string;
  onBodyColor: (name: string) => void;
  onCollarColor: (name: string) => void;
}

export function ColorPanel({ template, selectedColor, collarColor, onBodyColor, onCollarColor }: ColorPanelProps) {
  return (
    <div className="space-y-5">
      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className={PANEL_HEADING}>{template.colorLabel}</h3>
          <span className="truncate text-xs text-gray-400">{selectedColor}</span>
        </div>
        <SwatchGrid colors={BODY_COLORS} selected={selectedColor} onPick={onBodyColor} />
      </section>

      {template.secondaryColorLabel && (
        <section className="space-y-3 pt-4 border-t border-[#F1F3F7]">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className={PANEL_HEADING}>{template.secondaryColorLabel}</h3>
            <span className="truncate text-xs text-gray-400">{collarColor}</span>
          </div>
          <SwatchGrid colors={COLLAR_RIB_COLORS} selected={collarColor} onPick={onCollarColor} />
        </section>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Layers / selected element                                                  */
/* -------------------------------------------------------------------------- */

interface SelectionPanelProps {
  selected: any;
  onDelete: () => void;
  onCenterH: () => void;
  onCenterV: () => void;
  onForward: () => void;
  onBackward: () => void;
}

const actionBtn =
  'flex flex-col items-center gap-0.5 py-2 bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-[#E5E7EB] rounded-lg text-[10px] font-bold text-gray-700';

export function SelectionPanel({ selected, onDelete, onCenterH, onCenterV, onForward, onBackward }: SelectionPanelProps) {
  if (!selected) {
    return (
      <p className="text-[11px] text-gray-500">
        Select a logo, image or text on the product to move, resize, rotate, center or reorder it.
      </p>
    );
  }

  const kind = selected.type === 'image' ? 'Image' : selected.type === 'i-text' || selected.type === 'text' ? 'Text' : 'Element';

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-[#111111]">{kind} selected</span>
        <button
          type="button"
          onClick={onDelete}
          className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" /> Delete
        </button>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        <button type="button" onClick={onCenterH} title="Center horizontally" className={actionBtn}>
          <AlignHorizontalJustifyCenter className="w-4 h-4" />
          Center
        </button>
        <button type="button" onClick={onCenterV} title="Center vertically" className={actionBtn}>
          <AlignVerticalJustifyCenter className="w-4 h-4" />
          Middle
        </button>
        <button type="button" onClick={onForward} title="Bring forward" className={actionBtn}>
          <ArrowUp className="w-4 h-4" />
          Forward
        </button>
        <button type="button" onClick={onBackward} title="Send backward" className={actionBtn}>
          <ArrowDown className="w-4 h-4" />
          Back
        </button>
      </div>
    </div>
  );
}
