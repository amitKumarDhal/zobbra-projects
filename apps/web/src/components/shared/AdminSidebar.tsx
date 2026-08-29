'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  ShoppingBag,
  BarChart3,
  Users,
  Package,
  CheckSquare,
  UserCircle,
  CreditCard,
  Ticket,
  Star,
  Image as ImageIcon,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
} from 'lucide-react';

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function AdminSidebar({ isOpen = false, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Inquiry', href: '/dashboard/inquiries', icon: MessageSquare, badge: 23 },
    { name: 'Quote', href: '/dashboard/quotes', icon: FileText, badge: 15 },
    { name: 'Order', href: '/dashboard/orders', icon: ShoppingBag, badge: 18 },
    { name: 'Report', href: '/dashboard/reports', icon: BarChart3 },
    { name: 'Customers', href: '/dashboard/customers', icon: Users },
    { name: 'Products', href: '/dashboard/products', icon: Package },
    { name: 'To Do', href: '/dashboard/todo', icon: CheckSquare, badge: 12 },
    { name: 'Agents', href: '/dashboard/agents', icon: UserCircle },
    { name: 'Payments', href: '/dashboard/payments', icon: CreditCard },
    { name: 'Coupon', href: '/dashboard/coupons', icon: Ticket },
    { name: 'Testimonials', href: '/dashboard/testimonials', icon: Star },
    { name: 'Media', href: '/dashboard/media', icon: ImageIcon },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  const sidebarContent = (
    <aside
      className={`bg-[#0A0F1C] text-white flex flex-col justify-between p-3 h-full transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-3 py-4 mb-6">
          {!collapsed ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white text-[#111111] font-heading font-black text-lg flex items-center justify-center rounded-lg">
                Z
              </div>
              <div className="flex flex-col">
                <span className="text-base font-heading font-black text-white leading-none">ZOBBRA</span>
                <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest mt-1">WEAR YOUR BRAND</span>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 bg-white text-[#111111] font-heading font-black text-lg flex items-center justify-center rounded-lg mx-auto">
              Z
            </div>
          )}

          {/* Desktop collapse button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors hidden lg:block"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
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
        <nav className="space-y-1" aria-label="Admin navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group min-h-[44px] ${
                  isActive
                    ? 'bg-[#3B6FEB] text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                } ${collapsed ? 'justify-center px-0' : ''}`}
                title={collapsed ? item.name : undefined}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                  {!collapsed && <span>{item.name}</span>}
                </div>
                
                {!collapsed && item.badge && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${isActive ? 'bg-white/20 text-white' : 'bg-[#1E293B] text-slate-300'}`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Sidebar User Footer */}
      <div className="pt-4 mt-4">
        {!collapsed ? (
          <div className="flex items-center justify-between px-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#1E293B] text-white font-heading font-bold text-xs flex items-center justify-center rounded-full">
                Z
              </div>
              <div className="text-[11px]">
                <p className="font-bold text-white leading-tight">ZOBBRA Admin</p>
                <p className="text-slate-400 text-[10px] font-medium truncate max-w-[100px]">admin@zobbra.com</p>
              </div>
            </div>
            <Link href="/login" className="text-slate-400 hover:text-rose-400 p-1 transition-colors" title="Sign Out">
              <LogOut className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <Link href="/login" className="flex justify-center p-2 text-slate-400 hover:text-rose-400 transition-colors" title="Sign Out">
            <LogOut className="w-4 h-4" />
          </Link>
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
