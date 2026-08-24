import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * Canonical semantic variants. Use these for all new code.
   * Legacy variants kept for backward compatibility.
   */
  variant?:
    | 'success'   // Approved, Active, Paid, Completed, Delivered
    | 'warning'   // Pending, Follow-up, Draft (in some contexts)
    | 'danger'    // Rejected, Expired, Failed, Overdue, Cancelled
    | 'info'      // Sent, New, Processing, Shipped
    | 'neutral'   // Draft, Inactive, Archived
    | 'primary'   // Brand highlight
    // ── Legacy backward-compat ──────────────────────────────
    | 'default'
    | 'terracotta'
    | 'deepteal'
    | 'gold'
    | 'secondary'
    | 'outline';
}

export function Badge({ className, variant = 'neutral', children, ...props }: BadgeProps) {
  const variants: Record<string, string> = {
    // ── Canonical Semantic Variants ────────────────────────────────
    success:  'bg-emerald-50 text-emerald-700 border border-emerald-200',
    warning:  'bg-amber-50 text-amber-700 border border-amber-200',
    danger:   'bg-rose-50 text-rose-700 border border-rose-200',
    info:     'bg-blue-50 text-blue-700 border border-blue-200',
    neutral:  'bg-slate-50 text-slate-700 border border-slate-200',
    primary:  'bg-[#EEF2FF] text-[#3B6FEB] border border-[#BFDBFE]',
    // ── Legacy backward-compat ──────────────────────────────
    default:   'bg-[#EEF2FF] text-[#3B6FEB] border border-[#BFDBFE]',
    terracotta:'bg-[#C75B39]/10 text-[#C75B39] border border-[#C75B39]/20',
    deepteal:  'bg-[#1A5653]/10 text-[#1A5653] border border-[#1A5653]/20',
    gold:      'bg-[#D4A953]/15 text-[#9E7728] border border-[#D4A953]/30 font-bold',
    secondary: 'bg-[#F3F4F6] text-[#374151] border border-[#E5E7EB]',
    outline:   'border border-[#E5E7EB] text-[#6B7280] bg-transparent',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full',
        'text-[11px] font-bold tracking-wide uppercase',
        'transition-colors whitespace-nowrap',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
