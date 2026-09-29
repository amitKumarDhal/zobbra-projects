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
    <section className="bg-white py-10 sm:py-12 lg:py-14 border-y border-[#DDDCD5]">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        {/* Section Header with Scroll Reveal */}
        <motion.div
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center space-y-1.5 max-w-2xl mx-auto"
        >
          <span className="text-[10px] sm:text-[10.5px] font-extrabold uppercase tracking-[0.16em] text-[#666666] font-heading block">
            WHY ZOBBRA
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-[32px] font-heading font-black text-[#111111] tracking-[-0.03em] leading-tight">
            We Don&apos;t Just Print, We Represent Your Brand.
          </h2>
        </motion.div>

        {/* 5 Feature Columns with Staggered Entrance */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-0 divide-y sm:divide-y-0 lg:divide-x divide-[#E5E5E5]">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.title}
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{
                  duration: 0.55,
                  delay: idx * 0.1,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className={`pt-3.5 sm:pt-1 lg:pt-0 ${
                  idx === 0
                    ? 'lg:pr-4'
                    : idx === 4
                    ? 'lg:pl-4'
                    : 'lg:px-4'
                } space-y-2 text-center group hover:-translate-y-1 transition-transform duration-300`}
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#EEF2FF] border border-[#D9E2FF] group-hover:bg-[#3B6FEB] group-hover:text-white flex items-center justify-center text-[#3B6FEB] mx-auto transition-all duration-300">
                  <Icon className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="text-[13px] font-heading font-black text-[#050505]">
                  {feat.title}
                </h3>
                <p className="text-[11.5px] text-[#666666] leading-snug">
                  {feat.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
