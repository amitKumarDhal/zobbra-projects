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
import { useAdminSidebarCounts } from '@/hooks/useAdminSidebarCounts';
import { useCustomerUser } from '@/hooks/useCustomerUser';
import { ZobbraLogo } from './ZobbraLogo';

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function AdminSidebar({ isOpen = false, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { counts, loading } = useAdminSidebarCounts();
  const { user } = useCustomerUser();

  const userName = user?.name || 'ZOBBRA Admin';
  const userEmail = user?.email || 'admin@zobbra.com';

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Inquiry', href: '/dashboard/inquiries', icon: MessageSquare, badge: counts.inquiries, hasBadge: true },
    { name: 'Quote', href: '/dashboard/quotes', icon: FileText, badge: counts.quotes, hasBadge: true },
    { name: 'Order', href: '/dashboard/orders', icon: ShoppingBag, badge: counts.orders, hasBadge: true },
    { name: 'Report', href: '/dashboard/reports', icon: BarChart3 },
    { name: 'Customers', href: '/dashboard/customers', icon: Users },
    { name: 'Products', href: '/dashboard/products', icon: Package },
    { name: 'To Do', href: '/dashboard/todo', icon: CheckSquare, badge: counts.todo, hasBadge: true },
    { name: 'Agents', href: '/dashboard/agents', icon: UserCircle },
    { name: 'Payments', href: '/dashboard/payments', icon: CreditCard },
    { name: 'Coupon', href: '/dashboard/coupons', icon: Ticket },
    { name: 'Testimonials', href: '/dashboard/testimonials', icon: Star },
    { name: 'Media', href: '/dashboard/media', icon: ImageIcon },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  // Deterministic initials color for avatar — consistent for same user
  const avatarInitial = userName.charAt(0).toUpperCase();

  const sidebarContent = (
    <aside
      className={`bg-[#0A0F1C] text-white flex flex-col justify-between p-3 h-full transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div>
        {/* ── Sidebar Header ── */}
        <div
          className={`flex items-center justify-between px-3 py-4 mb-2 border-b`}
          style={{ borderColor: 'var(--color-sidebar-border)' }}
        >
          {!collapsed ? (
            <ZobbraLogo variant="white" href="/dashboard" width={135} height={45} priority={true} />
          ) : (
            <ZobbraLogo variant="mark-only" href="/dashboard" />
          )}

          {/* Desktop collapse button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg transition-colors hidden lg:flex items-center justify-center"
            style={{ color: 'var(--color-sidebar-icon)' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-sidebar-icon)')}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile close button */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg transition-colors lg:hidden flex items-center justify-center"
              style={{ color: 'var(--color-sidebar-icon)' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-sidebar-icon)')}
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ── Navigation ── */}
        <nav className="space-y-0.5 mt-2" aria-label="Admin navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group min-h-[44px] ${
                  collapsed ? 'justify-center px-0' : ''
                }`}
                style={
                  isActive
                    ? {
                        backgroundColor: 'var(--color-brand-primary)',
                        color: '#ffffff',
                        boxShadow: '0 2px 8px var(--color-sidebar-active-shadow)',
                      }
                    : {}
                }
                // Hover handled via CSS class below since inline styles can't do :hover
                data-active={isActive ? 'true' : 'false'}
                data-sidebar-item="true"
                title={collapsed ? item.name : undefined}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className="w-[18px] h-[18px] shrink-0 transition-colors duration-150"
                    style={
                      isActive
                        ? { color: '#ffffff' }
                        : { color: 'var(--color-sidebar-icon)' }
                    }
                  />
                  {!collapsed && <span className={isActive ? 'text-white' : 'text-[#CBD5E1]'}>{item.name}</span>}
                </div>

                {!collapsed && item.hasBadge && (
                  loading ? (
                    <span className="w-5 h-4 rounded-md animate-pulse" style={{ backgroundColor: 'var(--color-sidebar-badge-bg)' }} />
                  ) : typeof item.badge === 'number' && item.badge > 0 ? (
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-md tabular-nums"
                      style={
                        isActive
                          ? { backgroundColor: 'rgba(255,255,255,0.20)', color: '#ffffff' }
                          : { backgroundColor: 'var(--color-sidebar-badge-bg)', color: '#94A3B8' }
                      }
                    >
                      {item.badge}
                    </span>
                  ) : null
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ── Profile Footer ── */}
      <div
        className="pt-4 mt-4 border-t"
        style={{ borderColor: 'var(--color-sidebar-border)' }}
      >
        {!collapsed ? (
          <div className="flex items-center justify-between px-2 py-1 rounded-xl transition-colors duration-150 group/profile hover:bg-white/5">
            <div className="flex items-center gap-3 min-w-0">
              {/* Avatar */}
              <div
                className="w-8 h-8 text-white font-heading font-bold text-xs flex items-center justify-center rounded-full flex-shrink-0 select-none"
                style={{ backgroundColor: 'var(--color-sidebar-avatar-bg)' }}
                aria-hidden="true"
              >
                {avatarInitial}
              </div>
              <div className="text-[11px] min-w-0">
                <p className="font-bold text-white leading-tight truncate max-w-[120px]">{userName}</p>
                <p
                  className="text-[10px] font-medium truncate max-w-[120px] mt-0.5"
                  style={{ color: 'var(--color-sidebar-icon)' }}
                >
                  {userEmail}
                </p>
              </div>
            </div>
            <Link
              href="/login"
              className="p-1.5 rounded-lg transition-colors flex-shrink-0"
              style={{ color: 'var(--color-sidebar-icon)' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#FB7185')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-sidebar-icon)')}
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex justify-center p-2 rounded-lg transition-colors"
            style={{ color: 'var(--color-sidebar-icon)' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#FB7185')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-sidebar-icon)')}
            title="Sign Out"
          >
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
