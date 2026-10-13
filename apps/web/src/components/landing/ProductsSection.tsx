'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { API_URL } from '@/lib/api';

interface ProductItem {
  id: string;
  title: string;
  desc: string;
  price: string;
  image: string;
  href: string;
}

const INITIAL_PRODUCTS: ProductItem[] = [
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
];

export function ProductsSection() {
  const prefersReducedMotion = useReducedMotion();
  const [products, setProducts] = useState<ProductItem[]>(INITIAL_PRODUCTS);

  // Dynamically fetch live starting prices from the database / catalog API
  useEffect(() => {
    let isMounted = true;
    async function fetchDynamicPrices() {
      try {
        const res = await fetch(`${API_URL}/products`);
        if (!res.ok) return;
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && isMounted) {
          setProducts((prev) =>
            prev.map((item) => {
              // Lowest live base price in the card's category (e.g. all caps).
              const prices = json.data
                .filter((p: any) => p.category?.slug === item.id && Number(p.basePrice) > 0)
                .map((p: any) => Number(p.basePrice));
              return prices.length > 0 ? { ...item, price: `From ₹${Math.min(...prices)}` } : item;
            })
          );
        }
      } catch {
        // Graceful fallback to real catalog defaults
        console.debug('Using default catalog pricing for products section');
      }
    }

    fetchDynamicPrices();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="bg-[#F7F6F2] py-6 sm:py-7 lg:py-8 border-b border-[#DDDCD5]" id="products">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="text-left mb-3 sm:mb-4 max-w-xl mr-auto"
        >
          <span className="text-[11px] sm:text-[12px] font-bold uppercase tracking-[0.12em] text-[#666666] font-heading block mb-1 sm:mb-1.5">
            THE COLLECTION
          </span>
          <h2 className="text-[22px] sm:text-[26px] lg:text-[28px] font-heading font-black text-[#111111] tracking-[-0.03em] leading-[1.12]">
            Premium Merchandise. Perfectly Customized.
          </h2>
        </motion.div>

        {/* Product Cards Grid */}
        <div
          className={`grid grid-cols-1 ${products.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-3 sm:gap-4`}
        >
          {products.map((product, idx) => (
            <motion.div
              key={product.id}
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{
                duration: 0.5,
                delay: idx * 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
              whileHover={
                prefersReducedMotion
                  ? {}
                  : {
                      y: -3,
                      transition: { duration: 0.2, ease: 'easeOut' },
                    }
              }
              className="group bg-white rounded-2xl border border-[#E5E7EB] hover:border-[#D1D5DB] p-3 flex flex-col justify-between h-full transition-all duration-300 hover:shadow-[0_10px_24px_-6px_rgba(17,17,17,0.08)]"
            >
              {/* Product Image Area */}
              <div className="relative w-full h-[120px] sm:h-[125px] bg-[#F2F1EC] rounded-xl overflow-hidden mb-2.5 flex items-center justify-center p-2 border border-[#E9E7DF]">
                {/* Subtle soft ambient light glow */}
                <div className="absolute inset-0 bg-radial from-white/70 to-transparent pointer-events-none" />

                {/* Visual Size Product Wrapper with 3D shadow */}
                <div className="relative w-[85px] h-[85px] sm:w-[90px] sm:h-[90px] flex items-center justify-center">
                  <Image
                    src={product.image}
                    alt={`ZOBBRA Custom ${product.title}`}
                    fill
                    className="object-contain filter drop-shadow-[0_6px_14px_rgba(0,0,0,0.12)] group-hover:scale-105 group-hover:-translate-y-1 transition-all duration-300 ease-out"
                    sizes="(max-width: 768px) 115px, 130px"
                  />
                </div>

                {/* Ground shadow beneath the product */}
                <div className="absolute bottom-2.5 w-20 h-1.5 bg-black/10 rounded-full blur-[3px] -z-0 group-hover:scale-95 group-hover:opacity-75 transition-all duration-300" />
              </div>

              {/* Product Info */}
              <div className="flex flex-col flex-1">
                <h3 className="text-[16px] sm:text-[17px] font-heading font-bold text-[#111111] group-hover:text-black transition-colors leading-tight">
                  {product.title}
                </h3>
                <p className="text-[13px] sm:text-[13.5px] text-[#666666] leading-[1.4] line-clamp-2 mt-0.5">
                  {product.desc}
                </p>

                {/* Price */}
                <div className="flex items-baseline gap-1 mt-1.5 mb-2.5">
                  <span className="text-[12px] sm:text-[12.5px] font-medium text-[#666666]">
                    From
                  </span>
                  <span className="text-[13px] sm:text-[14px] font-bold text-[#111111] tracking-tight">
                    {product.price.replace('From ', '')}
                  </span>
                </div>

                {/* View Collection Button */}
                <Link
                  href={product.href}
                  className="w-full inline-flex items-center justify-center gap-1.5 h-9 px-4 bg-[#111111] hover:bg-[#262626] text-white text-[12px] sm:text-[12.5px] font-bold tracking-wider uppercase rounded-full transition-colors duration-200 shadow-sm active:scale-[0.99] group/btn mt-auto"
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
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="text-center mt-4 sm:mt-5"
        >
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-[12px] sm:text-[12.5px] font-bold uppercase tracking-[0.08em] text-[#111111] hover:text-[#000000] hover:underline underline-offset-4 transition-all group"
          >
            <span>VIEW ALL PRODUCTS</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
