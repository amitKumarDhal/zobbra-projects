'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export interface ZobbraLogoProps {
  /**
   * 'white': Official white brand logo asset (/brand/zobbra-logo-white.png) for dark backgrounds.
   * 'dark-text': Canonical typographic brand mark for light backgrounds (used when no official black PNG exists).
   * 'mark-only': Compact mark for collapsed sidebars / mobile icons.
   */
  variant?: 'white' | 'dark-text' | 'mark-only';
  /** Custom CSS classes */
  className?: string;
  /** Width in pixels (default: 135 for 'white') */
  width?: number;
  /** Height in pixels (default: 45 for 'white' to maintain 3:1 aspect ratio) */
  height?: number;
  /** Optional link destination (e.g. '/' or '/dashboard') */
  href?: string;
  /** Custom alt text */
  alt?: string;
  /** Next.js image priority flag */
  priority?: boolean;
  /** Whether to show the uppercase tagline "WEAR YOUR BRAND" */
  showTagline?: boolean;
}

export function ZobbraLogo({
  variant = 'white',
  className = '',
  width = 135,
  height = 45,
  href,
  alt = 'ZOBBRA - Wear Your Brand',
  priority = false,
  showTagline = false,
}: ZobbraLogoProps) {
  const renderContent = () => {
    if (variant === 'white') {
      return (
        <div className={`inline-flex flex-col items-start ${className}`}>
          <Image
            src="/brand/zobbra-logo-white.png"
            alt={alt}
            width={width}
            height={height}
            priority={priority}
            className="h-auto max-w-full object-contain transition-opacity duration-200"
            style={{ aspectRatio: '3 / 1' }}
          />
          {showTagline && (
            <span className="text-[9px] uppercase font-bold tracking-[0.14em] text-slate-400 mt-1">
              WEAR YOUR BRAND
            </span>
          )}
        </div>
      );
    }

    if (variant === 'mark-only') {
      return (
        <div className={`w-8 h-8 bg-white text-[#050505] font-heading font-black text-lg flex items-center justify-center rounded-lg shadow-sm ${className}`}>
          Z
        </div>
      );
    }

    // Default 'dark-text' for light backgrounds
    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        <div className="w-8 h-8 bg-[#050505] text-white font-heading font-black text-lg flex items-center justify-center rounded-[3px] shadow-sm">
          Z
        </div>
        <div className="leading-tight">
          <span className="text-[15px] sm:text-[16px] font-heading font-black tracking-[-0.02em] text-[#050505] block">
            ZOBBRA
          </span>
          <span className="text-[8px] sm:text-[8.5px] uppercase font-bold tracking-[0.14em] text-[#666666] block">
            WEAR YOUR BRAND
          </span>
        </div>
      </div>
    );
  };

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center group transition-opacity hover:opacity-95">
        {renderContent()}
      </Link>
    );
  }

  return renderContent();
}
