'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { PublicHeader } from './PublicHeader';
import { PublicFooter } from './PublicFooter';

/** The product customizer is a full-viewport studio with its own top bar: no site header/footer. */
const STUDIO_ROUTE = /^\/products\/[^/]+\/customize\/?$/;

export function PublicChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const isStudio = STUDIO_ROUTE.test(pathname);

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#111111]">
      {!isStudio && <PublicHeader />}
      <main className="flex-1">{children}</main>
      {!isStudio && <PublicFooter />}
    </div>
  );
}
