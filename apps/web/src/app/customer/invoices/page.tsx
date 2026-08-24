'use client';

import React from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';

export default function CustomerInvoicesPage() {
  const invoices = [
    { id: 'INV-2026-088', date: '01 Aug 2026', orderId: 'ORD-5001', taxable: '₹27,523', gst: '₹1,376 (5%)', total: '₹28,900', status: 'PAID' },
    { id: 'INV-2026-052', date: '15 Jul 2026', orderId: 'ORD-4890', taxable: '₹18,857', gst: '₹943 (5%)', total: '₹19,800', status: 'PAID' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EEF2FF] text-[#3B6FEB] uppercase tracking-wider mb-2">
          GST BILLING
        </div>
        <h1 className="text-3xl sm:text-4xl font-heading font-black text-[#111111] tracking-tight">
          Tax Invoices
        </h1>
        <p className="text-xs sm:text-sm text-[#6B7280] mt-1 font-medium">
          Download official GST tax invoices for accounting & input tax credit (ITC).
        </p>
      </div>

      <Card className="bg-white border-[#E5E7EB] p-0 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#6B7280] uppercase tracking-wider font-bold">
                <th className="p-4">Invoice #</th>
                <th className="p-4">Date</th>
                <th className="p-4">Order Ref</th>
                <th className="p-4">Taxable Value</th>
                <th className="p-4">GST Rate</th>
                <th className="p-4">Total Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] text-[#111111] font-medium">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-[#F9FAFB] transition-colors">
                  <td className="p-4 font-mono font-bold text-[#111111]">{inv.id}</td>
                  <td className="p-4 text-[#6B7280]">{inv.date}</td>
                  <td className="p-4 font-mono">{inv.orderId}</td>
                  <td className="p-4 font-mono">{inv.taxable}</td>
                  <td className="p-4 text-[#6B7280]">{inv.gst}</td>
                  <td className="p-4 font-mono font-bold text-[#111111]">{inv.total}</td>
                  <td className="p-4">
                    <StatusBadge status={inv.status} />
                  </td>
                  <td className="p-4 text-right">
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs font-bold" onClick={() => alert(`Downloading official PDF for ${inv.id}`)}>
                      <Download className="w-3.5 h-3.5 text-[#3B6FEB]" /> PDF
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
