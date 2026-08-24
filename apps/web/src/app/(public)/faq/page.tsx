'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  ShoppingBag,
  Package,
  HelpCircle,
  Truck,
  RefreshCw,
  CreditCard,
  User,
  Star,
  Headphones,
  Tag,
  CheckCircle,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

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

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [openFaq, setOpenFaq] = useState<number | null>(1);
  const [faqSearch, setFaqSearch] = useState('');

  const filteredFaqs = faqs.filter((faq) => {
    const matchCat = activeCategory === 'all' || faq.category === activeCategory;
    const matchSearch =
      faqSearch === '' ||
      faq.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
      faq.answer.toLowerCase().includes(faqSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen bg-[#F8F9FC]">
      {/* Page hero */}
      <div className="bg-white border-b border-[#E5E7EB] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <nav className="flex items-center gap-2 text-xs text-[#9CA3AF] mb-4">
                <Link href="/" className="hover:text-[#3B6FEB] transition-colors">Home</Link>
                <span>›</span>
                <span className="text-[#3B6FEB] font-medium">FAQs</span>
              </nav>
              <h1 className="text-4xl font-heading font-black text-[#111111] mb-3">FAQs</h1>
              <p className="text-sm text-[#6B7280] max-w-lg leading-relaxed">
                Find quick answers to the most common questions about our products, orders, shipping, returns and more.
                Can&apos;t find what you&apos;re looking for?{' '}
                <Link href="/contact" className="text-[#3B6FEB] hover:underline">
                  Contact us.
                </Link>
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
                  className="absolute top-4 right-4 w-28 h-32 object-cover rounded-xl shadow-lg border-2 border-white"
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

      {/* FAQ content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full lg:w-56 flex-shrink-0 space-y-6">
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
                          isActive ? 'bg-[#EEF2FF] text-[#111111]' : 'text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#111111]'
                        }`}
                      >
                        <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#3B6FEB]' : 'text-[#9CA3AF]'}`} />
                        <span className="flex-1 text-xs font-medium">{cat.label}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isActive ? 'bg-[#3B6FEB] text-white' : 'bg-[#F3F4F6] text-[#6B7280]'}`}>
                          {cat.count}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

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

          {/* Main */}
          <div className="flex-1 min-w-0 space-y-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Search for questions..."
                value={faqSearch}
                onChange={(e) => setFaqSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-[#E5E7EB] rounded-lg bg-white focus:outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] text-[#111111] placeholder:text-[#9CA3AF] transition-colors"
              />
            </div>

            {filteredFaqs.length === 0 ? (
              <div className="text-center py-12 text-[#9CA3AF] text-sm">No questions found.</div>
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
                      className="w-full flex items-center gap-4 px-5 py-4 text-left"
                    >
                      <div className="w-9 h-9 bg-[#EEF2FF] rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-[#3B6FEB]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold text-[#111111]">
                          <span className="text-[#9CA3AF] font-medium mr-2">{faq.id}.</span>
                          {faq.question}
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
    </div>
  );
}
