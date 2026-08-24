'use client';

import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function CustomerNotificationsPage() {
  const [filter, setFilter] = useState('ALL');

  const notifications = [
    { id: 1, title: 'Digital 3D Proof Ready', desc: 'Your mockup for Quote #ZQB-1024 is ready for approval.', time: '15 mins ago', cat: 'Quotes', unread: true },
    { id: 2, title: 'Order Status Updated', desc: 'Order #ORD-5001 has entered the Packing stage.', time: '2 hours ago', cat: 'Orders', unread: false },
    { id: 3, title: 'GST Tax Invoice Issued', desc: 'Invoice #INV-2026-088 generated for ₹28,900.', time: '1 day ago', cat: 'Invoices', unread: false },
  ];

  const filtered = filter === 'ALL' ? notifications : notifications.filter((n) => n.cat === filter);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EEF2FF] text-[#3B6FEB] uppercase tracking-wider mb-2">
          NOTIFICATIONS
        </div>
        <h1 className="text-3xl sm:text-4xl font-heading font-black text-[#111111] tracking-tight">
          Notification Center
        </h1>
        <p className="text-xs sm:text-sm text-[#6B7280] mt-1 font-medium">
          Real-time updates regarding your merchandise proofs, order fulfillment, and tax invoices.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-[#E5E7EB] pb-3">
        {['ALL', 'Quotes', 'Orders', 'Invoices'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filter === cat
                ? 'bg-[#3B6FEB] text-white shadow-sm'
                : 'bg-white text-[#6B7280] border border-[#E5E7EB] hover:text-[#111111]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((n) => (
          <Card
            key={n.id}
            className={`bg-white border-[#E5E7EB] p-5 flex items-start gap-4 shadow-sm transition-all ${
              n.unread ? 'ring-2 ring-[#3B6FEB]/30' : ''
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#3B6FEB] flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-[#111111] text-sm">{n.title}</h3>
                <span className="text-[11px] text-[#6B7280] font-medium">{n.time}</span>
              </div>
              <p className="text-xs text-[#6B7280] leading-relaxed">{n.desc}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
