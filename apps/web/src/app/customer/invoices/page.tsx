'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Download, FileText, Sparkles, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { API_URL } from '@/lib/api';

interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  amount: number;
  gstAmount: number;
  totalAmount: number;
  status: string;
  createdAt: string;
  dueDate?: string;
  order?: {
    id: string;
    orderNumber: string;
    status: string;
    paymentStatus: string;
  };
  company?: {
    name: string;
    gstin?: string;
  };
}

export default function CustomerInvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchInvoices = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('zobra_token') : null;
      const res = await fetch(`${API_URL}/invoices?pageSize=50`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const invoiceList = Array.isArray(data.data) ? data.data : Array.isArray(data.invoices) ? data.invoices : [];
        setInvoices(invoiceList);
      }
    } catch (err) {
      console.error('Failed to fetch customer invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleDownloadPdf = async (invoiceId: string, invoiceNumber: string) => {
    setDownloadingId(invoiceId);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('zobra_token') : null;
      const res = await fetch(`${API_URL}/invoices/${invoiceId}/pdf`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error('Failed to download invoice PDF');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice-${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF download error:', err);
      alert('Failed to download invoice PDF.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EEF2FF] text-[#3B6FEB] uppercase tracking-wider mb-2">
            <Sparkles className="w-3 h-3" /> GST BILLING
          </div>
          <h1 className="text-3xl sm:text-4xl font-heading font-black text-[#111111] tracking-tight">
            Tax Invoices
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-1 font-medium">
            Download official GST tax invoices for accounting & input tax credit (ITC).
          </p>
        </div>
        <Link href="/customer/orders">
          <Button variant="primary" size="sm" className="gap-2 font-bold">
            <Package className="w-4 h-4" /> MY ORDERS
          </Button>
        </Link>
      </div>

      {/* Invoices Table Card */}
      <Card className="bg-white border-[#E5E7EB] p-0 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 space-y-3">
            <div className="h-6 w-1/3 bg-gray-100 animate-pulse rounded" />
            <div className="h-10 w-full bg-gray-50 animate-pulse rounded" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#111111]">No Tax Invoices Found</h3>
            <p className="text-xs text-[#6B7280] mt-1 max-w-sm mx-auto">
              Invoices are automatically generated when approved quotations are converted to orders.
            </p>
            <Link href="/customer/quotes">
              <Button variant="outline" size="sm" className="mt-4 font-bold">
                VIEW APPROVED QUOTES
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left border-collapse text-xs" data-cy="invoices-table">
              <thead>
                <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#6B7280] uppercase tracking-wider font-bold">
                  <th className="p-4">Invoice #</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Order Ref</th>
                  <th className="p-4 text-right">Taxable Value</th>
                  <th className="p-4 text-right">GST (5%)</th>
                  <th className="p-4 text-right">Total Amount</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] text-[#111111] font-medium">
                {invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-[#F9FAFB] transition-colors"
                    data-cy={`invoice-row-${inv.invoiceNumber}`}
                  >
                    <td className="p-4 font-mono font-bold text-[#111111]" data-cy="invoice-number-cell">
                      {inv.invoiceNumber}
                    </td>
                    <td className="p-4 text-[#6B7280]" data-cy="invoice-date-cell">
                      {new Date(inv.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="p-4 font-mono text-[#3B6FEB] font-bold" data-cy="invoice-order-cell">
                      {inv.order?.orderNumber || 'N/A'}
                    </td>
                    <td className="p-4 font-mono text-right" data-cy="invoice-taxable-cell">
                      ₹{(inv.amount ?? 0).toLocaleString('en-IN')}
                    </td>
                    <td className="p-4 text-[#6B7280] font-mono text-right" data-cy="invoice-gst-cell">
                      ₹{(inv.gstAmount ?? 0).toLocaleString('en-IN')}
                    </td>
                    <td className="p-4 font-mono font-bold text-right text-[#111111]" data-cy="invoice-total-cell">
                      ₹{(inv.totalAmount ?? 0).toLocaleString('en-IN')}
                    </td>
                    <td className="p-4 text-center" data-cy="invoice-status-cell">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="p-4 text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={downloadingId === inv.id}
                        data-cy={`download-pdf-btn-${inv.invoiceNumber}`}
                        className="gap-1.5 text-xs font-bold"
                        onClick={() => handleDownloadPdf(inv.id, inv.invoiceNumber)}
                      >
                        <Download className="w-3.5 h-3.5 text-[#3B6FEB]" />
                        {downloadingId === inv.id ? 'DOWNLOADING...' : 'PDF'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
