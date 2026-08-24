import React from 'react';
import { cn } from '@/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Layout
          'flex h-10 w-full px-3.5 py-2.5',
          // Typography
          'text-sm font-medium text-[#111111]',
          // Background & border
          'bg-[#F9FAFB] border border-[#D1D5DB] rounded-xl',
          // Placeholder
          'placeholder:text-[#9CA3AF] placeholder:font-normal',
          // Focus (canonical brand blue)
          'focus:outline-none focus:bg-white focus:border-[#3B6FEB] focus:ring-2 focus:ring-[#3B6FEB]/20',
          // Transition
          'transition-all duration-150',
          // Disabled
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[#F3F4F6]',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';
