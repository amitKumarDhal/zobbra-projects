'use client';

import React from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  /** Taller sheet for content-heavy panels such as the order summary. */
  tall?: boolean;
  children: React.ReactNode;
}

/**
 * Docked sheet: sits in the page flow above the bottom bars (rather than floating over the page),
 * so the canvas above it stays visible and editable while a tool is open.
 */
export function BottomSheet({ open, title, onClose, tall = false, children }: BottomSheetProps) {
  if (!open) return null;

  return (
    <section role="dialog" aria-label={title} className="shrink-0 border-t border-[#E5E7EB] bg-white">
      <div className="flex items-center justify-between px-3 pt-2 pb-1.5">
        <h2 className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={`Close ${title}`}
          className="p-1.5 -mr-1 rounded-lg text-gray-500 hover:bg-gray-100"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className={`${tall ? 'max-h-[50dvh]' : 'max-h-[34dvh]'} overflow-y-auto px-3 pb-3`}>{children}</div>
    </section>
  );
}
