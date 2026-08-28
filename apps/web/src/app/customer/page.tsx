'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Clock,
  IndianRupee,
  PlusCircle,
  Package,
  ArrowRight,
  ShoppingBag,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { API_URL } from '@/lib/api';
import { useCustomerUser } from '@/hooks/useCustomerUser';

export default function CustomerDashboardPage() {
  const { userName, companyName } = useCustomerUser();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomerData();
  }, []);

  const fetchCustomerData = async () => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('zobra_token') : null;
      if (!token) return;

      const res = await fetch(`${API_URL}/quotes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const quotesList = Array.isArray(data.data) ? data.data : Array.isArray(data.quotes) ? data.quotes : [];
        setQuotes(quotesList);
      }
    } catch (err) {
      console.error('Error fetching customer dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const activeQuotesCount = quotes.filter((q) => q.status === 'DRAFT' || q.status === 'SENT').length;
  const approvedQuotesCount = quotes.filter((q) => q.status === 'APPROVED').length;
  const totalSpend = quotes
    .filter((q) => q.status === 'APPROVED')
    .reduce((acc, q) => acc + (q.totalAmount || 0), 0);

  return (
    <div className="space-y-8">
      {/* Header & Quick Action CTAs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EEF2FF] text-[#3B6FEB] uppercase tracking-wider mb-2">
            CLIENT PORTAL
          </div>
          <h1 className="text-3xl sm:text-4xl font-heading font-black text-[#111111] tracking-tight" data-cy="customer-dashboard-company">
            {companyName}
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-1 font-medium">
            Welcome back, <span data-cy="customer-dashboard-welcome-name">{userName}</span>! Track quotes, merchandise orders &amp; invoices.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/customer/create-quote">
            <Button variant="primary" size="sm" className="gap-2 font-bold" data-cy="create-quote-cta">
              <PlusCircle className="w-4 h-4" /> CREATE NEW QUOTE
            </Button>
          </Link>
          <Link href="/customer/products" data-cy="browse-products-cta">
            <Button variant="outline" size="sm" className="gap-2 font-bold">
              <Package className="w-4 h-4" /> BROWSE PRODUCTS
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          title="Active Quotes"
          value={loading ? '...' : `${activeQuotesCount} Quotes`}
          sub={loading ? 'Loading...' : `${approvedQuotesCount} approved by you`}
          icon={<FileText className="w-4 h-4 text-[#3B6FEB]" />}
          iconBg="bg-blue-50"
        />
        <StatCard
          title="Approved Quotes"
          value={loading ? '...' : `${approvedQuotesCount} Quotes`}
          sub="Ready for order conversion"
          icon={<Clock className="w-4 h-4 text-emerald-600" />}
          iconBg="bg-emerald-50"
        />
        <StatCard
          title="Total Approved Spend"
          value={loading ? '...' : `₹${totalSpend.toLocaleString('en-IN')}`}
          sub="Official GST invoices available"
          icon={<IndianRupee className="w-4 h-4 text-indigo-600" />}
          iconBg="bg-indigo-50"
        />
      </div>

      {/* Recent Quotes Quick Table */}
      <Card className="bg-white border-[#E5E7EB] shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-[#E5E7EB]">
          <CardTitle className="font-heading font-bold text-[#111111] text-lg flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#3B6FEB]" /> Recent B2B Quotes
          </CardTitle>
          <Link href="/customer/quotes" className="text-xs text-[#3B6FEB] font-bold hover:underline flex items-center gap-1">
            View All Quotes <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          ) : quotes.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-3">
              <FileText className="w-10 h-10 text-gray-300 mx-auto" />
              <p className="text-sm font-bold text-[#111111]">No Quotes Found</p>
              <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
                Configure merchandise specifications in the product catalog or create quote wizard to create your first quote.
              </p>
              <Link href="/customer/create-quote">
                <Button variant="primary" size="sm" className="font-bold mt-2">
                  <PlusCircle className="w-3.5 h-3.5 mr-1.5" /> Create Quote
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[#E5E7EB]">
              {quotes.slice(0, 4).map((q) => (
                <div key={q.id} className="p-4 flex items-center justify-between text-xs hover:bg-[#F9FAFB] transition-colors">
                  <div className="space-y-0.5">
                    <span className="font-mono font-bold text-[#111111] block text-sm">{q.quoteNumber}</span>
                    <span className="text-[#6B7280]">
                      {q.items?.[0]?.product?.name || 'Custom Merchandise'}
                    </span>
                  </div>
                  <div className="text-right space-y-1">
                    <span className="font-mono font-bold text-[#111111] block text-sm">
                      ₹{q.totalAmount?.toLocaleString('en-IN')}
                    </span>
                    <StatusBadge status={q.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
