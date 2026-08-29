'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Award, Clock, Truck, Sparkles } from 'lucide-react';

export function Hero() {
  const prefersReducedMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Mouse move 3D tilt calculation (disabled on touch / reduced motion)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !cardRef.current) return;
    if (typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches) return;

    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = (mouseX / width - 0.5) * 2; // -1 to 1
    const yPct = (mouseY / height - 0.5) * 2; // -1 to 1

    setRotateX(-yPct * 6);
    setRotateY(xPct * 6);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <section className="bg-white pt-8 sm:pt-14 pb-12 sm:pb-18 border-b border-[#E5E5E5] overflow-hidden">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center">
          {/* Left Column: Staggered Content (6 / 12 cols) */}
          <div className="lg:col-span-6 space-y-5 sm:space-y-6">
            {/* 1. Eyebrow */}
            <motion.div
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
              className="inline-block"
            >
              <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#444444] bg-[#F7F7F5] border border-[#E5E5E5] px-2.5 sm:px-3 py-1 rounded-[3px]">
                <Sparkles className="w-3 h-3 text-[#333333]" />
                CUSTOM MERCHANDISE
              </span>
            </motion.div>

            {/* 2. Main Headline */}
            <motion.h1
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
              className="text-3xl sm:text-5xl lg:text-[54px] font-heading font-black text-[#050505] tracking-[-0.03em] leading-[1.1] sm:leading-[1.08]"
            >
              Wear Your Brand.<br />
              Be Remembered.
            </motion.h1>

            {/* 3. Subtitle Description */}
            <motion.p
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
              className="text-[14px] sm:text-[16px] text-[#555555] leading-relaxed max-w-lg font-normal"
            >
              Premium quality custom merchandise for businesses, events, schools and organizations.
            </motion.p>

            {/* 4. 3 Mini Benefit Columns */}
            <motion.div
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 pb-2 border-y border-[#F0F0F0]"
            >
              {/* Benefit 1 */}
              <div className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-1.5 group">
                <div className="w-8 h-8 rounded-full bg-[#F7F7F5] border border-[#E5E5E5] flex items-center justify-center text-[#111111] group-hover:bg-black group-hover:text-white transition-colors duration-300 flex-shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-[#111111] font-heading leading-tight">
                    PREMIUM QUALITY
                  </h4>
                  <p className="text-[11px] text-[#666666] leading-tight mt-0.5">
                    Top grade materials for lasting impact
                  </p>
                </div>
              </div>

              {/* Benefit 2 */}
              <div className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-1.5 sm:border-l sm:border-[#F0F0F0] sm:pl-3 group">
                <div className="w-8 h-8 rounded-full bg-[#F7F7F5] border border-[#E5E5E5] flex items-center justify-center text-[#111111] group-hover:bg-black group-hover:text-white transition-colors duration-300 flex-shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-[#111111] font-heading leading-tight">
                    FAST TURNAROUND
                  </h4>
                  <p className="text-[11px] text-[#666666] leading-tight mt-0.5">
                    Production in 5-7 working days
                  </p>
                </div>
              </div>

              {/* Benefit 3 */}
              <div className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-1.5 sm:border-l sm:border-[#F0F0F0] sm:pl-3 group">
                <div className="w-8 h-8 rounded-full bg-[#F7F7F5] border border-[#E5E5E5] flex items-center justify-center text-[#111111] group-hover:bg-black group-hover:text-white transition-colors duration-300 flex-shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-[#111111] font-heading leading-tight">
                    PAN INDIA DELIVERY
                  </h4>
                  <p className="text-[11px] text-[#666666] leading-tight mt-0.5">
                    Delivering across India
                  </p>
                </div>
              </div>
            </motion.div>

            {/* 5. Action Buttons */}
            <motion.div
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5, ease: 'easeOut' }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2"
            >
              <Link
                href="/get-quote"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#050505] hover:bg-[#222222] text-white text-[13px] font-bold tracking-wider uppercase rounded-[3px] transition-all shadow-sm hover:shadow-md active:scale-[0.98] min-h-[44px] group"
              >
                <span>GET A FREE QUOTE</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>

              <Link
                href="/products"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white hover:bg-[#F7F7F5] text-[#111111] text-[13px] font-bold tracking-wider uppercase rounded-[3px] border border-[#D1D5DB] hover:border-black transition-all active:scale-[0.98] min-h-[44px] group"
              >
                <span>EXPLORE PRODUCTS</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
            </motion.div>
          </div>

          {/* Right Column: 3D Product Showcase Composition (6 / 12 cols) */}
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 relative perspective-[1200px]"
          >
            {/* 3D Tilt Container */}
            <div
              ref={cardRef}
              onMouseMove={handleMouseMove}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={handleMouseLeave}
              style={{
                transform: prefersReducedMotion
                  ? 'none'
                  : `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
                transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.5s ease-out',
                transformStyle: 'preserve-3d',
              }}
              className="relative rounded-2xl bg-gradient-to-b from-[#F9FAFB] to-[#F1F3F5] border border-[#E5E7EB] p-4 sm:p-8 overflow-hidden shadow-[0_15px_35px_-5px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.03)] group"
            >
              {/* Subtle ambient lighting highlight overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent pointer-events-none opacity-60" />

              {/* Handwritten Callout Top Right */}
              <div className="absolute top-4 right-6 z-20 text-right hidden sm:block pointer-events-none">
                <span className="font-serif italic text-[13px] font-bold text-[#222222] tracking-wide block drop-shadow-sm">
                  Your Brand,
                </span>
                <span className="font-serif italic text-[13px] font-bold text-[#222222] tracking-wide block drop-shadow-sm">
                  Our Passion! ♡
                </span>
              </div>

              {/* Product Showcase Stage */}
              <div className="relative w-full py-4 flex items-center justify-center">
                {/* Continuous floating animation wrapper */}
                <motion.div
                  animate={
                    prefersReducedMotion
                      ? {}
                      : {
                          y: [0, -8, 0],
                          rotate: [0, 0.4, 0],
                        }
                  }
                  transition={{
                    repeat: Infinity,
                    duration: 5.2,
                    ease: 'easeInOut',
                  }}
                  className="relative w-[85%] sm:w-[70%] max-w-[360px] aspect-[4/3] rounded-xl bg-white/90 backdrop-blur-sm border border-white/80 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.14),0_8px_16px_-6px_rgba(0,0,0,0.06)] p-3 flex items-center justify-center overflow-hidden"
                >
                  <Image
                    src="/images/landing/hero-showcase.jpg"
                    alt="ZOBBRA Premium Custom Merchandise Collection - Polo, Backpack, Cap, Bottle, Mug"
                    fill
                    priority
                    className="object-contain p-2 filter drop-shadow-[0_10px_15px_rgba(0,0,0,0.12)] hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 80vw, 400px"
                  />

                  {/* 3D Realistic Surface Reflection / Shine Bar */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
                </motion.div>

                {/* Ground soft shadow underneath floating stage */}
                <div className="absolute -bottom-1 w-[60%] h-4 bg-black/10 rounded-full blur-md -z-10" />
              </div>

              {/* Annotation Bottom Center */}
              <div className="pt-2 flex items-center justify-between text-xs text-[#666666] border-t border-[#E5E7EB]/60 mt-2">
                <span className="text-[10px] sm:text-[11px] font-medium tracking-wide">
                  Your Brand. Your Identity.
                </span>
                <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-[#888888] bg-white/80 px-2 py-0.5 rounded border border-[#E5E7EB]">
                  3D MERCH PREVIEW
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
