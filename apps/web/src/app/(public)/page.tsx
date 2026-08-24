'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Search,
  ShoppingBag,
  Package,
  HelpCircle,
  Truck,
  RefreshCw,
  CreditCard,
  User,
  Star,
  Shield,
  Headphones,
  Zap,
  Tag,
  CheckCircle,
  MessageCircle,
  Mail,
  Award,
  Layers,
} from 'lucide-react';

/* ─── FAQ DATA ─────────────────────────────────────────────────────────────── */
const faqCategories = [
  { id: 'all', label: 'All Questions', icon: HelpCircle, count: 12 },
  { id: 'orders', label: 'Orders', icon: ShoppingBag, count: 3 },
  { id: 'products', label: 'Products', icon: Package, count: 3 },
  { id: 'shipping', label: 'Shipping & Delivery', icon: Truck, count: 2 },
  { id: 'returns', label: 'Returns & Refunds', icon: RefreshCw, count: 1 },
  { id: 'payment', label: 'Payment', icon: CreditCard, count: 2 },
  { id: 'account', label: 'Account', icon: User, count: 1 },
];

const faqs = [
  {
    id: 1,
    category: 'orders',
    icon: ShoppingBag,
    question: 'How can I request a quote?',
    answer:
      'Click "GET A QUOTE" on any page, fill in your product requirements — type, quantity, color, and branding specs — and submit. Our team will review your request and respond within 24 hours with a customized quotation.',
  },
  {
    id: 2,
    category: 'payment',
    icon: CreditCard,
    question: 'How does ZOBBRA pricing work?',
    answer:
      'Pricing is based on product type, quantity, customization complexity, and delivery timeline. Bulk orders receive better per-unit pricing. You will receive a detailed quote before committing to any payment.',
  },
  {
    id: 3,
    category: 'products',
    icon: Package,
    question: 'What products can I customize?',
    answer:
      'We offer custom T-Shirts, Hoodies & Sweatshirts, Caps & Headwear, Bags & Backpacks, Corporate Merchandise, and Promotional Products. All products can be branded with your logo, colors, and custom text.',
  },
  {
    id: 4,
    category: 'orders',
    icon: Layers,
    question: 'What is the minimum order quantity?',
    answer:
      'MOQ varies by product. T-Shirts and Hoodies start at 20 pieces, Caps and Bags at 25 pieces, and Promotional items at 50 pieces. Contact us for smaller quantities — we may accommodate based on requirements.',
  },
  {
    id: 5,
    category: 'shipping',
    icon: Truck,
    question: 'How long does delivery take?',
    answer:
      'Standard delivery takes 7–14 working days after order confirmation and artwork approval. Rush orders may be accommodated. Delivery timelines are confirmed in your quote based on order size and destination.',
  },
  {
    id: 6,
    category: 'orders',
    icon: Tag,
    question: 'Can I track my order?',
    answer:
      'Yes. Once your order is dispatched, you will receive tracking information via email and WhatsApp. You can also log in to your ZOBBRA customer account to view order status in real time.',
  },
  {
    id: 7,
    category: 'products',
    icon: RefreshCw,
    question: 'Can I modify my quote?',
    answer:
      'Yes, quotes can be modified before payment confirmation. Simply contact your assigned ZOBBRA sales executive via WhatsApp or email with the changes, and we will update the quote accordingly.',
  },
  {
    id: 8,
    category: 'payment',
    icon: CreditCard,
    question: 'How does payment work?',
    answer:
      'We accept bank transfer (NEFT/RTGS), UPI, and online payment. A 50% advance is required to begin production, with the remaining 50% due before dispatch. GST invoices are provided for all orders.',
  },
  {
    id: 9,
    category: 'account',
    icon: User,
    question: 'Can I create a customer account?',
    answer:
      'Yes. You can register for a ZOBBRA customer account to track orders, view quotes, access invoices, and manage your order history. Visit our login page to sign up or log in.',
  },
  {
    id: 10,
    category: 'products',
    icon: CheckCircle,
    question: 'What happens after I submit a quote?',
    answer:
      'Our team reviews your requirements within 24 hours. We contact you via WhatsApp or phone to finalize details, then send a formal quotation. After your approval, we proceed with production.',
  },
  {
    id: 11,
    category: 'shipping',
    icon: Star,
    question: 'Do you offer bulk discounts?',
    answer:
      'Yes. Bulk orders receive progressive discounts — the higher the quantity, the better the per-unit price. Ask for bulk pricing in your quote request, and our team will provide tiered pricing options.',
  },
  {
    id: 12,
    category: 'returns',
    icon: Headphones,
    question: 'How can I contact ZOBBRA support?',
    answer:
      'Reach us via WhatsApp at +91 91244 49666, email at hello@zobbra.com, or use the Contact page. Our support team is available Monday to Saturday, 10:00 AM – 7:00 PM IST.',
  },
];

/* ─── PRODUCT CATEGORIES ────────────────────────────────────────────────────── */
const productCategories = [
  {
    name: 'Custom T-Shirts',
    desc: 'Premium quality tees with DTF, screen print & embroidery.',
    icon: '👕',
    href: '/products',
    bg: '#EEF2FF',
    iconColor: '#3B6FEB',
  },
  {
    name: 'Hoodies & Sweatshirts',
    desc: 'Fleece & cotton blend hoodies for teams and events.',
    icon: '🧥',
    href: '/products',
    bg: '#FFF7ED',
    iconColor: '#EA580C',
  },
  {
    name: 'Caps & Headwear',
    desc: 'Embroidered caps, snapbacks and beanies for your brand.',
    icon: '🧢',
    href: '/products',
    bg: '#F0FDF4',
    iconColor: '#16A34A',
  },
  {
    name: 'Bags & Backpacks',
    desc: 'Executive laptop bags, totes, and drawstring backpacks.',
    icon: '🎒',
    href: '/products',
    bg: '#FFF1F2',
    iconColor: '#E11D48',
  },
  {
    name: 'Corporate Merchandise',
    desc: 'Branded gifting solutions for employee onboarding & events.',
    icon: '🏢',
    href: '/products',
    bg: '#F5F3FF',
    iconColor: '#7C3AED',
  },
  {
    name: 'Promotional Products',
    desc: 'Pens, bottles, notebooks & giveaway items for campaigns.',
    icon: '🎁',
    href: '/products',
    bg: '#FFFBEB',
    iconColor: '#D97706',
  },
];

/* ─── HOW IT WORKS ──────────────────────────────────────────────────────────── */
const steps = [
  {
    num: '01',
    title: 'Select Your Product',
    desc: 'Browse our catalog and choose the products you want to customize for your brand.',
  },
  {
    num: '02',
    title: 'Customize Your Requirements',
    desc: 'Choose quantity, color, size, branding placement, and print technique.',
  },
  {
    num: '03',
    title: 'Request a Quote',
    desc: 'Submit your requirements and receive a customized quotation within 24 hours.',
  },
  {
    num: '04',
    title: 'Confirm & Proceed',
    desc: 'Our team contacts you to finalize requirements, approve artwork, and confirm payment.',
  },
];

/* ─── WHY ZOBBRA ─────────────────────────────────────────────────────────────── */
const benefits = [
  {
    icon: Award,
    title: 'Quality Products',
    desc: 'Premium materials and reliable customization with strict quality checks on every order.',
  },
  {
    icon: Layers,
    title: 'Bulk Order Expertise',
    desc: 'Flexible quantities with competitive bulk pricing designed for businesses of every size.',
  },
  {
    icon: Star,
    title: 'Custom Branding',
    desc: 'Make every product represent your brand — from logos to color-matched merchandise.',
  },
  {
    icon: Headphones,
    title: 'Personal Sales Support',
    desc: 'Our team helps you finalize every requirement through direct WhatsApp communication.',
  },
  {
    icon: Zap,
    title: 'Fast & Reliable Delivery',
    desc: 'Professional fulfillment with real-time tracking and pan-India delivery support.',
  },
];

/* ─── MAIN COMPONENT ────────────────────────────────────────────────────────── */
export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [openFaq, setOpenFaq] = useState<number | null>(1);
  const [faqSearch, setFaqSearch] = useState('');
  const [email, setEmail] = useState('');

  const filteredFaqs = faqs.filter((faq) => {
    const matchCat = activeCategory === 'all' || faq.category === activeCategory;
    const matchSearch =
      faqSearch === '' ||
      faq.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
      faq.answer.toLowerCase().includes(faqSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="overflow-x-hidden">
      {/* ═══════════════════════════════════════════════════════════════════════
          HERO SECTION
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-[#F8F9FC] border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Text */}
            <div className="space-y-7">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#EEF2FF] border border-[#C7D2FE] rounded-full text-xs font-semibold text-[#3B6FEB]">
                <Shield className="w-3.5 h-3.5" />
                Premium B2B Custom Merchandise
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[52px] font-heading font-black text-[#111111] leading-[1.1] tracking-tight">
                CUSTOM MERCHANDISE
                <br />
                THAT REPRESENTS
                <br />
                <span className="text-[#3B6FEB]">YOUR BRAND</span>
              </h1>

              <p className="text-base text-[#6B7280] leading-relaxed max-w-lg">
                Premium custom apparel, corporate merchandise, and branded products designed to make your business stand out.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/get-quote"
                  id="hero-get-quote-btn"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#111111] hover:bg-[#000000] text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  GET A FREE QUOTE
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/products"
                  id="hero-explore-btn"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-[#D1D5DB] hover:border-[#111111] text-[#111111] text-sm font-semibold rounded-lg transition-colors"
                >
                  EXPLORE PRODUCTS
                </Link>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-5 pt-2">
                <span className="flex items-center gap-1.5 text-xs text-[#6B7280] font-medium">
                  <CheckCircle className="w-4 h-4 text-[#16A34A]" />
                  Low MOQ (From 20 Pcs)
                </span>
                <span className="flex items-center gap-1.5 text-xs text-[#6B7280] font-medium">
                  <Truck className="w-4 h-4 text-[#3B6FEB]" />
                  PAN India Delivery
                </span>
                <span className="flex items-center gap-1.5 text-xs text-[#6B7280] font-medium">
                  <Shield className="w-4 h-4 text-[#7C3AED]" />
                  GST Compliant
                </span>
              </div>
            </div>

            {/* Right: Product Composition */}
            <div className="relative flex items-center justify-center">
              {/* Pale blue decorative circle */}
              <div className="absolute w-[340px] h-[340px] lg:w-[420px] lg:h-[420px] rounded-full bg-[#EEF2FF]" />

              {/* Dot grid decoration */}
              <div
                className="absolute top-4 right-4 w-28 h-28 opacity-30"
                style={{
                  backgroundImage: 'radial-gradient(#3B6FEB 1px, transparent 1px)',
                  backgroundSize: '10px 10px',
                }}
              />

              {/* Product images composition */}
              <div className="relative z-10 w-[320px] h-[320px] lg:w-[400px] lg:h-[400px]">
                {/* Backpack — center */}
                <img
                  src="https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=85"
                  alt="Custom branded backpack"
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 lg:w-52 lg:h-52 object-cover rounded-2xl shadow-2xl"
                />
                {/* T-shirt — top right */}
                <img
                  src="https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=400&q=85"
                  alt="Custom branded t-shirt"
                  className="absolute top-4 right-0 w-28 h-28 lg:w-36 lg:h-36 object-cover rounded-xl shadow-xl border-2 border-white"
                />
                {/* Cap — bottom left */}
                <img
                  src="https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=400&q=85"
                  alt="Custom branded cap"
                  className="absolute bottom-4 left-0 w-24 h-24 lg:w-32 lg:h-32 object-cover rounded-xl shadow-xl border-2 border-white"
                />

                {/* Floating stat card */}
                <div className="absolute bottom-0 right-0 bg-white border border-[#E5E7EB] rounded-xl px-4 py-3 shadow-lg">
                  <p className="text-[10px] text-[#6B7280] font-medium uppercase tracking-wider">Trusted by</p>
                  <p className="text-lg font-heading font-black text-[#111111]">500+ Brands</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          PRODUCT CATEGORIES
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-white border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Heading */}
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#3B6FEB] mb-3">OUR CATALOG</p>
            <h2 className="text-3xl sm:text-4xl font-heading font-black text-[#111111] tracking-tight mb-4">
              EXPLORE OUR PRODUCTS
            </h2>
            <p className="text-sm text-[#6B7280] leading-relaxed">
              High-quality custom merchandise designed for businesses, teams, events, and brands.
            </p>
          </div>

          {/* Category cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {productCategories.map((cat) => (
              <Link
                key={cat.name}
                href={cat.href}
                id={`category-${cat.name.toLowerCase().replace(/\s+/g, '-')}`}
                className="group bg-white border border-[#E5E7EB] rounded-xl p-6 hover:border-[#D1D5DB] hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ backgroundColor: cat.bg }}
                  >
                    {cat.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading font-bold text-[#111111] text-base mb-1 group-hover:text-[#3B6FEB] transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-[#9CA3AF] leading-relaxed">{cat.desc}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#D1D5DB] group-hover:text-[#3B6FEB] transition-colors flex-shrink-0 mt-1" />
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#111111] hover:text-[#3B6FEB] transition-colors"
            >
              View All Products <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          HOW IT WORKS
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-[#F8F9FC] border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#3B6FEB] mb-3">PROCESS</p>
            <h2 className="text-3xl sm:text-4xl font-heading font-black text-[#111111] tracking-tight">
              HOW ZOBBRA WORKS
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, idx) => (
              <div key={step.num} className="relative">
                {/* Connector line — desktop */}
                {idx < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-7 left-[calc(50%+28px)] right-0 h-px bg-[#E5E7EB] z-0" />
                )}
                <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 text-center space-y-4 relative z-10 hover:border-[#D1D5DB] hover:shadow-sm transition-all">
                  <div className="w-14 h-14 bg-[#111111] text-white font-heading font-black text-lg rounded-xl flex items-center justify-center mx-auto">
                    {step.num}
                  </div>
                  <h3 className="font-heading font-bold text-[#111111] text-sm leading-snug">{step.title}</h3>
                  <p className="text-xs text-[#9CA3AF] leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          WHY CHOOSE ZOBBRA
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-white border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#3B6FEB] mb-3">WHY US</p>
            <h2 className="text-3xl sm:text-4xl font-heading font-black text-[#111111] tracking-tight">
              WHY BRANDS CHOOSE ZOBBRA
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
            {benefits.map((b) => {
              const Icon = b.icon;
              return (
                <div
                  key={b.title}
                  className="bg-[#F8F9FC] border border-[#E5E7EB] rounded-xl p-6 space-y-3 hover:border-[#D1D5DB] hover:bg-white hover:shadow-sm transition-all duration-200"
                >
                  <div className="w-10 h-10 bg-[#EEF2FF] rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-[#3B6FEB]" />
                  </div>
                  <h3 className="font-heading font-bold text-[#111111] text-sm">{b.title}</h3>
                  <p className="text-xs text-[#9CA3AF] leading-relaxed">{b.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          QUOTE / CTA SECTION
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-[#F8F9FC] border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#111111] rounded-2xl px-8 py-14 text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl font-heading font-black text-white tracking-tight leading-tight">
              READY TO CREATE
              <br />
              SOMETHING FOR YOUR BRAND?
            </h2>
            <p className="text-sm text-[#9CA3AF] max-w-lg mx-auto leading-relaxed">
              Tell us what you need and our team will help you create the perfect custom merchandise solution.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href="/get-quote"
                id="cta-get-quote-btn"
                className="inline-flex items-center gap-2 px-7 py-3 bg-white hover:bg-[#F8F9FC] text-[#111111] text-sm font-bold rounded-lg transition-colors"
              >
                GET A FREE QUOTE
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="https://wa.me/919124449666?text=Hi%20Zobra%2C%20I%20want%20to%20inquire%20about%20custom%20merchandise."
                target="_blank"
                rel="noopener noreferrer"
                id="cta-whatsapp-btn"
                className="inline-flex items-center gap-2 px-7 py-3 bg-transparent border border-[#374151] hover:border-[#6B7280] text-white text-sm font-semibold rounded-lg transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-[#25D366]" />
                WhatsApp Us
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          FAQ SECTION — matches screenshot layout exactly
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-white border-b border-[#E5E7EB]" id="faq">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="mb-10">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#3B6FEB] mb-2">HELP CENTER</p>
            <h2 className="text-3xl font-heading font-black text-[#111111] tracking-tight">FAQs</h2>
          </div>

          {/* Two-column layout */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* ── Sidebar ── */}
            <aside className="w-full lg:w-56 flex-shrink-0 space-y-6">
              {/* Categories card */}
              <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-[#E5E7EB]">
                  <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#3B6FEB]">CATEGORIES</p>
                </div>
                <ul className="divide-y divide-[#F3F4F6]">
                  {faqCategories.map((cat) => {
                    const Icon = cat.icon;
                    const isActive = activeCategory === cat.id;
                    return (
                      <li key={cat.id}>
                        <button
                          onClick={() => setActiveCategory(cat.id)}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                            isActive
                              ? 'bg-[#EEF2FF] text-[#111111]'
                              : 'text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#111111]'
                          }`}
                        >
                          <Icon
                            className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#3B6FEB]' : 'text-[#9CA3AF]'}`}
                          />
                          <span className="flex-1 text-xs font-medium">{cat.label}</span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              isActive
                                ? 'bg-[#3B6FEB] text-white'
                                : 'bg-[#F3F4F6] text-[#6B7280]'
                            }`}
                          >
                            {cat.count}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Still have questions card */}
              <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 text-center space-y-3">
                <div className="w-12 h-12 bg-[#EEF2FF] rounded-full flex items-center justify-center mx-auto">
                  <Headphones className="w-5 h-5 text-[#3B6FEB]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#111111]">Still have questions?</p>
                  <p className="text-xs text-[#9CA3AF] mt-1">We&apos;re here to help! Reach out to our support team.</p>
                </div>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center w-full px-4 py-2 bg-[#111111] hover:bg-[#000] text-white text-xs font-bold rounded-lg transition-colors"
                >
                  CONTACT US
                </Link>
              </div>
            </aside>

            {/* ── Main FAQ Area ── */}
            <div className="flex-1 min-w-0 space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                <input
                  type="text"
                  placeholder="Search for questions..."
                  value={faqSearch}
                  onChange={(e) => setFaqSearch(e.target.value)}
                  id="faq-search-input"
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-[#E5E7EB] rounded-lg bg-white focus:outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] text-[#111111] placeholder:text-[#9CA3AF] transition-colors"
                />
              </div>

              {/* Accordion items */}
              {filteredFaqs.length === 0 ? (
                <div className="text-center py-12 text-[#9CA3AF] text-sm">
                  No questions found. Try a different search term.
                </div>
              ) : (
                filteredFaqs.map((faq) => {
                  const Icon = faq.icon;
                  const isOpen = openFaq === faq.id;
                  return (
                    <div
                      key={faq.id}
                      className={`bg-white border rounded-xl overflow-hidden transition-all duration-200 ${
                        isOpen ? 'border-[#C7D2FE] shadow-sm' : 'border-[#E5E7EB] hover:border-[#D1D5DB]'
                      }`}
                    >
                      <button
                        onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                        id={`faq-item-${faq.id}`}
                        className="w-full flex items-center gap-4 px-5 py-4 text-left"
                      >
                        {/* Icon */}
                        <div className="w-9 h-9 bg-[#EEF2FF] rounded-lg flex items-center justify-center flex-shrink-0">
                          <Icon className="w-4 h-4 text-[#3B6FEB]" />
                        </div>
                        {/* Question number + text */}
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-semibold text-[#111111]">
                            <span className="text-[#9CA3AF] font-medium mr-2">{faq.id}.</span>
                            {faq.question}
                          </span>
                        </div>
                        {/* Expand icon */}
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
                          <div className="ml-[52px] text-sm text-[#6B7280] leading-relaxed border-t border-[#F3F4F6] pt-3">
                            {faq.answer}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          NEWSLETTER SECTION — horizontal card matching screenshot
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-10 bg-[#F8F9FC] border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white border border-[#E5E7EB] rounded-xl px-6 py-5 flex flex-col sm:flex-row items-center gap-6">
            {/* Left: Icon + Text */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="w-12 h-12 bg-[#EEF2FF] rounded-xl flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-[#3B6FEB]" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#111111]">Subscribe to our newsletter</p>
                <p className="text-xs text-[#9CA3AF] mt-0.5">Get updates on new products, offers and more.</p>
              </div>
            </div>
            {/* Right: Input + Button */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                id="newsletter-email-input"
                className="flex-1 sm:w-64 px-4 py-2.5 text-sm border border-[#E5E7EB] rounded-lg bg-[#F8F9FC] focus:outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] text-[#111111] placeholder:text-[#9CA3AF] transition-colors"
              />
              <button
                id="newsletter-subscribe-btn"
                onClick={() => { if (email) { setEmail(''); } }}
                className="px-5 py-2.5 bg-[#111111] hover:bg-[#000] text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
              >
                SUBSCRIBE
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
