'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Search,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  User,
  Settings,
  LogOut,
  ChevronRight,
  PlusCircle,
} from 'lucide-react';
import { CommandPalette } from '@/components/ui/command-palette';
import { Button } from '@/components/ui/button';

export function CustomerNavbar() {
  const pathname = usePathname();
  const [darkMode, setDarkMode] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);

  // Generate breadcrumb path
  const pathSegments = pathname.split('/').filter(Boolean);

  return (
    <>
      <header className="bg-white border-b border-[#E5E7EB] h-16 px-6 flex items-center justify-between text-[#111111] sticky top-0 z-30 shadow-sm">
        {/* Left: Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-[#6B7280]">
          <Link href="/customer" className="hover:text-[#3B6FEB] transition-colors">Portal</Link>
          {pathSegments.map((segment, index) => {
            const href = '/' + pathSegments.slice(0, index + 1).join('/');
            const isLast = index === pathSegments.length - 1;
            return (
              <React.Fragment key={href}>
                <ChevronRight className="w-3.5 h-3.5 text-[#9CA3AF]" />
                {isLast ? (
                  <span className="text-[#111111] font-bold capitalize">{segment}</span>
                ) : (
                  <Link href={href} className="hover:text-[#3B6FEB] capitalize transition-colors">{segment}</Link>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Right: Cmd+K Search + Create Quote CTA + Notifications + Profile */}
        <div className="flex items-center gap-4">
          <Link href="/customer/create-quote">
            <Button variant="primary" size="sm" className="gap-2 font-bold hidden sm:flex">
              <PlusCircle className="w-4 h-4" /> CREATE QUOTE
            </Button>
          </Link>

          {/* Raycast Cmd+K Search Trigger */}
          <button
            onClick={() => setCmdOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-xs font-semibold text-[#6B7280] hover:text-[#111111] hover:border-[#3B6FEB] transition-all cursor-pointer hidden md:flex"
          >
            <Search className="w-3.5 h-3.5 text-[#3B6FEB]" />
            <span>Search portal...</span>
            <kbd className="bg-white px-1.5 py-0.5 rounded text-[10px] text-[#111111] font-mono border border-[#E5E7EB]">⌘K</kbd>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-xl text-[#6B7280] hover:text-[#111111] hover:bg-[#F9FAFB] transition-colors"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-[#6B7280]" />}
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                setProfileOpen(false);
              }}
              className="p-2 rounded-xl text-[#6B7280] hover:text-[#111111] hover:bg-[#F9FAFB] transition-colors relative"
              title="Notifications"
              data-cy="customer-bell-btn"
            >
              <Bell className="w-4 h-4" />
            </button>

            {notificationsOpen && (
              <div
                className="absolute right-0 mt-2 w-72 bg-white border border-[#E5E7EB] rounded-2xl shadow-xl p-4 text-xs space-y-3 z-50 animate-in fade-in zoom-in-95"
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

          {/* Profile Menu Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setProfileOpen(!profileOpen);
                setNotificationsOpen(false);
              }}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-[#F9FAFB] transition-colors"
            >
              <div className="w-8 h-8 bg-[#111111] text-white font-heading font-bold text-xs flex items-center justify-center rounded-lg shadow-sm">
                RM
              </div>
              <span className="text-xs font-bold text-[#111111] hidden sm:block">Rahul M.</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#6B7280]" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-[#E5E7EB] rounded-2xl shadow-xl p-2 text-xs space-y-1 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 border-b border-[#E5E7EB]">
                  <p className="font-bold text-[#111111]">Rahul Mishra</p>
                  <p className="text-[10px] text-[#6B7280]">Acme Tech Pvt Ltd</p>
                </div>
                <Link href="/customer/profile" className="flex items-center gap-2 px-3 py-2 rounded-xl text-[#6B7280] hover:text-[#111111] hover:bg-[#F9FAFB]">
                  <User className="w-3.5 h-3.5" /> Company Profile
                </Link>
                <Link href="/customer/profile" className="flex items-center gap-2 px-3 py-2 rounded-xl text-[#6B7280] hover:text-[#111111] hover:bg-[#F9FAFB]">
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
