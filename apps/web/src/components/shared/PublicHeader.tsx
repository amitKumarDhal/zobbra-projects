'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown, MapPin, Mail, Phone } from 'lucide-react';

export function PublicHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);

  const navLinks = [
    { name: 'Home', href: '/' },
    {
      name: 'Products',
      href: '/products',
      hasDropdown: true,
      children: [
        { name: 'Custom T-Shirts', href: '/products?category=custom-t-shirts' },
        { name: 'Hoodies & Sweatshirts', href: '/products?category=hoodies' },
        { name: 'Caps & Headwear', href: '/products?category=headwear' },
        { name: 'Bags & Backpacks', href: '/products?category=bags' },
        { name: 'Corporate Merchandise', href: '/products?category=corporate' },
        { name: 'Promotional Products', href: '/products?category=promotional' },
      ],
    },
    { name: 'About Us', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 bg-white">
        {/* Top Black Info Bar */}
        <div className="bg-[#050505] text-white text-xs py-2.5 px-4 hidden md:block">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Left: Contact info */}
            <div className="flex items-center gap-6 text-[#D1D5DB]">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-[#9CA3AF]" />
                Bhubaneswar, Odisha
              </span>
              <span className="flex items-center gap-1.5">
                <Mail className="w-3 h-3 text-[#9CA3AF]" />
                hello@zobbra.com
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-[#9CA3AF]" />
                +91 91244 49666
              </span>
            </div>

            {/* Right: Social icons */}
            <div className="flex items-center gap-3">
              <span className="text-[#9CA3AF] mr-1">Follow us:</span>
              {/* Instagram */}
              <a
                href="https://instagram.com/zobra"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-6 h-6 rounded-full border border-[#374151] flex items-center justify-center hover:border-white transition-colors"
              >
                <svg className="w-3 h-3 text-[#D1D5DB]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              {/* Facebook */}
              <a
                href="https://facebook.com/zobra"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-6 h-6 rounded-full border border-[#374151] flex items-center justify-center hover:border-white transition-colors"
              >
                <svg className="w-3 h-3 text-[#D1D5DB]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              {/* LinkedIn */}
              <a
                href="https://linkedin.com/company/zobra"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="w-6 h-6 rounded-full border border-[#374151] flex items-center justify-center hover:border-white transition-colors"
              >
                <svg className="w-3 h-3 text-[#D1D5DB]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
              {/* YouTube */}
              <a
                href="https://youtube.com/@zobra"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="w-6 h-6 rounded-full border border-[#374151] flex items-center justify-center hover:border-white transition-colors"
              >
                <svg className="w-3 h-3 text-[#D1D5DB]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Main Navigation Bar */}
        <div className="border-b border-[#E5E7EB] bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[68px] flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
              <div className="w-9 h-9 bg-[#111111] text-white font-heading font-black text-xl flex items-center justify-center rounded border border-[#111111] group-hover:bg-[#000] transition-colors">
                Z
              </div>
              <div className="leading-none">
                <span className="text-[15px] font-heading font-black tracking-tight text-[#111111] block">
                  ZOBBRA
                </span>
                <span className="text-[9px] uppercase font-bold tracking-[0.12em] text-[#9CA3AF] block mt-0.5">
                  WEAR YOUR BRAND
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#374151]">
              {navLinks.map((link) =>
                link.hasDropdown ? (
                  <div key={link.href} className="relative">
                    <button
                      onClick={() => setProductsOpen(!productsOpen)}
                      onBlur={() => setTimeout(() => setProductsOpen(false), 200)}
                      aria-expanded={productsOpen}
                      className={`flex items-center gap-1 transition-colors hover:text-[#111111] focus:outline-none ${
                        pathname.startsWith('/products') ? 'text-[#111111] font-semibold' : ''
                      }`}
                    >
                      {link.name}
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 motion-reduce:transition-none ${productsOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {productsOpen && (
                      <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-[#E5E7EB] rounded-lg shadow-lg z-50 py-1 origin-top animate-in fade-in zoom-in-95 duration-200 motion-reduce:transition-none">
                        {link.children?.map((child) => (
                          <Link
                            key={child.href + child.name}
                            href={child.href}
                            onClick={() => setProductsOpen(false)}
                            className="block px-4 py-2.5 text-sm text-[#374151] hover:bg-[#F8F9FC] hover:text-[#111111] transition-colors"
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
                    className={`transition-colors hover:text-[#111111] ${
                      pathname === link.href ? 'text-[#111111] font-semibold' : ''
                    }`}
                  >
                    {link.name}
                  </Link>
                )
              )}
            </nav>

            {/* CTA Button */}
            <div className="hidden md:flex items-center gap-3">
              <Link href="/login" className="text-sm text-[#6B7280] hover:text-[#111111] transition-colors font-medium">
                Login
              </Link>
              <Link
                href="/get-quote"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#111111] hover:bg-[#000000] text-white text-sm font-semibold rounded-lg transition-colors"
              >
                GET A QUOTE
              </Link>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-[#111111] hover:bg-[#F3F4F6] transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-[#E5E7EB] px-4 pb-5 pt-3 space-y-1">
            {/* Mobile contact bar */}
            <div className="flex flex-wrap gap-3 text-xs text-[#6B7280] pb-3 border-b border-[#E5E7EB] mb-3">
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" /> +91 91244 49666
              </span>
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3" /> hello@zobbra.com
              </span>
            </div>
            {navLinks.map((link) => (
              <div key={link.href}>
                {link.hasDropdown ? (
                  <div className="space-y-1">
                    <div className="px-2 py-1.5 text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mt-2">
                      {link.name}
                    </div>
                    <div className="pl-2 space-y-1 border-l-2 border-[#E5E7EB] ml-2 mb-2">
                      {link.children?.map((child) => (
                        <Link
                          key={child.href + child.name}
                          href={child.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`block py-2 px-3 text-sm font-medium rounded-lg transition-colors ${
                            pathname === child.href
                              ? 'text-[#111111] bg-[#F3F4F6] font-semibold'
                              : 'text-[#374151] hover:text-[#111111] hover:bg-[#F3F4F6]'
                          }`}
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
                    className={`block py-2.5 px-2 text-sm font-medium rounded-lg transition-colors ${
                      pathname === link.href
                        ? 'text-[#111111] bg-[#F3F4F6] font-semibold'
                        : 'text-[#374151] hover:text-[#111111] hover:bg-[#F3F4F6]'
                    }`}
                  >
                    {link.name}
                  </Link>
                )}
              </div>
            ))}
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 px-2 text-sm font-medium text-[#374151] hover:text-[#111111] hover:bg-[#F3F4F6] rounded-lg transition-colors"
            >
              Login
            </Link>
            <Link
              href="/get-quote"
              onClick={() => setMobileMenuOpen(false)}
              className="block mt-3 text-center px-5 py-2.5 bg-[#111111] text-white text-sm font-semibold rounded-lg"
            >
              GET A QUOTE
            </Link>
          </div>
        )}
      </header>
    </>
  );
}
