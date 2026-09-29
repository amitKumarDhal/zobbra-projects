'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Printer, Sparkles, Flame } from 'lucide-react';

export function PrintServices() {
  const prefersReducedMotion = useReducedMotion();

  const services = [
    {
      title: 'DTF Printing',
      desc: 'High quality prints with vibrant colours and strong wash durability.',
      icon: Printer,
    },
    {
      title: 'Embroidery',
      desc: 'Premium embroidery for a professional and classy look.',
      icon: Sparkles,
    },
    {
      title: 'Sublimation',
      desc: 'Perfect for full colour prints on polyester products.',
      icon: Flame,
    },
  ];

  return (
    <section className="bg-[#F7F6F2] py-8 sm:py-10 lg:py-12">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Large Black Container with Scroll Reveal */}
        <motion.div
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 30, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="bg-[#111111] text-white rounded-[1.5rem] p-6 sm:p-8 lg:p-10 shadow-[0_20px_45px_-15px_rgba(17,17,17,0.38)] border border-[#2B2B2B] relative overflow-hidden"
        >
          {/* Subtle background ambient gradient */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/[0.02] rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="text-center space-y-1 mb-6 sm:mb-8">
            <span className="text-[10px] sm:text-[10.5px] font-extrabold uppercase tracking-[0.18em] text-[#8EA8FF] font-heading block">
              OUR PRINT SERVICES
            </span>
            <h2 className="text-xl sm:text-2xl lg:text-[28px] font-heading font-black text-white tracking-tight">
              Quality Printing. Lasting Impression.
            </h2>
          </div>

          {/* 3 Services Columns with Vertical Dividers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-[#222222]">
            {services.map((srv, idx) => {
              const Icon = srv.icon;
              return (
                <div
                  key={srv.title}
                  className={`pt-4 md:pt-0 ${
                    idx === 0
                      ? 'md:pr-6'
                      : idx === 1
                      ? 'md:px-6'
                      : 'md:pl-6'
                  } space-y-2 text-center md:text-left group`}
                >
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#1C2B5A] border border-[#344B99] group-hover:border-[#8EA8FF] group-hover:bg-[#263A7A] flex items-center justify-center text-[#D9E2FF] mx-auto md:mx-0 transition-all duration-300">
                    <Icon className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <h3 className="text-[15px] sm:text-base font-heading font-bold text-white tracking-tight">
                    {srv.title}
                  </h3>
                  <p className="text-[12px] text-[#A1A1AA] leading-snug">
                    {srv.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
