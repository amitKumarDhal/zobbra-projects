'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  Mail,
  Phone,
  ArrowRight,
  UserCircle,
} from 'lucide-react';
import { ZobbraLogo } from './ZobbraLogo';

export function PublicHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.classList.add('drawer-open');
    } else {
      document.body.classList.remove('drawer-open');
    }
    return () => document.body.classList.remove('drawer-open');
  }, [mobileMenuOpen]);

  // Signed-in users browsing the public catalog/studio see their name (linking back to their
  // portal) instead of a Login link. Read after mount so server and client renders match.
  const [account, setAccount] = useState<{ href: string; label: string } | null>(null);
  useEffect(() => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('zobra_token');
      const raw = localStorage.getItem('user') || localStorage.getItem('zobra_user');
      const user = raw ? JSON.parse(raw) : null;
      const href =
        user?.role === 'CUSTOMER' ? '/customer/products' : user?.role === 'ADMIN' ? '/dashboard' : null;
      // New WhatsApp OTP accounts may not have a name yet — fall back to their phone number
      const label = user?.name?.trim() || user?.phone || 'My Account';
      setAccount(token && href ? { href, label } : null);
    } catch {
      setAccount(null);
    }
  }, [pathname]);

  const accountLink = account ?? { href: '/login', label: 'Login' };

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Products', href: '/products' },
    { name: 'About Us', href: '/about' },
    { name: 'Track Order', href: '/track-order' },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-[0_1px_3px_rgba(17,17,17,0.06)]">
        {/* 2. MAIN NAVIGATION */}
        <div className="border-b border-[#E5E5E5] bg-white">
          <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 h-[58px] sm:h-[62px] flex items-center justify-between">
            {/* Left: Canonical Official Brand Logo */}
            <div className="flex-1 flex items-center justify-start">
              <ZobbraLogo variant="dark-badge" href="/" priority={true} />
            </div>

            {/* Center: Navigation Links */}
            <nav className="hidden md:flex items-center justify-center gap-6 lg:gap-7 text-[13px] font-medium text-[#333333]">
              {navLinks.map((link) => {
                const isActive =
                  link.href === '/'
                    ? pathname === '/'
                    : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`transition-colors hover:text-[#050505] py-1.5 relative min-h-0 flex items-center justify-center ${
                      isActive ? 'text-[#050505] font-bold' : ''
                    }`}
                  >
                    {link.name}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#050505] rounded-full" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right: Login & CTA Button */}
            <div className="hidden md:flex flex-1 items-center justify-end gap-3.5">
              <Link
                href={accountLink.href}
                data-cy="public-header-account-link"
                title={account ? 'Go to your account' : undefined}
                className="text-[13px] font-semibold text-[#444444] hover:text-[#050505] transition-colors py-1 px-2 rounded hover:bg-[#F7F7F5] min-h-0 flex items-center justify-center gap-1.5 max-w-[180px]"
              >
                {account && <UserCircle className="w-4 h-4 shrink-0" />}
                <span className="truncate">{accountLink.label}</span>
              </Link>
              <Link
                href="/get-quote"
                className="px-3.5 py-2 bg-[#111111] hover:bg-[#3B6FEB] text-white text-[11px] font-bold tracking-wider uppercase rounded-full transition-all shadow-sm active:scale-[0.98] min-h-0 flex items-center justify-center group"
              >
                GET A FREE QUOTE <ArrowRight className="w-3 h-3 ml-1.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            {/* Mobile Menu Toggle */}
            <div className="flex flex-1 md:hidden items-center justify-end">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 rounded text-[#050505] hover:bg-[#F3F4F6] transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Backdrop */}
        {mobileMenuOpen && (
          <div
            className="md:hidden fixed inset-0 top-[58px] sm:top-[62px] bg-black/40 backdrop-blur-sm z-40"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed top-[58px] sm:top-[62px] left-0 right-0 max-h-[calc(100vh-62px)] overflow-y-auto bg-white border-b border-[#E5E5E5] px-4 pb-5 pt-2.5 space-y-1 z-50 shadow-xl animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-wrap gap-3 text-xs text-[#666666] pb-2.5 border-b border-[#E5E5E5] mb-2.5">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-gray-500" /> +91 91244 49665
              </span>
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-gray-500" /> sales@zobbra.com
              </span>
            </div>
            {navLinks.map((link) => {
              const isActive =
                link.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`py-2 px-3 text-sm font-medium rounded transition-colors min-h-[40px] flex items-center ${
                    isActive
                      ? 'text-[#050505] bg-[#F7F7F5] font-bold'
                      : 'text-[#333333] hover:text-[#050505] hover:bg-[#F7F7F5]'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
            <div className="pt-2.5 border-t border-[#E5E5E5] space-y-2 mt-2.5">
              <Link
                href={accountLink.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-center py-2 px-3 text-sm font-semibold text-[#333333] hover:text-black hover:bg-[#F7F7F5] rounded border border-[#E5E5E5] transition-colors min-h-[40px] flex items-center justify-center gap-1.5"
              >
                {account && <UserCircle className="w-4 h-4 shrink-0" />}
                <span className="truncate">{accountLink.label}</span>
              </Link>
              <Link
                href="/get-quote"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center px-4 py-2.5 bg-[#050505] text-white text-xs font-bold uppercase tracking-wider rounded-[3px] min-h-[40px] flex items-center justify-center active:scale-[0.98] group"
              >
                GET A FREE QUOTE <ArrowRight className="w-3.5 h-3.5 ml-1.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
