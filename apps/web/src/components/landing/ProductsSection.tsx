'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export function ProductsSection() {
  const prefersReducedMotion = useReducedMotion();

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
        {/* Section Header with Scroll Reveal */}
        <motion.div
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center space-y-3 max-w-2xl mx-auto"
        >
          <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#666666] font-heading block">
            OUR PRODUCTS
          </span>
          <h2 className="text-3xl sm:text-4xl font-heading font-black text-[#050505] tracking-[-0.03em] leading-tight">
            Premium Merchandise. Perfectly Customized.
          </h2>
        </motion.div>

        {/* 3 Product Cards Grid with Staggered 3D Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 perspective-[1000px]">
          {products.map((product, idx) => (
            <motion.div
              key={product.id}
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{
                duration: 0.6,
                delay: idx * 0.15,
                ease: [0.16, 1, 0.3, 1],
              }}
              whileHover={
                prefersReducedMotion
                  ? {}
                  : {
                      y: -6,
                      scale: 1.02,
                      transition: { duration: 0.25, ease: 'easeOut' },
                    }
              }
              className="bg-white border border-[#E5E5E5] hover:border-black rounded-xl p-5 sm:p-6 flex flex-col justify-between transition-shadow duration-300 hover:shadow-[0_20px_35px_-10px_rgba(0,0,0,0.12)] group relative"
            >
              {/* Product Image Area: Scaled down by ~50% visual size in a dedicated 3D floating showcase */}
              <div className="relative w-full h-[190px] sm:h-[210px] bg-gradient-to-b from-[#F9FAFB] to-[#F1F3F5] rounded-lg overflow-hidden mb-5 flex items-center justify-center p-4 border border-[#F0F0F0]">
                {/* Subtle soft ambient light glow */}
                <div className="absolute inset-0 bg-radial from-white/70 to-transparent pointer-events-none" />

                {/* 50% Visual Size Product Wrapper with 3D shadow */}
                <div className="relative w-[130px] h-[130px] sm:w-[145px] sm:h-[145px] flex items-center justify-center">
                  <Image
                    src={product.image}
                    alt={`ZOBBRA Custom ${product.title}`}
                    fill
                    className="object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.12)] group-hover:scale-105 group-hover:-translate-y-1.5 transition-all duration-300 ease-out"
                    sizes="(max-width: 768px) 160px, 180px"
                  />
                </div>

                {/* Ground shadow beneath the product */}
                <div className="absolute bottom-4 w-28 h-2.5 bg-black/10 rounded-full blur-[4px] -z-0 group-hover:scale-95 group-hover:opacity-75 transition-all duration-300" />
              </div>

              {/* Product Info */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <h3 className="text-lg font-heading font-black text-[#050505] group-hover:text-black transition-colors">
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
                  <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform duration-200" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Centered Link */}
        <motion.div
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center pt-2"
        >
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-[13px] font-bold uppercase tracking-wider text-[#050505] hover:underline transition-all group"
          >
            <span>VIEW ALL PRODUCTS</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
