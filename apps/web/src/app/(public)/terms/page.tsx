'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  ChevronUp,
  FileText,
  Monitor,
  Package,
  CreditCard,
  Truck,
  RefreshCw,
  Copyright,
  User,
  AlertTriangle,
  Shield,
  Edit,
  Scale,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
} from 'lucide-react';

const sections = [
  {
    id: 1,
    icon: FileText,
    title: 'Acceptance of Terms',
    content:
      'By accessing or using the ZOBBRA website and services, you agree to be bound by these Terms and Conditions and our Privacy Policy. If you do not agree, please do not use our website.',
  },
  {
    id: 2,
    icon: Monitor,
    title: 'Use of Our Website',
    content:
      'You agree to use our website for lawful purposes only. You must not use our site in any way that may damage, disable, overburden, or impair the website or interfere with any other party\'s use.',
  },
  {
    id: 3,
    icon: Package,
    title: 'Products and Orders',
    content:
      'We strive to display product colors and details as accurately as possible. However, actual products may vary slightly. We reserve the right to refuse or cancel any order at our discretion.',
  },
  {
    id: 4,
    icon: CreditCard,
    title: 'Pricing and Payment',
    content:
      'All prices are listed in INR and are inclusive of applicable taxes unless otherwise stated. We accept payments through secure third-party gateways. We reserve the right to change prices at any time.',
  },
  {
    id: 5,
    icon: Truck,
    title: 'Shipping and Delivery',
    content:
      'Orders are processed within the estimated time. Delivery times may vary based on location and courier partners. We are not responsible for delays caused by shipping partners or unforeseen events.',
  },
  {
    id: 6,
    icon: RefreshCw,
    title: 'Returns and Refunds',
    content:
      'We accept returns or exchanges only for defective or incorrect products within the specified period. Please visit our Returns & Refunds Policy for more information.',
  },
  {
    id: 7,
    icon: Copyright,
    title: 'Intellectual Property',
    content:
      'All content on this website, including logos, images, text, and designs, are the property of ZOBBRA and protected by copyright and trademark laws.',
  },
  {
    id: 8,
    icon: User,
    title: 'User Responsibilities',
    content:
      'You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account.',
  },
  {
    id: 9,
    icon: AlertTriangle,
    title: 'Limitation of Liability',
    content:
      'ZOBBRA shall not be liable for any indirect, incidental, or consequential damages arising from the use or inability to use our products or website.',
  },
  {
    id: 10,
    icon: Shield,
    title: 'Indemnification',
    content:
      'You agree to indemnify and hold harmless ZOBBRA from any claims, losses, or damages arising out of your use of our website or violation of these terms.',
  },
  {
    id: 11,
    icon: Edit,
    title: 'Changes to Terms',
    content:
      'We may update these Terms and Conditions from time to time. Any changes will be posted on this page with the updated effective date.',
  },
  {
    id: 12,
    icon: Scale,
    title: 'Governing Law',
    content:
      'These Terms shall be governed by and construed in accordance with the laws of India, and any disputes shall be subject to the jurisdiction of courts in Bhubaneswar, Odisha.',
  },
  {
    id: 13,
    icon: Mail,
    title: 'Contact Us',
    content: 'If you have any questions about these Terms and Conditions, please contact us.',
    contactInfo: true,
  },
];

export default function TermsPage() {
  const [openSection, setOpenSection] = useState<number | null>(1);

  return (
    <div className="min-h-screen bg-[#F8F9FC]">
      {/* ── Page Hero ── */}
      <div className="bg-white border-b border-[#E5E7EB] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <nav className="flex items-center gap-2 text-xs text-[#9CA3AF] mb-4">
                <Link href="/" className="hover:text-[#3B6FEB] transition-colors">Home</Link>
                <span>›</span>
                <span className="text-[#3B6FEB] font-medium">Terms and Conditions</span>
              </nav>
              <h1 className="text-4xl font-heading font-black text-[#111111] mb-3">Terms and Conditions</h1>
              <p className="text-sm text-[#6B7280] max-w-lg leading-relaxed">
                Welcome to ZOBBRA. Please read these Terms and Conditions carefully before using our website or purchasing our products. By accessing our site or placing an order, you agree to be bound by these terms.
              </p>
            </div>
            {/* Hero product images */}
            <div className="hidden lg:flex items-center justify-end">
              <div className="relative w-72 h-44">
                <div className="absolute inset-0 bg-[#EEF2FF] rounded-2xl" />
                <div
                  className="absolute top-2 right-2 w-16 h-16 opacity-20"
                  style={{
                    backgroundImage: 'radial-gradient(#3B6FEB 1px, transparent 1px)',
                    backgroundSize: '8px 8px',
                  }}
                />
                <img
                  src="https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=400&q=80"
                  alt="Custom backpack"
                  className="absolute bottom-0 left-8 w-28 h-36 object-cover rounded-xl shadow-lg"
                />
                <img
                  src="https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=400&q=80"
                  alt="Custom hoodie"
                  className="absolute top-2 right-3 w-28 h-32 object-cover rounded-xl shadow-lg border-2 border-white"
                />
                <img
                  src="https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=300&q=80"
                  alt="Custom cap"
                  className="absolute bottom-0 right-0 w-20 h-20 object-cover rounded-xl shadow-md border-2 border-white"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Two-column content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── Left Sidebar ── */}
          <aside className="w-full lg:w-56 flex-shrink-0 space-y-5">
            {/* ON THIS PAGE */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[#E5E7EB]">
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#3B6FEB]">ON THIS PAGE</p>
              </div>
              <ul className="py-2">
                {sections.map((sec) => (
                  <li key={sec.id}>
                    <button
                      onClick={() => {
                        setOpenSection(sec.id);
                        const el = document.getElementById(`section-${sec.id}`);
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                      className={`w-full flex items-center gap-2.5 px-4 py-2 text-left text-xs transition-colors ${
                        openSection === sec.id
                          ? 'text-[#3B6FEB] font-semibold'
                          : 'text-[#6B7280] hover:text-[#111111]'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                          openSection === sec.id
                            ? 'bg-[#3B6FEB] text-white'
                            : 'bg-[#F3F4F6] text-[#6B7280]'
                        }`}
                      >
                        {sec.id}
                      </span>
                      {sec.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Compliance note card */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 space-y-2">
              <div className="w-10 h-10 bg-[#EEF2FF] rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#3B6FEB]" />
              </div>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                By using our website and services, you agree to comply with these terms and conditions.
              </p>
            </div>
          </aside>

          {/* ── Right: Accordion Sections ── */}
          <div className="flex-1 min-w-0 space-y-3">
            {sections.map((sec) => {
              const Icon = sec.icon;
              const isOpen = openSection === sec.id;
              return (
                <div
                  key={sec.id}
                  id={`section-${sec.id}`}
                  className={`bg-white border rounded-xl overflow-hidden transition-all duration-200 ${
                    isOpen ? 'border-[#C7D2FE] shadow-sm' : 'border-[#E5E7EB] hover:border-[#D1D5DB]'
                  }`}
                >
                  <button
                    onClick={() => setOpenSection(isOpen ? null : sec.id)}
                    className="w-full flex items-center gap-4 px-5 py-4 text-left"
                  >
                    <div className="w-9 h-9 bg-[#EEF2FF] rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-[#3B6FEB]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold text-[#111111]">
                        <span className="text-[#9CA3AF] font-medium mr-2">{sec.id}.</span>
                        {sec.title}
                      </span>
                    </div>
                    <div className="flex-shrink-0">
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-[#3B6FEB]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#9CA3AF]" />
                      )}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-0">
                      <div className="ml-[52px] border-t border-[#F3F4F6] pt-3">
                        <p className="text-sm text-[#6B7280] leading-relaxed">{sec.content}</p>
                        {sec.contactInfo && (
                          <div className="flex flex-wrap gap-5 mt-4 text-xs text-[#6B7280]">
                            <span className="flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5 text-[#3B6FEB]" />
                              hello@zobbra.com
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-[#3B6FEB]" />
                              +91 91244 49666
                            </span>
                            <span className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-[#3B6FEB]" />
                              Bhubaneswar, Odisha - 751012
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Bottom CTA ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14">
        <div className="bg-white border border-[#E5E7EB] rounded-xl px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#EEF2FF] rounded-full flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-[#3B6FEB]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#111111]">Still have questions?</p>
              <p className="text-xs text-[#9CA3AF] mt-0.5">We&apos;re here to help. Reach out to us anytime.</p>
            </div>
          </div>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#111111] hover:bg-[#000] text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
          >
            GET IN TOUCH <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
