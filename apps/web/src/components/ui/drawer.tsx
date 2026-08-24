'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Width of the drawer panel. Defaults to 'md' (448px) */
  width?: 'sm' | 'md' | 'lg' | 'xl';
  /** Whether the overlay click should close the drawer */
  closeOnOverlayClick?: boolean;
}

const WIDTHS = {
  sm:  'w-full max-w-sm',
  md:  'w-full max-w-md',
  lg:  'w-full max-w-lg',
  xl:  'w-full max-w-2xl',
};

/**
 * Canonical ZOBBRA Right-Side Drawer.
 *
 * Standardizes the slide-over pattern used across:
 * Inquiry, Quote, Order, Customer, Product, Coupon, Testimonial, Settings.
 *
 * Usage:
 * ```tsx
 * <Drawer isOpen={isOpen} onClose={close} title="Quote Details">
 *   <p>drawer body content...</p>
 * </Drawer>
 * ```
 */
export function Drawer({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 'md',
  closeOnOverlayClick = true,
}: DrawerProps) {
  // Trap scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-[#111111]/40 backdrop-blur-[2px] transition-opacity"
        onClick={closeOnOverlayClick ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Panel — slides in from right */}
      <div
        className={cn(
          'relative ml-auto h-full flex flex-col',
          'bg-white border-l border-[#E5E7EB] shadow-xl',
          'animate-in slide-in-from-right duration-300',
          WIDTHS[width]
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-[#E5E7EB] flex-shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            <h2
              id="drawer-title"
              className="text-lg font-heading font-bold text-[#111111] leading-tight tracking-tight truncate"
            >
              {title}
            </h2>
            {subtitle && (
              <p className="text-[13px] text-[#6B7280] font-medium mt-0.5 truncate">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#111111] hover:bg-[#F3F4F6] transition-colors flex-shrink-0"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {children}
        </div>

        {/* Footer (optional) */}
        {footer && (
          <div className="flex-shrink-0 px-6 py-4 border-t border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
