'use client';

import React from 'react';

export function AnimatedStats() {
  const stats = [
    { label: 'Custom Orders Delivered', value: '5,000+', sub: 'Across 28 Indian states' },
    { label: 'Active Corporate Clients', value: '500+', sub: 'Tech, Education & Retail' },
    { label: 'On-Time Dispatch Rate', value: '99.8%', sub: 'Express courier tracking' },
    { label: 'Instant Proof Turnaround', value: '< 24 hrs', sub: 'Free digital mockups' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {stats.map((stat, i) => (
        <div
          key={i}
          className="p-7 rounded-xl bg-white border border-[#E5E7EB] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
        >
          <p className="text-4xl font-heading font-black text-[#111111] tracking-tight">{stat.value}</p>
          <p className="text-xs font-semibold text-[#374151] uppercase tracking-wider mt-3">{stat.label}</p>
          <p className="text-xs text-[#3B6FEB] font-medium mt-1">{stat.sub}</p>
        </div>
      ))}
    </div>
  );
}
