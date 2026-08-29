'use client';

import React from 'react';
import { Printer, Sparkles, Flame } from 'lucide-react';

export function PrintServices() {
  const services = [
    {
      title: 'DTF Printing',
      desc: 'High quality prints with vibrant colours and strong wash durability.',
      icon: Printer,
    },
    {
      title: 'Embroidery',
      desc: 'Premium embroidery for a professional and classy look.',
      icon: Sparkles,
    },
    {
      title: 'Sublimation',
      desc: 'Perfect for full colour prints on polyester products.',
      icon: Flame,
    },
  ];

  return (
    <section className="bg-white py-12 sm:py-16">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Large Black Container */}
        <div className="bg-[#050505] text-white rounded-2xl p-8 sm:p-12 lg:p-14 shadow-xl border border-[#1F2937]">
          {/* Header */}
          <div className="text-center space-y-2 mb-10 sm:mb-12">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#9CA3AF] font-heading block">
              OUR PRINT SERVICES
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-black text-white tracking-tight">
              Quality Printing. Lasting Impression.
            </h2>
          </div>

          {/* 3 Services Columns with Vertical Dividers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-[#222222]">
            {services.map((srv, idx) => {
              const Icon = srv.icon;
              return (
                <div
                  key={srv.title}
                  className={`pt-6 md:pt-0 ${
                    idx === 0
                      ? 'md:pr-8'
                      : idx === 1
                      ? 'md:px-8'
                      : 'md:pl-8'
                  } space-y-3 text-center md:text-left`}
                >
                  <div className="w-10 h-10 rounded-lg bg-[#151515] border border-[#2A2A2A] flex items-center justify-center text-gray-200 mx-auto md:mx-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-heading font-bold text-white tracking-tight">
                    {srv.title}
                  </h3>
                  <p className="text-[13px] text-[#A1A1AA] leading-relaxed">
                    {srv.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
