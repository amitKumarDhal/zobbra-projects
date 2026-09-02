'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, MessageSquare, Phone, Globe, Camera, Eye, MoreVertical, Plus, UserCircle, FileText, ArrowRight, X, Clock, AlertCircle, Users, FileCheck, CheckCircle } from 'lucide-react';
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
  assignedTo?: { id: string; name: string };
  activities?: any[];
  quote?: { id: string; quoteNumber: string };
}

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [stats, setStats] = useState<any>({ total: 0, new: 0, contacted: 0, quoted: 0, converted: 0, registered: 0, guest: 0 });
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [loading, setLoading] = useState(true);
  
  // Drawer state
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isNewInquiryModalOpen, setIsNewInquiryModalOpen] = useState(false);

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

  const handleOpenInquiry = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/inquiries/${id}`, { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } }).then(r => r.json());
      setSelectedInquiry(res);
      setIsDrawerOpen(true);
    } catch (err: any) {
      console.error('Failed to load inquiry details');
    }
  };

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
        {/* LIST TABLE (Takes full width if drawer is closed, or partial if open) */}
        <div className={`bg-white border border-[#E5E7EB] rounded-2xl shadow-sm transition-all duration-300 flex-1 ${isDrawerOpen ? 'w-full lg:w-2/3' : 'w-full'}`}>
          {/* Toolbar */}
          <div className="p-4 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:flex-wrap gap-3 justify-between items-stretch sm:items-center bg-[#FDFDFD] rounded-t-2xl">
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
              <button className="flex items-center gap-2 px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm font-semibold text-[#374151] hover:bg-[#F9FAFB] transition-colors bg-white">
                <Filter className="w-4 h-4" /> Filter
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="table-scroll">
            <table className="w-full min-w-[850px] text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E7EB]">
                  <th className="px-4 py-3 w-10 text-center"><input type="checkbox" className="rounded border-gray-300" /></th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Inquiry ID</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Product Interested</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Source</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Assigned To</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {loading ? (
                  <tr><td colSpan={9} className="p-8 text-center text-gray-500">Loading inquiries...</td></tr>
                ) : inquiries.length === 0 ? (
                  <tr><td colSpan={9} className="p-8 text-center text-gray-500">No inquiries found.</td></tr>
                ) : inquiries.filter(inq => filterType === 'ALL' || inq.customerType === filterType).map((inq) => (
                  <tr key={inq.id} className="hover:bg-[#F9FAFB] transition-colors cursor-pointer group" onClick={() => handleOpenInquiry(inq.id)}>
                    <td className="px-4 py-4 text-center"><input type="checkbox" className="rounded border-gray-300" onClick={e=>e.stopPropagation()} /></td>
                    <td className="px-4 py-4 text-xs font-bold text-[#111111]">{inq.inquiryNumber}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-[#111111]">{inq.customerName || inq.customer?.name}</p>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${inq.customerType === 'REGISTERED' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                          {inq.customerType}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#6B7280] mt-0.5">{inq.companyName || inq.customer?.company || inq.company?.name || 'Individual'}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-xs font-medium text-[#374151] line-clamp-1">{inq.quantity ? `${inq.quantity} ` : ''}{inq.productInterest || 'N/A'}</p>
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
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 bg-white border border-[#E5E7EB] text-[#6B7280] hover:text-[#3B6FEB] rounded shadow-sm" title="View Details">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button className="p-1.5 bg-white border border-[#E5E7EB] text-[#6B7280] hover:text-[#111111] rounded shadow-sm" title="More Options">
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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

        {/* RIGHT DRAWER */}
        {isDrawerOpen && selectedInquiry && (
          <InquiryDrawer 
            inquiry={selectedInquiry} 
            onClose={() => setIsDrawerOpen(false)} 
            onRefresh={() => { handleOpenInquiry(selectedInquiry.id); fetchData(); }}
          />
        )}
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
// RIGHT SIDE DRAWER COMPONENT
// ---------------------------------------------------------
function InquiryDrawer({ inquiry, onClose, onRefresh }: { inquiry: Inquiry, onClose: () => void, onRefresh: () => void }) {
  const [note, setNote] = useState('');


  const handleConvertToQuote = async () => {
    try {
      const res = await fetch(`${API_URL}/inquiries/${inquiry.id}/convert-to-quote`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
      }).then(r => r.json());
      if(res.quote) {
         window.location.href = `/dashboard/quotes/${res.quote.id}`;
      }
    } catch (err: any) {
      console.error('Conversion failed');
    }
  };

  const handleAddNote = async () => {
    if(!note) return;
    try {
      await fetch(`${API_URL}/inquiries/${inquiry.id}/activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') },
        body: JSON.stringify({ type: 'NOTE', message: note })
      });
      setNote('');
      onRefresh();
    } catch(err) {
      console.error('Failed to add note');
    }
  };

  const openWhatsApp = () => {
    const phone = inquiry.phone || inquiry.customer?.phone;
    if (!phone) return alert('Customer phone number is unavailable.');
    const text = `Hello ${inquiry.customerName || inquiry.customer?.name || 'Customer'},\n\nThis is ZOBBRA Sales regarding your inquiry ${inquiry.inquiryNumber} (${inquiry.productInterest || 'Custom Merchandise'}, ${inquiry.quantity || 100} units).\n\nWe would like to discuss your requirements and share an official quote.\n\nThank you,\nZOBBRA Team`;
    const url = buildWhatsAppUrl(phone, text);
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
      onRefresh();
    } else {
      alert('Customer phone number is invalid.');
    }
  };

  return (
    <div data-cy="inquiry-drawer" className="w-full lg:w-1/3 min-w-0 lg:min-w-[360px] bg-white border border-[#E5E7EB] rounded-2xl shadow-xl flex flex-col h-[calc(100vh-140px)] sticky top-6 overflow-hidden">
      {/* Drawer Header */}
      <div className="p-5 border-b border-[#E5E7EB] flex items-start justify-between bg-[#FDFDFD]">
        <div>
          <h2 className="text-lg font-heading font-black text-[#111111]">Inquiry Details</h2>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-sm font-bold text-[#111111]">{inquiry.inquiryNumber}</span>
            <StatusBadge status={inquiry.status} />
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${inquiry.customerType === 'REGISTERED' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
              {inquiry.customerType}
            </span>
          </div>
          <p className="text-[10px] text-[#6B7280] mt-1">{new Date(inquiry.createdAt).toLocaleString()}</p>
        </div>
        <button onClick={onClose} className="p-1.5 text-[#9CA3AF] hover:text-[#111111] hover:bg-[#F3F4F6] rounded-lg transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        
        {/* Customer Information */}
        <div>
          <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wider flex items-center gap-2 mb-3"><UserCircle className="w-4 h-4 text-[#3B6FEB]"/> Customer Information</h3>
          <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-4 space-y-2.5 text-sm">
            <div className="flex justify-between items-center"><span className="w-28 text-[#6B7280] text-xs">Customer Type</span><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${inquiry.customerType === 'REGISTERED' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>{inquiry.customerType}</span></div>
            <div className="flex justify-between items-center"><span className="w-28 text-[#6B7280] text-xs">Name</span><span className="font-semibold text-[#111111]">{inquiry.customerName || inquiry.customer?.name || 'N/A'}</span></div>
            <div className="flex justify-between items-center"><span className="w-28 text-[#6B7280] text-xs">Company</span><span className="font-semibold text-[#374151]">{inquiry.companyName || inquiry.company?.name || inquiry.customer?.company || 'N/A'}</span></div>
            <div className="flex justify-between items-center"><span className="w-28 text-[#6B7280] text-xs">Phone</span>
              <span className="font-semibold text-[#374151] flex items-center gap-1.5">
                {inquiry.phone || inquiry.customer?.phone || 'N/A'}
                {(inquiry.phone || inquiry.customer?.phone) && <button onClick={openWhatsApp} title="WhatsApp Customer" className="text-green-500 hover:bg-green-50 p-1 rounded transition-colors"><MessageSquare className="w-3.5 h-3.5" /></button>}
              </span>
            </div>
            <div className="flex justify-between items-center"><span className="w-28 text-[#6B7280] text-xs">Email</span><span className="font-semibold text-[#3B6FEB] truncate max-w-[180px]">{inquiry.email || inquiry.customer?.email || 'N/A'}</span></div>
            {inquiry.location && (
              <div className="flex justify-between items-center"><span className="w-28 text-[#6B7280] text-xs">Location / City</span><span className="font-semibold text-[#374151]">{inquiry.location}</span></div>
            )}
          </div>
        </div>

        {/* Inquiry Information */}
        <div>
          <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wider flex items-center gap-2 mb-3"><FileText className="w-4 h-4 text-[#3B6FEB]"/> Inquiry Specifications</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-[#F3F4F6] pb-2"><span className="text-[#6B7280] text-xs">Product Interest</span><span className="font-semibold text-[#111111] text-right">{inquiry.productInterest || 'N/A'}</span></div>
            <div className="flex justify-between border-b border-[#F3F4F6] pb-2"><span className="text-[#6B7280] text-xs">Quantity</span><span className="font-semibold text-[#111111] text-right">{inquiry.quantity ? `${inquiry.quantity} Pieces` : 'N/A'}</span></div>
            <div className="flex justify-between border-b border-[#F3F4F6] pb-2"><span className="text-[#6B7280] text-xs">Printing Type</span><span className="font-semibold text-[#374151] text-right">{inquiry.printingType || 'N/A'}</span></div>
            <div className="flex justify-between border-b border-[#F3F4F6] pb-2"><span className="text-[#6B7280] text-xs">Print Position</span><span className="font-semibold text-[#374151] text-right">{inquiry.printPosition || 'N/A'}</span></div>
            <div className="flex justify-between border-b border-[#F3F4F6] pb-2"><span className="text-[#6B7280] text-xs">Colors</span><span className="font-semibold text-[#374151] text-right">{inquiry.colors || 'N/A'}</span></div>
            <div className="flex justify-between border-b border-[#F3F4F6] pb-2"><span className="text-[#6B7280] text-xs">Sizes Breakdown</span><span className="font-semibold text-[#374151] text-right">{inquiry.sizes || 'N/A'}</span></div>
            <div className="flex justify-between border-b border-[#F3F4F6] pb-2"><span className="text-[#6B7280] text-xs">Budget Range</span><span className="font-semibold text-[#10B981] text-right">{inquiry.budget || 'N/A'}</span></div>
            <div className="flex justify-between border-b border-[#F3F4F6] pb-2"><span className="text-[#6B7280] text-xs">Delivery Date</span><span className="font-semibold text-[#374151] text-right">{inquiry.deliveryDate ? new Date(inquiry.deliveryDate).toLocaleDateString() : 'N/A'}</span></div>
            {inquiry.artworkUrl && (
              <div className="flex justify-between border-b border-[#F3F4F6] pb-2"><span className="text-[#6B7280] text-xs">Artwork Link</span><a href={inquiry.artworkUrl} target="_blank" rel="noreferrer" className="text-[#3B6FEB] font-bold text-xs underline truncate max-w-[160px]">View Artwork</a></div>
            )}
            <div className="flex justify-between pb-2"><span className="text-[#6B7280] text-xs">Customization Notes</span><span className="font-medium text-[#4B5563] text-right text-xs max-w-[200px] leading-relaxed">{inquiry.customizationRequirements || inquiry.message || 'No requirements specified.'}</span></div>
          </div>
        </div>

        {/* Assigned To & Follow Up */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-3">
            <h3 className="text-[10px] font-bold text-[#6B7280] uppercase mb-2">Assigned To</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#111111] text-white flex items-center justify-center text-xs font-bold">
                  {inquiry.assignedTo ? inquiry.assignedTo.name.charAt(0) : 'U'}
                </div>
                <div>
                  <p className="text-xs font-bold text-[#111111]">{inquiry.assignedTo?.name || 'Unassigned'}</p>
                </div>
              </div>
              <button className="text-[#3B6FEB] text-xs font-bold">Edit</button>
            </div>
          </div>
          <div className="bg-[#FFFBEB] border border-[#FEF3C7] rounded-xl p-3">
            <h3 className="text-[10px] font-bold text-[#D97706] uppercase mb-2">Next Follow Up</h3>
            <div className="flex items-center gap-2 text-xs font-bold text-[#B45309]">
              <Clock className="w-4 h-4" />
              {inquiry.nextFollowUpAt ? new Date(inquiry.nextFollowUpAt).toLocaleString() : 'Not Set'}
            </div>
          </div>
        </div>

        {/* Activity Timeline */}
        <div>
           <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wider mb-3">Activity Timeline</h3>
           <div className="space-y-4 pl-2 border-l-2 border-[#E5E7EB] ml-2">
              {inquiry.activities?.map((act: any) => (
                <div key={act.id} className="relative pl-4">
                  <div className="absolute w-2.5 h-2.5 bg-[#3B6FEB] rounded-full -left-[21px] top-1 border-2 border-white"></div>
                  <p className="text-xs font-semibold text-[#111111]">{act.message}</p>
                  <p className="text-[10px] text-[#6B7280] mt-0.5">{new Date(act.createdAt).toLocaleString()} • {act.user?.name || 'System'}</p>
                </div>
              ))}
           </div>
           
           <div className="mt-4 flex gap-2">
              <input type="text" data-cy="inquiry-note-input" value={note} onChange={e=>setNote(e.target.value)} placeholder="Add a note..." className="flex-1 text-xs border border-[#E5E7EB] rounded-lg px-3 py-2 bg-[#F9FAFB] focus:outline-none focus:border-[#3B6FEB]"/>
              <button onClick={handleAddNote} data-cy="add-note-btn" className="bg-[#F3F4F6] text-[#374151] px-3 py-2 rounded-lg text-xs font-bold hover:bg-[#E5E7EB]">Add</button>
           </div>
        </div>

      </div>

      {/* Drawer Actions */}
      <div className="p-4 border-t border-[#E5E7EB] bg-[#FDFDFD] flex items-center justify-between gap-3">
        <button className="px-4 py-2.5 border border-[#E5E7EB] bg-white rounded-lg text-sm font-bold text-[#374151] hover:bg-[#F9FAFB] flex-1 flex justify-center gap-2">
          <Phone className="w-4 h-4" /> Call
        </button>
        {inquiry.status !== 'CONVERTED' ? (
          <button onClick={handleConvertToQuote} className="px-4 py-2.5 bg-[#3B6FEB] rounded-lg text-sm font-bold text-white hover:bg-[#2563EB] flex-1 flex justify-center gap-2">
            Convert to Quote <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <Link href={`/dashboard/quotes/${inquiry.quote?.id}`} className="px-4 py-2.5 bg-emerald-600 rounded-lg text-sm font-bold text-white hover:bg-emerald-700 flex-1 flex justify-center gap-2 text-center">
            View Quote {inquiry.quote?.quoteNumber}
          </Link>
        )}
      </div>
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
    } catch (err: any) {
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
