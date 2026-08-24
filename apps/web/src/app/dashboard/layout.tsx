'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/shared/AdminSidebar';
import { AdminNavbar } from '@/components/shared/AdminNavbar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/login');
      return;
    }
    
    try {
      const user = JSON.parse(userStr);
      if (user.role !== 'ADMIN' && user.role !== 'SALES') {
        router.push('/login');
        return;
      }
      setAuthorized(true);
    } catch (e) {
      router.push('/login');
    }
  }, [router]);

  if (!authorized) {
    return <div className="min-h-screen bg-[#F7F5F2] flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen bg-[#F7F5F2] text-[#1C1C1C]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminNavbar />
        <main className="p-8 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
