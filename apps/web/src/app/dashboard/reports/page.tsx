'use client';

import React from 'react';
import { BarChart3, TrendingUp, Users, ShoppingBag, Calendar, ChevronDown, DownloadCloud } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export default function ReportsPage() {
  const { data: salesRes, isLoading: loading } = useQuery({
    queryKey: ['admin-sales-report'],
    queryFn: () => apiFetch('/reports/sales').then(res => res.json()),
  });
  const sales = salesRes?.report;

  return (
    <div className="space-y-6 pb-12 font-sans bg-[#F8F9FC] min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-black text-[#111111]">Reports & Analytics</h1>
          <p className="text-sm text-[#6B7280] font-medium mt-1">Sales performance and growth metrics.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-white border border-[#E5E7EB] text-[#111111] px-4 py-2.5 rounded-lg text-sm font-bold shadow-sm hover:bg-[#F9FAFB] transition-colors flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Last 30 Days <ChevronDown className="w-4 h-4 text-[#9CA3AF]" />
          </button>
          <button className="bg-[#3B6FEB] text-white px-4 py-2.5 rounded-lg text-sm font-bold shadow-sm hover:bg-[#2563EB] transition-colors flex items-center gap-2">
            <DownloadCloud className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* ── KPI ROW ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0"><TrendingUp className="w-5 h-5" /></div>
            <div>
              <p className="text-xs font-semibold text-[#6B7280]">Total Revenue</p>
              <h3 className="text-xl font-black text-[#111111]">₹{loading ? '...' : (sales?.totalRevenue || 0).toLocaleString()}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0"><ShoppingBag className="w-5 h-5" /></div>
            <div>
              <p className="text-xs font-semibold text-[#6B7280]">Total Orders</p>
              <h3 className="text-xl font-black text-[#111111]">{loading ? '...' : (sales?.totalOrders || 0)}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center flex-shrink-0"><BarChart3 className="w-5 h-5" /></div>
            <div>
              <p className="text-xs font-semibold text-[#6B7280]">Total Quotes</p>
              <h3 className="text-xl font-black text-[#111111]">{loading ? '...' : (sales?.totalQuotes || 0)}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0"><Users className="w-5 h-5" /></div>
            <div>
              <p className="text-xs font-semibold text-[#6B7280]">Total Customers</p>
              <h3 className="text-xl font-black text-[#111111]">{loading ? '...' : (sales?.totalCustomers || 0)}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* ── CHARTS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Revenue Chart */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm flex flex-col h-80">
          <h3 className="font-bold text-[#111111] mb-6">Revenue Trend</h3>
          <div className="flex-1 relative flex items-end justify-between px-2 pt-10 pb-4 mt-auto">
            <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
              <path d="M 0,90 L 16,70 L 33,75 L 50,50 L 66,30 L 83,40 L 100,10" fill="none" stroke="#3B6FEB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="absolute top-[10%] right-[0%] mb-2 bg-[#111111] text-white text-[10px] px-3 py-1.5 rounded-lg shadow-xl font-medium whitespace-nowrap z-10 -translate-x-4 -translate-y-full">
              Jul 2024<br /><span className="font-bold">₹3,45,000</span>
              <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-[#111111] rotate-45"></div>
            </div>
            {[0, 16, 33, 50, 66, 83, 100].map((x, i) => (
              <div key={i} className="absolute w-2.5 h-2.5 bg-[#3B6FEB] border-2 border-white rounded-full z-10" style={{ left: `calc(${x}% - 5px)`, bottom: `${[10, 30, 25, 50, 70, 60, 90][i]}%` }} />
            ))}
            
            {/* Grid lines */}
            {[25, 50, 75, 100].map((y) => (
              <div key={y} className="absolute left-0 right-0 border-t border-[#F3F4F6] text-[10px] text-[#9CA3AF] flex items-center" style={{ bottom: `${y}%` }}></div>
            ))}
            <div className="absolute left-0 right-0 border-t border-[#E5E7EB] text-[10px] text-[#9CA3AF] flex items-center" style={{ bottom: '0%' }}></div>
            
            {/* X axis labels */}
            <div className="w-full flex justify-between absolute -bottom-6 left-0 text-[10px] font-medium text-[#9CA3AF] px-1">
              <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span>
            </div>
          </div>
        </div>

        {/* Orders Chart (Bar) */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm flex flex-col h-80">
          <h3 className="font-bold text-[#111111] mb-6">Orders by Category</h3>
          <div className="flex-1 relative flex items-end justify-between px-6 pt-10 pb-4 mt-auto">
            {/* Grid lines */}
            {[25, 50, 75, 100].map((y) => (
              <div key={y} className="absolute left-0 right-0 border-t border-[#F3F4F6] text-[10px] text-[#9CA3AF] flex items-center" style={{ bottom: `${y}%` }}></div>
            ))}
            <div className="absolute left-0 right-0 border-t border-[#E5E7EB] text-[10px] text-[#9CA3AF] flex items-center" style={{ bottom: '0%' }}></div>

            {/* Bars */}
            {[
              { label: 'T-Shirts', val: 80, col: 'bg-[#3B6FEB]' },
              { label: 'Hoodies', val: 45, col: 'bg-[#8B5CF6]' },
              { label: 'Caps', val: 60, col: 'bg-[#10B981]' },
              { label: 'Mugs', val: 30, col: 'bg-[#F59E0B]' },
              { label: 'Bags', val: 55, col: 'bg-[#EC4899]' },
            ].map((bar, i) => (
              <div key={i} className="relative z-10 w-12 flex flex-col items-center group cursor-pointer">
                <div className={`w-full rounded-t-md ${bar.col} transition-all duration-300 group-hover:opacity-80`} style={{ height: `${bar.val}%` }}></div>
                <span className="absolute -bottom-6 text-[10px] font-medium text-[#6B7280]">{bar.label}</span>
                {/* Tooltip */}
                <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-[#111111] text-white text-[10px] px-2 py-1 rounded shadow-xl font-bold whitespace-nowrap pointer-events-none">
                  {bar.val * 10} Orders
                  <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-[#111111] rotate-45"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
