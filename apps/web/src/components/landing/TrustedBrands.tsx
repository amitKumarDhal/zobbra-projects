'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export function TrustedBrands() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="bg-white py-10 sm:py-12 border-b border-[#E5E5E5]" id="clients">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Centered Divider Heading */}
        <motion.div
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-20px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex items-center justify-center gap-4 mb-8"
        >
          <div className="h-[1px] bg-[#E5E5E5] w-12 sm:w-20 md:w-32" />
          <span className="text-[11px] sm:text-[12px] font-black uppercase tracking-[0.2em] text-[#777777] text-center font-heading">
            TRUSTED BY 500+ BUSINESSES
          </span>
          <div className="h-[1px] bg-[#E5E5E5] w-12 sm:w-20 md:w-32" />
        </motion.div>

        {/* 8 Grayscale Brand Logos with subtle fade-in */}
        <motion.div
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-20px' }}
          transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
          className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-6 sm:gap-8 items-center justify-items-center opacity-75 hover:opacity-100 transition-opacity"
        >
          {/* 1. OLA */}
          <div className="flex items-center gap-1.5 text-gray-800 font-bold tracking-tight hover:text-black hover:scale-105 transition-all">
            <span className="w-4 h-4 rounded-full border-2 border-gray-800 flex items-center justify-center text-[9px] font-black">
              ●
            </span>
            <span className="font-heading font-black text-lg tracking-wide">OLA</span>
          </div>

          {/* 2. PhonePe */}
          <div className="flex items-center gap-1.5 text-gray-800 font-bold hover:text-black hover:scale-105 transition-all">
            <span className="w-5 h-5 rounded-full bg-gray-800 text-white flex items-center justify-center text-[10px] font-black">
              पे
            </span>
            <span className="font-heading font-black text-base tracking-tight">PhonePe</span>
          </div>

          {/* 3. DECATHLON */}
          <div className="text-gray-800 font-black text-base tracking-wider font-heading hover:text-black hover:scale-105 transition-all">
            DECATHLON
          </div>

          {/* 4. BYJU'S */}
          <div className="flex items-center gap-1 text-gray-800 font-black text-base font-heading hover:text-black hover:scale-105 transition-all">
            <span className="bg-gray-800 text-white px-1.5 py-0.5 rounded-[2px] text-xs font-bold">
              B
            </span>
            <span>BYJU&apos;S</span>
          </div>

          {/* 5. Mahindra */}
          <div className="flex items-center gap-1 text-gray-800 font-bold text-sm tracking-wide hover:text-black hover:scale-105 transition-all">
            <span className="text-xs">▲</span>
            <span className="font-heading font-black text-base">Mahindra</span>
          </div>

          {/* 6. zomato */}
          <div className="text-gray-800 font-black italic text-lg tracking-tight font-heading hover:text-black hover:scale-105 transition-all">
            zomato
          </div>

          {/* 7. CRED */}
          <div className="flex items-center gap-1 text-gray-800 font-black tracking-widest text-sm border-b-2 border-gray-800 pb-0.5 hover:text-black hover:scale-105 transition-all">
            CRED
          </div>

          {/* 8. zepto */}
          <div className="text-gray-800 font-black text-lg tracking-tight font-heading hover:text-black hover:scale-105 transition-all">
            zepto
          </div>
        </motion.div>
      </div>
    </section>
  );
}
