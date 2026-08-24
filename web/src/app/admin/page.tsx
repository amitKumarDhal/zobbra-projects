'use client';

import React from 'react';
import Link from 'next/link';
import { FileText, ShoppingBag, Kanban, Truck, IndianRupee, ArrowUpRight, Clock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function AdminDashboardPage() {
  const kpis = [
    { title: "Today's Quotes", value: '4', change: '+2 today', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: "Today's Orders", value: '2', change: '₹48,500 total', icon: ShoppingBag, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Production Pending', value: '3 Jobs', change: '1 in printing', icon: Kanban, color: 'text-amber-600', bg: 'bg-amber-50' },
    { title: 'Dispatch Pending', value: '1 Package', change: 'BlueDart ready', icon: Truck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { title: 'Revenue Summary', value: '₹2,45,000', change: 'This Month', icon: IndianRupee, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  const recentQuotes = [
    { id: 'ZQB-QT-2026-1001', customer: 'Acme Tech Pvt Ltd', amount: '₹25,145', status: 'APPROVED', date: 'Today, 02:15 PM' },
    { id: 'ZQB-QT-2026-1002', customer: 'Zepto Logistics', amount: '₹84,200', status: 'SENT', date: 'Today, 11:30 AM' },
    { id: 'ZQB-QT-2026-1003', customer: 'Decathlon Event', amount: '₹14,500', status: 'DRAFT', date: 'Yesterday' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Dashboard Overview</h1>
          <p className="text-xs text-slate-500 font-semibold">Real-time status of quotes, orders & production pipeline.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/quotes">
            <Button variant="secondary" className="gap-2">
              <Plus className="w-4 h-4" /> CREATE QUOTE
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 custom-shadow space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">{kpi.title}</span>
                <div className={`p-2 rounded-xl ${kpi.bg}`}>
                  <Icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">{kpi.value}</p>
                <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-0.5 mt-1">
                  <ArrowUpRight className="w-3 h-3" /> {kpi.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Action Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Quotes */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 custom-shadow space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base">Recent Quotations</h3>
            <Link href="/admin/quotes" className="text-xs text-blue-600 font-bold hover:underline">
              View All
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                <tr>
                  <th className="p-3">Quote #</th>
                  <th className="p-3">Customer / Company</th>
                  <th className="p-3">Total Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {recentQuotes.map((q) => (
                  <tr key={q.id}>
                    <td className="p-3 font-bold text-slate-900">{q.id}</td>
                    <td className="p-3">{q.customer}</td>
                    <td className="p-3 font-bold text-slate-900">{q.amount}</td>
                    <td className="p-3">
                      <Badge variant={q.status === 'APPROVED' ? 'success' : q.status === 'SENT' ? 'info' : 'default'}>
                        {q.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-slate-400">{q.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Production Summary */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 custom-shadow space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base">Production Status</h3>
            <Link href="/admin/production" className="text-xs text-blue-600 font-bold hover:underline">
              Kanban Board
            </Link>
          </div>
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-1">
              <span className="font-bold text-amber-900 block">ZQB-ORD-2026-5001</span>
              <p className="text-amber-700">100 Polo T-Shirts (DTF Printing)</p>
              <div className="flex justify-between items-center pt-1 text-[10px] text-amber-800 font-bold">
                <span>Stage: PRINTING</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> In Progress</span>
              </div>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 space-y-1">
              <span className="font-bold text-blue-900 block">ZQB-ORD-2026-5002</span>
              <p className="text-blue-700">50 Cotton Caps (3D Embroidery)</p>
              <div className="flex justify-between items-center pt-1 text-[10px] text-blue-800 font-bold">
                <span>Stage: PENDING</span>
                <span>Queue #1</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
