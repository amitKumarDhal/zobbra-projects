'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, FileText, Download, ExternalLink, MoreVertical, MessageSquare, Phone, MapPin, X, ArrowRight, CheckCircle, Clock, CheckCircle2, Users, Copy, ShoppingCart, UserCircle, Edit2, Send, Plus, Eye } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';

import { API_URL } from '@/lib/api';

// Types
type QuoteStatus = 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

interface Quote {
  id: string;
  quoteNumber: string;
  subtotal: number;
  gstTotal: number;
  discount: number;
  totalAmount: number;
  status: QuoteStatus;
  validUntil: string;
  createdAt: string;
  notes?: string;
  customer: { id: string; name: string; email: string; phone: string };
  company?: { id: string; name: string; gstin: string };
  items: any[];
  activities: any[];
}

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [stats, setStats] = useState<any>({ total: 0, sent: 0, pending: 0, approved: 0, expired: 0, draft: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Drawer State
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, pageSize: 10 });

  useEffect(() => {
    fetchData();
  }, [search, page]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [resList, resStats] = await Promise.all([
        fetch(`${API_URL}/quotes?search=${search}&page=${page}`, { headers }).then(r => r.json()),
        fetch(`${API_URL}/quotes/stats`, { headers }).then(r => r.json())
      ]);

      if(resList.success) {
        setQuotes(resList.data || []);
        if (resList.pagination) setPagination(resList.pagination);
      }
      
      if(resStats.success) {
        setStats(resStats.stats || {});
      }
    } catch (error) {
      console.error('Failed to load quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenQuote = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/quotes/${id}`, { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } }).then(r => r.json());
      if(res.success) {
        setSelectedQuote(res.quote);
        setIsDrawerOpen(true);
      }
    } catch(err) {
      console.error('Failed to load quote details', err);
    }
  };

  const handleWhatsApp = async (quoteId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/quotes/${quoteId}/whatsapp`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json());
      if (res.whatsappUrl || res.link) {
        window.open(res.whatsappUrl || res.link, '_blank');
      }
      fetchData();
    } catch (err: any) {
      console.error('Failed to trigger WhatsApp for quote:', err);
    }
  };

  const getStatusColor = (status: QuoteStatus) => {
    switch (status) {
      case 'DRAFT': return 'text-slate-600 bg-slate-50 border-slate-200';
      case 'SENT': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'APPROVED': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'REJECTED': return 'text-red-600 bg-red-50 border-red-200';
      case 'EXPIRED': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-amber-600 bg-amber-50 border-amber-200';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const getValidityDisplay = (validUntil: string, status: QuoteStatus) => {
    if (status === 'EXPIRED') return <span className="text-red-500 font-bold">(Expired)</span>;
    if (status === 'APPROVED') return <span className="text-emerald-500 font-bold">(Accepted)</span>;

    const diffTime = new Date(validUntil).getTime() - new Date().getTime();
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (days < 0) return <span className="text-red-500 font-bold">(Expired)</span>;
    if (days === 0) return <span className="text-amber-500 font-bold">(Expires Today)</span>;
    return <span className="text-amber-500 font-bold">({days} days left)</span>;
  };

  return (
    <div className="space-y-6 pb-12 font-sans bg-[#F8F9FC] min-h-screen relative flex flex-col">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-black text-[#111111]">Quote</h1>
          <p className="text-sm text-[#6B7280] font-medium mt-1">Manage and track all customer quotes</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-white border border-[#E5E7EB] text-[#111111] px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm hover:bg-[#F9FAFB] transition-colors flex items-center gap-2">
            <Download className="w-4 h-4"/> Export
          </button>
          <Link href="/dashboard/quotes/new" className="bg-[#3B6FEB] text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm hover:bg-[#2563EB] transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create New Quote
          </Link>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard icon={<Users className="w-5 h-5 text-purple-600" />} iconBg="bg-purple-50" title="Total Quotes" value={stats.total} trend={12.3} />
        <StatCard icon={<Send className="w-5 h-5 text-green-600" />} iconBg="bg-green-50" title="Sent Quotes" value={stats.sent} trend={15.6} />
        <StatCard icon={<Clock className="w-5 h-5 text-amber-600" />} iconBg="bg-amber-50" title="Pending Quotes" value={stats.pending || (stats.sent + stats.draft)} trend={8.7} />
        <StatCard icon={<CheckCircle2 className="w-5 h-5 text-blue-600" />} iconBg="bg-blue-50" title="Accepted Quotes" value={stats.approved} trend={10.2} />
        <StatCard icon={<X className="w-5 h-5 text-red-600" />} iconBg="bg-red-50" title="Expired Quotes" value={stats.expired} trend={-2.1} />
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex flex-1 gap-6 relative">
        {/* LIST TABLE */}
        <div className={`bg-white border border-[#E5E7EB] rounded-2xl shadow-sm transition-all duration-300 flex-1 ${isDrawerOpen ? 'w-2/3 hidden lg:block' : 'w-full'}`}>
          {/* Toolbar */}
          <div className="p-4 border-b border-[#E5E7EB] flex flex-wrap gap-3 justify-between items-center bg-[#FDFDFD] rounded-t-2xl">
            <div className="relative flex-1 min-w-[250px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
              <input 
                type="text" 
                placeholder="Search by Quote ID, Customer, Email..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#111111] focus:outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] shadow-sm transition-shadow"
              />
            </div>
            <div className="flex items-center gap-2">
              <select className="px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#374151] outline-none hover:bg-[#F9FAFB]">
                <option>All Status</option>
                <option>DRAFT</option>
                <option>SENT</option>
                <option>APPROVED</option>
              </select>
              <select className="px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#374151] outline-none hover:bg-[#F9FAFB]">
                <option>All Products</option>
              </select>
              <select className="px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#374151] outline-none hover:bg-[#F9FAFB] hidden sm:block">
                <option>All Assigned To</option>
              </select>
              <button className="flex items-center gap-2 px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm font-semibold text-[#374151] hover:bg-[#F9FAFB] transition-colors bg-white">
                <Filter className="w-4 h-4" /> Filter
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm font-semibold text-[#374151] hover:bg-[#F9FAFB] transition-colors bg-white">
                Reset
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E7EB]">
                  <th className="px-4 py-3 w-10 text-center"><input type="checkbox" className="rounded border-gray-300" /></th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Quote ID</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Products</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Valid Till</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Assigned To</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {loading ? (
                  <tr><td colSpan={9} className="p-8 text-center text-gray-500 font-medium">Loading quotes...</td></tr>
                ) : quotes.length === 0 ? (
                  <tr><td colSpan={9} className="p-8 text-center text-gray-500 font-medium">No quotes found.</td></tr>
                ) : quotes.map((q) => (
                  <tr key={q.id} className="hover:bg-[#F9FAFB] transition-colors cursor-pointer group" onClick={() => handleOpenQuote(q.id)}>
                    <td className="px-4 py-4 text-center"><input type="checkbox" className="rounded border-gray-300" onClick={e=>e.stopPropagation()} /></td>
                    <td className="px-4 py-4 text-xs font-bold text-[#111111]" data-cy="admin-quote-number-cell">{q.quoteNumber}</td>
                    <td className="px-4 py-4">
                      <p className="text-xs font-bold text-[#111111]">{q.customer?.name}</p>
                      <p className="text-[10px] text-[#6B7280] mt-0.5">{q.company?.name || 'Individual'}</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                         {/* Product thumbnails mockup - in reality you would map q.items to icons/images */}
                         <div className="w-7 h-7 bg-[#F3F4F6] rounded border border-[#E5E7EB] flex items-center justify-center text-xs">👕</div>
                         {q.items.length > 1 && (
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-[#111111]">+{q.items.length - 1}</span>
                              <span className="text-[9px] text-[#6B7280] leading-none">{q.items.length} Items</span>
                            </div>
                         )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs font-bold text-[#111111]">{formatCurrency(q.totalAmount)}</td>
                    <td className="px-4 py-4">
                      <p className="text-xs text-[#111111]">{new Date(q.validUntil).toLocaleDateString()}</p>
                      <p className="text-[10px]">{getValidityDisplay(q.validUntil, q.status)}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md border ${getStatusColor(q.status)}`}>
                        {q.status === 'SENT' ? 'Pending' : q.status.charAt(0) + q.status.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#E5E7EB] flex items-center justify-center text-[10px] font-bold text-[#374151]">
                           S
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-[#374151]">Sales Rep</span>
                          <span className="text-[9px] text-[#6B7280]">Sales Executive</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 bg-white border border-[#E5E7EB] text-[#6B7280] hover:text-[#3B6FEB] rounded shadow-sm" title="View Details" data-cy="admin-row-view-btn" onClick={(e) => { e.stopPropagation(); handleOpenQuote(q.id); }}><Eye className="w-3.5 h-3.5" /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleWhatsApp(q.id); }} className="p-1.5 bg-white border border-[#E5E7EB] text-green-600 hover:text-green-700 rounded shadow-sm" title="WhatsApp" data-cy="whatsapp-btn"><MessageSquare className="w-3.5 h-3.5" /></button>
                        <button className="p-1.5 bg-white border border-[#E5E7EB] text-[#6B7280] hover:text-[#111111] rounded shadow-sm" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button className="p-1.5 bg-white border border-[#E5E7EB] text-[#6B7280] hover:text-[#111111] rounded shadow-sm" title="More Options"><MoreVertical className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="p-4 border-t border-[#E5E7EB] flex justify-between items-center text-xs text-[#6B7280]">
            <span>Showing {(page - 1) * pagination.pageSize + 1} to {Math.min(page * pagination.pageSize, pagination.total)} of {pagination.total} quotes</span>
            <div className="flex gap-1 items-center">
              <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-2 py-1 border border-[#E5E7EB] rounded hover:bg-[#F3F4F6] disabled:opacity-50">&lt;</button>
              <span className="px-3 font-semibold text-[#111111]">{page}</span>
              <button disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)} className="px-2 py-1 border border-[#E5E7EB] rounded hover:bg-[#F3F4F6] disabled:opacity-50">&gt;</button>
              
              <select className="ml-4 border border-[#E5E7EB] rounded px-2 py-1 bg-white outline-none">
                <option>10 / page</option>
              </select>
            </div>
          </div>
        </div>

        {/* RIGHT DRAWER */}
        {isDrawerOpen && selectedQuote && (
          <QuoteDrawer 
            quote={selectedQuote} 
            onClose={() => setIsDrawerOpen(false)} 
            onRefresh={() => { handleOpenQuote(selectedQuote.id); fetchData(); }}
          />
        )}
      </div>
    </div>
  );
}


// ---------------------------------------------------------
// RIGHT SIDE DRAWER COMPONENT
// ---------------------------------------------------------
function QuoteDrawer({ quote, onClose, onRefresh }: { quote: Quote, onClose: () => void, onRefresh: () => void }) {
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const getStatusColor = (status: QuoteStatus) => {
    switch (status) {
      case 'DRAFT': return 'text-slate-600 bg-slate-50 border-slate-200';
      case 'SENT': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'APPROVED': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'REJECTED': return 'text-red-600 bg-red-50 border-red-200';
      case 'EXPIRED': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-amber-600 bg-amber-50 border-amber-200';
    }
  };

  const numberToWords = (num: number) => {
    // Very basic mockup of number to words for demonstration
    // A real implementation would use a library like number-to-words
    return `Rupees ${num.toLocaleString('en-IN')} Only`; 
  };

  const openWhatsApp = async () => {
    try {
      const res = await fetch(`${API_URL}/quotes/${quote.id}/whatsapp`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
      }).then(r => r.json());
      if(res.link) window.open(res.link, '_blank');
      onRefresh();
    } catch (err: any) {
      console.error('Failed to generate link');
    }
  };

  const markAccepted = async () => {
    try {
      await fetch(`${API_URL}/quotes/${quote.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') },
        body: JSON.stringify({ status: 'APPROVED' })
      });
      onRefresh();
    } catch (error) {
      console.error('Error approving quote', error);
    }
  };

  const convertToOrder = async () => {
    try {
      const res = await fetch(`${API_URL}/orders/from-quote/${quote.id}`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
      }).then(r => r.json());
      
      if(res.success && res.order) {
        window.location.href = `/dashboard/orders/${res.order.id}`;
      } else {
        alert(res.message || 'Failed to convert to order');
      }
    } catch (error) {
      console.error('Error converting to order', error);
    }
  };

  return (
    <div className="w-full lg:w-1/3 min-w-[380px] bg-white border border-[#E5E7EB] rounded-2xl shadow-xl flex flex-col h-[calc(100vh-140px)] sticky top-6 overflow-hidden">
      
      {/* Drawer Header */}
      <div className="p-5 border-b border-[#E5E7EB] flex items-start justify-between bg-[#FDFDFD]">
        <div>
          <h2 className="text-lg font-heading font-black text-[#111111]">Quote Details</h2>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-sm font-bold text-[#111111]">{quote.quoteNumber}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusColor(quote.status)}`}>
              {quote.status === 'SENT' ? 'Pending' : quote.status}
            </span>
          </div>
          <p className="text-[10px] text-[#6B7280] mt-1">{new Date(quote.createdAt).toLocaleString()}</p>
        </div>
        <button onClick={onClose} className="p-1.5 text-[#9CA3AF] hover:text-[#111111] hover:bg-[#F3F4F6] rounded-lg transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6 hide-scrollbar">
        
        {/* Customer Information */}
        <div>
          <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wider flex items-center gap-2 mb-3"><UserCircle className="w-4 h-4"/> Customer Information</h3>
          <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-4 space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                {quote.customer.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-[#111111]">{quote.customer.name}</p>
                <p className="text-[10px] text-[#6B7280]">{quote.company?.name || 'Corporate Solutions'}</p>
              </div>
            </div>
            
            <div className="flex items-center mt-2 border-t border-[#E5E7EB] pt-3"><Phone className="w-3.5 h-3.5 text-[#6B7280] mr-2"/> <span className="font-semibold text-[#374151] text-xs flex-1">{quote.customer.phone || '+91 98765 43210'}</span> 
              <button onClick={openWhatsApp} data-cy="whatsapp-btn" data-cy-link="whatsapp-link" className="text-green-500 hover:bg-green-50 p-1 rounded-full"><MessageSquare className="w-4 h-4" /></button>
            </div>
            <div className="flex items-center"><MessageSquare className="w-3.5 h-3.5 text-[#6B7280] mr-2"/> <span className="font-medium text-[#4B5563] text-xs">{quote.customer.email}</span></div>
            <div className="flex items-start"><MapPin className="w-3.5 h-3.5 text-[#6B7280] mr-2 mt-0.5"/> <span className="font-medium text-[#4B5563] text-xs">Bhubaneswar, Odisha - 751012</span></div>
          </div>
        </div>

        {/* Quote Summary */}
        <div>
          <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wider flex items-center gap-2 mb-3"><FileText className="w-4 h-4"/> Quote Summary</h3>
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 text-sm shadow-sm">
            <div className="space-y-2.5">
              <div className="flex justify-between"><span className="text-[#6B7280] text-xs font-medium">Sub Total</span><span className="font-semibold text-[#111111]">{formatCurrency(quote.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-[#6B7280] text-xs font-medium">Discount</span><span className="font-semibold text-red-600">- {formatCurrency(quote.discount)}</span></div>
              <div className="flex justify-between"><span className="text-[#6B7280] text-xs font-medium">Tax (GST)</span><span className="font-semibold text-[#111111]">{formatCurrency(quote.gstTotal)}</span></div>
              <div className="flex justify-between border-b border-[#E5E7EB] pb-2.5"><span className="text-[#6B7280] text-xs font-medium">Shipping</span><span className="font-semibold text-[#111111]">₹0</span></div>
              <div className="flex justify-between pt-1"><span className="text-[#111111] text-sm font-black">Total Amount</span><span className="font-black text-[#111111] text-base">{formatCurrency(quote.totalAmount)}</span></div>
            </div>
            
            <div className="mt-4 bg-[#F8F9FC] p-3 rounded-lg">
               <span className="text-[10px] font-bold text-[#3B6FEB] uppercase block mb-1">Amount In Words</span>
               <span className="text-xs font-semibold text-[#374151] leading-snug block">{numberToWords(quote.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Quote Validity */}
        <div>
          <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wider flex items-center gap-2 mb-3"><Clock className="w-4 h-4"/> Quote Validity</h3>
          <div className="flex flex-col space-y-2 text-sm border border-[#E5E7EB] rounded-xl p-4">
             <div className="flex justify-between"><span className="text-[#6B7280] text-xs font-medium">Valid From</span><span className="font-semibold text-[#111111]">{new Date(quote.createdAt).toLocaleDateString()}</span></div>
             <div className="flex justify-between"><span className="text-[#6B7280] text-xs font-medium">Valid Till</span>
               <div className="text-right">
                  <span className="font-semibold text-[#111111] block">{new Date(quote.validUntil).toLocaleDateString()}</span>
                  {Math.ceil((new Date(quote.validUntil).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) > 0 ? (
                    <span className="text-[10px] font-bold text-amber-500">({Math.ceil((new Date(quote.validUntil).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left)</span>
                  ) : (
                    <span className="text-[10px] font-bold text-red-500">(Expired)</span>
                  )}
               </div>
             </div>
          </div>
        </div>
        
        {/* Quote Items Mini */}
        <div>
          <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wider flex items-center gap-2 mb-3"><ShoppingCart className="w-4 h-4"/> Items ({quote.items.length})</h3>
          <div className="space-y-3">
             {quote.items.map(item => (
                <div key={item.id} className="flex gap-3 items-center border border-[#E5E7EB] p-3 rounded-xl">
                   <div className="w-10 h-10 bg-[#F3F4F6] rounded flex items-center justify-center text-lg">👕</div>
                   <div className="flex-1">
                     <p className="text-xs font-bold text-[#111111] line-clamp-1">{item.product?.name || 'Custom Product'}</p>
                     <p className="text-[10px] text-[#6B7280]">{item.quantity} x {formatCurrency(item.unitPrice)} • {item.color}</p>
                   </div>
                   <div className="font-bold text-sm text-[#111111]">{formatCurrency(item.totalPrice)}</div>
                </div>
             ))}
          </div>
        </div>

      </div>

      {/* Drawer Actions */}
      <div className="p-4 border-t border-[#E5E7EB] bg-[#FDFDFD] flex flex-col gap-3">
        <div className="flex gap-3">
          <Link href={`/dashboard/quotes/${quote.id}`} data-cy="admin-view-quote-btn" className="px-4 py-2 border border-[#E5E7EB] bg-white rounded-lg text-sm font-bold text-[#374151] hover:bg-[#F9FAFB] flex-1 flex justify-center items-center gap-2 shadow-sm">
            <Eye className="w-4 h-4" /> View Quote
          </Link>
          <a href={`${API_URL}/quotes/${quote.id}/pdf`} target="_blank" rel="noreferrer" className="px-4 py-2 border border-[#E5E7EB] bg-white rounded-lg text-sm font-bold text-[#374151] hover:bg-[#F9FAFB] flex-1 flex justify-center items-center gap-2 shadow-sm">
            <Download className="w-4 h-4" /> Download PDF
          </a>
        </div>
        
        {quote.status !== 'APPROVED' && quote.status !== 'EXPIRED' && quote.status !== 'REJECTED' && (
          <button onClick={markAccepted} className="w-full px-4 py-3 border border-[#E5E7EB] bg-white rounded-lg text-sm font-bold text-[#111111] hover:bg-[#F9FAFB] flex justify-center items-center gap-2 shadow-sm transition-colors">
            <CheckCircle2 className="w-4 h-4 text-green-600" /> Mark as Accepted
          </button>
        )}

        {quote.status === 'APPROVED' && !quote.notes?.includes('Order #') && (
           <button onClick={convertToOrder} className="w-full px-4 py-3 bg-[#3B6FEB] rounded-lg text-sm font-bold text-white hover:bg-[#2563EB] flex justify-center items-center gap-2 shadow-sm transition-colors">
            <ShoppingCart className="w-4 h-4" /> Convert to Order
          </button>
        )}
      </div>
    </div>
  );
}
