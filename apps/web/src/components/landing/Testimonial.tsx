'use client';

import React, { useState } from 'react';
import Image from 'next/image';

export function Testimonial() {
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
        'Exceptional turnaround time and premium fabric finish. The custom embroidery was flawless across 500+ hoodies.',
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
    <section className="bg-white py-16 sm:py-20 border-b border-[#E5E5E5]">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#F7F7F5] border border-[#E5E5E5] rounded-2xl overflow-hidden shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
            {/* Left Side: Quote Content (7 / 12 cols) */}
            <div className="lg:col-span-7 p-8 sm:p-12 lg:p-14 space-y-6 flex flex-col justify-between h-full">
              <div className="space-y-4">
                {/* Large Quote Mark */}
                <div className="text-4xl sm:text-5xl font-serif text-[#050505] font-black leading-none select-none">
                  “
                </div>

                {/* Quote Text */}
                <blockquote className="text-xl sm:text-2xl lg:text-[25px] font-heading font-medium text-[#111111] leading-snug tracking-tight">
                  {current.quote}
                </blockquote>

                {/* Author Info */}
                <div className="pt-2">
                  <p className="text-sm font-bold text-[#555555]">
                    {current.author}
                  </p>
                </div>
              </div>

              {/* Pagination Dots */}
              <div className="flex items-center gap-2 pt-4">
                {testimonials.map((t, idx) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveIdx(idx)}
                    aria-label={`Go to testimonial ${idx + 1}`}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      activeIdx === idx
                        ? 'w-6 bg-[#050505]'
                        : 'w-2 bg-[#D1D5DB] hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Right Side: Product Showcase Image (5 / 12 cols) */}
            <div className="lg:col-span-5 relative w-full h-[280px] sm:h-[340px] lg:h-[400px] bg-white border-t lg:border-t-0 lg:border-l border-[#E5E5E5]">
              <Image
                src="/images/landing/testimonial-showcase.jpg"
                alt="ZOBBRA Branded Merchandise - Bottle, Mug, and Cap"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
