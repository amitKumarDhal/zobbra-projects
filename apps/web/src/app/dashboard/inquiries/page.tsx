'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, MessageSquare, Phone, Globe, Camera, Eye, MoreVertical, Plus, UserCircle, FileText, ArrowRight, X, Clock, AlertCircle, Users, FileCheck, CheckCircle, Calendar, Building2, MapPin, Package, User, Mail } from 'lucide-react';
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
                ) : inquiries.length === 0 ? (
                  <tr><td colSpan={8} className="p-8 text-center text-gray-500">No inquiries found.</td></tr>
                ) : inquiries.filter(inq => filterType === 'ALL' || inq.customerType === filterType).map((inq) => {
                  const isActive = isDrawerOpen && selectedInquiry?.id === inq.id;
                  return (
                    <tr key={inq.id} className={`${isActive ? 'bg-[#EEF2FF]' : 'hover:bg-[#F9FAFB]'} transition-all duration-150 ease-out cursor-pointer group`} onClick={() => handleOpenInquiry(inq.id)}>
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
// RIGHT SIDE DRAWER COMPONENT - PREMIUM REDESIGN
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
    <div data-cy="inquiry-drawer" className="w-full lg:w-[400px] xl:w-[440px] bg-white border border-[#E5E7EB] rounded-2xl shadow-2xl flex flex-col h-[calc(100vh-140px)] sticky top-6 overflow-hidden">
      {/* Premium Header */}
      <div className="p-5 border-b border-[#F3F4F6] bg-gradient-to-b from-white to-[#FAFAFA]">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0 pr-4">
            {/* Label */}
            <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-1">Inquiry ID</p>
            {/* Inquiry Number - Prominent */}
            <h2 className="text-2xl font-heading font-black text-[#111111] leading-tight tracking-tight">
              {inquiry.inquiryNumber}
            </h2>
            {/* Status Badges */}
            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
              <StatusBadge status={inquiry.status} />
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${inquiry.customerType === 'REGISTERED' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                {inquiry.customerType}
              </span>
            </div>
            {/* Date */}
            <div className="flex items-center gap-1.5 mt-2.5 text-[11px] text-[#6B7280]">
              <Calendar className="w-3.5 h-3.5" />
              <span>{new Date(inquiry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              <span className="text-[#D1D5DB]">·</span>
              <span>{new Date(inquiry.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
            </div>
          </div>
          {/* Close Button */}
          <button onClick={onClose} className="p-2 text-[#9CA3AF] hover:text-[#374151] hover:bg-[#F3F4F6] rounded-xl transition-all duration-200 flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">

        {/* Customer Information - Clean Section */}
        <div>
          <h3 className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-[#3B6FEB]" />
            Customer Information
          </h3>
          <div className="bg-[#FAFAFA] rounded-xl p-4 space-y-3">
            {/* Name */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#9CA3AF]">
                <UserCircle className="w-4 h-4" />
                <span className="text-xs font-medium">Name</span>
              </div>
              <span className="text-xs font-semibold text-[#111111]">{inquiry.customerName || inquiry.customer?.name || 'N/A'}</span>
            </div>
            {/* Company */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#9CA3AF]">
                <Building2 className="w-4 h-4" />
                <span className="text-xs font-medium">Company</span>
              </div>
              <span className="text-xs font-semibold text-[#374151]">{inquiry.companyName || inquiry.company?.name || inquiry.customer?.company || 'Individual'}</span>
            </div>
            {/* Phone */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#9CA3AF]">
                <Phone className="w-4 h-4" />
                <span className="text-xs font-medium">Phone</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#374151]">{inquiry.phone || inquiry.customer?.phone || 'N/A'}</span>
                {(inquiry.phone || inquiry.customer?.phone) && (
                  <button onClick={openWhatsApp} title="Message on WhatsApp" className="text-green-500 hover:bg-green-50 p-1 rounded-lg transition-colors">
                    <MessageSquare className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            {/* Email */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#9CA3AF]">
                <Mail className="w-4 h-4" />
                <span className="text-xs font-medium">Email</span>
              </div>
              <span className="text-xs font-semibold text-[#3B6FEB] truncate max-w-[160px]">{inquiry.email || inquiry.customer?.email || 'N/A'}</span>
            </div>
            {/* Location */}
            {inquiry.location && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#9CA3AF]">
                  <MapPin className="w-4 h-4" />
                  <span className="text-xs font-medium">Location</span>
                </div>
                <span className="text-xs font-semibold text-[#374151]">{inquiry.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Inquiry Details - Specifications */}
        <div>
          <h3 className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-4 flex items-center gap-2">
            <Package className="w-4 h-4 text-[#3B6FEB]" />
            Product Specifications
          </h3>
          <div className="bg-[#FAFAFA] rounded-xl p-4 space-y-3">
            {/* Product Interest */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#9CA3AF]">Product</span>
              <span className="text-xs font-semibold text-[#111111] text-right max-w-[200px] truncate">{inquiry.productInterest || 'N/A'}</span>
            </div>
            {/* Quantity */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#9CA3AF]">Quantity</span>
              <span className="text-xs font-semibold text-[#111111]">{inquiry.quantity ? `${inquiry.quantity} pieces` : 'N/A'}</span>
            </div>
            {/* Printing Type */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#9CA3AF]">Printing</span>
              <span className="text-xs font-semibold text-[#374151]">{inquiry.printingType || 'N/A'}</span>
            </div>
            {/* Print Position */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#9CA3AF]">Position</span>
              <span className="text-xs font-semibold text-[#374151]">{inquiry.printPosition || 'N/A'}</span>
            </div>
            {/* Colors */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#9CA3AF]">Colors</span>
              <span className="text-xs font-semibold text-[#374151]">{inquiry.colors || 'N/A'}</span>
            </div>
            {/* Sizes */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#9CA3AF]">Sizes</span>
              <span className="text-xs font-semibold text-[#374151]">{inquiry.sizes || 'N/A'}</span>
            </div>
            {/* Budget */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#9CA3AF]">Budget</span>
              <span className="text-xs font-bold text-[#10B981]">{inquiry.budget || 'N/A'}</span>
            </div>
            {/* Delivery Date */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#9CA3AF]">Delivery</span>
              <span className="text-xs font-semibold text-[#374151]">{inquiry.deliveryDate ? new Date(inquiry.deliveryDate).toLocaleDateString() : 'N/A'}</span>
            </div>
            {/* Artwork Link */}
            {inquiry.artworkUrl && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#9CA3AF]">Artwork</span>
                <a href={inquiry.artworkUrl} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-[#3B6FEB] hover:underline truncate max-w-[160px]">View Link →</a>
              </div>
            )}
          </div>
          {/* Customization Notes */}
          {(inquiry.customizationRequirements || inquiry.message) && (
            <div className="mt-3 bg-[#F0F4FF] rounded-xl p-3 border border-[#E0E8FF]">
              <p className="text-[10px] font-bold text-[#3B6FEB] uppercase tracking-wider mb-1.5">Notes</p>
              <p className="text-xs text-[#374151] leading-relaxed">{inquiry.customizationRequirements || inquiry.message}</p>
            </div>
          )}
        </div>

        {/* Assignment & Follow Up - Grid Cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* Assigned To Card */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Assigned To</p>
              <button className="text-[#3B6FEB] text-[10px] font-bold hover:underline">Edit</button>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3B6FEB] to-[#2563EB] text-white flex items-center justify-center text-xs font-bold shadow-sm">
                {inquiry.assignedTo ? inquiry.assignedTo.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <p className="text-xs font-semibold text-[#111111] truncate">{inquiry.assignedTo?.name || 'Unassigned'}</p>
            </div>
          </div>
          {/* Next Follow Up Card */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5">
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-2">Next Follow Up</p>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <p className="text-[11px] font-semibold text-amber-700 leading-tight">
                {inquiry.nextFollowUpAt ? new Date(inquiry.nextFollowUpAt).toLocaleDateString() : 'Not Set'}
              </p>
            </div>
          </div>
        </div>

        {/* Activity Timeline - Clean Design */}
        <div>
          <h3 className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#3B6FEB]" />
            Activity
          </h3>

          {inquiry.activities && inquiry.activities.length > 0 ? (
            <div className="relative pl-5">
              {/* Timeline Line */}
              <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-[#3B6FEB] to-[#E5E7EB]" />

              <div className="space-y-4">
                {inquiry.activities.map((act: any, index: number) => (
                  <div key={act.id} className="relative">
                    {/* Timeline Dot */}
                    <div className={`absolute -left-[13px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ${index === 0 ? 'bg-[#3B6FEB]' : 'bg-[#D1D5DB]'}`} />
                    {/* Content */}
                    <div className="bg-white border border-[#E5E7EB] rounded-lg p-3">
                      <p className="text-xs font-medium text-[#111111] leading-snug">{act.message}</p>
                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-[#9CA3AF]">
                        <span>{new Date(act.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        <span>·</span>
                        <span>{new Date(act.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                        <span>·</span>
                        <span>{act.user?.name || 'System'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 bg-[#FAFAFA] rounded-xl border border-dashed border-[#E5E7EB]">
              <FileText className="w-6 h-6 text-[#D1D5DB] mx-auto mb-2" />
              <p className="text-xs text-[#9CA3AF]">No activity recorded yet</p>
            </div>
          )}

          {/* Add Note Input */}
          <div className="mt-4 flex gap-2">
            <input
              type="text"
              data-cy="inquiry-note-input"
              value={note}
              onChange={e=>setNote(e.target.value)}
              placeholder="Add a note..."
              className="flex-1 text-xs border border-[#E5E7EB] rounded-xl px-3.5 py-2.5 bg-[#FAFAFA] focus:outline-none focus:border-[#3B6FEB] focus:ring-2 focus:ring-[#3B6FEB]/10 transition-all"
            />
            <button
              onClick={handleAddNote}
              data-cy="add-note-btn"
              className="px-4 py-2.5 bg-[#3B6FEB] text-white rounded-xl text-xs font-bold hover:bg-[#2563EB] transition-colors shadow-sm"
            >
              Add
            </button>
          </div>
        </div>

      </div>

      {/* Premium Footer Actions */}
      <div className="p-4 border-t border-[#F3F4F6] bg-white">
        <div className="flex items-center gap-3">
          <button className="px-4 py-3 border border-[#E5E7EB] bg-white rounded-xl text-sm font-semibold text-[#374151] hover:bg-[#F9FAFB] hover:border-[#D1D5DB] transition-all flex items-center justify-center gap-2 flex-1">
            <Phone className="w-4 h-4" />
            <span>Call</span>
          </button>
          {inquiry.status !== 'CONVERTED' ? (
            <button onClick={handleConvertToQuote} className="px-5 py-3 bg-[#3B6FEB] rounded-xl text-sm font-bold text-white hover:bg-[#2563EB] transition-all flex items-center justify-center gap-2 flex-[2] shadow-sm shadow-[#3B6FEB]/20">
              Convert to Quote
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <Link href={`/dashboard/quotes/${inquiry.quote?.id}`} className="px-5 py-3 bg-emerald-600 rounded-xl text-sm font-bold text-white hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 flex-[2] shadow-sm shadow-emerald-600/20">
              View Quote
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
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
