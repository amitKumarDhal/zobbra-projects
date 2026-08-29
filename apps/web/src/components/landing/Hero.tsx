'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Award, Clock, Truck } from 'lucide-react';

export function Hero() {
  return (
    <section className="bg-white pt-10 sm:pt-14 pb-12 sm:pb-16 border-b border-[#E5E5E5] overflow-hidden">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left Column: Content (5.5 / 12 cols) */}
          <div className="lg:col-span-6 space-y-6">
            {/* Eyebrow */}
            <div className="inline-block">
              <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#555555] bg-[#F7F7F5] border border-[#E5E5E5] px-3 py-1 rounded-[3px]">
                CUSTOM MERCHANDISE
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-heading font-black text-[#050505] tracking-[-0.03em] leading-[1.08]">
              Wear Your Brand.<br />
              Be Remembered.
            </h1>

            {/* Subtitle Description */}
            <p className="text-[15px] sm:text-[16px] text-[#555555] leading-relaxed max-w-lg font-normal">
              Premium quality custom merchandise for businesses, events, schools and organizations.
            </p>

            {/* 3 Mini Benefit Columns */}
            <div className="grid grid-cols-3 gap-3 pt-2 pb-2 border-y border-[#F0F0F0]">
              {/* Benefit 1 */}
              <div className="space-y-1.5">
                <div className="w-8 h-8 rounded-full bg-[#F7F7F5] border border-[#E5E5E5] flex items-center justify-center text-[#111111]">
                  <Award className="w-4 h-4" />
                </div>
                <h4 className="text-[11px] font-black uppercase tracking-wider text-[#111111] font-heading leading-tight">
                  PREMIUM QUALITY
                </h4>
                <p className="text-[11px] text-[#666666] leading-tight">
                  Top grade materials for lasting impact
                </p>
              </div>

              {/* Benefit 2 */}
              <div className="space-y-1.5 border-l border-[#F0F0F0] pl-3">
                <div className="w-8 h-8 rounded-full bg-[#F7F7F5] border border-[#E5E5E5] flex items-center justify-center text-[#111111]">
                  <Clock className="w-4 h-4" />
                </div>
                <h4 className="text-[11px] font-black uppercase tracking-wider text-[#111111] font-heading leading-tight">
                  FAST TURNAROUND
                </h4>
                <p className="text-[11px] text-[#666666] leading-tight">
                  Production in 5-7 working days
                </p>
              </div>

              {/* Benefit 3 */}
              <div className="space-y-1.5 border-l border-[#F0F0F0] pl-3">
                <div className="w-8 h-8 rounded-full bg-[#F7F7F5] border border-[#E5E5E5] flex items-center justify-center text-[#111111]">
                  <Truck className="w-4 h-4" />
                </div>
                <h4 className="text-[11px] font-black uppercase tracking-wider text-[#111111] font-heading leading-tight">
                  PAN INDIA DELIVERY
                </h4>
                <p className="text-[11px] text-[#666666] leading-tight">
                  Delivering across India
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link
                href="/get-quote"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#050505] hover:bg-[#222222] text-white text-[13px] font-bold tracking-wider uppercase rounded-[3px] transition-all shadow-sm active:scale-[0.98] group"
              >
                <span>GET A FREE QUOTE</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/products"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white hover:bg-[#F7F7F5] text-[#111111] text-[13px] font-bold tracking-wider uppercase rounded-[3px] border border-[#D1D5DB] transition-all active:scale-[0.98] group"
              >
                <span>EXPLORE PRODUCTS</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Right Column: Premium Showcase Composition (6 / 12 cols) */}
          <div className="lg:col-span-6 relative">
            {/* Soft backdrop container */}
            <div className="relative rounded-2xl bg-[#F7F7F5] border border-[#EAEAE8] p-4 sm:p-6 overflow-hidden shadow-sm">
              {/* Handwritten Callout Top Right */}
              <div className="absolute top-4 right-5 z-10 text-right hidden sm:block">
                <span className="font-serif italic text-[13px] font-bold text-[#333333] tracking-wide block">
                  Your Brand,
                </span>
                <span className="font-serif italic text-[13px] font-bold text-[#333333] tracking-wide block">
                  Our Passion! ♡
                </span>
              </div>

              {/* Product Showcase Image */}
              <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-white shadow-inner flex items-center justify-center">
                <Image
                  src="/images/landing/hero-showcase.jpg"
                  alt="ZOBBRA Premium Custom Merchandise Collection - Polo, Backpack, Cap, Bottle, Mug"
                  fill
                  priority
                  className="object-contain p-2 hover:scale-[1.02] transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                />
              </div>

              {/* Annotation Bottom Center */}
              <div className="pt-3 flex items-center justify-between text-xs text-[#666666]">
                <span className="text-[11px] font-medium tracking-wide">
                  Your Brand. Your Identity.
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#999999]">
                  100% CUSTOMIZED MERCH
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
