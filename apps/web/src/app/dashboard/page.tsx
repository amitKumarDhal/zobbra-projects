'use client';

import React from 'react';
import Link from 'next/link';
import {
  Users,
  FileText,
  Package,
  ShoppingBag,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  TrendingUp,
  CheckCircle,
  Clock,
  IndianRupee,
  MoreHorizontal,
  ChevronDown,
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';

/* Deterministic avatar color palette — brand-consistent, 5 slots */
const AVATAR_PALETTE = [
  'bg-[#EEF2FF] text-[#3B6FEB]',   // brand blue
  'bg-[#F0FDFA] text-[#0D9488]',   // teal
  'bg-[#F5F3FF] text-[#7C3AED]',   // violet
  'bg-[#FFFBEB] text-[#D97706]',   // amber
  'bg-[#FFF1F2] text-[#BE123C]',   // rose
];
const avatarClass = (i: number) => AVATAR_PALETTE[i % AVATAR_PALETTE.length];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6 pb-12 font-sans bg-[#F8F9FC] min-h-screen">
      <div>
        <h1 className="text-3xl font-heading font-black text-[#111111]">Dashboard</h1>
        <p className="text-sm text-[#6B7280] font-medium mt-1">Welcome back, Admin! 👋</p>
      </div>

      {/* ── TOP KPI CARDS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1 — Inquiries */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--color-kpi-inquiry-bg)', color: 'var(--color-kpi-inquiry-icon)' }}>
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#6B7280]">Total Inquiries</p>
              <h3 className="text-2xl font-black text-[#111111] mt-0.5">247</h3>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              <ArrowUp className="w-3 h-3 mr-0.5" /> 18.6%
            </span>
            <span className="text-[10px] text-[#9CA3AF] font-medium">vs last 7 days</span>
          </div>
        </div>

        {/* KPI 2 — Quotes */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--color-kpi-quote-bg)', color: 'var(--color-kpi-quote-icon)' }}>
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#6B7280]">Quotes Sent</p>
              <h3 className="text-2xl font-black text-[#111111] mt-0.5">89</h3>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              <ArrowUp className="w-3 h-3 mr-0.5" /> 12.3%
            </span>
            <span className="text-[10px] text-[#9CA3AF] font-medium">vs last 7 days</span>
          </div>
        </div>

        {/* KPI 3 — Orders */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--color-kpi-order-bg)', color: 'var(--color-kpi-order-icon)' }}>
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#6B7280]">Orders Received</p>
              <h3 className="text-2xl font-black text-[#111111] mt-0.5">32</h3>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              <ArrowUp className="w-3 h-3 mr-0.5" /> 8.2%
            </span>
            <span className="text-[10px] text-[#9CA3AF] font-medium">vs last 7 days</span>
          </div>
        </div>

        {/* KPI 4 — Revenue */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--color-kpi-revenue-bg)', color: 'var(--color-kpi-revenue-icon)' }}>
              <IndianRupee className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#6B7280]">Revenue</p>
              <h3 className="text-2xl font-black text-[#111111] mt-0.5">₹1,24,560</h3>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              <ArrowUp className="w-3 h-3 mr-0.5" /> 22.7%
            </span>
            <span className="text-[10px] text-[#9CA3AF] font-medium">vs last 7 days</span>
          </div>
        </div>
      </div>

      {/* ── CHARTS ROW ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Line Chart Placeholder */}
        <div className="lg:col-span-6 bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-[#111111]">Inquiry Overview</h3>
            <button className="flex items-center gap-1.5 text-xs font-semibold text-[#6B7280] bg-white border border-[#E5E7EB] px-2.5 py-1.5 rounded-lg hover:bg-[#F9FAFB]">
              Last 7 Days <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex-1 relative flex items-end justify-between px-2 pt-10 pb-4 mt-auto">
            {/* Mock Chart lines & points */}
            <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
              <path d="M 0,80 L 20,60 L 40,75 L 60,50 L 80,60 L 100,40" fill="none" stroke="#3B6FEB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="absolute top-[35%] left-[55%] -translate-x-1/2 -translate-y-full mb-2 bg-[#111111] text-white text-[10px] px-3 py-1.5 rounded-lg shadow-xl font-medium whitespace-nowrap z-10">
              17 May, 2024<br /><span className="font-bold">Inquiries: 45</span>
              <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-[#111111] rotate-45"></div>
            </div>
            {[0, 20, 40, 60, 80, 100].map((x, i) => (
              <div key={i} className="absolute w-2.5 h-2.5 bg-[#3B6FEB] border-2 border-white rounded-full z-10" style={{ left: `calc(${x}% - 5px)`, bottom: `${[20, 40, 25, 50, 40, 60][i]}%` }} />
            ))}
            
            {/* Grid lines */}
            {[20, 40, 60, 80, 100].map((y) => (
              <div key={y} className="absolute left-0 right-0 border-t border-[#F3F4F6] text-[10px] text-[#9CA3AF] flex items-center" style={{ bottom: `${y}%` }}>
                <span className="absolute -left-5 bg-white pr-1">{y}</span>
              </div>
            ))}
            <div className="absolute left-0 right-0 border-t border-[#E5E7EB] text-[10px] text-[#9CA3AF] flex items-center" style={{ bottom: '0%' }}>
               <span className="absolute -left-5 bg-white pr-1">0</span>
            </div>
            
            {/* X axis labels */}
            <div className="w-full flex justify-between absolute -bottom-6 left-0 text-[10px] font-medium text-[#9CA3AF] px-1">
              <span>14 May</span>
              <span>15 May</span>
              <span>16 May</span>
              <span>17 May</span>
              <span>18 May</span>
              <span>19 May</span>
              <span>20 May</span>
            </div>
          </div>
        </div>

        {/* Donut Chart Placeholder */}
        <div className="lg:col-span-3 bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm flex flex-col">
          <h3 className="font-bold text-[#111111] mb-6">Inquiries by Source</h3>
          <div className="flex-1 flex flex-col items-center justify-center">
            {/* CSS Donut */}
            <div className="relative w-36 h-36 rounded-full flex items-center justify-center mb-6 shadow-sm" style={{ background: 'conic-gradient(#3B6FEB 0% 51.8%, #10B981 51.8% 82.6%, #F59E0B 82.6% 92.7%, #8B5CF6 92.7% 100%)' }}>
              <div className="w-24 h-24 bg-white rounded-full flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-[#111111] leading-none">247</span>
                <span className="text-[10px] font-bold text-[#6B7280] uppercase mt-1">Total</span>
              </div>
            </div>
            <div className="w-full space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-medium text-[#374151]"><div className="w-2.5 h-2.5 rounded-full bg-[#3B6FEB]" /> Website</div>
                <div className="text-[#6B7280]">128 (51.8%)</div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-medium text-[#374151]"><div className="w-2.5 h-2.5 rounded-full bg-[#10B981]" /> WhatsApp</div>
                <div className="text-[#6B7280]">76 (30.8%)</div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-medium text-[#374151]"><div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" /> Instagram</div>
                <div className="text-[#6B7280]">25 (10.1%)</div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-medium text-[#374151]"><div className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]" /> Call / Others</div>
                <div className="text-[#6B7280]">18 (7.3%)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Inquiries List */}
        <div className="lg:col-span-3 bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#111111]">Recent Inquiries</h3>
            <Link href="/dashboard/inquiries" className="text-[10px] font-bold text-[#3B6FEB] hover:underline uppercase tracking-wider">
              View All
            </Link>
          </div>
          <div className="flex-1 flex flex-col gap-4">
            {[
              { init: 'RK', name: 'Rakesh Kumar', prod: 'Corporate T-Shirts', time: '2m ago', status: 'NEW' },
              { init: 'SP', name: 'Sunita Patel', prod: 'School Uniform', time: '15m ago', status: 'NEW' },
              { init: 'AM', name: 'Amit Mohanty', prod: 'Caps & T-Shirts', time: '1h ago', status: 'CONTACTED' },
              { init: 'DB', name: 'Dream Builders Pvt. Ltd.', prod: 'Employee Welcome Kit', time: '2h ago', status: 'QUOTED' },
              { init: 'PK', name: 'Pooja Khatri', prod: 'Bags & Accessories', time: '3h ago', status: 'CLOSED' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${avatarClass(i)}`}>
                  {item.init}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[#111111] truncate">{item.name}</p>
                  <p className="text-[10px] text-[#6B7280] truncate">{item.prod}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] text-[#9CA3AF] mb-1">{item.time}</p>
                  <StatusBadge status={item.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── LOWER SECTION ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Latest Inquiries Table */}
        <div className="lg:col-span-6 bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm flex flex-col">
          <h3 className="font-bold text-[#111111] mb-4">Latest Inquiries</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[540px] text-left border-collapse">
              <thead>
                <tr className="border-b border-[#F3F4F6]">
                  <th className="py-2.5 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Customer</th>
                  <th className="py-2.5 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Product Interest</th>
                  <th className="py-2.5 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Source</th>
                  <th className="py-2.5 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Date</th>
                  <th className="py-2.5 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {[
                  { name: 'Rakesh Kumar', prod: 'Corporate T-Shirts', src: 'Website', date: '20 May, 2024', status: 'NEW' },
                  { name: 'Sunita Patel', prod: 'School Uniform', src: 'WhatsApp', date: '20 May, 2024', status: 'NEW' },
                  { name: 'Amit Mohanty', prod: 'Caps & T-Shirts', src: 'Call', date: '20 May, 2024', status: 'CONTACTED' },
                  { name: 'Dream Builders Pvt. Ltd.', prod: 'Welcome Kit', src: 'Website', date: '19 May, 2024', status: 'QUOTED' },
                  { name: 'Pooja Khatri', prod: 'Bags & Accessories', src: 'Instagram', date: '19 May, 2024', status: 'CLOSED' },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="py-3 text-xs font-semibold text-[#111111]">{row.name}</td>
                    <td className="py-3 text-xs text-[#4B5563]">{row.prod}</td>
                    <td className="py-3 text-xs text-[#6B7280] flex items-center gap-1.5">
                      {row.src === 'Website' && <div className="w-3 h-3 rounded-full border border-slate-300 flex items-center justify-center"><Globe className="w-2 h-2 text-slate-500" /></div>}
                      {row.src === 'WhatsApp' && <div className="w-3 h-3 rounded-full bg-emerald-500 flex items-center justify-center"><MessageSquare className="w-2 h-2 text-white" /></div>}
                      {row.src === 'Call' && <div className="w-3 h-3 rounded-full bg-[#3B6FEB] flex items-center justify-center"><Phone className="w-2 h-2 text-white" /></div>}
                      {row.src === 'Instagram' && <div className="w-3 h-3 rounded-full bg-pink-500 flex items-center justify-center"><Camera className="w-2 h-2 text-white" /></div>}
                      {row.src}
                    </td>
                    <td className="py-3 text-xs text-[#6B7280]">{row.date}</td>
                    <td className="py-3">
                      <StatusBadge status={row.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Link href="/dashboard/inquiries" className="mt-4 flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg border border-[#E5E7EB] text-xs font-bold text-[#111111] hover:bg-[#F9FAFB] transition-colors">
            View All Inquiries <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Top Products */}
        <div className="lg:col-span-3 bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm flex flex-col">
          <h3 className="font-bold text-[#111111] mb-4">Top Products <span className="text-[10px] font-medium text-[#9CA3AF] font-sans">(This Week)</span></h3>
          <div className="flex-1 flex flex-col gap-4">
            {[
              { name: 'Polo T-Shirts', orders: 96, img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=100&q=80' },
              { name: 'Round Neck T-Shirts', orders: 74, img: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=100&q=80' },
              { name: 'Caps', orders: 42, img: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=100&q=80' },
              { name: 'Bags', orders: 28, img: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=100&q=80' },
              { name: 'Mugs', orders: 18, img: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=100&q=80' },
            ].map((prod, i) => (
              <div key={i} className="flex items-center gap-3">
                <img src={prod.img} alt={prod.name} className="w-10 h-10 rounded-lg object-cover bg-[#F3F4F6] border border-[#E5E7EB]" />
                <div>
                  <p className="text-xs font-bold text-[#111111]">{prod.name}</p>
                  <p className="text-[10px] font-medium text-[#6B7280]">{prod.orders} Orders</p>
                </div>
              </div>
            ))}
          </div>
          <Link href="/dashboard/products" className="mt-4 flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg border border-[#E5E7EB] text-xs font-bold text-[#111111] hover:bg-[#F9FAFB] transition-colors">
            View All Products <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-3 bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm flex flex-col">
          <h3 className="font-bold text-[#111111] mb-5">Recent Activity</h3>
          <div className="flex-1 relative">
            <div className="absolute top-1 bottom-1 left-2 w-px bg-[#F3F4F6]"></div>
            <div className="space-y-5">
              {[
                { text: 'New inquiry received from Rakesh Kumar', time: '2m ago', c: 'bg-green-500' },
                { text: 'Quote sent to Sunita Patel', time: '15m ago', c: 'bg-blue-500' },
                { text: 'Order #ZB-2024-032 confirmed', time: '1h ago', c: 'bg-amber-500' },
                { text: 'Payment received for Order #ZB-2024-030', time: '2h ago', c: 'bg-green-500' },
                { text: 'Dispatch update for Order #ZB-2024-028', time: '3h ago', c: 'bg-blue-500' },
              ].map((act, i) => (
                <div key={i} className="relative pl-6">
                  <div className={`absolute left-[5px] top-1.5 w-1.5 h-1.5 rounded-full ${act.c}`}></div>
                  <p className="text-xs font-medium text-[#374151] leading-snug">{act.text}</p>
                  <p className="text-[10px] font-medium text-[#9CA3AF] mt-0.5">{act.time}</p>
                </div>
              ))}
            </div>
          </div>
          <Link href="/dashboard/reports" className="mt-4 flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg border border-[#E5E7EB] text-xs font-bold text-[#111111] hover:bg-[#F9FAFB] transition-colors">
            View All Activity <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ── BOTTOM KPI CARDS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 5 — Orders */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--color-kpi-order-bg)', color: 'var(--color-kpi-order-icon)' }}>
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-semibold text-[#6B7280]">Total Orders</p>
            <h3 className="text-lg font-black text-[#111111] mt-0.5">156</h3>
          </div>
          <div className="text-right">
            <span className="flex items-center justify-end text-[10px] font-bold text-emerald-700">
              <ArrowUp className="w-3 h-3 mr-0.5" /> 14.3%
            </span>
            <span className="text-[9px] text-[#9CA3AF] font-medium">this month</span>
          </div>
        </div>

        {/* KPI 6 — Revenue */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--color-kpi-revenue-bg)', color: 'var(--color-kpi-revenue-icon)' }}>
            <IndianRupee className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-semibold text-[#6B7280]">Total Revenue</p>
            <h3 className="text-lg font-black text-[#111111] mt-0.5">₹6,78,540</h3>
          </div>
          <div className="text-right">
            <span className="flex items-center justify-end text-[10px] font-bold text-emerald-700">
              <ArrowUp className="w-3 h-3 mr-0.5" /> 16.5%
            </span>
            <span className="text-[9px] text-[#9CA3AF] font-medium">this month</span>
          </div>
        </div>

        {/* KPI 7 — Customers */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--color-kpi-customer-bg)', color: 'var(--color-kpi-customer-icon)' }}>
            <Users className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-semibold text-[#6B7280]">Total Customers</p>
            <h3 className="text-lg font-black text-[#111111] mt-0.5">312</h3>
          </div>
          <div className="text-right">
            <span className="flex items-center justify-end text-[10px] font-bold text-emerald-700">
              <ArrowUp className="w-3 h-3 mr-0.5" /> 10.2%
            </span>
            <span className="text-[9px] text-[#9CA3AF] font-medium">this month</span>
          </div>
        </div>

        {/* KPI 8 — Conversion */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--color-kpi-inquiry-bg)', color: 'var(--color-kpi-inquiry-icon)' }}>
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-semibold text-[#6B7280]">Conversion Rate</p>
            <h3 className="text-lg font-black text-[#111111] mt-0.5">18.7%</h3>
          </div>
          <div className="text-right">
            <span className="flex items-center justify-end text-[10px] font-bold text-emerald-700">
              <ArrowUp className="w-3 h-3 mr-0.5" /> 2.6%
            </span>
            <span className="text-[9px] text-[#9CA3AF] font-medium">this month</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Missing icons for the table and activities
function Globe(props: React.SVGProps<SVGSVGElement>) { return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/></svg> }
function MessageSquare(props: React.SVGProps<SVGSVGElement>) { return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> }
function Phone(props: React.SVGProps<SVGSVGElement>) { return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg> }
function Camera(props: React.SVGProps<SVGSVGElement>) { return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg> }
