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
    <section className="relative bg-[#F7F6F2] pt-6 sm:pt-10 lg:pt-12 pb-8 sm:pb-12 lg:pb-14 border-b border-[#DDDCD5] overflow-hidden">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 xl:gap-10 items-center">
          {/* Left Column: Staggered Content (6 / 12 cols) */}
          <div className="lg:col-span-6 space-y-3.5 sm:space-y-4">
            {/* 1. Eyebrow */}
            <motion.div
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
              className="inline-block"
            >
              <span className="inline-flex items-center gap-1.5 text-[9.5px] sm:text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#3B6FEB] bg-white border border-[#D9E2FF] px-2.5 py-1 rounded-full shadow-sm">
                <Sparkles className="w-2.5 h-2.5 text-[#333333]" />
                CUSTOM MERCHANDISE
              </span>
            </motion.div>

            {/* 2. Main Headline */}
            <motion.h1
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
              className="text-[2.2rem] sm:text-4xl lg:text-[42px] xl:text-[46px] font-heading font-black text-[#111111] tracking-[-0.035em] leading-[1.08]"
            >
              Make your brand<br />
              <span className="text-[#3B6FEB]">impossible to forget.</span>
            </motion.h1>

            {/* 3. Subtitle Description */}
            <motion.p
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
              className="text-[13.5px] sm:text-[14.5px] text-[#555555] leading-[1.5] max-w-md font-normal"
            >
              Premium quality custom merchandise for businesses, events, schools and organizations.
            </motion.p>

            {/* 4. 3 Mini Benefit Columns */}
            <motion.div
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2.5 pb-2.5 border-y border-[#DDDCD5]"
            >
              {/* Benefit 1 */}
              <div className="flex sm:flex-col items-center sm:items-start gap-2.5 sm:gap-1 group">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border border-[#DDDCD5] flex items-center justify-center text-[#3B6FEB] group-hover:bg-[#3B6FEB] group-hover:text-white transition-colors duration-300 flex-shrink-0">
                  <Award className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-[10px] sm:text-[10.5px] font-black uppercase tracking-wider text-[#111111] font-heading leading-tight">
                    PREMIUM QUALITY
                  </h4>
                  <p className="text-[10px] sm:text-[10.5px] text-[#666666] leading-tight mt-0.5">
                    Top grade materials for lasting impact
                  </p>
                </div>
              </div>

              {/* Benefit 2 */}
              <div className="flex sm:flex-col items-center sm:items-start gap-2.5 sm:gap-1 sm:border-l sm:border-[#DDDCD5] sm:pl-3 group">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border border-[#DDDCD5] flex items-center justify-center text-[#3B6FEB] group-hover:bg-[#3B6FEB] group-hover:text-white transition-colors duration-300 flex-shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-[10px] sm:text-[10.5px] font-black uppercase tracking-wider text-[#111111] font-heading leading-tight">
                    FAST TURNAROUND
                  </h4>
                  <p className="text-[10px] sm:text-[10.5px] text-[#666666] leading-tight mt-0.5">
                    Production in 5-7 working days
                  </p>
                </div>
              </div>

              {/* Benefit 3 */}
              <div className="flex sm:flex-col items-center sm:items-start gap-2.5 sm:gap-1 sm:border-l sm:border-[#DDDCD5] sm:pl-3 group">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border border-[#DDDCD5] flex items-center justify-center text-[#3B6FEB] group-hover:bg-[#3B6FEB] group-hover:text-white transition-colors duration-300 flex-shrink-0">
                  <Truck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-[10px] sm:text-[10.5px] font-black uppercase tracking-wider text-[#111111] font-heading leading-tight">
                    PAN INDIA DELIVERY
                  </h4>
                  <p className="text-[10px] sm:text-[10.5px] text-[#666666] leading-tight mt-0.5">
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
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1"
            >
              <Link
                href="/get-quote"
                className="inline-flex items-center justify-center gap-1.5 px-4.5 py-2.5 sm:px-5 sm:py-2.5 bg-[#111111] hover:bg-[#3B6FEB] text-white text-[11.5px] font-bold tracking-wider uppercase rounded-full transition-all shadow-sm hover:shadow-md active:scale-[0.98] min-h-[38px] sm:min-h-[40px] group"
              >
                <span>GET A FREE QUOTE</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>

              <Link
                href="/products"
                className="inline-flex items-center justify-center gap-1.5 px-4.5 py-2.5 sm:px-5 sm:py-2.5 bg-transparent hover:bg-white text-[#111111] text-[11.5px] font-bold tracking-wider uppercase rounded-full border border-[#B9B8B0] hover:border-[#111111] transition-all active:scale-[0.98] min-h-[38px] sm:min-h-[40px] group"
              >
                <span>DESIGN & ORDER ONLINE</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
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
              className="relative rounded-[1.5rem] bg-[#111111] border border-[#2B2B2B] p-3.5 sm:p-5 overflow-hidden shadow-[0_20px_45px_-15px_rgba(17,17,17,0.35)] group"
            >
              {/* Subtle ambient lighting highlight overlay */}
              <div className="absolute inset-0 bg-[#3B6FEB]/10 pointer-events-none" />

              {/* Handwritten Callout Top Right */}
              <div className="absolute top-3 right-5 z-20 text-right hidden sm:block pointer-events-none">
                <span className="font-serif italic text-[11.5px] font-bold text-white tracking-wide block drop-shadow-sm">
                  Your Brand,
                </span>
                <span className="font-serif italic text-[11.5px] font-bold text-white tracking-wide block drop-shadow-sm">
                  Our Passion! ♡
                </span>
              </div>

              {/* Product Showcase Stage */}
              <div className="relative w-full py-2 flex items-center justify-center">
                {/* Continuous floating animation wrapper */}
                <motion.div
                  animate={
                    prefersReducedMotion
                      ? {}
                      : {
                          y: [0, -6, 0],
                          rotate: [0, 0.3, 0],
                        }
                  }
                  transition={{
                    repeat: Infinity,
                    duration: 5.2,
                    ease: 'easeInOut',
                  }}
                  className="relative w-[88%] sm:w-[75%] max-w-[320px] aspect-[4/3] rounded-xl bg-[#F7F6F2] border border-white/20 shadow-[0_16px_32px_-8px_rgba(0,0,0,0.3)] p-2.5 flex items-center justify-center overflow-hidden"
                >
                  <Image
                    src="/images/landing/hero-showcase.jpg"
                    alt="ZOBBRA Premium Custom Merchandise Collection - Polo, Backpack, Cap, Bottle, Mug"
                    fill
                    priority
                    className="object-contain p-1.5 filter drop-shadow-[0_8px_12px_rgba(0,0,0,0.12)] hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 75vw, 320px"
                  />

                  {/* 3D Realistic Surface Reflection / Shine Bar */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
                </motion.div>

                {/* Ground soft shadow underneath floating stage */}
                <div className="absolute -bottom-1 w-[55%] h-3.5 bg-black/10 rounded-full blur-md -z-10" />
              </div>

              {/* Annotation Bottom Center */}
              <div className="pt-2 flex items-center justify-between text-xs text-[#A1A1AA] border-t border-white/15 mt-1.5">
                <span className="text-[10px] sm:text-[10.5px] font-medium tracking-wide">
                  Your Brand. Your Identity.
                </span>
                <span className="text-[9px] uppercase font-bold tracking-widest text-[#D1D5DB] bg-white/10 px-2 py-0.5 rounded border border-white/15">
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
