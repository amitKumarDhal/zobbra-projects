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

/** Canonical ZOBBRA modal dialog. White card, slate border, subtle shadow. */
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#111111]/60 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={cn(
          'bg-white border border-[#E5E7EB] rounded-2xl shadow-xl w-full overflow-hidden',
          'animate-in fade-in zoom-in-95 duration-200',
          sizeClasses[size]
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
          <h3 className="text-lg font-heading font-bold text-[#111111] tracking-tight">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#111111] hover:bg-[#F3F4F6] transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 text-[#374151] text-sm">{children}</div>

        {/* Footer (optional) */}
        {footer && (
          <div className="px-6 py-4 border-t border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
