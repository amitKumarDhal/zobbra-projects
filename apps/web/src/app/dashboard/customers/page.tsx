'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, Download, ExternalLink, MoreVertical, MessageSquare, Phone, MapPin, X, Users, UserPlus, Star, Clock, CheckCircle2, UserCircle, Edit2, ChevronRight, Briefcase, FileText, ShoppingBag, CreditCard, ChevronDown } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';

import { API_URL } from '@/lib/api';
import { buildWhatsAppUrl } from '@/lib/whatsapp';

interface Company {
  id: string;
  name: string;
  gstin?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  notes?: string;
  createdAt: string;
  users: { id: string; name: string; email: string; phone: string }[];
  _count: { quotes: number; orders: number };
  orders: { id: string; totalAmount: number; createdAt: string; status: string; payments?: any[] }[];
  quotes?: any[];
  invoices?: any[];
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Company[]>([]);
  const [stats, setStats] = useState<any>({ totalCustomers: 0, activeCustomers: 0, newThisMonth: 0, repeatCustomers: 0, topCustomerCount: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Drawer State
  const [selectedCustomer, setSelectedCustomer] = useState<Company | null>(null);
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
        fetch(`${API_URL}/customers?search=${search}&page=${page}`, { headers }).then(r => r.json()),
        fetch(`${API_URL}/customers/stats`, { headers }).then(r => r.json())
      ]);

      if(resList.success) {
        setCustomers(resList.data || []);
        if (resList.pagination) setPagination(resList.pagination);
      }
      
      if(resStats.success) {
        setStats(resStats.stats || {});
      }
    } catch (error) {
      console.error('Failed to load customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCustomer = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/customers/${id}`, { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } }).then(r => r.json());
      if(res.success) {
        setSelectedCustomer(res.company);
        setIsDrawerOpen(true);
      }
    } catch(err) {
      console.error('Failed to load customer details', err);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
  };

  return (
    <div className="space-y-6 pb-12 font-sans bg-[#F8F9FC] min-h-screen relative flex flex-col">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-black text-[#111111]">Customers</h1>
          <p className="text-sm text-[#6B7280] font-medium mt-1">Manage all your customers and their information</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-white border border-[#E5E7EB] text-[#111111] px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm hover:bg-[#F9FAFB] transition-colors flex items-center gap-2">
            <UserPlus className="w-4 h-4"/> Import Customers
          </button>
          <button className="bg-white border border-[#E5E7EB] text-[#111111] px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm hover:bg-[#F9FAFB] transition-colors flex items-center gap-2">
            <Download className="w-4 h-4"/> Export
          </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard icon={<Users className="w-5 h-5 text-purple-600" />} iconBg="bg-purple-50" title="Total Customers" value={stats.totalCustomers} sub="All time customers" />
        <StatCard icon={<CheckCircle2 className="w-5 h-5 text-green-600" />} iconBg="bg-green-50" title="Active Customers" value={stats.activeCustomers} sub="Active & Engaged" />
        <StatCard icon={<UserPlus className="w-5 h-5 text-amber-600" />} iconBg="bg-amber-50" title="New This Month" value={stats.newThisMonth} sub="Joined this month" />
        <StatCard icon={<Clock className="w-5 h-5 text-blue-600" />} iconBg="bg-blue-50" title="Repeat Customers" value={stats.repeatCustomers} sub="Placed multiple orders" />
        <StatCard icon={<Star className="w-5 h-5 text-pink-600" />} iconBg="bg-pink-50" title="Top Customers" value={stats.topCustomerCount} sub="High value customers" />
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
                placeholder="Search by name, email, phone, company..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#111111] focus:outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] shadow-sm transition-shadow"
              />
            </div>
            <div className="flex items-center gap-2">
              <select className="px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#374151] outline-none hover:bg-[#F9FAFB]">
                <option>All Status</option>
                <option>Active</option>
                <option>Inactive</option>
              </select>
              <select className="px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#374151] outline-none hover:bg-[#F9FAFB] hidden sm:block">
                <option>All Cities</option>
              </select>
              <select className="px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#374151] outline-none hover:bg-[#F9FAFB] hidden sm:block">
                <option>All Customer Type</option>
              </select>
              <button className="flex items-center gap-2 px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm font-semibold text-[#374151] hover:bg-[#F9FAFB] transition-colors bg-white">
                <Filter className="w-4 h-4" /> Filter
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E7EB]">
                  <th className="px-4 py-3 w-10 text-center"><input type="checkbox" className="rounded border-gray-300" /></th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Contact</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Company</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider text-center">Total Orders</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider text-right">Total Spent</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Last Order</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider text-center">Status</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {loading ? (
                  <tr><td colSpan={9} className="p-8 text-center text-gray-500 font-medium">Loading customers...</td></tr>
                ) : customers.length === 0 ? (
                  <tr><td colSpan={9} className="p-8 text-center text-gray-500 font-medium">No customers found.</td></tr>
                ) : customers.map((c) => {
                  const mainUser = c.users?.[0] || { name: 'Unknown', email: 'N/A', phone: 'N/A' };
                  const totalSpent = c.orders?.reduce((sum, ord) => sum + ord.totalAmount, 0) || 0;
                  const isActive = c.orders?.length > 0;
                  const lastOrder = c.orders?.[0];
                  
                  return (
                    <tr key={c.id} className="hover:bg-[#F9FAFB] transition-colors cursor-pointer group" onClick={() => handleOpenCustomer(c.id)}>
                      <td className="px-4 py-4 text-center"><input type="checkbox" className="rounded border-gray-300" onClick={e=>e.stopPropagation()} /></td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-50 text-[#3B6FEB] flex items-center justify-center font-bold text-xs uppercase border border-blue-100">
                            {mainUser.name.substring(0, 2)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[#111111] flex items-center gap-2">
                              {mainUser.name} 
                              {totalSpent > 50000 && <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-purple-50 text-purple-600 border border-purple-200 uppercase tracking-wider">Top</span>}
                            </p>
                            <p className="text-[10px] text-[#6B7280] mt-0.5">{mainUser.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-[#4B5563]">
                          <Phone className="w-3.5 h-3.5 text-[#9CA3AF]" />
                          {mainUser.phone}
                          <MessageSquare className="w-3.5 h-3.5 text-green-500 ml-1" />
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs font-bold text-[#111111]">{c.name}</td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-xs font-bold text-[#111111]">{c._count.orders}</span>
                        <span className="block text-[9px] text-[#6B7280]">Orders</span>
                      </td>
                      <td className="px-4 py-4 text-right text-xs font-bold text-[#111111]">{formatCurrency(totalSpent)}</td>
                      <td className="px-4 py-4">
                        {lastOrder ? (
                          <>
                            <p className="text-xs text-[#111111]">{new Date(lastOrder.createdAt).toLocaleDateString()}</p>
                            <p className="text-[10px] text-[#6B7280]">{new Date(lastOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </>
                        ) : (
                          <span className="text-xs text-[#9CA3AF] italic">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${isActive ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-slate-600 bg-slate-50 border-slate-200'}`}>
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-1.5 text-[#6B7280] hover:text-[#111111] hover:bg-[#F3F4F6] rounded" title="View"><ExternalLink className="w-3.5 h-3.5" /></button>
                          <button className="p-1.5 text-[#6B7280] hover:text-[#111111] hover:bg-[#F3F4F6] rounded" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="p-4 border-t border-[#E5E7EB] flex justify-between items-center text-xs text-[#6B7280]">
            <span>Showing {(page - 1) * pagination.pageSize + 1} to {Math.min(page * pagination.pageSize, pagination.total)} of {pagination.total} customers</span>
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
        {isDrawerOpen && selectedCustomer && (
          <CustomerDrawer 
            customer={selectedCustomer} 
            onClose={() => setIsDrawerOpen(false)} 
            onRefresh={() => { handleOpenCustomer(selectedCustomer.id); fetchData(); }}
          />
        )}
      </div>
    </div>
  );
}


// ---------------------------------------------------------
// RIGHT SIDE DRAWER COMPONENT (CUSTOMER 360)
// ---------------------------------------------------------
function CustomerDrawer({ customer, onClose, onRefresh }: { customer: Company, onClose: () => void, onRefresh: () => void }) {
  const [activeTab, setActiveTab] = useState<'Overview' | 'Orders' | 'Quotes' | 'Payments' | 'Notes'>('Overview');
  const [note, setNote] = useState(customer.notes || '');
  const [savingNote, setSavingNote] = useState(false);
  
  const mainUser = customer.users?.[0] || { name: 'Unknown', email: 'N/A', phone: 'N/A' };
  const isActive = (customer.orders?.length || 0) > 0;
  const isCorporate = !!customer.gstin;

  const totalOrders = customer.orders?.length || 0;
  const totalSpent = customer.orders?.filter(o => o.status !== 'CANCELLED').reduce((sum, ord) => sum + ord.totalAmount, 0) || 0;
  const pendingOrders = customer.orders?.filter(o => o.status === 'PENDING').length || 0;
  const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
  };

  const saveNote = async () => {
    try {
      setSavingNote(true);
      const res = await fetch(`${API_URL}/customers/${customer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') },
        body: JSON.stringify({ notes: note })
      }).then(r => r.json());
      if (res.success) onRefresh();
    } catch(err) {
      console.error(err);
    } finally {
      setSavingNote(false);
    }
  };

  const openWhatsApp = () => {
    if (!mainUser.phone) return alert('Customer phone number is unavailable.');
    const text = `Hello ${mainUser.name},\n\nThis is ZOBBRA Sales regarding your account. Please let us know if you need any assistance.\n\nThank you,\nZOBBRA Team`;
    const url = buildWhatsAppUrl(mainUser.phone, text);
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      alert('Customer phone number is invalid.');
    }
  };

  return (
    <div className="w-full lg:w-1/3 min-w-[380px] max-w-[420px] bg-white border border-[#E5E7EB] rounded-2xl shadow-xl flex flex-col h-[calc(100vh-140px)] sticky top-6 overflow-hidden">
      
      {/* Drawer Header */}
      <div className="px-5 pt-5 pb-0 border-b border-[#E5E7EB] bg-[#FDFDFD]">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-lg uppercase border border-purple-100 shadow-sm">
              {mainUser.name.substring(0, 2)}
            </div>
            <div>
              <h2 className="text-lg font-heading font-black text-[#111111]">{mainUser.name}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-[10px] text-[#6B7280]">Customer ID: <span className="font-bold text-[#111111]">{customer.id.substring(0,8).toUpperCase()}</span></span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${isActive ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-slate-600 bg-slate-50 border-slate-200'}`}>
                  {isActive ? 'Active' : 'Inactive'}
                </span>
                {totalSpent > 50000 && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border text-purple-700 bg-purple-50 border-purple-200">Top Customer</span>}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-[#9CA3AF] hover:text-[#111111] hover:bg-[#F3F4F6] rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mt-5 border-b border-[#E5E7EB]">
          {['Overview', 'Orders', 'Quotes', 'Payments', 'Notes'].map((tab) => (
             <button 
                key={tab} 
                onClick={() => setActiveTab(tab as any)}
                className={`text-[11px] font-bold uppercase tracking-wider pb-3 border-b-2 transition-colors ${activeTab === tab ? 'border-[#111111] text-[#111111]' : 'border-transparent text-[#9CA3AF] hover:text-[#4B5563]'}`}
             >
               {tab} {tab === 'Orders' && `(${totalOrders})`} {tab === 'Quotes' && `(${customer.quotes?.length || 0})`}
             </button>
          ))}
        </div>
      </div>

      {/* Drawer Content */}
      <div className="flex-1 overflow-y-auto p-5 hide-scrollbar">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'Overview' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wider flex items-center gap-1.5 mb-3"><UserCircle className="w-4 h-4"/> Contact Information</h3>
              <div className="space-y-3 bg-[#F9FAFB] rounded-lg p-3 border border-[#E5E7EB]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-medium text-[#4B5563]"><Phone className="w-3.5 h-3.5 text-[#9CA3AF]"/> {mainUser.phone}</div>
                  <button onClick={openWhatsApp} className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 hover:bg-green-200 transition-colors" title="WhatsApp"><MessageSquare className="w-3 h-3" /></button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-medium text-[#4B5563]"><MessageSquare className="w-3.5 h-3.5 text-[#9CA3AF]"/> {mainUser.email}</div>
                </div>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2 text-xs font-medium text-[#4B5563]">
                    <MapPin className="w-3.5 h-3.5 text-[#9CA3AF] mt-0.5 shrink-0"/> 
                    <span className="leading-snug">{customer.address || 'N/A'}<br/>{customer.city}, {customer.state} - {customer.pincode}</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wider flex items-center gap-1.5 mb-3"><Briefcase className="w-4 h-4"/> Company Information</h3>
              <div className="space-y-3 bg-white rounded-lg p-0 text-xs">
                <div className="flex justify-between border-b border-[#E5E7EB] pb-2"><span className="text-[#6B7280]">Company Name</span> <span className="font-semibold text-[#111111] text-right">{customer.name}</span></div>
                <div className="flex justify-between border-b border-[#E5E7EB] pb-2"><span className="text-[#6B7280]">GST Number</span> <span className="font-semibold text-[#111111] text-right">{customer.gstin || 'N/A'}</span></div>
                <div className="flex justify-between border-b border-[#E5E7EB] pb-2"><span className="text-[#6B7280]">Customer Type</span> <span className={`font-bold px-1.5 py-0.5 rounded text-[9px] uppercase ${isCorporate ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-700'}`}>{isCorporate ? 'Corporate' : 'Individual'}</span></div>
                <div className="flex justify-between"><span className="text-[#6B7280]">Joined Date</span> <span className="font-semibold text-[#111111] text-right">{new Date(customer.createdAt).toLocaleDateString()}</span></div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wider flex items-center gap-1.5 mb-3"><ShoppingBag className="w-4 h-4"/> Order Summary</h3>
              <div className="grid grid-cols-4 gap-2 text-center border border-[#E5E7EB] rounded-lg p-3 bg-white shadow-sm">
                <div><div className="text-sm font-black text-[#111111]">{totalOrders}</div><div className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider">Total Orders</div></div>
                <div><div className="text-sm font-black text-[#111111]">{formatCurrency(totalSpent)}</div><div className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider">Total Spent</div></div>
                <div><div className="text-sm font-black text-[#111111]">{formatCurrency(avgOrderValue)}</div><div className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider">Avg. Value</div></div>
                <div><div className="text-sm font-black text-[#111111]">{pendingOrders}</div><div className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider">Pending</div></div>
              </div>
            </div>

            {totalOrders > 0 && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wider">Recent Orders</h3>
                  <span className="text-[10px] font-bold text-[#3B6FEB] cursor-pointer hover:underline" onClick={() => setActiveTab('Orders')}>View All</span>
                </div>
                <div className="space-y-2">
                  {customer.orders.slice(0, 3).map((ord: any) => (
                    <div key={ord.id} className="flex items-center justify-between p-3 border border-[#E5E7EB] rounded-lg hover:border-[#3B6FEB] transition-colors bg-white">
                      <div>
                        <Link href={`/dashboard/orders/${ord.id}`} className="text-xs font-bold text-[#3B6FEB] hover:underline">{ord.orderNumber}</Link>
                        <p className="text-[10px] text-[#6B7280] mt-0.5">{new Date(ord.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-[#111111]">{formatCurrency(ord.totalAmount)}</p>
                        <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5 inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">{ord.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'Orders' && (
          <div className="space-y-3">
             {totalOrders === 0 ? (
                <div className="text-center py-12 text-[#9CA3AF]"><ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-50"/> <p className="text-xs">No orders placed yet.</p></div>
             ) : (
                customer.orders.map((ord: any) => (
                  <div key={ord.id} className="flex items-center justify-between p-3 border border-[#E5E7EB] rounded-lg bg-white">
                    <div>
                      <Link href={`/dashboard/orders/${ord.id}`} className="text-xs font-bold text-[#3B6FEB] hover:underline">{ord.orderNumber || ord.id.substring(0,8)}</Link>
                      <p className="text-[10px] text-[#6B7280] mt-0.5">{new Date(ord.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-[#111111]">{formatCurrency(ord.totalAmount)}</p>
                      <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5 inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{ord.status}</span>
                    </div>
                  </div>
                ))
             )}
          </div>
        )}

        {/* QUOTES TAB */}
        {activeTab === 'Quotes' && (
          <div className="space-y-3">
             {(!customer.quotes || customer.quotes.length === 0) ? (
                <div className="text-center py-12 text-[#9CA3AF]"><FileText className="w-8 h-8 mx-auto mb-2 opacity-50"/> <p className="text-xs">No quotes created yet.</p></div>
             ) : (
                customer.quotes.map((q: any) => (
                  <div key={q.id} className="flex items-center justify-between p-3 border border-[#E5E7EB] rounded-lg bg-white">
                    <div>
                      <Link href={`/dashboard/quotes/${q.id}`} className="text-xs font-bold text-[#3B6FEB] hover:underline">{q.quoteNumber || q.id.substring(0,8)}</Link>
                      <p className="text-[10px] text-[#6B7280] mt-0.5">{new Date(q.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-[#111111]">{formatCurrency(q.totalAmount)}</p>
                      <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5 inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{q.status}</span>
                    </div>
                  </div>
                ))
             )}
          </div>
        )}

        {/* PAYMENTS TAB */}
        {activeTab === 'Payments' && (
          <div className="space-y-3">
             {(() => {
                const allPayments = customer.orders?.flatMap(o => o.payments || []).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || [];
                if (allPayments.length === 0) {
                  return <div className="text-center py-12 text-[#9CA3AF]"><CreditCard className="w-8 h-8 mx-auto mb-2 opacity-50"/> <p className="text-xs">No payment history.</p></div>;
                }
                return allPayments.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between p-3 border border-[#E5E7EB] rounded-lg bg-white">
                    <div>
                      <p className="text-xs font-bold text-[#111111]">Pay ID: {p.id.substring(0,8)}</p>
                      <p className="text-[10px] text-[#6B7280] mt-0.5">{new Date(p.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-[#111111]">{formatCurrency(p.amount)}</p>
                      <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5 inline-block px-1.5 py-0.5 rounded bg-green-50 text-green-700">{p.status}</span>
                    </div>
                  </div>
                ));
             })()}
          </div>
        )}

        {/* NOTES TAB */}
        {activeTab === 'Notes' && (
          <div className="flex flex-col h-full">
            <p className="text-xs text-[#6B7280] mb-3 leading-relaxed">Internal notes for this customer. This is not visible to the customer on their portal.</p>
            <textarea 
               value={note}
               onChange={(e) => setNote(e.target.value)}
               className="w-full flex-1 min-h-[150px] p-3 border border-[#E5E7EB] rounded-lg text-sm bg-[#F9FAFB] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#3B6FEB] resize-none transition-all shadow-inner"
               placeholder="Write customer notes here..."
            />
            <div className="mt-4 flex justify-end">
               <button 
                  onClick={saveNote}
                  disabled={savingNote}
                  className="px-5 py-2.5 bg-[#3B6FEB] text-white rounded-lg text-sm font-bold shadow-sm hover:bg-[#2563EB] disabled:opacity-50 transition-colors flex items-center gap-2"
               >
                 {savingNote ? 'Saving...' : 'Save Notes'}
               </button>
            </div>
          </div>
        )}

      </div>

      {/* Drawer Actions */}
      <div className="p-4 border-t border-[#E5E7EB] bg-[#FDFDFD] flex flex-col gap-3">
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-[#E5E7EB] bg-white rounded-lg text-xs font-bold text-[#374151] hover:bg-[#F9FAFB] flex-1 flex justify-center items-center gap-1.5 shadow-sm transition-colors">
            <Edit2 className="w-3.5 h-3.5" /> Edit Customer
          </button>
          <button onClick={openWhatsApp} className="px-4 py-2 bg-[#111111] text-white rounded-lg text-xs font-bold hover:bg-black flex-1 flex justify-center items-center gap-1.5 shadow-sm transition-colors">
            <MessageSquare className="w-3.5 h-3.5" /> Send Message
          </button>
        </div>
      </div>
    </div>
  );
}
