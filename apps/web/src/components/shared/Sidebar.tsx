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
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Products', href: '/dashboard/products', icon: Package },
    { name: 'Customers', href: '/dashboard/customers', icon: Users },
    { name: 'Quotes', href: '/dashboard/quotes', icon: FileText },
    { name: 'Orders', href: '/dashboard/orders', icon: ShoppingBag },
    { name: 'Production', href: '/dashboard/production', icon: Kanban },
    { name: 'Dispatch', href: '/dashboard/dispatch', icon: Truck },
    { name: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
    { name: 'CMS', href: '/dashboard/cms', icon: Globe },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-4 min-h-screen text-slate-300">
      <div>
        <div className="flex items-center gap-3 px-3 py-4 border-b border-slate-800 mb-6">
          <div className="w-9 h-9 bg-blue-600 text-white font-black text-lg flex items-center justify-center rounded-xl shadow-md">
            Z
          </div>
          <div>
            <span className="text-lg font-black text-white block leading-tight">ZOBBRA</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase">B2B SaaS</span>
          </div>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 text-center">
        ZOBBRA Foundation v1.0
      </div>
    </aside>
  );
};
