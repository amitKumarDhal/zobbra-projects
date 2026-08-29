'use client';

import React from 'react';
import Link from 'next/link';
import { Send, ArrowRight } from 'lucide-react';

export function CTASection() {
  return (
    <section className="bg-white py-14 sm:py-18">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Full-width Black CTA Box */}
        <div className="bg-[#050505] text-white rounded-2xl p-8 sm:p-12 lg:p-14 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 border border-[#1F2937]">
          {/* Left: Icon & Text */}
          <div className="flex items-center gap-5 text-center md:text-left">
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-white text-[#050505] flex items-center justify-center shrink-0 shadow-md">
              <Send className="w-6 h-6 -rotate-12 translate-x-0.5" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl lg:text-[32px] font-heading font-black text-white tracking-tight leading-tight">
                Ready to bring your brand to life?
              </h2>
              <p className="text-sm sm:text-[15px] text-[#9CA3AF] font-normal">
                Let&apos;s create something amazing together.
              </p>
            </div>
          </div>

          {/* Right: White Button */}
          <div className="shrink-0 w-full sm:w-auto text-center">
            <Link
              href="/get-quote"
              className="inline-flex items-center justify-center gap-2.5 px-7 py-4 bg-white hover:bg-[#F0F0F0] text-[#050505] text-[13px] font-extrabold uppercase tracking-wider rounded-[3px] transition-all shadow-md active:scale-[0.98] group w-full sm:w-auto"
            >
              <span>GET A FREE QUOTE</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
