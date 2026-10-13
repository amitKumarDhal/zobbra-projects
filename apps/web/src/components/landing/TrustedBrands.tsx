'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const logos = [
  <React.Fragment key="0">
    <div className="flex items-center gap-1.5 text-gray-800 font-bold tracking-tight hover:text-black hover:scale-105 transition-all">
      <span className="w-4 h-4 rounded-full border-2 border-gray-800 flex items-center justify-center text-[9px] font-black">
        ●
      </span>
      <span className="font-heading font-black text-lg tracking-wide">OLA</span>
    </div>
  </React.Fragment>,
  <React.Fragment key="1">
    <div className="flex items-center gap-1.5 text-gray-800 font-bold hover:text-black hover:scale-105 transition-all">
      <span className="w-5 h-5 rounded-full bg-gray-800 text-white flex items-center justify-center text-[10px] font-black">
        पे
      </span>
      <span className="font-heading font-black text-base tracking-tight">PhonePe</span>
    </div>
  </React.Fragment>,
  <React.Fragment key="2">
    <div className="text-gray-800 font-black text-base tracking-wider font-heading hover:text-black hover:scale-105 transition-all">
      DECATHLON
    </div>
  </React.Fragment>,
  <React.Fragment key="3">
    <div className="flex items-center gap-1 text-gray-800 font-black text-base font-heading hover:text-black hover:scale-105 transition-all">
      <span className="bg-gray-800 text-white px-1.5 py-0.5 rounded-[2px] text-xs font-bold">
        B
      </span>
      <span>BYJU&apos;S</span>
    </div>
  </React.Fragment>,
  <React.Fragment key="4">
    <div className="flex items-center gap-1 text-gray-800 font-bold text-sm tracking-wide hover:text-black hover:scale-105 transition-all">
      <span className="text-xs">▲</span>
      <span className="font-heading font-black text-base">Mahindra</span>
    </div>
  </React.Fragment>,
  <React.Fragment key="5">
    <div className="text-gray-800 font-black italic text-lg tracking-tight font-heading hover:text-black hover:scale-105 transition-all">
      zomato
    </div>
  </React.Fragment>,
  <React.Fragment key="6">
    <div className="flex items-center gap-1 text-gray-800 font-black tracking-widest text-sm border-b-2 border-gray-800 pb-0.5 hover:text-black hover:scale-105 transition-all">
      CRED
    </div>
  </React.Fragment>,
  <React.Fragment key="7">
    <div className="text-gray-800 font-black text-lg tracking-tight font-heading hover:text-black hover:scale-105 transition-all">
      zepto
    </div>
  </React.Fragment>,
];

export function TrustedBrands() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="bg-white py-5 sm:py-7 border-b border-[#DDDCD5]" id="clients">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Centered Divider Heading */}
        <motion.div
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-20px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex items-center justify-center gap-3 sm:gap-4 mb-4 sm:mb-5"
        >
          <div className="h-[1px] bg-[#E5E5E5] w-8 sm:w-16 md:w-28" />
          <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.18em] text-[#777777] text-center font-heading">
            TRUSTED BY BUSINESSES THAT MOVE FAST
          </span>
          <div className="h-[1px] bg-[#E5E5E5] w-8 sm:w-16 md:w-28" />
        </motion.div>

        {/* Brand logos scrolling right to left */}
        <div className="relative overflow-hidden grayscale opacity-60 hover:opacity-100 transition-opacity [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
          <motion.div
            className="flex w-max items-center"
            animate={prefersReducedMotion ? undefined : { x: ['0%', '-50%'] }}
            transition={{ duration: 28, ease: 'linear', repeat: Infinity }}
          >
            {[0, 1].map((copy) => (
              <div
                key={copy}
                className="flex shrink-0 items-center gap-12 sm:gap-16 pr-12 sm:pr-16"
                aria-hidden={copy === 1}
              >
                {logos.map((logo, idx) => (
                  <div key={idx} className="shrink-0">
                    {logo}
                  </div>
                ))}
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
