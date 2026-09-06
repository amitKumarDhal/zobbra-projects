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
    <section className="bg-[#F7F6F2] py-16 sm:py-24 border-b border-[#DDDCD5]" id="products">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header with Scroll Reveal */}
        <motion.div
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-left space-y-3 max-w-2xl mr-auto"
        >
          <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#666666] font-heading block">
            THE COLLECTION
          </span>
          <h2 className="text-3xl sm:text-4xl font-heading font-black text-[#111111] tracking-[-0.03em] leading-tight">
            Premium Merchandise. Perfectly Customized.
          </h2>
        </motion.div>

        {/* 3 Product Cards Grid with Staggered 3D Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 perspective-[1000px]">
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
              className="group relative rounded-[18px] p-[1.5px] overflow-hidden hover:shadow-[0_20px_35px_-10px_rgba(17,17,17,0.14)] transition-shadow duration-300"
            >
              {/* Animated Border Layer */}
              <div className="absolute inset-[-100%] w-[300%] h-[300%] bg-[conic-gradient(from_0deg,transparent_70%,#3B6FEB_100%)] animate-[spin_4s_linear_infinite] motion-reduce:animate-none motion-reduce:bg-[#3B6FEB] motion-reduce:opacity-30 opacity-100 z-0" />
              
              {/* Inner Card Layer */}
              <div className="relative bg-white rounded-[16.5px] p-3 sm:p-4 flex flex-col justify-between h-full z-10 border border-transparent">
                {/* Product Image Area: Scaled down by ~50% visual size in a dedicated 3D floating showcase */}
                <div className="relative w-full h-[180px] sm:h-[190px] bg-[#F2F1EC] rounded-xl overflow-hidden mb-4 flex items-center justify-center p-3 border border-[#E9E7DF]">
                  {/* Subtle soft ambient light glow */}
                  <div className="absolute inset-0 bg-radial from-white/70 to-transparent pointer-events-none" />

                  {/* 50% Visual Size Product Wrapper with 3D shadow */}
                  <div className="relative w-[110px] h-[110px] sm:w-[130px] sm:h-[130px] flex items-center justify-center">
                    <Image
                      src={product.image}
                      alt={`ZOBBRA Custom ${product.title}`}
                      fill
                      className="object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.12)] group-hover:scale-105 group-hover:-translate-y-1.5 transition-all duration-300 ease-out"
                      sizes="(max-width: 768px) 130px, 150px"
                    />
                  </div>

                  {/* Ground shadow beneath the product */}
                  <div className="absolute bottom-3 w-24 h-2 bg-black/10 rounded-full blur-[4px] -z-0 group-hover:scale-95 group-hover:opacity-75 transition-all duration-300" />
                </div>

                {/* Product Info */}
                <div className="space-y-2.5">
                  <div className="space-y-1">
                    <h3 className="text-base font-heading font-black text-[#050505] group-hover:text-black transition-colors">
                      {product.title}
                    </h3>
                    <p className="text-[12px] text-[#666666] leading-relaxed">
                      {product.desc}
                    </p>
                  </div>

                  <div className="text-[13px] font-bold text-[#111111] font-mono pb-1">
                    {product.price}
                  </div>

                  {/* View Collection Button */}
                  <Link
                    href={product.href}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-[#111111] hover:bg-[#3B6FEB] text-white text-[11px] font-bold tracking-wider uppercase rounded-full transition-all shadow-sm active:scale-[0.98] group/btn"
                  >
                    <span>VIEW COLLECTION</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform duration-200" />
                  </Link>
                </div>
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
