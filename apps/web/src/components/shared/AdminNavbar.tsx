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
  Menu,
} from 'lucide-react';
import { CommandPalette } from '@/components/ui/command-palette';

export function AdminNavbar() {
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);

  return (
    <>
      <header className="bg-white border-b border-[#E5E7EB] h-[72px] px-6 flex items-center justify-between text-[#111111] sticky top-0 z-30">
        {/* Left: Mobile Menu Trigger (hidden on desktop normally, handled by sidebar) */}
        <div className="flex items-center gap-4">
          <button className="p-2 -ml-2 rounded-lg text-[#6B7280] hover:text-[#111111] hover:bg-[#F3F4F6] transition-colors md:hidden">
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Right: Search + Notifications + Profile */}
        <div className="flex items-center gap-5 ml-auto">
          {/* Global Search */}
          <button
            onClick={() => setCmdOpen(true)}
            className="flex items-center gap-2 px-4 py-2 w-64 rounded-lg border border-[#E5E7EB] text-sm text-[#9CA3AF] hover:text-[#111111] hover:border-[#D1D5DB] transition-all cursor-pointer bg-white"
          >
            <Search className="w-4 h-4 text-[#9CA3AF]" />
            <span className="flex-1 text-left">Search anything...</span>
            <Search className="w-3.5 h-3.5 opacity-0" /> {/* Spacer for balance */}
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                setProfileOpen(false);
              }}
              className="p-2 rounded-full text-[#6B7280] hover:text-[#111111] hover:bg-[#F3F4F6] transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                5
              </span>
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-3 w-80 bg-white border border-[#E5E7EB] rounded-2xl shadow-xl p-4 text-sm space-y-3 z-50">
                <div className="flex justify-between items-center pb-3 border-b border-[#E5E7EB]">
                  <span className="font-bold text-[#111111]">Notifications</span>
                  <span className="text-xs text-[#3B6FEB] font-semibold cursor-pointer hover:underline">Mark all read</span>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  <div className="p-3 rounded-xl bg-[#EEF2FF] border border-[#C7D2FE]">
                    <p className="font-bold text-[#111111] text-xs">New Inquiry Received</p>
                    <p className="text-xs text-[#6B7280] mt-0.5">Rakesh Kumar requested a quote for Corporate T-Shirts.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-[#E5E7EB]">
                    <p className="font-bold text-[#111111] text-xs">Order Confirmed</p>
                    <p className="text-xs text-[#6B7280] mt-0.5">Order #ZB-2024-032 payment received successfully.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-[#E5E7EB]"></div>

          {/* Profile Menu Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setProfileOpen(!profileOpen);
                setNotificationsOpen(false);
              }}
              className="flex items-center gap-3 p-1 rounded-xl hover:bg-[#F3F4F6] transition-colors"
            >
              <div className="w-9 h-9 bg-[#111111] text-white font-heading font-bold text-sm flex items-center justify-center rounded-full">
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
                <Link href="/dashboard/settings" className="flex items-center gap-2 px-4 py-2 text-[#6B7280] hover:text-[#111111] hover:bg-[#F9FAFB]">
                  <User className="w-4 h-4" /> My Profile
                </Link>
                <Link href="/dashboard/settings" className="flex items-center gap-2 px-4 py-2 text-[#6B7280] hover:text-[#111111] hover:bg-[#F9FAFB]">
                  <Settings className="w-4 h-4" /> Account Settings
                </Link>
                <div className="my-1 border-t border-[#E5E7EB]"></div>
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
