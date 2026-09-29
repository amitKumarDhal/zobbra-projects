'use client';

import React from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Send, ArrowRight } from 'lucide-react';

export function CTASection() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="bg-[#F7F6F2] py-8 sm:py-10 lg:py-12">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Full-width Black CTA Box with Scroll Reveal */}
        <motion.div
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="bg-[#3B6FEB] text-white rounded-[1.5rem] p-5 sm:p-7 lg:p-9 shadow-[0_20px_45px_-15px_rgba(59,111,235,0.4)] flex flex-col md:flex-row items-center justify-between gap-6 border border-[#5B84F1] relative overflow-hidden"
        >
          {/* Subtle top ambient sheen */}
          <div className="absolute top-0 left-1/4 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

          {/* Left: Icon & Text */}
          <div className="flex items-center gap-4 sm:gap-5 text-center md:text-left">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white text-[#3B6FEB] flex items-center justify-center shrink-0 shadow-md">
              <Send className="w-5 h-5 -rotate-12 translate-x-0.5" />
            </div>

            <div className="space-y-0.5">
              <h2 className="text-xl sm:text-2xl lg:text-[26px] font-heading font-black text-white tracking-tight leading-tight">
                Ready to bring your brand to life?
              </h2>
              <p className="text-[13px] sm:text-[14px] text-[#D9E2FF] font-normal">
                Let&apos;s create something amazing together.
              </p>
            </div>
          </div>

          {/* Right: White Button */}
          <div className="shrink-0 w-full sm:w-auto text-center">
            <Link
              href="/get-quote"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 sm:px-6 sm:py-3 bg-white hover:bg-[#EEF2FF] text-[#111111] text-[11.5px] font-extrabold tracking-wider uppercase rounded-full transition-all shadow-md hover:shadow-xl active:scale-[0.98] group w-full sm:w-auto min-h-[38px] sm:min-h-[40px]"
            >
              <span>GET A FREE QUOTE</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
