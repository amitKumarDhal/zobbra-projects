import React from 'react';
import Link from 'next/link';
import { MapPin, Mail, Phone, Clock } from 'lucide-react';
import { ZobbraLogo } from './ZobbraLogo';

const SOCIAL_LINKS = [
  {
    label: 'Instagram',
    href: 'https://instagram.com/zobra',
    path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z',
  },
  {
    label: 'Facebook',
    href: 'https://facebook.com/zobra',
    path: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
  },
  {
    label: 'LinkedIn',
    href: 'https://linkedin.com/company/zobra',
    path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
  },
  {
    label: 'YouTube',
    href: 'https://youtube.com/@zobra',
    path: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
  },
];

const LINK_COLUMNS = [
  {
    title: 'Products',
    links: [
      { label: 'T-Shirts', href: '/products?category=t-shirts' },
      { label: 'Caps', href: '/products?category=caps' },
      { label: 'Welcome Kits', href: '/get-quote' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Our Process', href: '/#how-it-works' },
      { label: 'Our Clients', href: '/#clients' },
      { label: 'Contact Us', href: '/contact' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'FAQs', href: '/faq' },
      { label: 'Shipping & Delivery', href: '/terms#section-5' },
      { label: 'Returns & Refunds', href: '/terms#section-6' },
      { label: 'Terms & Conditions', href: '/terms' },
      { label: 'Privacy Policy', href: '/privacy' },
    ],
  },
];

// Global CSS gives every <a> a 44px min-height for touch targets. Footer links set their own
// sizing (min-h-0) so flex/block anchors don't stretch and misalign their rows.
const footerLinkClass = 'min-h-0 hover:text-white transition-colors';
const headingClass =
  'text-white font-bold text-[11px] uppercase tracking-[0.12em] mb-4 font-heading';

export function PublicFooter() {
  return (
    <footer className="bg-[#111111] text-[#9CA3AF] pt-12 pb-6 border-t border-black">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-12 gap-x-6 gap-y-10 pb-10 border-b border-[#2B2B2B]">
          {/* Brand & Socials */}
          <div className="col-span-2 lg:col-span-3 space-y-4">
            <ZobbraLogo variant="white" href="/" width={125} height={42} showTagline={true} />

            <p className="text-[13px] text-[#9CA3AF] leading-relaxed max-w-[260px]">
              Custom merchandise that represents your brand with pride.
            </p>

            <div className="flex items-center gap-2.5">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="w-9 h-9 min-h-0 shrink-0 rounded-full border border-[#2B2B2B] flex items-center justify-center text-gray-400 hover:text-white hover:border-gray-500 hover:bg-white/5 transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d={social.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {LINK_COLUMNS.map((column) => (
            <div key={column.title} className="lg:col-span-2">
              <h4 className={headingClass}>{column.title}</h4>
              <ul className="space-y-2.5 text-[13px]">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className={footerLinkClass}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact Us */}
          <div className="col-span-2 sm:col-span-1 lg:col-span-3">
            <h4 className={headingClass}>Contact Us</h4>
            <ul className="space-y-3 text-[13px]">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-gray-400 mt-px shrink-0" />
                <span>Bhubaneswar, Odisha - 751012</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-gray-400 mt-px shrink-0" />
                <a href="mailto:sales@zobbra.com" className={`${footerLinkClass} break-all`}>
                  sales@zobbra.com
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-gray-400 mt-px shrink-0" />
                <a href="tel:+919124449665" className={footerLinkClass}>
                  +91 91244 49665
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-gray-400 mt-px shrink-0" />
                <span>Mon - Sat (10:00 AM - 7:00 PM)</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="pt-5 text-center text-[12px] text-[#666666]">
          <p>© {new Date().getFullYear()} Zobbra. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}
