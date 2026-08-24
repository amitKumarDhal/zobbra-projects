import React from 'react';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="space-y-3">
        <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">PRIVACY POLICY</span>
        <h1 className="text-4xl font-black text-slate-900">Your Privacy. Our Responsibility.</h1>
        <p className="text-slate-600 text-sm max-w-2xl">
          At Zobra, we value your trust. This Privacy Policy explains how we collect, use, protect, and share your information when you visit our website or use our services.
        </p>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 custom-shadow space-y-6 text-sm text-slate-700 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900">1. Information We Collect</h2>
          <p>We collect information you provide directly to us such as your name, email address, phone number, company name, GST number, shipping address, and artwork files when you request a quote or place an order.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900">2. How We Use Your Information</h2>
          <p>We use the information we collect to respond to inquiries, process orders, deliver products, send quote updates, and improve our B2B merchandise services.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900">3. Data Security</h2>
          <p>We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, or destruction.</p>
        </section>
      </div>
    </div>
  );
}
