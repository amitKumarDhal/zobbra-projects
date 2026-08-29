'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { CustomerSidebar } from '@/components/shared/CustomerSidebar';
import { CustomerNavbar } from '@/components/shared/CustomerNavbar';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile navigation)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.classList.add('drawer-open');
    } else {
      document.body.classList.remove('drawer-open');
    }
    return () => document.body.classList.remove('drawer-open');
  }, [sidebarOpen]);

  return (
    <div className="flex min-h-screen bg-[#F8F9FC] text-[#111111] font-sans antialiased">
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          className="drawer-backdrop lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <CustomerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        <CustomerNavbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
