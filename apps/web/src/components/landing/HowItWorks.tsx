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
    <section className="bg-[#111111] text-white py-6 sm:py-7 lg:py-8 border-b border-[#111111]" id="how-it-works">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Column: Heading & CTA (4 / 12 cols) */}
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="lg:col-span-4 space-y-3 sm:space-y-3.5"
          >
            <span className="text-[10px] sm:text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-[#9CA3AF] font-heading block">
              HOW IT WORKS
            </span>

            <h2 className="text-2xl sm:text-3xl lg:text-[28px] font-heading font-black text-white tracking-[-0.03em] leading-tight">
              Simple Process.<br />
              Amazing Results.
            </h2>

            <p className="text-[13px] text-[#A1A1AA] leading-normal max-w-xs">
              From concept to finished merchandise in 4 straightforward steps with dedicated project managers.
            </p>

            <div className="pt-1">
              <Link
                href="/get-quote"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#3B6FEB] hover:bg-[#5B84F1] text-white text-[11px] font-bold tracking-wider uppercase rounded-full transition-all shadow-sm active:scale-[0.98] min-h-[38px] sm:min-h-[40px] group"
              >
                <span>SEE HOW IT WORKS</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
            </div>
          </motion.div>

          {/* Right Column: 4 Process Steps (8 / 12 cols) */}
          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-3.5 relative">
              {/* Desktop zigzag connector: runs between badges, clear of all text */}
              <svg
                className="hidden lg:block absolute top-[92px] left-[16px] w-[calc(75%+10.5px)] h-6 z-0 pointer-events-none"
                viewBox="0 0 100 24"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <polyline
                  points="0,0 33.33,24 66.67,0 100,24"
                  fill="none"
                  stroke="#4B5563"
                  strokeWidth="1.5"
                  strokeDasharray="5 5"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>

              {steps.map((step, idx) => {
                const up = idx % 2 === 0; // text above badge, badge sits high
                return (
                  <motion.div
                    key={step.num}
                    initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 25 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-30px' }}
                    transition={{ duration: 0.55, delay: idx * 0.12, ease: [0.16, 1, 0.3, 1] }}
                    className="relative z-10 bg-[#1B1B1B] lg:bg-transparent p-3.5 lg:p-0 rounded-xl lg:rounded-none border lg:border-0 border-[#2B2B2B] space-y-2 lg:space-y-0 lg:h-[212px] group"
                  >
                    {/* Circle Badge */}
                    <div
                      className={`w-8 h-8 rounded-full bg-[#3B6FEB] text-white flex items-center justify-center shadow-md group-hover:scale-110 group-hover:bg-[#5B84F1] transition-all duration-300 lg:absolute lg:left-0 ${
                        up ? 'lg:top-[76px]' : 'lg:top-[100px]'
                      }`}
                    >
                      <span className="font-mono text-xs font-black">{step.num}</span>
                    </div>

                    {/* Step Content */}
                    <div
                      className={`space-y-1 lg:absolute lg:left-0 lg:right-0 lg:space-y-1 ${
                        up
                          ? 'lg:top-0 lg:h-[72px] lg:flex lg:flex-col lg:justify-end'
                          : 'lg:top-[140px]'
                      }`}
                    >
                      <h3 className="text-[13px] font-heading font-black text-white tracking-tight">
                        {step.title}
                      </h3>
                      <p className="text-[11.5px] text-[#A1A1AA] leading-snug">{step.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
