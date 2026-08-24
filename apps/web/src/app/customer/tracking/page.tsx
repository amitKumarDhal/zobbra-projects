'use client';

import React from 'react';
import { MapPin, CheckCircle2, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function CustomerTrackingPage() {
  const milestones = [
    { title: 'Package Picked Up by BlueDart Courier', location: 'Bhubaneswar Hub', time: '05 Aug 2026, 04:30 PM', done: true },
    { title: 'In Transit to Kolkata Distribution Center', location: 'En Route', time: '05 Aug 2026, 09:15 PM', done: true },
    { title: 'Out for Delivery to Client Facility', location: 'Bhubaneswar Local Center', time: 'Expected 06 Aug 2026', done: false },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EEF2FF] text-[#3B6FEB] uppercase tracking-wider mb-2">
          EXPRESS SHIPPING
        </div>
        <h1 className="text-3xl sm:text-4xl font-heading font-black text-[#111111] tracking-tight">
          Shipment Tracking
        </h1>
        <p className="text-xs sm:text-sm text-[#6B7280] mt-1 font-medium">
          Live tracking status for active dispatch packages.
        </p>
      </div>

      <Card className="bg-white border-[#E5E7EB] p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-4">
          <div>
            <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Courier Partner: BlueDart Express</span>
            <h3 className="text-xl font-heading font-bold text-[#111111]">AWB #BLUEDART-9922</h3>
            <p className="text-xs text-[#6B7280] mt-0.5">Order #ORD-5001 • 100 Polo T-Shirts (Box 1 of 2)</p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-xs font-semibold text-[#6B7280]">Estimated Delivery:</span>
            <span className="text-lg font-heading font-bold text-[#111111] block">Tomorrow, 06 Aug</span>
          </div>
        </div>

        {/* Milestone Timeline */}
        <div className="space-y-5 pt-2">
          {milestones.map((m, i) => (
            <div key={i} className="flex items-start gap-4">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  m.done ? 'bg-[#3B6FEB] text-white shadow-sm' : 'bg-[#F9FAFB] text-[#9CA3AF] border border-[#E5E7EB]'
                }`}
              >
                {m.done ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
              </div>
              <div className="space-y-0.5">
                <h4 className="font-bold text-[#111111] text-xs sm:text-sm">{m.title}</h4>
                <p className="text-xs text-[#6B7280] flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#3B6FEB]" /> {m.location} • {m.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
