'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  FileText,
  ShoppingBag,
  Truck,
  Receipt,
  Bell,
  HelpCircle,
  User,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';

export function CustomerSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [userName, setUserName] = useState('Rahul Sharma');
  const [companyName, setCompanyName] = useState('ZOBBRA Demo Technologies');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const uStr = localStorage.getItem('user') || localStorage.getItem('zobra_user');
      if (uStr) {
        try {
          const u = JSON.parse(uStr);
          if (u.name) setUserName(u.name);
          if (u.company?.name) setCompanyName(u.company.name);
        } catch (_err) {
          // ignore
        }
      }
    }
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
    router.push('/login');
  };

  const navItems = [
    { name: 'Dashboard', href: '/customer', icon: LayoutDashboard },
    { name: 'Products', href: '/customer/products', icon: Package },
    { name: 'Create Quote', href: '/customer/create-quote', icon: PlusCircle },
    { name: 'My Quotes', href: '/customer/quotes', icon: FileText },
    { name: 'My Orders', href: '/customer/orders', icon: ShoppingBag },
    { name: 'Shipment Tracking', href: '/customer/tracking', icon: Truck },
    { name: 'Invoices', href: '/customer/invoices', icon: Receipt },
    { name: 'Notifications', href: '/customer/notifications', icon: Bell },
    { name: 'Support', href: '/customer/support', icon: HelpCircle },
    { name: 'Profile', href: '/customer/profile', icon: User },
  ];

  return (
    <aside
      className={`bg-[#0A0F1C] text-white flex flex-col justify-between p-3 min-h-screen transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-3 py-4 mb-3 border-b border-slate-800/80">
          {!collapsed ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white text-[#111111] font-heading font-black text-lg flex items-center justify-center rounded-lg shadow-sm">
                Z
              </div>
              <div>
                <span className="text-base font-heading font-black text-white block leading-tight">ZOBBRA</span>
                <span className="text-[9px] font-bold text-[#3B6FEB] uppercase tracking-wider">CLIENT PORTAL</span>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 bg-white text-[#111111] font-heading font-black text-lg flex items-center justify-center rounded-lg mx-auto shadow-sm">
              Z
            </div>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors hidden md:block"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/customer' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#3B6FEB] text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                } ${collapsed ? 'justify-center px-0' : ''}`}
                title={collapsed ? item.name : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Sidebar User Footer */}
      <div className="pt-4 border-t border-slate-800">
        {!collapsed ? (
          <div className="flex items-center justify-between px-3">
            <div className="text-[11px] truncate max-w-[140px]">
              <p className="font-bold text-white leading-tight truncate">{userName}</p>
              <p className="text-slate-400 text-[10px] font-medium truncate">{companyName}</p>
            </div>
            <button onClick={handleLogout} className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-white/5 transition-colors" title="Sign Out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button onClick={handleLogout} className="flex justify-center w-full p-2 text-slate-400 hover:text-rose-400 transition-colors" title="Sign Out">
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
