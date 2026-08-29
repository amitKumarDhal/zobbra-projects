'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Bell,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Menu,
} from 'lucide-react';
import { CommandPalette } from '@/components/ui/command-palette';

interface AdminNavbarProps {
  onMenuToggle?: () => void;
}

export function AdminNavbar({ onMenuToggle }: AdminNavbarProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);

  return (
    <>
      <header className="bg-white border-b border-[#E5E7EB] h-[60px] lg:h-[72px] px-4 lg:px-6 flex items-center justify-between text-[#111111] sticky top-0 z-30 shadow-sm">
        {/* Left: Mobile Hamburger + optional page context */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="p-2 -ml-1 rounded-lg text-[#6B7280] hover:text-[#111111] hover:bg-[#F3F4F6] transition-colors lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Desktop: Global Search */}
          <button
            onClick={() => setCmdOpen(true)}
            className="hidden md:flex items-center gap-2 px-4 py-2 w-52 lg:w-64 rounded-lg border border-[#E5E7EB] text-sm text-[#9CA3AF] hover:text-[#111111] hover:border-[#D1D5DB] transition-all cursor-pointer bg-white"
            aria-label="Open search"
          >
            <Search className="w-4 h-4 text-[#9CA3AF] shrink-0" />
            <span className="flex-1 text-left truncate">Search anything...</span>
          </button>
        </div>

        {/* Right: Search (mobile icon) + Notifications + Profile */}
        <div className="flex items-center gap-2 lg:gap-5 ml-auto">
          {/* Mobile search icon only */}
          <button
            onClick={() => setCmdOpen(true)}
            className="md:hidden p-2 rounded-lg text-[#6B7280] hover:text-[#111111] hover:bg-[#F3F4F6] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                setProfileOpen(false);
              }}
              className="p-2 rounded-full text-[#6B7280] hover:text-[#111111] hover:bg-[#F3F4F6] transition-colors relative min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Notifications"
              data-cy="admin-bell-btn"
            >
              <Bell className="w-5 h-5" />
            </button>

            {notificationsOpen && (
              <div
                className="absolute right-0 mt-3 w-[min(320px,90vw)] bg-white border border-[#E5E7EB] rounded-2xl shadow-xl p-4 text-xs space-y-3 z-50 animate-in fade-in zoom-in-95"
                data-cy="admin-notifications-dropdown"
              >
                <div className="flex justify-between items-center pb-2 border-b border-[#E5E7EB]">
                  <span className="font-bold text-[#111111]">Notifications</span>
                  <span className="text-[10px] text-[#3B6FEB] font-bold bg-[#EEF2FF] px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Coming Soon
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-center space-y-1">
                  <p className="font-bold text-[#111111]">Admin Alerts</p>
                  <p className="text-[11px] text-[#6B7280]">
                    Real-time alerts for new inquiries, quote approvals, payments, and orders will be available soon.
                  </p>
                </div>
                <Link
                  href="/dashboard/notifications"
                  onClick={() => setNotificationsOpen(false)}
                  className="text-xs text-[#3B6FEB] font-bold block text-center pt-1 hover:underline"
                  data-cy="admin-view-all-notifications-link"
                >
                  Open Notification Center →
                </Link>
              </div>
            )}
          </div>

          {/* Divider — hidden on small screens */}
          <div className="hidden sm:block w-px h-8 bg-[#E5E7EB]" />

          {/* Profile Menu Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setProfileOpen(!profileOpen);
                setNotificationsOpen(false);
              }}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-[#F3F4F6] transition-colors min-h-[44px]"
            >
              <div className="w-8 h-8 lg:w-9 lg:h-9 bg-[#111111] text-white font-heading font-bold text-sm flex items-center justify-center rounded-full">
                Z
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-sm font-bold text-[#111111] leading-none">ZOBBRA Admin</span>
                <span className="text-xs text-[#6B7280] mt-1">Administrator</span>
              </div>
              <ChevronDown className="w-4 h-4 text-[#6B7280] hidden sm:block ml-1" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-3 w-56 bg-white border border-[#E5E7EB] rounded-2xl shadow-xl py-2 text-sm z-50">
                <div className="px-4 py-3 border-b border-[#E5E7EB] mb-1">
                  <p className="font-bold text-[#111111]">ZOBBRA Admin</p>
                  <p className="text-xs text-[#6B7280]">admin@zobbra.com</p>
                </div>
                <Link href="/dashboard/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-4 py-2 text-[#6B7280] hover:text-[#111111] hover:bg-[#F9FAFB]">
                  <User className="w-4 h-4" /> My Profile
                </Link>
                <Link href="/dashboard/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-4 py-2 text-[#6B7280] hover:text-[#111111] hover:bg-[#F9FAFB]">
                  <Settings className="w-4 h-4" /> Account Settings
                </Link>
                <div className="my-1 border-t border-[#E5E7EB]" />
                <Link href="/login" className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 font-medium">
                  <LogOut className="w-4 h-4" /> Sign Out
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
