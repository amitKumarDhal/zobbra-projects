import React from 'react';
import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-xl bg-[#F3F4F6] border border-[#E5E7EB]',
        className
      )}
      {...props}
    />
  );
}
