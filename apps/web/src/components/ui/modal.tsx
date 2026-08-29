'use client';

import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: React.ReactNode;
}

/** Canonical ZOBBRA modal dialog. White card, slate border, subtle shadow, fully mobile-responsive. */
export function Modal({ isOpen, onClose, title, children, size = 'md', footer }: ModalProps) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-xl',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#111111]/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={cn(
          'bg-white border border-[#E5E7EB] rounded-2xl shadow-xl w-full max-h-[calc(100vh-2rem)] flex flex-col overflow-hidden my-auto',
          'animate-in fade-in zoom-in-95 duration-200',
          sizeClasses[size]
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[#E5E7EB] flex-shrink-0">
          <h3 className="text-base sm:text-lg font-heading font-bold text-[#111111] tracking-tight truncate pr-2">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 -mr-1 rounded-lg text-[#9CA3AF] hover:text-[#111111] hover:bg-[#F3F4F6] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Body — scrollable when content exceeds viewport */}
        <div className="p-4 sm:p-6 text-[#374151] text-sm overflow-y-auto flex-1">{children}</div>

        {/* Footer (optional) */}
        {footer && (
          <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-t border-[#E5E7EB] bg-[#F9FAFB] flex flex-wrap items-center justify-end gap-2.5 sm:gap-3 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
