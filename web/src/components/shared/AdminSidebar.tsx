'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Users,
  FileText,
  ShoppingBag,
  Kanban,
  Truck,
  BarChart3,
  Globe,
  Settings,
  LogOut,
} from 'lucide-react';

export const AdminSidebar: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Products', href: '/admin/products', icon: Package },
    { name: 'Customers', href: '/admin/customers', icon: Users },
    { name: 'Quote Management', href: '/admin/quotes', icon: FileText },
    { name: 'Order Management', href: '/admin/orders', icon: ShoppingBag },
    { name: 'Production Kanban', href: '/admin/production', icon: Kanban },
    { name: 'Dispatch & Shipping', href: '/admin/dispatch', icon: Truck },
    { name: 'Reports & Sales', href: '/admin/reports', icon: BarChart3 },
    { name: 'CMS & Website', href: '/admin/cms', icon: Globe },
    { name: 'System Settings', href: '/admin/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-screen flex flex-col justify-between p-4 border-r border-slate-800">
      <div>
        {/* Header */}
        <div className="flex items-center gap-3 px-3 py-4 border-b border-slate-800 mb-6">
          <div className="w-9 h-9 bg-blue-600 text-white font-black text-lg flex items-center justify-center rounded-lg shadow-md">
            Z
          </div>
          <div>
            <span className="text-lg font-black text-white block leading-tight">
              ZOBRA <span className="text-blue-400">ADMIN</span>
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase">
              Merchandise SaaS
            </span>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / User Session */}
      <div className="pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="text-xs">
            <p className="font-bold text-white">Rajesh Sharma</p>
            <p className="text-slate-500">Admin Role</p>
          </div>
          <Link href="/login" className="text-slate-400 hover:text-rose-400 p-1">
            <LogOut className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </aside>
  );
};
