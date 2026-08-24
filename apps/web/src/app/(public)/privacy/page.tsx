'use client';

import React from 'react';
import Link from 'next/link';
import {
  FileText,
  Database,
  Settings,
  Globe,
  Share2,
  Lock,
  UserCheck,
  ExternalLink,
  Baby,
  Edit,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  Shield,
} from 'lucide-react';

const sections = [
  {
    id: 1,
    icon: FileText,
    title: 'Introduction',
    content: (
      <p>
        This Privacy Policy describes how ZOBBRA (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) collects, uses, and protects the personal
        information you provide when you visit our website, place an order, or interact with our services.
      </p>
    ),
  },
  {
    id: 2,
    icon: Database,
    title: 'Information We Collect',
    content: (
      <div className="space-y-2">
        <p>We may collect the following types of information:</p>
        <ul className="list-disc pl-5 space-y-1 text-sm text-[#6B7280]">
          <li>Personal Information: Name, email address, phone number, billing/shipping address, and payment details.</li>
          <li>Order Information: Products purchased, order history, and preferences.</li>
          <li>Usage Information: IP address, browser type, device information, pages visited, and time spent on our site.</li>
          <li>Communication Information: Any information you provide when contacting our customer support.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 3,
    icon: Settings,
    title: 'How We Use Your Information',
    content: (
      <div className="space-y-2">
        <p>We use your information to:</p>
        <ul className="list-disc pl-5 space-y-1 text-sm text-[#6B7280]">
          <li>Process and deliver your orders.</li>
          <li>Communicate with you about your orders and inquiries.</li>
          <li>Improve our website, products, and customer experience.</li>
          <li>Send promotional offers and updates (you can opt out anytime).</li>
          <li>Comply with legal obligations.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 4,
    icon: Globe,
    title: 'Cookies and Tracking Technologies',
    content: (
      <p>
        We use cookies and similar technologies to enhance your browsing experience, analyze site traffic,
        and personalize content. You can control cookies through your browser settings.
      </p>
    ),
  },
  {
    id: 5,
    icon: Share2,
    title: 'Data Sharing and Disclosure',
    content: (
      <div className="space-y-2">
        <p>We do not sell, trade, or rent your personal information. We may share your data with:</p>
        <ul className="list-disc pl-5 space-y-1 text-sm text-[#6B7280]">
          <li>Trusted service providers who assist in our operations (payment gateways, shipping partners, etc.)</li>
          <li>Legal authorities if required by law or to protect our rights and safety.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 6,
    icon: Lock,
    title: 'Data Security',
    content: (
      <p>
        We implement industry-standard security measures to protect your personal information from
        unauthorized access, alteration, or disclosure.
      </p>
    ),
  },
  {
    id: 7,
    icon: UserCheck,
    title: 'Your Rights and Choices',
    content: (
      <div className="space-y-2">
        <p>You have the right to:</p>
        <ul className="list-disc pl-5 space-y-1 text-sm text-[#6B7280]">
          <li>Access, update, or delete your personal information.</li>
          <li>Opt out of marketing communications at any time.</li>
          <li>Disable cookies through your browser settings.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 8,
    icon: ExternalLink,
    title: 'Third-Party Links',
    content: (
      <p>
        Our website may contain links to third-party websites. We are not responsible for their privacy practices.
        Please review their privacy policies before sharing any information.
      </p>
    ),
  },
  {
    id: 9,
    icon: Baby,
    title: "Children's Privacy",
    content: (
      <p>
        Our website and services are not intended for children under 13. We do not knowingly collect personal
        information from children.
      </p>
    ),
  },
  {
    id: 10,
    icon: Edit,
    title: 'Changes to This Policy',
    content: (
      <p>
        We may update this Privacy Policy from time to time. Any changes will be posted on this page with
        the updated effective date.
      </p>
    ),
  },
  {
    id: 11,
    icon: Mail,
    title: 'Contact Us',
    content: (
      <div className="space-y-3">
        <p>If you have any questions about this Privacy Policy, please contact us:</p>
        <div className="flex flex-wrap gap-5 text-xs text-[#6B7280]">
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
      </div>
    ),
  },
];

export default function PrivacyPage() {
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
                <span className="text-[#3B6FEB] font-medium">Privacy Policy</span>
              </nav>
              <h1 className="text-4xl font-heading font-black text-[#111111] mb-3">Privacy Policy</h1>
              <p className="text-sm text-[#6B7280] max-w-lg leading-relaxed">
                At ZOBBRA, we value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data.
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
                  src="https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=400&q=80"
                  alt="Custom t-shirt"
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
            <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[#E5E7EB]">
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#3B6FEB]">ON THIS PAGE</p>
              </div>
              <ul className="py-2">
                {sections.map((sec) => (
                  <li key={sec.id}>
                    <a
                      href={`#section-${sec.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById(`section-${sec.id}`)?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#6B7280] hover:text-[#111111] transition-colors"
                    >
                      <span className="w-5 h-5 rounded-full bg-[#F3F4F6] text-[#6B7280] flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                        {sec.id}
                      </span>
                      {sec.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Privacy note card */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 space-y-2">
              <div className="w-10 h-10 bg-[#EEF2FF] rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#3B6FEB]" />
              </div>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                Your privacy is important to us. We never sell your personal information.
              </p>
            </div>
          </aside>

          {/* ── Right: All sections expanded (not accordion) ── */}
          <div className="flex-1 min-w-0 space-y-8">
            {sections.map((sec) => {
              const Icon = sec.icon;
              return (
                <div key={sec.id} id={`section-${sec.id}`} className="scroll-mt-8">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-[#EEF2FF] rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-[#3B6FEB]" />
                    </div>
                    <h2 className="text-base font-heading font-bold text-[#111111]">
                      {sec.id}. {sec.title}
                    </h2>
                  </div>
                  <div className="pl-11 text-sm text-[#6B7280] leading-relaxed">
                    {sec.content}
                  </div>
                  {sec.id < sections.length && (
                    <div className="mt-6 border-b border-[#F3F4F6]" />
                  )}
                </div>
              );
            })}

            {/* Last updated */}
            <p className="text-xs text-[#9CA3AF] pt-2">Last updated: 20 May, 2024</p>
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
              <p className="text-sm font-bold text-[#111111]">Have questions about our privacy practices?</p>
              <p className="text-xs text-[#9CA3AF] mt-0.5">We&apos;re here to help. Reach out to us anytime.</p>
            </div>
          </div>
          <Link
            href="/get-quote"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#111111] hover:bg-[#000] text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
          >
            GET A FREE QUOTE <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
