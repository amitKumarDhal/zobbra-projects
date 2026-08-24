'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileText, ShoppingBag, Download, CheckCircle2, Clock, User, LogOut, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { apiClient, formatINR } from '@/lib/api';

export default function CustomerPortalPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'quotes' | 'orders' | 'invoices' | 'profile'>('quotes');
  const [quotes, setQuotes] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/quotes');
      if (res.data.success) {
        setQuotes(res.data.quotes || []);
      }
    } catch (err: any) {
      console.error('Fetch portal quotes error:', err);
      if (err.response?.status === 401) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('zobra_user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {}
      }
    }
    fetchQuotes();
  }, []);

  const handleUpdateStatus = async (quoteId: string, newStatus: string) => {
    setActionLoading(quoteId);
    setNotice(null);
    try {
      const res = await apiClient.patch(`/quotes/${quoteId}/status`, { status: newStatus });
      if (res.data.success) {
        setNotice(`Quotation status updated to ${newStatus} successfully!`);
        fetchQuotes();
      }
    } catch (err: any) {
      console.error('Update status error:', err);
      alert(err.response?.data?.message || 'Failed to update quote status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('zobra_token');
    localStorage.removeItem('zobra_user');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="bg-slate-900 text-white h-16 px-8 flex items-center justify-between border-b border-slate-800">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 font-black flex items-center justify-center rounded-lg">Z</div>
          <span className="font-black text-lg">ZOBRA <span className="text-blue-400">CLIENT PORTAL</span></span>
        </Link>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <span>{user?.company?.name || 'Client Account'} {user?.company?.gstin ? `(GSTIN: ${user.company.gstin})` : ''}</span>
          <button onClick={handleLogout} className="text-slate-400 hover:text-white flex items-center gap-1">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-1 w-full">
        {/* Welcome Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 custom-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Welcome Back, {user?.name || 'Valued Client'}</h1>
            <p className="text-xs text-slate-500 font-semibold">{user?.email} {user?.company?.name ? `• ${user.company.name}` : ''}</p>
          </div>
          <Link href="/products/polo-t-shirt">
            <Button variant="secondary" className="font-bold">
              + REQUEST NEW QUOTE
            </Button>
          </Link>
        </div>

        {notice && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-bold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {notice}
            </span>
            <button onClick={() => setNotice(null)} className="text-slate-400 hover:text-slate-600">✕</button>
          </div>
        )}

        {/* Portal Tabs */}
        <div className="flex border-b border-slate-200 space-x-8 text-sm font-bold">
          {[
            { key: 'quotes', label: `My Quotes (${quotes.length})`, icon: FileText },
            { key: 'orders', label: 'Active Orders (1)', icon: ShoppingBag },
            { key: 'invoices', label: 'Invoices (1)', icon: Download },
            { key: 'profile', label: 'Company Profile', icon: User },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`pb-4 flex items-center gap-2 border-b-2 transition-all ${
                  isActive ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content: Quotes */}
        {activeTab === 'quotes' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900">Your Quotations (PostgreSQL DB)</h2>
              <Button variant="outline" size="sm" onClick={fetchQuotes} className="gap-1">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </Button>
            </div>

            {loading ? (
              <div className="bg-white p-12 rounded-3xl text-center text-slate-400 font-bold">
                Loading quotations...
              </div>
            ) : quotes.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl text-center space-y-3 border border-slate-200">
                <FileText className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-700 text-base">No Quotes Found</h3>
                <p className="text-xs text-slate-400">Configure a product and request your first B2B quote.</p>
                <Link href="/products/polo-t-shirt">
                  <Button variant="secondary" size="sm" className="mt-2">Browse Products & Request Quote</Button>
                </Link>
              </div>
            ) : (
              quotes.map((q) => {
                const item = q.items && q.items[0];
                const isApproved = q.status === 'APPROVED';
                const isRejected = q.status === 'REJECTED';
                const canApprove = q.status === 'SENT' || q.status === 'DRAFT';

                return (
                  <div key={q.id} className="bg-white p-6 rounded-3xl border border-slate-200 custom-shadow space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg">Quotation #{q.quoteNumber}</h3>
                        <p className="text-xs text-slate-400 font-medium">
                          Created: {new Date(q.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <Badge variant={isApproved ? 'success' : isRejected ? 'danger' : 'info'}>{q.status}</Badge>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 text-xs">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                          <span className="text-slate-400 block font-bold">Product</span>
                          <span className="font-bold text-slate-900">{item?.product?.name || 'Polo T-Shirt'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-bold">Print & Specs</span>
                          <span className="font-bold text-slate-900">{item?.printType || 'Front Only'} ({item?.color || 'N/A'}, Size {item?.size || 'L'})</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-bold">Quantity</span>
                          <span className="font-bold text-slate-900">{item?.quantity || 50} Pcs</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-bold">Grand Total (incl GST)</span>
                          <span className="font-black text-blue-600 text-sm">{formatINR(q.totalAmount)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <a href={`http://localhost:5000/api/v1/quotes/${q.id}/pdf`} target="_blank" rel="noreferrer">
                        <Button variant="outline" size="sm" className="gap-2">
                          <Download className="w-4 h-4" /> Download PDF Quote
                        </Button>
                      </a>

                      {canApprove && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="danger"
                            size="sm"
                            disabled={actionLoading === q.id}
                            onClick={() => handleUpdateStatus(q.id, 'REJECTED')}
                          >
                            Reject Quote
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={actionLoading === q.id}
                            onClick={() => handleUpdateStatus(q.id, 'APPROVED')}
                          >
                            {actionLoading === q.id ? 'Processing...' : 'Approve & Convert to Order'}
                          </Button>
                        </div>
                      )}
                      {isApproved && (
                        <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Quote Approved by You
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 custom-shadow space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Order #ZQB-ORD-2026-5001</h3>
                <p className="text-xs text-slate-400 font-bold">Converted from Quote ZQB-QT-2026-1001</p>
              </div>
              <Badge variant="info">IN PRINTING</Badge>
            </div>

            {/* Live Order Timeline Visualizer */}
            <div className="py-6 border-y border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase block mb-4">Live Production Timeline</span>
              <div className="grid grid-cols-5 gap-2 text-center text-[10px] font-bold">
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto">✓</div>
                  <span className="text-slate-900">Order Confirmed</span>
                </div>
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center mx-auto animate-pulse">2</div>
                  <span className="text-blue-600">Printing (DTF)</span>
                </div>
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center mx-auto">3</div>
                  <span className="text-slate-400">Quality Check</span>
                </div>
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center mx-auto">4</div>
                  <span className="text-slate-400">Packing</span>
                </div>
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center mx-auto">5</div>
                  <span className="text-slate-400">Dispatched</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'invoices' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 custom-shadow space-y-4">
            <h3 className="font-bold text-slate-900 text-lg">Tax Invoices</h3>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                <tr>
                  <th className="p-3">Invoice Number</th>
                  <th className="p-3">Subtotal</th>
                  <th className="p-3">GST (5%)</th>
                  <th className="p-3">Total Amount</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                <tr>
                  <td className="p-3 font-bold text-slate-900">INV-2026-8001</td>
                  <td className="p-3">₹24,900.00</td>
                  <td className="p-3">₹1,245.00</td>
                  <td className="p-3 font-black text-slate-900">₹26,145.00</td>
                  <td className="p-3"><Badge variant="success">PAID</Badge></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 custom-shadow space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 text-lg">Company Profile</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-slate-400 font-bold block">Contact Name</span><span className="font-bold text-slate-900">{user?.name || 'N/A'}</span></div>
              <div><span className="text-slate-400 font-bold block">Company Name</span><span className="font-bold text-slate-900">{user?.company?.name || 'N/A'}</span></div>
              <div><span className="text-slate-400 font-bold block">GSTIN</span><span className="font-bold text-slate-900 font-mono">{user?.company?.gstin || 'N/A'}</span></div>
              <div><span className="text-slate-400 font-bold block">Email</span><span className="font-bold text-slate-900">{user?.email}</span></div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

