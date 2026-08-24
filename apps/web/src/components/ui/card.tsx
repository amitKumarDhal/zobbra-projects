'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  variant?: 'default' | 'summary' | 'flat';
}

/** Canonical admin content card. White bg, slate border, subtle shadow. */
export function Card({ className, hoverEffect = false, variant = 'default', children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        // Base
        'rounded-2xl border border-[#E5E7EB] bg-white text-[#111111] relative overflow-hidden',
        // Shadow by variant
        variant === 'default' && 'shadow-sm',
        variant === 'summary' && 'shadow-md',
        variant === 'flat' && 'shadow-none',
        // Hover lift (opt-in)
        hoverEffect && 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[#D1D5DB] cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center gap-3 px-6 py-4 border-b border-[#F3F4F6]', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-lg font-heading font-bold text-[#111111] tracking-tight', className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-6', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('px-6 py-4 border-t border-[#F3F4F6] bg-[#F9FAFB] flex items-center', className)}
      {...props}
    >
      {children}
    </div>
  );
}
