'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, MessageSquare, Phone, Globe, Camera, Eye, Plus, X, FileText, ArrowRight, CheckCircle, Link as LinkIcon, ExternalLink, ShoppingBag, Users, UserCircle } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';

import { API_URL } from '@/lib/api';
import { buildWhatsAppUrl } from '@/lib/whatsapp';
import { triggerSidebarCountsRefresh } from '@/hooks/useAdminSidebarCounts';

// --- TYPES ---
type InquiryStatus = 'NEW' | 'CONTACTED' | 'FOLLOW_UP' | 'QUOTED' | 'CONVERTED' | 'LOST' | 'CLOSED';
type InquirySource = 'WEBSITE' | 'WHATSAPP' | 'PHONE' | 'INSTAGRAM' | 'REFERRAL' | 'OTHER';

interface Inquiry {
  id: string;
  inquiryNumber: string;
  productInterest: string;
  quantity: number;
  printingType: string;
  printPosition: string;
  colors: string;
  deliveryDate: string;
  budget: string;
  source: InquirySource;
  message: string;
  status: InquiryStatus;
  nextFollowUpAt: string;
  createdAt: string;
  customerType: string;
  customerName?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  location?: string;
  sizes?: string;
  artworkUrl?: string;
  customizationRequirements?: string;
  customer: { name: string; company?: string; email: string; phone: string };
  company?: { name: string };
  product?: { id: string; name: string; slug: string; category?: { name: string } };
  assignedTo?: { id: string; name: string };
  activities?: any[];
  quote?: { id: string; quoteNumber: string; order?: { id: string; orderNumber: string } };
  variants?: Array<{ color: string | null; size: string | null; quantity: number }>;
}

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [stats, setStats] = useState<any>({ total: 0, new: 0, contacted: 0, quoted: 0, converted: 0, registered: 0, guest: 0 });
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [loading, setLoading] = useState(true);
  
  const [selectedInquiryId, setSelectedInquiryId] = useState<string | null>(null);
  const [selectedInquiryDetails, setSelectedInquiryDetails] = useState<Inquiry | null>(null);
  const [isNewInquiryModalOpen, setIsNewInquiryModalOpen] = useState(false);
  const [note, setNote] = useState('');

  // Fetch Data
  useEffect(() => {
    fetchData();
  }, [search]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resList, resStats] = await Promise.all([
        fetch(`${API_URL}/inquiries?search=${search}`, { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } }).then(r => r.json()),
        fetch(`${API_URL}/inquiries/stats`, { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } }).then(r => r.json())
      ]);
      setInquiries(resList.data || []);
      setStats(resStats || {});
      triggerSidebarCountsRefresh();
    } catch (err: any) {
      console.error('Failed to load inquiries:', err.message);
    } finally {
      setLoading(false);
    }
  };


  const getSourceIcon = (source: InquirySource) => {
    switch (source) {
      case 'WEBSITE': return <div className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-slate-400" /> Website</div>;
      case 'WHATSAPP': return <div className="flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5 text-green-500" /> WhatsApp</div>;
      case 'PHONE': return <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-blue-500" /> Call</div>;
      case 'INSTAGRAM': return <div className="flex items-center gap-1.5"><Camera className="w-3.5 h-3.5 text-pink-500" /> Instagram</div>;
      default: return <span className="text-[#6B7280]">{source}</span>;
    }
  };

  const toggleRow = async (id: string) => {
    if (selectedInquiryId === id) {
      setSelectedInquiryId(null);
      setSelectedInquiryDetails(null);
      setNote('');
    } else {
      setSelectedInquiryId(id);
      setSelectedInquiryDetails(null);
      setNote('');
      try {
        const res = await fetch(`${API_URL}/inquiries/${id}`, { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } }).then(r => r.json());
        setSelectedInquiryDetails(res);
      } catch {
        console.error('Failed to load inquiry details');
      }
    }
  };

  const handleConvertToQuote = async (inq: Inquiry) => {
    try {
      const res = await fetch(`${API_URL}/inquiries/${inq.id}/convert-to-quote`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
      }).then(r => r.json());
      if(res.quote || res.inquiry) {
         window.location.href = `/dashboard/inquiries/${inq.id}`;
      }
    } catch {
      console.error('Conversion failed');
    }
  };

  const handleAddNote = async (inq: Inquiry) => {
    if(!note) return;
    try {
      await fetch(`${API_URL}/inquiries/${inq.id}/activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') },
        body: JSON.stringify({ type: 'NOTE', message: note })
      });
      setNote('');
      // Refresh just this inquiry details
      const res = await fetch(`${API_URL}/inquiries/${inq.id}`, { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } }).then(r => r.json());
      setSelectedInquiryDetails(res);
      fetchData(); // Refresh list to update any aggregated status
    } catch {
      console.error('Failed to add note');
    }
  };

  const openWhatsApp = (inq: Inquiry) => {
    const phone = inq.phone || inq.customer?.phone;
    if (!phone) return alert('Customer phone number is unavailable.');
    const text = `Hello ${inq.customerName || inq.customer?.name || 'Customer'},\n\nThis is ZOBBRA Sales regarding your inquiry ${inq.inquiryNumber} (${inq.product?.category?.name || inq.product?.name || inq.productInterest || 'Custom Request'}, ${inq.quantity || 100} units).\n\nWe would like to discuss your requirements and share an official quote.\n\nThank you,\nZOBBRA Team`;
    const url = buildWhatsAppUrl(phone, text);
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      alert('Customer phone number is invalid.');
    }
  };

  const filteredInquiries = inquiries.filter(
    (inq) => (filterType === 'ALL' || inq.customerType === filterType) && !inq.quote?.order
  );

  return (
    <div className="space-y-6 pb-12 font-sans bg-[#F8F9FC] min-h-screen relative flex flex-col">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-black text-[#111111]">Inquiry</h1>
          <p className="text-sm text-[#6B7280] font-medium mt-1">Manage all customer inquiries and follow-ups</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <button className="bg-white border border-[#E5E7EB] text-[#111111] px-4 sm:px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm hover:bg-[#F9FAFB] transition-colors min-h-[44px]">
            Export
          </button>
          <button onClick={() => setIsNewInquiryModalOpen(true)} className="bg-[#3B6FEB] text-white px-4 sm:px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm hover:bg-[#2563EB] transition-colors flex items-center gap-2 min-h-[44px]">
            <Plus className="w-4 h-4" /> Add New Inquiry
          </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <StatCard icon={<Users className="w-5 h-5 text-purple-600" />} iconBg="bg-purple-50" title="Total Inquiries" value={stats.total} trend={18.6} />
        <StatCard icon={<UserCircle className="w-5 h-5 text-indigo-600" />} iconBg="bg-indigo-50" title="Registered" value={stats.registered} trend={12.3} />
        <StatCard icon={<Globe className="w-5 h-5 text-teal-600" />} iconBg="bg-teal-50" title="Guests" value={stats.guest} trend={4.1} />
        <StatCard icon={<Phone className="w-5 h-5 text-amber-600" />} iconBg="bg-amber-50" title="Contacted" value={stats.contacted} trend={8.2} />
        <StatCard icon={<CheckCircle className="w-5 h-5 text-emerald-600" />} iconBg="bg-emerald-50" title="Converted" value={stats.converted} trend={-3.1} />
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex flex-1 gap-6 relative">
        <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm transition-all duration-300 flex-1 w-full overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:flex-wrap gap-3 justify-between items-stretch sm:items-center bg-[#FDFDFD]">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
              <input 
                type="text" 
                placeholder="Search by name, phone, email, company..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#111111] focus:outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] shadow-sm transition-shadow"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select className="px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#374151] outline-none hover:bg-[#F9FAFB]">
                <option>All Status</option>
              </select>
              <select value={filterType} onChange={e=>setFilterType(e.target.value)} className="px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#374151] outline-none hover:bg-[#F9FAFB]">
                <option value="ALL">All Types</option>
                <option value="REGISTERED">Registered</option>
                <option value="GUEST">Guest</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="table-scroll overflow-x-auto">
            <table className="w-full min-w-[900px] text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#FAFAFA]">
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider w-32">Inquiry ID</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider w-40">Customer</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Product Interested</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider w-28">Source</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider w-32">Date</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider w-28">Status</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider w-32">Assigned To</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider w-24 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {loading ? (
                  <tr><td colSpan={8} className="p-8 text-center text-gray-500">Loading inquiries...</td></tr>
                ) : filteredInquiries.length === 0 ? (
                  <tr><td colSpan={8} className="p-8 text-center text-gray-500">No inquiries found.</td></tr>
                ) : filteredInquiries.map((inq) => {
                  const isExpanded = selectedInquiryId === inq.id;
                  const detail = isExpanded ? selectedInquiryDetails : null;
                  
                  return (
                    <React.Fragment key={inq.id}>
                      <tr 
                        className={`${isExpanded ? 'bg-[#EEF2FF]' : 'hover:bg-[#F9FAFB]'} transition-all duration-150 ease-out cursor-pointer group`} 
                        onClick={() => toggleRow(inq.id)}
                      >
                        <td className="px-4 py-4 text-xs font-bold text-[#111111]">
                          <Link
                            href={`/dashboard/inquiries/${inq.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="hover:text-[#3B6FEB] transition-colors underline-offset-2 hover:underline"
                            title="Open Full Inquiry Desk"
                          >
                            {inq.inquiryNumber}
                          </Link>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-[#111111]">{inq.customerName || inq.customer?.name}</p>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${inq.customerType === 'REGISTERED' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                              {inq.customerType === 'REGISTERED' ? 'REGISTERED' : 'INDIVIDUAL / GUEST'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-xs font-medium text-[#374151] line-clamp-1">{inq.quantity ? `${inq.quantity} ` : ''}{inq.product?.name || inq.productInterest || inq.product?.category?.name || 'Custom Request / Not specified'}</p>
                        </td>
                        <td className="px-4 py-4 text-xs font-medium text-[#4B5563]">
                          {getSourceIcon(inq.source)}
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-xs text-[#111111]">{new Date(inq.createdAt).toLocaleDateString()}</p>
                          <p className="text-[10px] text-[#6B7280]">{new Date(inq.createdAt).toLocaleTimeString()}</p>
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge status={inq.status} />
                        </td>
                        <td className="px-4 py-4">
                          {inq.assignedTo ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-[#E5E7EB] flex items-center justify-center text-[10px] font-bold text-[#374151]">
                                {inq.assignedTo.name.charAt(0)}
                              </div>
                              <span className="text-xs font-medium text-[#374151]">{inq.assignedTo.name}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-[#9CA3AF] italic">Unassigned</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link
                              href={`/dashboard/inquiries/${inq.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 bg-white border border-[#E5E7EB] text-[#6B7280] hover:text-[#3B6FEB] hover:border-[#3B6FEB] rounded-lg shadow-sm transition-colors"
                              title="Open Full Inquiry Desk"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                            <button className="p-1.5 bg-white border border-[#E5E7EB] text-[#6B7280] hover:text-[#3B6FEB] rounded-lg shadow-sm" title="Expand Details">
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* EXPANDED ROW */}
                      {isExpanded && (
                        <tr className="bg-[#FAFAFA] border-b border-[#E5E7EB]">
                          <td colSpan={8} className="p-0">
                            {detail ? (
                              <div className="p-6 md:p-8 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                                  
                                  {/* Left Column - Core Info */}
                                  <div className="space-y-6">
                                    <div>
                                      <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-3">Customer Information</h3>
                                      <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 space-y-3 shadow-sm">
                                        <div>
                                          <span className="text-xs text-[#6B7280] block mb-1">Name</span>
                                          <span className="text-sm font-semibold text-[#111111]">{detail.customerName || detail.customer?.name}</span>
                                        </div>
                                        <div>
                                          <span className="text-xs text-[#6B7280] block mb-1">Phone</span>
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-[#111111]">{detail.phone || detail.customer?.phone}</span>
                                          </div>
                                        </div>

                                        {(detail.companyName || detail.company?.name || detail.customer?.company) && (
                                          <div>
                                            <span className="text-xs text-[#6B7280] block mb-1">Company</span>
                                            <span className="text-sm font-semibold text-[#111111]">{detail.companyName || detail.company?.name || detail.customer?.company}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    <div>
                                      <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-3">Request</h3>
                                      <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 space-y-3 shadow-sm">
                                          <div>
                                            <span className="text-xs text-[#6B7280] block mb-1">Product</span>
                                            <span className="text-sm font-semibold text-[#111111]">{detail.product?.name || detail.productInterest || detail.product?.category?.name || 'Custom Request / Not specified'}</span>
                                          </div>
                                        <div>
                                          <span className="text-xs text-[#6B7280] block mb-1">Quantity</span>
                                          <span className="text-sm font-semibold text-[#111111]">{detail.quantity}</span>
                                        </div>
                                        {detail.variants && detail.variants.length > 0 && (
                                          <div>
                                            <span className="text-xs font-bold text-[#6B7280] block mb-1.5 uppercase tracking-wider">Breakdown</span>
                                            <div className="flex flex-wrap gap-1.5">
                                              {detail.variants.map((v: any, idx: number) => (
                                                <div key={idx} className="flex items-center gap-1 text-[11px] bg-[#F8F9FC] border border-[#E5E7EB] px-2 py-1 rounded shadow-sm">
                                                  {v.color && (
                                                    <span className="flex items-center gap-1">
                                                      <div className="w-2 h-2 rounded-full border border-gray-300" style={{ backgroundColor: v.color.toLowerCase() }}></div>
                                                      <span className="font-medium text-[#374151]">{v.color}</span>
                                                    </span>
                                                  )}
                                                  {v.size && <span className="text-[#6B7280] font-bold bg-gray-200 px-1.5 rounded">{v.size}</span>}
                                                  <span className="font-bold text-[#111111] ml-1">× {v.quantity}</span>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                        
                                        {/* Legacy Fields Conditionally Rendered */}
                                        <div>
                                          <span className="text-xs text-[#6B7280] block mb-1">Printing & Position</span>
                                          <span className={`text-sm font-semibold ${!(detail.printPosition || detail.printingType) ? 'text-[#9CA3AF] font-normal italic' : 'text-[#111111]'}`}>
                                            {(() => {
                                              const raw = (detail.printPosition || detail.printingType || '').trim().toLowerCase();
                                              if (!raw || raw === 'null' || raw === 'undefined' || raw === 'not provided' || raw === 'none' || raw === 'n/a') {
                                                return 'Not provided';
                                              }
                                              if (raw.includes('both') || raw.includes('&')) return 'Both';
                                              if (raw.includes('back')) return 'Back';
                                              if (raw.includes('front')) return 'Front';
                                              return detail.printPosition || detail.printingType;
                                            })()}
                                          </span>
                                        </div>
                                        {detail.colors && (
                                          <div>
                                            <span className="text-xs text-[#6B7280] block mb-1">Colors</span>
                                            <span className="text-sm text-[#374151]">{detail.colors}</span>
                                          </div>
                                        )}
                                        {detail.sizes && (
                                          <div>
                                            <span className="text-xs text-[#6B7280] block mb-1">Sizes</span>
                                            <span className="text-sm text-[#374151]">{detail.sizes}</span>
                                          </div>
                                        )}
                                        {detail.budget && (
                                          <div>
                                            <span className="text-xs text-[#6B7280] block mb-1">Budget</span>
                                            <span className="text-sm font-medium text-[#10B981]">{detail.budget}</span>
                                          </div>
                                        )}
                                        {detail.deliveryDate && (
                                          <div>
                                            <span className="text-xs text-[#6B7280] block mb-1">Delivery</span>
                                            <span className="text-sm text-[#374151]">{new Date(detail.deliveryDate).toLocaleDateString()}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Middle Column - Reference & Notes */}
                                  <div className="space-y-6">
                                    {detail.artworkUrl && (
                                      <div>
                                        <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-3">Reference / Mockup</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                          {detail.artworkUrl.split(',').map((url, i) => {
                                            const cleanUrl = url.trim();
                                            const isPdf = cleanUrl.toLowerCase().endsWith('.pdf');
                                            return (
                                              <a key={i} href={cleanUrl} target="_blank" rel="noreferrer" className="block relative group bg-white border border-[#E5E7EB] rounded-xl overflow-hidden aspect-video flex items-center justify-center hover:border-[#3B6FEB] transition-colors shadow-sm">
                                                {isPdf ? (
                                                  <div className="flex flex-col items-center text-[#6B7280] group-hover:text-[#3B6FEB]">
                                                    <FileText className="w-8 h-8 mb-2" />
                                                    <span className="text-xs font-semibold">View PDF</span>
                                                  </div>
                                                ) : (
                                                  <img src={cleanUrl} alt="Reference" className="w-full h-full object-cover" />
                                                )}
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                                  <LinkIcon className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 drop-shadow-md" />
                                                </div>
                                              </a>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}

                                    {(detail.customizationRequirements || detail.message) && (
                                      <div>
                                        <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-3">Notes</h3>
                                        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-sm text-sm text-[#374151] leading-relaxed">
                                          {detail.customizationRequirements || detail.message}
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Right Column - System & Actions */}
                                  <div className="space-y-6">
                                    <div>
                                      <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-3">System</h3>
                                      <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 space-y-3 shadow-sm">
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs text-[#6B7280]">Type</span>
                                          <span className="text-sm font-semibold text-[#111111]">{detail.customerType === 'REGISTERED' ? 'Registered' : 'Individual / Guest'}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs text-[#6B7280]">Status</span>
                                          <StatusBadge status={detail.status} />
                                        </div>
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs text-[#6B7280]">Source</span>
                                          <span className="text-sm font-semibold text-[#111111] capitalize">{detail.source.toLowerCase()}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs text-[#6B7280]">Created</span>
                                          <span className="text-sm font-semibold text-[#111111]">{new Date(detail.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs text-[#6B7280]">Assigned To</span>
                                          <span className="text-sm font-semibold text-[#111111]">{detail.assignedTo?.name || 'Unassigned'}</span>
                                        </div>
                                      </div>
                                    </div>

                                    <div>
                                      <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-3">Actions</h3>
                                      <div className="flex flex-col gap-3">
                                        <button onClick={() => openWhatsApp(detail)} className="w-full px-4 py-3 bg-white border border-[#E5E7EB] hover:border-green-500 hover:text-green-600 hover:bg-green-50 rounded-xl text-sm font-bold text-[#374151] transition-all flex items-center justify-center gap-2 shadow-sm">
                                          <Phone className="w-4 h-4" /> Call / WhatsApp
                                        </button>
                                        
                                        {detail.quote?.order ? (
                                          <Link href={`/dashboard/orders`} className="w-full px-4 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/20">
                                            <ShoppingBag className="w-4 h-4" /> View Order ({detail.quote.order.orderNumber})
                                          </Link>
                                        ) : detail.status !== 'CONVERTED' ? (
                                          <div className="flex flex-col gap-2">
                                            <Link href={`/dashboard/inquiries/${detail.id}`} className="w-full px-4 py-3 bg-[#3B6FEB] text-white rounded-xl text-sm font-bold hover:bg-[#2563EB] transition-all flex items-center justify-center gap-2 shadow-sm shadow-[#3B6FEB]/20">
                                              Open Inquiry Desk <ArrowRight className="w-4 h-4" />
                                            </Link>
                                            <button onClick={() => handleConvertToQuote(detail)} className="w-full px-4 py-2 bg-white border border-[#E5E7EB] text-[#374151] rounded-xl text-xs font-bold hover:bg-[#F9FAFB] transition-all flex items-center justify-center gap-1.5 shadow-sm">
                                              Convert to Quote <ArrowRight className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        ) : (
                                          <Link href={`/dashboard/inquiries/${detail.id}`} className="w-full px-4 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/20">
                                            View Quote <ArrowRight className="w-4 h-4" />
                                          </Link>
                                        )}
                                      </div>
                                    </div>
                                    
                                    {/* Quick Notes inside expanded row */}
                                    <div>
                                      <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">Activity Log</h3>
                                      </div>
                                      <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-sm overflow-hidden flex flex-col h-48">
                                        <div className="flex-1 overflow-y-auto p-3 space-y-3">
                                          {detail.activities && detail.activities.length > 0 ? (
                                            detail.activities.map((act: any) => (
                                              <div key={act.id} className="text-xs p-2 bg-[#F9FAFB] rounded-lg border border-[#F3F4F6]">
                                                <p className="font-medium text-[#111111]">{act.message}</p>
                                                <p className="text-[#9CA3AF] text-[10px] mt-1">{new Date(act.createdAt).toLocaleString()} · {act.user?.name || 'System'}</p>
                                              </div>
                                            ))
                                          ) : (
                                            <p className="text-xs text-[#9CA3AF] text-center mt-6">No activity recorded.</p>
                                          )}
                                        </div>
                                        <div className="p-2 border-t border-[#E5E7EB] bg-[#FAFAFA] flex gap-2">
                                          <input
                                            type="text"
                                            value={note}
                                            onChange={e => setNote(e.target.value)}
                                            placeholder="Add a note..."
                                            className="flex-1 text-xs border border-[#E5E7EB] rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#3B6FEB]"
                                          />
                                          <button
                                            onClick={() => handleAddNote(detail)}
                                            className="px-3 py-2 bg-[#111111] text-white rounded-lg text-xs font-bold hover:bg-black transition-colors"
                                          >
                                            Add
                                          </button>
                                        </div>
                                      </div>
                                    </div>

                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="p-12 flex justify-center items-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#3B6FEB] border-t-transparent"></div>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-[#E5E7EB] flex justify-between items-center text-xs text-[#6B7280]">
            <span>Showing 1 to {inquiries.length} of {stats.total} inquiries</span>
            <div className="flex gap-1">
              <button className="px-2 py-1 border border-[#E5E7EB] rounded hover:bg-[#F3F4F6]">&lt;</button>
              <button className="px-2 py-1 bg-[#111111] text-white rounded">1</button>
              <button className="px-2 py-1 border border-[#E5E7EB] rounded hover:bg-[#F3F4F6]">&gt;</button>
            </div>
          </div>
        </div>
      </div>

      {/* NEW INQUIRY MODAL */}
      {isNewInquiryModalOpen && (
        <NewInquiryModal
          onClose={() => setIsNewInquiryModalOpen(false)}
          onSuccess={() => { setIsNewInquiryModalOpen(false); fetchData(); }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------
// NEW INQUIRY MODAL COMPONENT
// ---------------------------------------------------------
function NewInquiryModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '', company: '', email: '', phone: '', productInterest: '', quantity: '', budget: '', message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch(`${API_URL}/inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') },
        body: JSON.stringify({
          source: 'OTHER',
          message: formData.message,
          productInterest: formData.productInterest,
          quantity: Number(formData.quantity) || undefined,
          budget: formData.budget,
        })
      });
      onSuccess();
    } catch {
      console.error('Failed to create inquiry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-[#E5E7EB] flex items-center justify-between bg-[#FDFDFD]">
          <h2 className="text-lg font-heading font-black text-[#111111]">Add New Inquiry</h2>
          <button onClick={onClose} className="p-1.5 text-[#9CA3AF] hover:text-[#111111] hover:bg-[#F3F4F6] rounded-lg transition-colors"><X className="w-5 h-5" /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1"><label className="text-xs font-bold text-[#374151]">Customer Name *</label><input required value={formData.customerName} onChange={e=>setFormData({...formData, customerName: e.target.value})} className="w-full text-sm border border-[#E5E7EB] rounded-lg px-3 py-2 bg-[#F9FAFB] focus:outline-none focus:border-[#3B6FEB]"/></div>
            <div className="space-y-1"><label className="text-xs font-bold text-[#374151]">Company Name</label><input value={formData.company} onChange={e=>setFormData({...formData, company: e.target.value})} className="w-full text-sm border border-[#E5E7EB] rounded-lg px-3 py-2 bg-[#F9FAFB] focus:outline-none focus:border-[#3B6FEB]"/></div>
            <div className="space-y-1"><label className="text-xs font-bold text-[#374151]">Email *</label><input type="email" required value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} className="w-full text-sm border border-[#E5E7EB] rounded-lg px-3 py-2 bg-[#F9FAFB] focus:outline-none focus:border-[#3B6FEB]"/></div>
            <div className="space-y-1"><label className="text-xs font-bold text-[#374151]">Phone *</label><input required value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})} className="w-full text-sm border border-[#E5E7EB] rounded-lg px-3 py-2 bg-[#F9FAFB] focus:outline-none focus:border-[#3B6FEB]"/></div>
          </div>
          
          <div className="border-t border-[#E5E7EB] pt-6 grid grid-cols-2 gap-4">
             <div className="space-y-1"><label className="text-xs font-bold text-[#374151]">Product Interest</label><input value={formData.productInterest} onChange={e=>setFormData({...formData, productInterest: e.target.value})} className="w-full text-sm border border-[#E5E7EB] rounded-lg px-3 py-2 bg-[#F9FAFB] focus:outline-none focus:border-[#3B6FEB]"/></div>
             <div className="space-y-1"><label className="text-xs font-bold text-[#374151]">Quantity</label><input type="number" value={formData.quantity} onChange={e=>setFormData({...formData, quantity: e.target.value})} className="w-full text-sm border border-[#E5E7EB] rounded-lg px-3 py-2 bg-[#F9FAFB] focus:outline-none focus:border-[#3B6FEB]"/></div>
             <div className="space-y-1 col-span-2"><label className="text-xs font-bold text-[#374151]">Message</label><textarea rows={3} value={formData.message} onChange={e=>setFormData({...formData, message: e.target.value})} className="w-full text-sm border border-[#E5E7EB] rounded-lg px-3 py-2 bg-[#F9FAFB] focus:outline-none focus:border-[#3B6FEB]"></textarea></div>
          </div>
        </form>

        <div className="p-5 border-t border-[#E5E7EB] bg-[#FDFDFD] flex items-center justify-end gap-3">
          <button onClick={onClose} type="button" className="px-5 py-2.5 border border-[#E5E7EB] rounded-lg text-sm font-bold text-[#374151] hover:bg-[#F9FAFB]">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="px-5 py-2.5 bg-[#3B6FEB] rounded-lg text-sm font-bold text-white hover:bg-[#2563EB] disabled:opacity-50">
            {loading ? 'Saving...' : 'Create Inquiry'}
          </button>
        </div>
      </div>
    </div>
  );
}
