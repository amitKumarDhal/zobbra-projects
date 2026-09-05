'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  FileText,
  Package,
  ShoppingBag,
  TrendingUp,
  IndianRupee,
  ArrowRight,
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';
import { apiFetch } from '@/lib/api';

const AVATAR_PALETTE = [
  'bg-[#EEF2FF] text-[#3B6FEB]',
  'bg-[#F0FDFA] text-[#0D9488]',
  'bg-[#F5F3FF] text-[#7C3AED]',
  'bg-[#FFFBEB] text-[#D97706]',
  'bg-[#FFF1F2] text-[#BE123C]',
];
const avatarClass = (i: number) => AVATAR_PALETTE[i % AVATAR_PALETTE.length];

export default function AdminDashboardPage() {
  const { data: salesRes, isLoading: loadingSales } = useQuery({
    queryKey: ['admin-sales-report'],
    queryFn: () => apiFetch('/reports/sales').then(res => res.json()),
  });

  const { data: inquiriesRes, isLoading: loadingInquiries } = useQuery({
    queryKey: ['admin-recent-inquiries'],
    queryFn: () => apiFetch('/inquiries?limit=5').then(res => res.json()),
  });

  const { data: activityRes, isLoading: loadingActivity } = useQuery({
    queryKey: ['admin-recent-activity'],
    queryFn: () => apiFetch('/reports/activity').then(res => res.json()),
  });

  const { data: inquiryStatsRes } = useQuery({
    queryKey: ['admin-inquiry-stats'],
    queryFn: () => apiFetch('/inquiries/stats').then(res => res.json()),
  });

  const sales = salesRes?.report || { totalOrders: 0, totalQuotes: 0, totalCustomers: 0, totalRevenue: 0 };
  const recentInquiries = inquiriesRes?.data || [];
  const activities = activityRes?.activities || [];
  const totalInquiries = inquiryStatsRes?.totalInquiries || 0;
  
  if (loadingSales || loadingInquiries || loadingActivity) {
    return (
      <div className="space-y-6 pb-12 font-sans bg-[#F8F9FC] min-h-screen p-6">
        <div>
          <h1 className="text-3xl font-heading font-black text-[#111111]">Dashboard</h1>
          <p className="text-sm text-[#6B7280] font-medium mt-1">Loading real-time data...</p>
        </div>
        <div className="animate-pulse flex gap-4">
          <div className="h-24 bg-gray-200 rounded-2xl w-full"></div>
          <div className="h-24 bg-gray-200 rounded-2xl w-full"></div>
          <div className="h-24 bg-gray-200 rounded-2xl w-full"></div>
          <div className="h-24 bg-gray-200 rounded-2xl w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 font-sans bg-[#F8F9FC] min-h-screen">
      <div>
        <h1 className="text-3xl font-heading font-black text-[#111111]">Dashboard</h1>
        <p className="text-sm text-[#6B7280] font-medium mt-1">Welcome back, Admin! 👋</p>
      </div>

      {/* ── TOP KPI CARDS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--color-kpi-inquiry-bg)', color: 'var(--color-kpi-inquiry-icon)' }}>
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#6B7280]">Total Inquiries</p>
              <h3 className="text-2xl font-black text-[#111111] mt-0.5">{totalInquiries}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--color-kpi-quote-bg)', color: 'var(--color-kpi-quote-icon)' }}>
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#6B7280]">Total Quotes</p>
              <h3 className="text-2xl font-black text-[#111111] mt-0.5">{sales.totalQuotes}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--color-kpi-order-bg)', color: 'var(--color-kpi-order-icon)' }}>
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#6B7280]">Total Orders</p>
              <h3 className="text-2xl font-black text-[#111111] mt-0.5">{sales.totalOrders}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--color-kpi-revenue-bg)', color: 'var(--color-kpi-revenue-icon)' }}>
              <IndianRupee className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#6B7280]">Total Revenue</p>
              <h3 className="text-2xl font-black text-[#111111] mt-0.5">₹{sales.totalRevenue.toLocaleString()}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* ── LOWER SECTION ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-6">
        
        {/* Recent Inquiries List */}
        <div className="lg:col-span-6 bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#111111]">Recent Inquiries</h3>
            <Link href="/dashboard/inquiries" className="text-[10px] font-bold text-[#3B6FEB] hover:underline uppercase tracking-wider">
              View All
            </Link>
          </div>
          <div className="flex-1 flex flex-col gap-4">
            {recentInquiries.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No inquiries found.</p>
            ) : (
              recentInquiries.map((item: any, i: number) => {
                const name = item.customerName || item.customer?.name || 'Guest';
                const init = name.substring(0, 2).toUpperCase();
                return (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${avatarClass(i)}`}>
                      {init}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[#111111] truncate">{name}</p>
                      <p className="text-[10px] text-[#6B7280] truncate">{item.productInterest || 'Custom Request'}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[10px] text-[#9CA3AF] mb-1">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                      <StatusBadge status={item.status} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-6 bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm flex flex-col">
          <h3 className="font-bold text-[#111111] mb-5">Recent System Activity</h3>
          <div className="flex-1 relative">
            {activities.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No recent activity found in database.</p>
            ) : (
              <>
                <div className="absolute top-1 bottom-1 left-2 w-px bg-[#F3F4F6]"></div>
                <div className="space-y-5">
                  {activities.map((act: any, i: number) => (
                    <div key={act.id || i} className="relative pl-6">
                      <div className={`absolute left-[5px] top-1.5 w-1.5 h-1.5 rounded-full bg-blue-500`}></div>
                      <p className="text-xs font-medium text-[#374151] leading-snug">
                        {act.message} {act.user?.name ? `by ${act.user.name}` : ''}
                      </p>
                      <p className="text-[10px] font-medium text-[#9CA3AF] mt-0.5">
                        {new Date(act.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <Link href="/dashboard/reports" className="mt-4 flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg border border-[#E5E7EB] text-xs font-bold text-[#111111] hover:bg-[#F9FAFB] transition-colors">
            View All Reports <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
