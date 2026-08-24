import React from 'react';
import { cn } from '@/lib/utils';

/* ─── Canonical ZOBBRA Status Definitions ────────────────────────────────── */

/**
 * Maps every known business status to a semantic display variant + label.
 *
 * Covers: Quote, Order, Payment, Inquiry, Coupon, Task
 *
 * Do NOT rename or change the status string keys — they map 1:1 to
 * backend enum values in the database.
 */
const STATUS_MAP: Record<string, { variant: SemanticVariant; label: string }> = {
  // ── Quote ─────────────────────────────────────────────────────
  DRAFT:       { variant: 'neutral',  label: 'Draft'       },
  SENT:        { variant: 'info',     label: 'Sent'        },
  APPROVED:    { variant: 'success',  label: 'Approved'    },
  REJECTED:    { variant: 'danger',   label: 'Rejected'    },
  EXPIRED:     { variant: 'danger',   label: 'Expired'     },

  // ── Order ──────────────────────────────────────────────────────
  PENDING:     { variant: 'warning',  label: 'Pending'     },
  CONFIRMED:   { variant: 'info',     label: 'Confirmed'   },
  PROCESSING:  { variant: 'info',     label: 'Processing'  },
  COMPLETED:   { variant: 'success',  label: 'Completed'   },
  DELIVERED:   { variant: 'success',  label: 'Delivered'   },
  CANCELLED:   { variant: 'danger',   label: 'Cancelled'   },
  SHIPPED:     { variant: 'info',     label: 'Shipped'     },

  // ── Payment ────────────────────────────────────────────────────
  PARTIAL:     { variant: 'warning',  label: 'Partial'     },
  PAID:        { variant: 'success',  label: 'Paid'        },
  FAILED:      { variant: 'danger',   label: 'Failed'      },
  OVERDUE:     { variant: 'danger',   label: 'Overdue'     },
  REFUNDED:    { variant: 'neutral',  label: 'Refunded'    },

  // ── Inquiry ────────────────────────────────────────────────────
  NEW:         { variant: 'info',     label: 'New'         },
  CONTACTED:   { variant: 'info',     label: 'Contacted'   },
  FOLLOW_UP:   { variant: 'warning',  label: 'Follow-up'   },
  QUOTED:      { variant: 'warning',  label: 'Quoted'      },
  CONVERTED:   { variant: 'success',  label: 'Converted'   },
  LOST:        { variant: 'danger',   label: 'Lost'        },

  // ── Coupon ─────────────────────────────────────────────────────
  ACTIVE:      { variant: 'success',  label: 'Active'      },
  INACTIVE:    { variant: 'neutral',  label: 'Inactive'    },

  // ── Task ───────────────────────────────────────────────────────
  IN_PROGRESS: { variant: 'info',     label: 'In Progress' },

  // ── General ───────────────────────────────────────────────────
  ARCHIVED:    { variant: 'neutral',  label: 'Archived'    },
};

type SemanticVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';

const VARIANT_CLASSES: Record<SemanticVariant, string> = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger:  'bg-rose-50 text-rose-700 border-rose-200',
  info:    'bg-blue-50 text-blue-700 border-blue-200',
  neutral: 'bg-slate-50 text-slate-600 border-slate-200',
  primary: 'bg-[#EEF2FF] text-[#3B6FEB] border-[#BFDBFE]',
};

export interface StatusBadgeProps {
  /** Backend status string, e.g. "APPROVED", "PENDING", "DRAFT" */
  status: string;
  /** Override display label (optional — defaults to mapped label or formatted status) */
  label?: string;
  /** Override semantic variant (optional — defaults to mapped variant) */
  variant?: SemanticVariant;
  className?: string;
}

/**
 * Canonical ZOBBRA Status Badge.
 *
 * Centralizes all status → semantic color mappings for:
 * Quote, Order, Payment, Inquiry, Coupon, Task statuses.
 *
 * Usage:
 * ```tsx
 * <StatusBadge status="APPROVED" />
 * <StatusBadge status="PENDING" />
 * <StatusBadge status="DRAFT" label="Saved" />
 * ```
 */
export function StatusBadge({ status, label, variant, className }: StatusBadgeProps) {
  const mapped = STATUS_MAP[status] ?? { variant: 'neutral' as SemanticVariant, label: status };
  const resolvedVariant: SemanticVariant = variant ?? mapped.variant;
  const resolvedLabel = label ?? mapped.label ?? status;

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full',
        'text-[11px] font-bold tracking-wide uppercase whitespace-nowrap',
        'border transition-colors',
        VARIANT_CLASSES[resolvedVariant],
        className
      )}
    >
      {resolvedLabel}
    </span>
  );
}

/** Helper to get variant class string (e.g. for inline table cells) */
export function getStatusVariantClasses(status: string): string {
  const mapped = STATUS_MAP[status];
  if (!mapped) return VARIANT_CLASSES.neutral;
  return VARIANT_CLASSES[mapped.variant];
}

/** Helper to get just the variant name for a status */
export function getStatusVariant(status: string): SemanticVariant {
  return STATUS_MAP[status]?.variant ?? 'neutral';
}

/** Helper to get a human-readable label for a status */
export function getStatusLabel(status: string): string {
  return STATUS_MAP[status]?.label ?? status;
}
