'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  ChevronDown,
  MapPin,
  Mail,
  Phone,
} from 'lucide-react';
import { ZobbraLogo } from './ZobbraLogo';

export function PublicHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);

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

  const navLinks = [
    { name: 'Home', href: '/' },
    {
      name: 'Products',
      href: '/products',
      hasDropdown: true,
      children: [
        { name: 'T-Shirts', href: '/products?category=t-shirts' },
        { name: 'Caps & Headwear', href: '/products?category=caps' },
        { name: 'Bags & Backpacks', href: '/products?category=bags' },
        { name: 'Mugs & Bottles', href: '/products?category=drinkware' },
        { name: 'Welcome Kits', href: '/products?category=kits' },
        { name: 'All Products', href: '/products' },
      ],
    },
    { name: 'How It Works', href: '/#how-it-works' },
    { name: 'Our Clients', href: '/#clients' },
    { name: 'About Us', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        {/* 1. TOP UTILITY BAR (Thin black bar at very top) */}
        <div className="bg-[#050505] text-[#D1D5DB] text-[11px] py-1.5 px-4 hidden md:block border-b border-black">
          <div className="max-w-[1240px] mx-auto flex items-center justify-between font-normal tracking-wide">
            {/* Left: Location */}
            <div className="flex items-center gap-1.5 text-gray-300">
              <MapPin className="w-3 h-3 text-gray-400" />
              <span>Bhubaneswar, Odisha</span>
            </div>

            {/* Center: Email */}
            <div className="flex items-center gap-1.5 text-gray-300">
              <Mail className="w-3 h-3 text-gray-400" />
              <a href="mailto:hello@zobbra.com" className="hover:text-white transition-colors">
                hello@zobbra.com
              </a>
            </div>

            {/* Right: Phone & Socials */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1.5 text-gray-300">
                <Phone className="w-3 h-3 text-gray-400" />
                <a href="tel:+919124449666" className="hover:text-white transition-colors">
                  +91 91244 49666
                </a>
              </div>

              <div className="flex items-center gap-2.5 pl-3 border-l border-gray-800">
                {/* Instagram */}
                <a
                  href="https://instagram.com/zobra"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-5 h-5 rounded-full border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white hover:border-white transition-colors"
                >
                  <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
                {/* Facebook */}
                <a
                  href="https://facebook.com/zobra"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="w-5 h-5 rounded-full border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white hover:border-white transition-colors"
                >
                  <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                {/* LinkedIn */}
                <a
                  href="https://linkedin.com/company/zobra"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="w-5 h-5 rounded-full border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white hover:border-white transition-colors"
                >
                  <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* 2. MAIN NAVIGATION */}
        <div className="border-b border-[#E5E5E5] bg-white">
          <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 h-[60px] sm:h-[66px] flex items-center justify-between">
            {/* Left: Canonical Official Brand Logo */}
            <ZobbraLogo variant="dark-badge" href="/" priority={true} />

            {/* Center: Navigation Links */}
            <nav className="hidden md:flex items-center gap-7 text-[13.5px] font-medium text-[#333333]">
              {navLinks.map((link) =>
                link.hasDropdown ? (
                  <div key={link.href} className="relative">
                    <button
                      onClick={() => setProductsOpen(!productsOpen)}
                      onBlur={() => setTimeout(() => setProductsOpen(false), 200)}
                      aria-expanded={productsOpen}
                      className={`flex items-center gap-1 transition-colors hover:text-[#050505] py-2 ${
                        pathname.startsWith('/products') ? 'text-[#050505] font-bold' : ''
                      }`}
                    >
                      {link.name}
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${
                          productsOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {productsOpen && (
                      <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-[#E5E5E5] rounded-md shadow-lg z-50 py-1">
                        {link.children?.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setProductsOpen(false)}
                            className="block px-4 py-2 text-[13px] text-[#444444] hover:bg-[#F7F7F5] hover:text-[#050505] transition-colors"
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`transition-colors hover:text-[#050505] py-2 relative ${
                      pathname === link.href ? 'text-[#050505] font-bold' : ''
                    }`}
                  >
                    {link.name}
                    {pathname === link.href && (
                      <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#050505] rounded-full" />
                    )}
                  </Link>
                )
              )}
            </nav>

            {/* Right: Login & CTA Button */}
            <div className="hidden md:flex items-center gap-4">
              <Link
                href="/login"
                className="text-[13px] font-semibold text-[#444444] hover:text-[#050505] transition-colors py-1.5 px-2.5 rounded hover:bg-[#F7F7F5]"
              >
                Login
              </Link>
              <Link
                href="/get-quote"
                className="px-4 py-2 bg-[#050505] hover:bg-[#1f1f1f] text-white text-[12px] font-bold tracking-wider uppercase rounded-[3px] transition-all shadow-sm active:scale-[0.98]"
              >
                GET A FREE QUOTE
              </Link>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded text-[#050505] hover:bg-[#F3F4F6] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Backdrop */}
        {mobileMenuOpen && (
          <div
            className="md:hidden fixed inset-0 top-[60px] sm:top-[66px] bg-black/40 backdrop-blur-sm z-40"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed top-[60px] sm:top-[66px] left-0 right-0 max-h-[calc(100vh-66px)] overflow-y-auto bg-white border-b border-[#E5E5E5] px-4 pb-6 pt-3 space-y-1 z-50 shadow-xl animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-wrap gap-3 text-xs text-[#666666] pb-3 border-b border-[#E5E5E5] mb-3">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-gray-500" /> +91 91244 49666
              </span>
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-gray-500" /> hello@zobbra.com
              </span>
            </div>
            {navLinks.map((link) => (
              <div key={link.href}>
                {link.hasDropdown ? (
                  <div className="space-y-1">
                    <div className="px-2 py-1.5 text-xs font-bold text-[#999999] uppercase tracking-wider mt-1">
                      {link.name}
                    </div>
                    <div className="pl-2 space-y-1 border-l-2 border-[#E5E5E5] ml-2 mb-2">
                      {link.children?.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="block py-2 px-3 text-sm font-medium text-[#444444] hover:text-[#050505] hover:bg-[#F7F7F5] rounded transition-colors min-h-[40px] flex items-center"
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Link
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block py-2.5 px-3 text-sm font-medium rounded transition-colors min-h-[44px] flex items-center ${
                      pathname === link.href
                        ? 'text-[#050505] bg-[#F7F7F5] font-bold'
                        : 'text-[#333333] hover:text-[#050505] hover:bg-[#F7F7F5]'
                    }`}
                  >
                    {link.name}
                  </Link>
                )}
              </div>
            ))}
            <div className="pt-3 border-t border-[#E5E5E5] space-y-2.5 mt-3">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-2.5 px-3 text-sm font-semibold text-[#333333] hover:text-black hover:bg-[#F7F7F5] rounded border border-[#E5E5E5] transition-colors min-h-[44px] flex items-center justify-center"
              >
                Login
              </Link>
              <Link
                href="/get-quote"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center px-4 py-3 bg-[#050505] text-white text-xs font-bold uppercase tracking-wider rounded-[3px] min-h-[44px] flex items-center justify-center active:scale-[0.98]"
              >
                GET A FREE QUOTE
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
