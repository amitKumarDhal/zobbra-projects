'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PlusCircle, ShoppingBag, FileText, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { API_URL } from '@/lib/api';

interface QuoteItem {
  id: string;
  quoteNumber: string;
  createdAt: string;
  status: 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  totalAmount: number;
  subtotal: number;
  gstTotal: number;
  items?: Array<{
    product?: { name: string };
    quantity: number;
    color: string;
    size: string;
    printType: string;
    unitPrice: number;
    totalPrice: number;
  }>;
}

export default function CustomerQuotesPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<QuoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('zobra_token') : null;
      const res = await fetch(`${API_URL}/quotes`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.data)) {
        setQuotes(data.data);
      } else {
        setQuotes([]);
      }
    } catch {
      setQuotes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: 'APPROVED' | 'REJECTED') => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('zobra_token') : null;
      const res = await fetch(`${API_URL}/quotes/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setQuotes(quotes.map((q) => (q.id === id ? { ...q, status: newStatus } : q)));
      } else {
        setQuotes(quotes.map((q) => (q.id === id ? { ...q, status: newStatus } : q)));
      }
    } catch {
      setQuotes(quotes.map((q) => (q.id === id ? { ...q, status: newStatus } : q)));
    }
  };

  const handleConvertToOrder = async (quoteId: string) => {
    setConvertingId(quoteId);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('zobra_token') : null;
      const res = await fetch(`${API_URL}/orders/from-quote/${quoteId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        router.push('/customer/orders');
      } else {
        alert(data.message || 'Failed to convert quote to order');
      }
    } catch (e: any) {
      alert(e.message || 'Failed to connect to backend server.');
    } finally {
      setConvertingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EEF2FF] text-[#3B6FEB] uppercase tracking-wider mb-2">
            QUOTATION RECORDS
          </div>
          <h1 className="text-3xl sm:text-4xl font-heading font-black text-[#111111] tracking-tight">
            My Quotations
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-1 font-medium">
            Review quotation breakdowns, approve pricing, and convert approved quotes to orders.
          </p>
        </div>
        <Link href="/customer/create-quote">
          <Button variant="primary" size="sm" className="gap-2 font-bold" data-cy="create-quote-btn">
            <PlusCircle className="w-4 h-4" /> CREATE NEW QUOTE
          </Button>
        </Link>
      </div>

      {/* Table Container */}
      <Card className="bg-white border-[#E5E7EB] p-0 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-xs text-[#6B7280] font-semibold">Loading quotes from PostgreSQL...</div>
        ) : quotes.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-3">
            <FileText className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="text-sm font-bold text-[#111111]">No Quotations Found</p>
            <p className="text-xs text-[#6B7280]">Create a quote from the merchandise catalog to see it persisted here.</p>
            <Link href="/customer/create-quote">
              <Button variant="primary" size="sm" className="font-bold mt-2">
                Create Quote
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#6B7280] uppercase tracking-wider font-bold">
                  <th className="p-4">Quote Number</th>
                  <th className="p-4">Product Specs</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Total Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] text-[#111111] font-medium">
                {quotes.map((q) => {
                  const item = q.items?.[0];
                  return (
                    <tr key={q.id} className="hover:bg-[#F9FAFB] transition-colors" data-cy={`quote-row-${q.quoteNumber}`}>
                      <td className="p-4 font-mono font-bold text-[#111111]" data-cy="quote-number-cell">
                        {q.quoteNumber}
                      </td>
                      <td className="p-4">
                        <span className="font-bold block text-[#111111]">{item?.product?.name || 'Custom Merchandise'}</span>
                        <span className="text-[11px] text-[#6B7280]">
                          {item ? `${item.quantity} Pcs | ${item.color} | Size ${item.size} | ${item.printType}` : 'Custom Specifications'}
                        </span>
                      </td>
                      <td className="p-4 text-[#6B7280]">{new Date(q.createdAt).toLocaleDateString('en-IN')}</td>
                      <td className="p-4 font-mono font-bold text-[#111111]" data-cy="quote-total-cell">
                        ₹{q.totalAmount?.toLocaleString('en-IN')}
                      </td>
                      <td className="p-4">
                        <div data-cy="quote-status-badge">
                          <StatusBadge status={q.status} />
                        </div>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        {q.status === 'APPROVED' && (
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={convertingId === q.id}
                            onClick={() => handleConvertToOrder(q.id)}
                            className="gap-1.5 font-bold"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            {convertingId === q.id ? 'CONVERTING...' : 'CONVERT TO ORDER'}
                          </Button>
                        )}
                        {q.status !== 'APPROVED' && q.status !== 'REJECTED' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              data-cy="approve-quote-btn"
                              onClick={() => handleUpdateStatus(q.id, 'APPROVED')}
                              className="bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 font-bold"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> APPROVE
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateStatus(q.id, 'REJECTED')}
                              className="bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 font-bold"
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1" /> REJECT
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
