'use client';

import React, { useState } from 'react';
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
  X,
} from 'lucide-react';
import { useCustomerUser } from '@/hooks/useCustomerUser';
import { ZobbraLogo } from './ZobbraLogo';

interface CustomerSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function CustomerSidebar({ isOpen = false, onClose }: CustomerSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const { userName, companyName } = useCustomerUser();

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
    router.push('/login');
  };

  const navItems = [
    { name: 'Overview', href: '/customer', icon: LayoutDashboard },
    { name: 'Browse Products', href: '/customer/products', icon: Package },
    { name: 'Request Quote', href: '/customer/create-quote', icon: PlusCircle },
    { name: 'My Quotes', href: '/customer/quotes', icon: FileText },
    { name: 'My Orders', href: '/customer/orders', icon: ShoppingBag },
    { name: 'Track Shipments', href: '/customer/tracking', icon: Truck },
    { name: 'Invoices', href: '/customer/invoices', icon: Receipt },
    { name: 'Notifications', href: '/customer/notifications', icon: Bell },
    { name: 'Support', href: '/customer/support', icon: HelpCircle },
    { name: 'Profile', href: '/customer/profile', icon: User },
  ];

  const sidebarContent = (
    <aside
      className={`bg-[#0A0F1C] text-white flex flex-col justify-between p-3 h-full transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-3 py-4 mb-3 border-b border-slate-800/80">
          {!collapsed ? (
            <div className="flex flex-col gap-1">
              <ZobbraLogo variant="white" href="/customer" width={125} height={42} priority={true} />
              <span className="text-[9px] font-bold text-[#3B6FEB] uppercase tracking-wider pl-1">CLIENT PORTAL</span>
            </div>
          ) : (
            <ZobbraLogo variant="mark-only" href="/customer" />
          )}

          {/* Desktop collapse button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors hidden lg:block"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile close button */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors lg:hidden"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1" aria-label="Customer portal navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/customer' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all min-h-[44px] ${
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
              <p className="font-bold text-white leading-tight truncate" data-cy="customer-sidebar-name">{userName}</p>
              <p className="text-slate-400 text-[10px] font-medium truncate" data-cy="customer-sidebar-company">{companyName}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-white/5 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Sign Out"
              data-cy="customer-sidebar-logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            className="flex justify-center w-full p-2 text-slate-400 hover:text-rose-400 transition-colors min-h-[44px]"
            title="Sign Out"
            data-cy="customer-sidebar-logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop: Always visible sidebar */}
      <div className="hidden lg:flex h-screen sticky top-0">
        {sidebarContent}
      </div>

      {/* Mobile: Fixed overlay drawer */}
      <div
        className={`lg:hidden fixed inset-y-0 left-0 z-40 flex h-full transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-hidden={!isOpen}
      >
        {sidebarContent}
      </div>
    </>
  );
}
