'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Canonical ZOBBRA button variants.
   * Legacy variants (terracotta, deepteal, gold) are kept for backward
   * compatibility but should NOT be used in new code.
   */
  variant?:
    | 'primary'      // Zobra Blue — default CTA
    | 'black'        // Near-black — strong secondary CTA
    | 'secondary'    // White + border — secondary action
    | 'outline'      // Transparent + border — tertiary
    | 'ghost'        // No background — subtle action
    | 'danger'       // Rose — destructive action
    | 'success'      // Emerald — positive confirmation
    // ── Legacy backward-compat aliases ─────────────────────────
    | 'default'      // → primary
    | 'terracotta'   // → primary (legacy)
    | 'deepteal'     // → black  (legacy)
    | 'gold'         // → secondary (legacy)
    | 'outline-black'; // → outline (legacy)
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const variants: Record<string, string> = {
      // ── Canonical Variants ─────────────────────────────────────
      primary:
        'bg-[#3B6FEB] hover:bg-[#2563EB] active:bg-[#1D4ED8] text-white border border-[#3B6FEB]/20',
      black:
        'bg-[#111111] hover:bg-[#000000] text-white border border-[#111111]',
      secondary:
        'bg-white hover:bg-[#F9FAFB] text-[#111111] border border-[#E5E7EB]',
      outline:
        'bg-transparent hover:bg-[#F9FAFB] text-[#111111] border border-[#E5E7EB] hover:border-[#D1D5DB]',
      ghost:
        'bg-transparent hover:bg-[#F3F4F6] text-[#6B7280] hover:text-[#111111] border border-transparent',
      danger:
        'bg-[#FFF1F2] hover:bg-[#FFE4E8] text-[#BE123C] border border-[#FECDD3] hover:border-[#FDA4AF]',
      success:
        'bg-[#ECFDF5] hover:bg-[#D1FAE5] text-[#047857] border border-[#A7F3D0]',
      // ── Legacy backward-compat aliases ─────────────────────────
      default:
        'bg-[#3B6FEB] hover:bg-[#2563EB] text-white border border-[#3B6FEB]/20',
      terracotta:
        'bg-[#C75B39] hover:bg-[#B44F2F] text-white border border-[#C75B39]/30',
      deepteal:
        'bg-[#1A5653] hover:bg-[#123D3B] text-white border border-[#1A5653]/30',
      gold:
        'bg-[#D4A953] hover:bg-[#C29842] text-slate-950 font-extrabold',
      'outline-black':
        'bg-transparent hover:bg-[#111111] hover:text-white text-[#111111] border border-[#111111]',
    };

    const sizes = {
      sm: 'px-4 py-2 text-xs rounded-lg h-8',
      md: 'px-5 py-2.5 text-sm rounded-xl h-10',
      lg: 'px-6 py-3 text-sm rounded-xl h-11',
    };

    return (
      <button
        ref={ref}
        className={cn(
          // Base
          'inline-flex items-center justify-center gap-2 font-sans font-semibold tracking-tight',
          'transition-all duration-150 cursor-pointer',
          // Focus ring (keyboard a11y)
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B6FEB] focus-visible:ring-offset-2',
          // Disabled
          'disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed',
          // Active scale
          'active:scale-[0.97]',
          // Hover lift
          'hover:-translate-y-px',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
