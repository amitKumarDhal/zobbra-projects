'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';

export function Testimonial() {
  const prefersReducedMotion = useReducedMotion();

  const testimonials = [
    {
      id: 1,
      quote:
        'The quality, service and support from Zobra is outstanding. Our team loves the merchandise!',
      author: '— Aniket Verma, Operations Head',
      company: 'TechFlow Enterprises',
    },
    {
      id: 2,
      quote:
        'Exceptional turnaround time and premium fabric finish. The custom embroidery was flawless across 500+ polos.',
      author: '— Priya Sharma, Brand Director',
      company: 'Innovate Labs',
    },
    {
      id: 3,
      quote:
        'ZOBBRA delivered our annual conference kits across 14 cities seamlessly with zero defects. Truly reliable partner.',
      author: '— Rajesh Patel, Events Lead',
      company: 'Apex Global',
    },
    {
      id: 4,
      quote:
        'From digital mockups to final delivery, the entire experience was completely transparent and hassle-free.',
      author: '— Sneha Roy, People & Culture',
      company: 'Zenith Systems',
    },
  ];

  const [activeIdx, setActiveIdx] = useState(0);
  const current = testimonials[activeIdx];

  return (
    <section className="bg-white py-10 sm:py-12 lg:py-14 border-b border-[#DDDCD5]">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="bg-[#F2F1EC] border border-[#DDDCD5] rounded-[1.5rem] overflow-hidden shadow-[0_16px_32px_rgba(17,17,17,0.06)]"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
            {/* Left Side: Quote Content (7 / 12 cols) */}
            <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 space-y-4 flex flex-col justify-between h-full">
              <div className="space-y-2.5">
                {/* Large Quote Mark */}
                <div className="text-3xl sm:text-4xl font-serif text-[#050505] font-black leading-none select-none">
                  “
                </div>

                {/* Quote Text with smooth fade key */}
                <motion.blockquote
                  key={current.id}
                  initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="text-lg sm:text-xl lg:text-[21px] font-heading font-medium text-[#111111] leading-snug tracking-tight"
                >
                  {current.quote}
                </motion.blockquote>

                {/* Author Info */}
                <div className="pt-1">
                  <p className="text-[12.5px] sm:text-[13px] font-bold text-[#555555]">
                    {current.author}
                  </p>
                </div>
              </div>

              {/* Pagination Dots */}
              <div className="flex items-center gap-1.5 pt-2">
                {testimonials.map((t, idx) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveIdx(idx)}
                    aria-label={`Go to testimonial ${idx + 1}`}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      activeIdx === idx
                        ? 'w-5 bg-[#050505]'
                        : 'w-2 bg-[#D1D5DB] hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Right Side: Product Showcase Image (5 / 12 cols) with 3D shadow */}
            <div className="lg:col-span-5 relative w-full h-[220px] sm:h-[260px] lg:h-[300px] bg-white border-t lg:border-t-0 lg:border-l border-[#E5E5E5] overflow-hidden group">
              <Image
                src="/images/landing/testimonial-showcase.jpg"
                alt="ZOBBRA Branded Merchandise - Bottle, Mug, and Cap"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
