'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Award, Tag, Truck, Headphones, ShieldCheck } from 'lucide-react';

export function WhyChooseUs() {
  const prefersReducedMotion = useReducedMotion();

  const features = [
    {
      title: 'Premium Quality',
      desc: 'We use the best materials and printing techniques.',
      icon: Award,
    },
    {
      title: 'Best Price',
      desc: 'Competitive pricing with no compromise on quality.',
      icon: Tag,
    },
    {
      title: 'On-Time Delivery',
      desc: 'We value your time and always deliver on our promise.',
      icon: Truck,
    },
    {
      title: 'Dedicated Support',
      desc: 'Our team is here to support you at every step.',
      icon: Headphones,
    },
    {
      title: 'Secure & Trusted',
      desc: 'Your data and trust are always safe with us.',
      icon: ShieldCheck,
    },
  ];

  return (
    <section className="bg-white py-6 sm:py-7 lg:py-8 border-y border-[#DDDCD5]">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-5">
        {/* Section Header */}
        <motion.div
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-0.5 sm:gap-4"
        >
          <h2 className="text-xl sm:text-2xl lg:text-[26px] font-heading font-black text-[#111111] tracking-[-0.03em] leading-tight">
            We Don&apos;t Just Print, We Represent Your Brand.
          </h2>
          <span className="text-[10px] sm:text-[10.5px] font-extrabold uppercase tracking-[0.16em] text-[#666666] font-heading order-first sm:order-none shrink-0">
            WHY ZOBBRA
          </span>
        </motion.div>

        {/* 5 compact features: icon beside text */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-x-4 gap-y-3 lg:gap-0 lg:divide-x divide-[#E5E5E5]">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.title}
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.45, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className={`flex items-start gap-2.5 group ${
                  idx === 0 ? 'lg:pr-4' : idx === 4 ? 'lg:pl-4' : 'lg:px-4'
                }`}
              >
                <div className="w-8 h-8 shrink-0 rounded-full bg-[#EEF2FF] border border-[#D9E2FF] group-hover:bg-[#3B6FEB] group-hover:text-white flex items-center justify-center text-[#3B6FEB] transition-all duration-300">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-[13px] font-heading font-black text-[#050505] leading-tight">
                    {feat.title}
                  </h3>
                  <p className="text-[11.5px] text-[#666666] leading-snug mt-0.5">{feat.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
