'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Search,
  Bell,
  ChevronDown,
  User,
  Settings,
  LogOut,
  ChevronRight,
  PlusCircle,
  Menu,
} from 'lucide-react';
import { CommandPalette } from '@/components/ui/command-palette';
import { Button } from '@/components/ui/button';
import { useCustomerUser } from '@/hooks/useCustomerUser';

interface CustomerNavbarProps {
  onMenuToggle?: () => void;
}

export function CustomerNavbar({ onMenuToggle }: CustomerNavbarProps) {
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);

  const { userName, companyName, initials } = useCustomerUser();

  // Generate breadcrumb path — only show last 2 segments on small screens
  const pathSegments = pathname.split('/').filter(Boolean);

  return (
    <>
      <header className="bg-white border-b border-[#E5E7EB] h-16 px-3 sm:px-6 flex items-center justify-between text-[#111111] sticky top-0 z-30 shadow-sm">
        {/* Left: Mobile Hamburger + Breadcrumb */}
        <div className="flex items-center gap-2 min-w-0">
          {/* Mobile hamburger */}
          <button
            onClick={onMenuToggle}
            className="p-2 -ml-1 rounded-lg text-[#6B7280] hover:text-[#111111] hover:bg-[#F9FAFB] transition-colors lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#6B7280] overflow-hidden">
            <Link href="/customer" className="hover:text-[#3B6FEB] transition-colors flex-shrink-0">
              Portal
            </Link>
            {pathSegments.map((segment, index) => {
              const href = '/' + pathSegments.slice(0, index + 1).join('/');
              const isLast = index === pathSegments.length - 1;
              // On mobile, only show last segment to save space
              const showOnMobile = index === pathSegments.length - 1;
              return (
                <React.Fragment key={href}>
                  <ChevronRight className={`w-3.5 h-3.5 text-[#9CA3AF] flex-shrink-0 ${!showOnMobile ? 'hidden sm:block' : ''}`} />
                  {isLast ? (
                    <span className={`text-[#111111] font-bold capitalize truncate max-w-[80px] sm:max-w-none ${!showOnMobile ? 'hidden sm:block' : ''}`}>
                      {segment}
                    </span>
                  ) : (
                    <Link href={href} className={`hover:text-[#3B6FEB] capitalize transition-colors flex-shrink-0 ${!showOnMobile ? 'hidden sm:block' : ''}`}>
                      {segment}
                    </Link>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Right: Create Quote + Search + Notifications + Profile */}
        <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
          {/* Create Quote CTA */}
          <Link href="/customer/create-quote" className="hidden sm:block">
            <Button variant="primary" size="sm" className="gap-1.5 font-bold">
              <PlusCircle className="w-4 h-4" /> 
              <span className="hidden lg:inline">CREATE QUOTE</span>
              <span className="lg:hidden">Quote</span>
            </Button>
          </Link>

          {/* Search — desktop only */}
          <button
            onClick={() => setCmdOpen(true)}
            className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-xs font-semibold text-[#6B7280] hover:text-[#111111] hover:border-[#3B6FEB] transition-all cursor-pointer"
            aria-label="Search portal"
          >
            <Search className="w-3.5 h-3.5 text-[#3B6FEB]" />
            <span>Search portal...</span>
            <kbd className="bg-white px-1.5 py-0.5 rounded text-[10px] text-[#111111] font-mono border border-[#E5E7EB]">⌘K</kbd>
          </button>

          {/* Mobile search icon */}
          <button
            onClick={() => setCmdOpen(true)}
            className="lg:hidden p-2 rounded-xl text-[#6B7280] hover:text-[#111111] hover:bg-[#F9FAFB] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Search"
          >
            <Search className="w-4 h-4 text-[#3B6FEB]" />
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                setProfileOpen(false);
              }}
              className="p-2 rounded-xl text-[#6B7280] hover:text-[#111111] hover:bg-[#F9FAFB] transition-colors relative min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Notifications"
              data-cy="customer-bell-btn"
            >
              <Bell className="w-4 h-4" />
            </button>

            {notificationsOpen && (
              <div
                className="absolute right-0 mt-2 w-[min(288px,90vw)] bg-white border border-[#E5E7EB] rounded-2xl shadow-xl p-4 text-xs space-y-3 z-50 animate-in fade-in zoom-in-95"
                data-cy="customer-notifications-dropdown"
              >
                <div className="flex justify-between items-center pb-2 border-b border-[#E5E7EB]">
                  <span className="font-bold text-[#111111]">Notifications</span>
                  <span className="text-[10px] text-[#3B6FEB] font-bold bg-[#EEF2FF] px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Coming Soon
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-center space-y-1">
                  <p className="font-bold text-[#111111]">Notification Center</p>
                  <p className="text-[11px] text-[#6B7280]">
                    Real-time alerts for quotes, orders, and shipments will be available soon.
                  </p>
                </div>
                <Link
                  href="/customer/notifications"
                  onClick={() => setNotificationsOpen(false)}
                  className="text-xs text-[#3B6FEB] font-bold block text-center pt-1 hover:underline"
                  data-cy="customer-view-all-notifications-link"
                >
                  Open Notification Center →
                </Link>
              </div>
            )}
          </div>

          {/* Profile Menu */}
          <div className="relative">
            <button
              onClick={() => {
                setProfileOpen(!profileOpen);
                setNotificationsOpen(false);
              }}
              className="flex items-center gap-1.5 p-1.5 rounded-xl hover:bg-[#F9FAFB] transition-colors min-h-[44px]"
              data-cy="customer-profile-menu-btn"
            >
              <div className="w-8 h-8 bg-[#111111] text-white font-heading font-bold text-xs flex items-center justify-center rounded-lg shadow-sm" data-cy="customer-avatar-initials">
                {initials}
              </div>
              <span className="text-xs font-bold text-[#111111] hidden md:block" data-cy="customer-navbar-name">{userName}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#6B7280] hidden md:block" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-[#E5E7EB] rounded-2xl shadow-xl p-2 text-xs space-y-1 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 border-b border-[#E5E7EB]">
                  <p className="font-bold text-[#111111]" data-cy="customer-profile-dropdown-name">{userName}</p>
                  <p className="text-[10px] text-[#6B7280]">{companyName}</p>
                </div>
                <Link href="/customer/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-xl text-[#6B7280] hover:text-[#111111] hover:bg-[#F9FAFB]">
                  <User className="w-3.5 h-3.5" /> Company Profile
                </Link>
                <Link href="/customer/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-xl text-[#6B7280] hover:text-[#111111] hover:bg-[#F9FAFB]">
                  <Settings className="w-3.5 h-3.5" /> Preferences
                </Link>
                <Link href="/login" className="flex items-center gap-2 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50">
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <CommandPalette isOpen={cmdOpen} onClose={() => setCmdOpen(false)} onToggle={() => setCmdOpen(!cmdOpen)} />
    </>
  );
}
