'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

export function ProductsSection() {
  const products = [
    {
      id: 't-shirts',
      title: 'T-Shirts',
      desc: 'Comfortable, stylish, built for your brand.',
      price: 'From ₹249',
      image: '/images/landing/tshirt.jpg',
      href: '/products?category=t-shirts',
    },
    {
      id: 'caps',
      title: 'Caps',
      desc: 'Stay visible. Stay stylish.',
      price: 'From ₹199',
      image: '/images/landing/cap.jpg',
      href: '/products?category=caps',
    },
    {
      id: 'bags',
      title: 'Bags',
      desc: 'Durable. Practical. Perfect for everyday.',
      price: 'From ₹1299',
      image: '/images/landing/backpack.jpg',
      href: '/products?category=bags',
    },
  ];

  return (
    <section className="bg-white py-16 sm:py-20 border-b border-[#E5E5E5]" id="products">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#666666] font-heading block">
            OUR PRODUCTS
          </span>
          <h2 className="text-3xl sm:text-4xl font-heading font-black text-[#050505] tracking-[-0.03em] leading-tight">
            Premium Merchandise. Perfectly Customized.
          </h2>
        </div>

        {/* 3 Product Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white border border-[#E5E5E5] rounded-xl p-5 sm:p-6 flex flex-col justify-between hover:border-black transition-all hover:shadow-md group"
            >
              {/* Product Image Area */}
              <div className="relative w-full aspect-square bg-[#F7F7F5] rounded-lg overflow-hidden mb-5 flex items-center justify-center p-4">
                <Image
                  src={product.image}
                  alt={`ZOBBRA Custom ${product.title}`}
                  fill
                  className="object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>

              {/* Product Info */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <h3 className="text-lg font-heading font-black text-[#050505]">
                    {product.title}
                  </h3>
                  <p className="text-[13px] text-[#666666] leading-relaxed">
                    {product.desc}
                  </p>
                </div>

                <div className="text-[14px] font-bold text-[#111111] font-mono">
                  {product.price}
                </div>

                {/* View Collection Button */}
                <Link
                  href={product.href}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 bg-[#050505] hover:bg-[#222222] text-white text-[12px] font-bold tracking-wider uppercase rounded-[3px] transition-all shadow-sm active:scale-[0.98] group/btn"
                >
                  <span>VIEW COLLECTION</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Centered Link */}
        <div className="text-center pt-2">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-[13px] font-bold uppercase tracking-wider text-[#050505] hover:underline transition-all group"
          >
            <span>VIEW ALL PRODUCTS</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
