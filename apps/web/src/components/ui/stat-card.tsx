import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  /** Icon element (should use w-5 h-5 sizing) */
  icon: React.ReactNode;
  /** Tailwind bg class for icon container, e.g. "bg-blue-50" */
  iconBg?: string;
  /** KPI label */
  title: string;
  /** KPI value (string or number) */
  value: string | number;
  /** Optional sub-text (description, percentage breakdown) */
  sub?: string;
  /** Optional trend percentage (positive = up, negative = down) */
  trend?: number;
  /** Optional VS period label for trend */
  trendPeriod?: string;
  className?: string;
}

/**
 * Canonical ZOBBRA KPI Stat Card.
 *
 * Replaces all per-page `function StatCard()` implementations across:
 * Dashboard, Inquiry, Quote, Order, Customer, Product, Todo,
 * Agents, Payments, Coupons, Testimonials.
 *
 * Usage:
 * ```tsx
 * <StatCard
 *   icon={<Users className="w-5 h-5 text-purple-600" />}
 *   iconBg="bg-purple-50"
 *   title="Total Customers"
 *   value={stats.total}
 *   trend={12.3}
 *   trendPeriod="vs last 7 days"
 * />
 * ```
 */
export function StatCard({
  icon,
  iconBg = 'bg-[#EEF2FF]',
  title,
  value,
  sub,
  trend,
  trendPeriod = 'vs last 7 days',
  className,
}: StatCardProps) {
  const hasTrend = trend !== undefined;
  const isUp = hasTrend && trend >= 0;

  return (
    <div
      className={cn(
        'bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-sm',
        'flex flex-col justify-between min-h-[7rem] relative overflow-hidden',
        className
      )}
    >
      {/* Icon + Label row */}
      <div className="flex items-center gap-2.5">
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', iconBg)}>
          {icon}
        </div>
        <p className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wide leading-tight line-clamp-2">
          {title}
        </p>
      </div>

      {/* Value + Trend row */}
      <div className="flex items-end justify-between mt-2 gap-2">
        <h3 className="text-2xl font-heading font-black text-[#111111] leading-none tabular-nums">
          {value}
        </h3>

        {hasTrend ? (
          <p
            className={cn(
              'text-[10px] font-bold flex items-center gap-0.5 shrink-0',
              isUp ? 'text-emerald-600' : 'text-rose-600'
            )}
          >
            {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}% {trendPeriod}
          </p>
        ) : sub ? (
          <p className="text-[11px] text-[#6B7280] font-medium text-right leading-tight shrink-0 max-w-[45%]">
            {sub}
          </p>
        ) : null}
      </div>
    </div>
  );
}
