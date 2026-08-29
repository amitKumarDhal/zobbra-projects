'use client';

import React from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Lightbulb, PenTool, CheckSquare, PackageCheck } from 'lucide-react';

export function HowItWorks() {
  const prefersReducedMotion = useReducedMotion();

  const steps = [
    {
      num: '1',
      title: 'Share Your Idea',
      desc: 'Tell us what you need and share your logo or requirements.',
      icon: Lightbulb,
    },
    {
      num: '2',
      title: 'We Design & Suggest',
      desc: 'Our team creates designs and suggests the best options.',
      icon: PenTool,
    },
    {
      num: '3',
      title: 'You Approve',
      desc: 'Review, suggest changes (if any) and approve the final design.',
      icon: CheckSquare,
    },
    {
      num: '4',
      title: 'We Produce & Deliver',
      desc: 'We print, pack and deliver to your doorstep.',
      icon: PackageCheck,
    },
  ];

  return (
    <section className="bg-[#F7F7F5] py-14 sm:py-18 lg:py-20 border-b border-[#E5E5E5]" id="how-it-works">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Left Column: Heading & CTA (4 / 12 cols) */}
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="lg:col-span-4 space-y-5"
          >
            <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#666666] font-heading block">
              HOW IT WORKS
            </span>

            <h2 className="text-3xl sm:text-4xl font-heading font-black text-[#050505] tracking-[-0.03em] leading-tight">
              Simple Process.<br />
              Amazing Results.
            </h2>

            <p className="text-[14px] text-[#666666] leading-relaxed max-w-sm">
              From concept to finished merchandise in 4 straightforward steps with dedicated project managers.
            </p>

            <div className="pt-2">
              <Link
                href="/get-quote"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#050505] hover:bg-[#222222] text-white text-[12px] font-bold tracking-wider uppercase rounded-[3px] transition-all shadow-sm active:scale-[0.98] min-h-[44px] group"
              >
                <span>SEE HOW IT WORKS</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
            </div>
          </motion.div>

          {/* Right Column: 4 Process Steps (8 / 12 cols) */}
          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4 relative">
              {/* Desktop Connecting Dotted Line */}
              <div className="hidden lg:block absolute top-6 left-8 right-8 h-[2px] border-t-2 border-dashed border-[#D1D5DB] z-0" />

              {steps.map((step, idx) => (
                <motion.div
                  key={step.num}
                  initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-30px' }}
                  transition={{
                    duration: 0.55,
                    delay: idx * 0.12,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="relative z-10 bg-white sm:bg-transparent p-5 sm:p-2 rounded-xl sm:rounded-none border sm:border-0 border-[#E5E5E5] space-y-3 group hover:-translate-y-1 transition-transform duration-300"
                >
                  {/* Circle Icon Badge */}
                  <div className="w-12 h-12 rounded-full bg-[#050505] text-white flex items-center justify-center font-heading font-black text-sm shadow-md group-hover:scale-110 group-hover:bg-[#222222] transition-all duration-300">
                    <span className="font-mono text-sm">{step.num}</span>
                  </div>

                  {/* Step Content */}
                  <div className="space-y-1.5">
                    <h3 className="text-[14px] font-heading font-black text-[#050505] tracking-tight">
                      {step.title}
                    </h3>
                    <p className="text-[12px] text-[#666666] leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
