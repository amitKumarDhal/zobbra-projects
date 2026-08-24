import React from 'react';
import Link from 'next/link';

export default function TermsPage() {
  const terms = [
    {
      id: 1,
      title: 'Introduction',
      desc: 'Welcome to ZOBBRA Prints. By accessing our website or placing an order, you agree to comply with and be bound by these Terms & Conditions.',
    },
    {
      id: 2,
      title: 'Our Services',
      desc: 'We provide customized printing on T-Shirts, Caps, Bags, Mugs, Bottles and other merchandise for businesses, events, schools, colleges and organizations.',
    },
    {
      id: 3,
      title: 'Order Process',
      desc: 'Select your product, share your requirements, receive a quote, approve the design, make payment and we will start the production.',
    },
    {
      id: 4,
      title: 'Minimum Order Quantity',
      desc: 'The minimum order quantity for customized products starts from 20 to 50 pieces depending on product category.',
    },
    {
      id: 5,
      title: 'Pricing',
      desc: 'All prices are subject to change without prior notice. Final pricing depends on quantity, fabric, print type, design and delivery location.',
    },
    {
      id: 6,
      title: 'Payment Terms',
      desc: 'Full or advance payment is required to confirm the order. We accept UPI, Bank Transfer, and Online Payments.',
    },
    {
      id: 7,
      title: 'Design Approval',
      desc: 'Customers must review and approve the design digital mockup before printing. Once approved, Zobra Prints is not responsible for text or logo errors.',
    },
    {
      id: 8,
      title: 'Production & Delivery',
      desc: 'Standard production time is 5-7 working days from date of design approval. Delivery time varies by location.',
    },
    {
      id: 9,
      title: 'Cancellation Policy',
      desc: 'Orders cannot be cancelled once production has started. Cancellations are accepted only before production begins.',
    },
    {
      id: 10,
      title: 'Returns & Refunds',
      desc: 'Since all products are customized, we do not accept returns or offer refunds unless there is a physical manufacturing defect.',
    },
    {
      id: 11,
      title: 'Product Variation',
      desc: 'Slight variations in color, size, placement and fabric GSM may occur due to printing and manufacturing processes.',
    },
    {
      id: 12,
      title: 'Intellectual Property',
      desc: 'You are responsible for ensuring that the logo, design or content you provide does not infringe any third-party rights.',
    },
    {
      id: 13,
      title: 'Limitation of Liability',
      desc: 'Zobra Prints is not liable for any indirect or consequential damages arising from the use of our products.',
    },
    {
      id: 14,
      title: 'Privacy Policy',
      desc: 'We respect your privacy. Your personal information will only be used to process orders and provide better service.',
    },
    {
      id: 15,
      title: 'Governing Law',
      desc: 'These Terms & Conditions are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Bhubaneswar, Odisha.',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="space-y-3">
        <nav className="text-xs font-semibold text-slate-500 flex items-center gap-2">
          <Link href="/" className="hover:underline">Home</Link>
          <span>/</span>
          <span className="text-slate-900 font-bold">Terms & Conditions</span>
        </nav>
        <h1 className="text-4xl font-black text-slate-900">Terms & Conditions</h1>
        <p className="text-slate-600 text-sm max-w-2xl">
          Please read these terms and conditions carefully before using our website or placing an order with Zobra Prints.
        </p>
        <p className="text-xs font-bold text-slate-400">Last Updated: May 20, 2025</p>
      </div>

      {/* Grid matching Image 2 mockup */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {terms.map((item) => (
          <div key={item.id} className="bg-white p-6 rounded-2xl border border-slate-200 custom-shadow flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
              {item.id}
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 text-base">{item.title}</h3>
              <p className="text-slate-600 text-xs leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
