'use client';

import React from 'react';
import { ShoppingBag, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function AdminOrdersPage() {
  const orders = [
    {
      id: 'ZQB-ORD-2026-5001',
      quoteNumber: 'ZQB-QT-2026-1001',
      customer: 'Rahul Mishra (Acme Tech)',
      items: '100 Polo T-Shirts (DTF Both Sides)',
      total: '₹25,145',
      payment: 'PAID',
      status: 'IN_PRODUCTION',
      date: '05 Aug 2026',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Order Management</h1>
          <p className="text-xs text-slate-500 font-semibold">Track converted orders, assign production jobs & issue invoices.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 custom-shadow overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
            <tr>
              <th className="p-4">Order Number</th>
              <th className="p-4">Ref Quote</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Items Summary</th>
              <th className="p-4">Total Amount</th>
              <th className="p-4">Payment</th>
              <th className="p-4">Production Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-slate-50">
                <td className="p-4 font-bold text-slate-900 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-blue-600" /> {o.id}
                </td>
                <td className="p-4 font-mono text-slate-500">{o.quoteNumber}</td>
                <td className="p-4 font-bold text-slate-900">{o.customer}</td>
                <td className="p-4">{o.items}</td>
                <td className="p-4 font-black text-slate-900 text-sm">{o.total}</td>
                <td className="p-4">
                  <Badge variant="success">{o.payment}</Badge>
                </td>
                <td className="p-4">
                  <Badge variant="info">{o.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
