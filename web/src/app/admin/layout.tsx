import React from 'react';
import { AdminSidebar } from '@/components/shared/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 h-16 px-8 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-700">ZOBBRA B2B Management Suite</h2>
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-slate-600">System Online (Express API)</span>
          </div>
        </header>
        <main className="p-8 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
