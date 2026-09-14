'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PlusCircle, ShoppingBag, FileText, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { API_URL } from '@/lib/api';

interface UnifiedRequest {
  id: string;
  type: 'QUOTE' | 'INQUIRY';
  number: string;
  createdAt: string;
  status: string;
  totalAmount?: number;
  description: string;
  details: string;
  raw: any;
}

export default function CustomerQuotesPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<UnifiedRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('zobra_token') : null;
      const headers = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const [quotesRes, inquiriesRes] = await Promise.all([
        fetch(`${API_URL}/quotes`, { headers }),
        fetch(`${API_URL}/inquiries`, { headers })
      ]);

      const quotesData = await quotesRes.json();
      const inquiriesData = await inquiriesRes.json();

      let combined: UnifiedRequest[] = [];

      if (quotesRes.ok && quotesData.success && Array.isArray(quotesData.data)) {
        combined = combined.concat(quotesData.data.map((q: any) => ({
          id: q.id,
          type: 'QUOTE',
          number: q.quoteNumber,
          createdAt: q.createdAt,
          status: q.status,
          totalAmount: q.totalAmount,
          description: q.items?.[0]?.product?.name || 'Custom Merchandise',
          details: q.items?.[0] ? `${q.items[0].quantity} Pcs | ${q.items[0].color} | Size ${q.items[0].size} | ${q.items[0].printType}` : 'Custom Specifications',
          raw: q
        })));
      }

      if (inquiriesRes.ok && inquiriesData.data && Array.isArray(inquiriesData.data)) {
        combined = combined.concat(inquiriesData.data.map((i: any) => ({
          id: i.id,
          type: 'INQUIRY',
          number: i.inquiryNumber,
          createdAt: i.createdAt,
          status: i.status,
          description: i.productInterest || 'Custom Mockup Request',
          details: i.quantity ? `${i.quantity} Pcs | Request pending pricing` : 'Pending specifications',
          raw: i
        })));
      } else if (inquiriesRes.ok && Array.isArray(inquiriesData)) {
        // Fallback if inquiries return array directly
        combined = combined.concat(inquiriesData.map((i: any) => ({
          id: i.id,
          type: 'INQUIRY',
          number: i.inquiryNumber,
          createdAt: i.createdAt,
          status: i.status,
          description: i.productInterest || 'Custom Mockup Request',
          details: i.quantity ? `${i.quantity} Pcs | Request pending pricing` : 'Pending specifications',
          raw: i
        })));
      }

      // Sort by descending date
      combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setRequests(combined);
    } catch (e) {
      console.error('Failed to fetch requests', e);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
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
        setRequests(requests.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));
      } else {
        setRequests(requests.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));
      }
    } catch {
      setRequests(requests.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));
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
            QUOTATIONS & REQUESTS
          </div>
          <h1 className="text-3xl sm:text-4xl font-heading font-black text-[#111111] tracking-tight">
            My Quotes & Requests
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-1 font-medium">
            Review quotation breakdowns, custom mockup requests, approve pricing, and convert to orders.
          </p>
        </div>
        <Link href="/customer/create-quote">
          <Button variant="primary" size="sm" className="gap-2 font-bold" data-cy="create-quote-btn">
            <PlusCircle className="w-4 h-4" /> NEW QUOTE / REQUEST
          </Button>
        </Link>
      </div>

      {/* Table Container */}
      <Card className="bg-white border-[#E5E7EB] p-0 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-xs text-[#6B7280] font-semibold">Loading requests from PostgreSQL...</div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-3">
            <FileText className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="text-sm font-bold text-[#111111]">No Quotations or Requests Found</p>
            <p className="text-xs text-[#6B7280]">Create a quote from the merchandise catalog or upload a custom mockup.</p>
            <Link href="/customer/create-quote">
              <Button variant="primary" size="sm" className="font-bold mt-2">
                Create Quote
              </Button>
            </Link>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="w-full min-w-[680px] text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#6B7280] uppercase tracking-wider font-bold">
                  <th className="p-4">Reference Number</th>
                  <th className="p-4">Product / Request Details</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Total Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] text-[#111111] font-medium">
                {requests.map((req) => {
                  return (
                    <tr key={req.id} className="hover:bg-[#F9FAFB] transition-colors" data-cy={`request-row-${req.number}`}>
                      <td className="p-4 font-mono font-bold text-[#111111]" data-cy="request-number-cell">
                        {req.number}
                        {req.type === 'INQUIRY' && (
                          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 uppercase">
                            MOCKUP
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="font-bold block text-[#111111]">{req.description}</span>
                        <span className="text-[11px] text-[#6B7280]">
                          {req.details}
                        </span>
                      </td>
                      <td className="p-4 text-[#6B7280]">{new Date(req.createdAt).toLocaleDateString('en-IN')}</td>
                      <td className="p-4 font-mono font-bold text-[#111111]" data-cy="request-total-cell">
                        {req.type === 'QUOTE' ? `₹${req.totalAmount?.toLocaleString('en-IN')}` : <span className="text-gray-400 font-medium italic">Pending Quote</span>}
                      </td>
                      <td className="p-4">
                        <div data-cy="request-status-badge">
                          <StatusBadge status={req.status} />
                        </div>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        {req.type === 'QUOTE' && req.status === 'APPROVED' && (
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={convertingId === req.id}
                            onClick={() => handleConvertToOrder(req.id)}
                            className="gap-1.5 font-bold"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            {convertingId === req.id ? 'CONVERTING...' : 'CONVERT TO ORDER'}
                          </Button>
                        )}
                        {req.type === 'QUOTE' && req.status !== 'APPROVED' && req.status !== 'REJECTED' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              data-cy="approve-quote-btn"
                              onClick={() => handleUpdateStatus(req.id, 'APPROVED')}
                              className="bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 font-bold"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> APPROVE
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateStatus(req.id, 'REJECTED')}
                              className="bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 font-bold"
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1" /> REJECT
                            </Button>
                          </>
                        )}
                        {req.type === 'INQUIRY' && (
                          <span className="text-xs text-gray-400 font-medium italic mr-2">Under Review</span>
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
