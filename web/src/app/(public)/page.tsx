'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, ShieldCheck, Truck, Sparkles, MessageCircle, Layers, Printer, Award } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

export default function HomePage() {
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);

  const trustLogos = ['OLA', 'PhonePe', 'DECATHLON', "BYJU'S", 'Mahindra', 'zomato', 'CRED', 'zepto'];

  const products = [
    {
      name: 'Customized Polo T-Shirt',
      category: 'T-Shirts & Apparel',
      price: '₹249',
      moq: '20 Pcs',
      image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=600&q=80',
      slug: 'polo-t-shirt',
    },
    {
      name: 'Promotional Cotton Cap',
      category: 'Caps & Headwear',
      price: '₹99',
      moq: '50 Pcs',
      image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=600&q=80',
      slug: 'promotional-cotton-cap',
    },
    {
      name: 'Executive Laptop Backpack',
      category: 'Bags & Backpacks',
      price: '₹599',
      moq: '20 Pcs',
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80',
      slug: 'executive-laptop-backpack',
    },
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-white via-slate-50 to-slate-100 pt-12 pb-20 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-center lg:text-left">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold rounded-full uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Custom Merchandise Printing in Odisha
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-none">
              Custom T-Shirts & <span className="text-blue-600 underline decoration-blue-300">Corporate Merchandise</span> Printing
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
              Premium Customized T-Shirts, Polo T-Shirts, Caps, Bags & Promotional Merchandise for Businesses, Schools, Colleges, Startups & Events.
            </p>
            <div className="flex flex-wrap gap-4 pt-2 justify-center lg:justify-start">
              <Button variant="primary" size="lg" onClick={() => setIsQuoteOpen(true)} className="gap-2">
                GET A FREE QUOTE <ArrowRight className="w-4 h-4" />
              </Button>
              <Link href="/products">
                <Button variant="outline" size="lg">
                  EXPLORE PRODUCTS
                </Button>
              </Link>
            </div>
            <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs font-bold text-slate-500">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Bulk Orders Starting from 20 Pcs</span>
              <span className="flex items-center gap-1.5"><Truck className="w-4 h-4 text-blue-500" /> Free Delivery Across Odisha</span>
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-indigo-500" /> PAN India Shipping</span>
            </div>
          </div>

          <div className="relative flex justify-center">
            <div className="relative w-full max-w-md bg-white p-4 rounded-3xl shadow-2xl border border-slate-200">
              <img
                src="https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80"
                alt="ZOBBRA Merchandise Setup"
                className="rounded-2xl w-full object-cover h-80"
              />
              <div className="absolute -bottom-6 -left-6 bg-slate-900 text-white p-4 rounded-2xl shadow-xl flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center font-black text-xl">Z</div>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase">Trusted By 500+ Brands</p>
                  <p className="text-sm font-bold">5,000+ Orders Delivered</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Logos Bar */}
      <section className="max-w-7xl mx-auto px-4 text-center">
        <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-6">
          TRUSTED BY 500+ BUSINESSES, SCHOOLS & ORGANIZATIONS ACROSS ODISHA & INDIA
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14 opacity-75 grayscale hover:grayscale-0 transition-all">
          {trustLogos.map((logo, idx) => (
            <span key={idx} className="text-xl font-black tracking-tighter text-slate-800">
              {logo}
            </span>
          ))}
        </div>
      </section>

      {/* 4-Step Process Section */}
      <section id="process" className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">HOW IT WORKS</span>
          <h2 className="text-3xl font-black text-slate-900">Simple Ordering Process</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { step: '1', title: 'Share Your Logo', desc: 'Send your logo, artwork or design idea through quote form or WhatsApp.' },
            { step: '2', title: 'Free Design Support', desc: 'Our design team creates a professional digital mockup before production.' },
            { step: '3', title: 'Approve Your Design', desc: 'Review your artwork and approve it before printing begins.' },
            { step: '4', title: 'Printing & Delivery', desc: 'We print, quality check and deliver anywhere in Odisha & India.' },
          ].map((item) => (
            <div key={item.step} className="bg-white p-6 rounded-2xl border border-slate-200 custom-shadow text-center relative">
              <div className="w-10 h-10 bg-slate-900 text-white font-bold rounded-full flex items-center justify-center mx-auto mb-4">
                {item.step}
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-2">{item.title}</h3>
              <p className="text-slate-600 text-xs leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Products Grid */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">OUR PRODUCTS</span>
            <h2 className="text-3xl font-black text-slate-900">Premium Customized Merchandise</h2>
          </div>
          <Link href="/products" className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1">
            VIEW ALL PRODUCTS <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {products.map((item) => (
            <div key={item.slug} className="bg-white rounded-2xl border border-slate-200 overflow-hidden custom-shadow card-hover flex flex-col justify-between">
              <div>
                <img src={item.image} alt={item.name} className="w-full h-64 object-cover" />
                <div className="p-6 space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">{item.category}</span>
                  <h3 className="text-xl font-bold text-slate-900">{item.name}</h3>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-slate-500 text-sm">Starting From <strong className="text-slate-900 text-lg font-black">{item.price}</strong></span>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">MOQ: {item.moq}</span>
                  </div>
                </div>
              </div>
              <div className="p-6 pt-0">
                <Link href={`/products/${item.slug}`}>
                  <Button variant="primary" className="w-full">
                    VIEW COLLECTION
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Printing Services Cards */}
      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">OUR PRINTING SERVICES</span>
            <h2 className="text-3xl font-black text-white mt-1">Professional Printing Techniques in Bhubaneswar</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 space-y-3">
              <Printer className="w-8 h-8 text-blue-400" />
              <h3 className="font-bold text-lg text-white">DTF Printing</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Vibrant, ultra-durable prints for corporate branding and complex multi-color artwork with crisp detail.
              </p>
            </div>
            <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 space-y-3">
              <Layers className="w-8 h-8 text-emerald-400" />
              <h3 className="font-bold text-lg text-white">3D Embroidery</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Premium computerised logo embroidery for polo t-shirts, jackets, caps, and uniforms.
              </p>
            </div>
            <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 space-y-3">
              <Award className="w-8 h-8 text-amber-400" />
              <h3 className="font-bold text-lg text-white">Sublimation Printing</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                All-over fade-resistant sublimation perfect for sports jerseys, polyester wear, and ceramic mugs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Instant Quote Modal */}
      <Modal isOpen={isQuoteOpen} onClose={() => setIsQuoteOpen(false)} title="Get Custom Quotation">
        <div className="text-center py-4 space-y-4">
          <p className="text-slate-600 text-sm">Fill details below to get an instant bulk price quote from ZOBBRA Team.</p>
          <Link href="/products/polo-t-shirt">
            <Button variant="secondary" className="w-full">
              Explore Polo T-Shirt & Calculate Bulk Price
            </Button>
          </Link>
        </div>
      </Modal>
    </div>
  );
}
