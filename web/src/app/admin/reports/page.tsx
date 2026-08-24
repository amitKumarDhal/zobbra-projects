'use client';

import React from 'react';
import { BarChart3, TrendingUp, IndianRupee, PieChart } from 'lucide-react';

export default function AdminReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Analytics & Sales Reports</h1>
        <p className="text-xs text-slate-500 font-semibold">Revenue summary, top merchandise categories & quote conversion rates.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 custom-shadow space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase">Monthly Revenue</span>
          <p className="text-3xl font-black text-slate-900">₹2,45,000</p>
          <span className="text-xs text-emerald-600 font-bold">+18.5% vs last month</span>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 custom-shadow space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase">Quote Conversion Rate</span>
          <p className="text-3xl font-black text-slate-900">76.4%</p>
          <span className="text-xs text-blue-600 font-bold">19 of 25 quotes converted to orders</span>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 custom-shadow space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase">Top Selling Product</span>
          <p className="text-2xl font-black text-slate-900">Polo T-Shirt (200 GSM)</p>
          <span className="text-xs text-slate-400 font-bold">1,850 units printed this month</span>
        </div>
      </div>
    </div>
  );
}
