import React from 'react';
import { CustomerSidebar } from '@/components/shared/CustomerSidebar';
import { CustomerNavbar } from '@/components/shared/CustomerNavbar';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#F8F9FC] text-[#111111] font-sans antialiased">
      <CustomerSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <CustomerNavbar />
        <main className="p-6 lg:p-8 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
