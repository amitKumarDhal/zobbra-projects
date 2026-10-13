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
    <section className="bg-[#F7F6F2] py-5 sm:py-6 lg:py-7">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="bg-[#111111] text-white rounded-2xl px-5 py-5 sm:px-7 lg:px-8 lg:py-5 border border-[#2B2B2B] flex flex-col lg:flex-row lg:items-center gap-5 lg:gap-8"
        >
          {/* Heading */}
          <div className="lg:w-[250px] shrink-0 text-center lg:text-left">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#8EA8FF] font-heading block mb-1">
              OUR PRINT SERVICES
            </span>
            <h2 className="text-lg sm:text-xl font-heading font-black text-white tracking-tight leading-tight">
              Quality Printing. Lasting Impression.
            </h2>
          </div>

          {/* Services inline: icon beside text */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-0 lg:border-l lg:border-[#2B2B2B] md:divide-x divide-[#2B2B2B]">
            {services.map((srv, idx) => {
              const Icon = srv.icon;
              return (
                <div
                  key={srv.title}
                  className={`flex items-start gap-3 group ${
                    idx === 0 ? 'md:pr-5 lg:pl-8' : 'md:px-5'
                  }`}
                >
                  <div className="w-9 h-9 shrink-0 rounded-lg bg-[#1C2B5A] border border-[#344B99] group-hover:border-[#8EA8FF] group-hover:bg-[#263A7A] flex items-center justify-center text-[#D9E2FF] transition-all duration-300">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[14px] font-heading font-bold text-white tracking-tight leading-tight">
                      {srv.title}
                    </h3>
                    <p className="text-[12px] text-[#A1A1AA] leading-snug mt-0.5">{srv.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
