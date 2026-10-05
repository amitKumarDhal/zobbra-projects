'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Download, ExternalLink, Phone, X, Users, UserPlus, Star, Clock, CheckCircle2, UserCircle, ShoppingBag, Trash2, Palette, History } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';

import { API_URL } from '@/lib/api';

// Every profile value is the customer's current saved profile; null means "not filled yet".
interface CustomerProfile {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  companyId: string | null;
  company: string | null;
  gstin: string | null;
  address: string | null;
  addressType: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  joinedAt: string;
  ordersCount: number;
  totalValue: number;
  status: string;
}

interface CustomerRow extends CustomerProfile {
  lastOrderAt: string | null;
}

interface CustomerDetail extends CustomerProfile {
  notes: string | null;
  orders: { id: string; orderNumber: string; status: string; paymentStatus: string; totalAmount: number; createdAt: string }[];
  designHistory: {
    quoteId: string;
    quoteNumber: string;
    orderNumber: string | null;
    product: string | null;
    status: string;
    createdAt: string;
    artworkUrl: string | null;
    previewFrontUrl: string | null;
    previewBackUrl: string | null;
  }[];
  activity: { type: string; message: string; at: string }[];
}

const dash = (value: string | null | undefined) => value || '—';

/** OTP-only customers have no name yet, so they are listed by their number. */
const displayName = (c: { name: string | null; phone: string | null }) =>
  c.name || (c.phone ? c.phone.replace(/^\+91/, '') : '—');

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

const authHeader = () => ({ Authorization: 'Bearer ' + localStorage.getItem('token') });

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [stats, setStats] = useState<any>({ totalCustomers: 0, activeCustomers: 0, newThisMonth: 0, repeatCustomers: 0, topCustomerCount: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Drawer State
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetail | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Pagination
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, pageSize: 10 });
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    try {
      const u = localStorage.getItem('user');
      if (u) {
        setUserRole(JSON.parse(u).role || '');
      }
    } catch (e) {
      console.warn('Could not parse user from local storage', e);
    }
    fetchData();
  }, [search, page]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = authHeader();

      const [resList, resStats] = await Promise.all([
        fetch(`${API_URL}/customers/accounts?search=${encodeURIComponent(search)}&page=${page}`, { headers }).then(r => r.json()),
        fetch(`${API_URL}/customers/accounts/stats`, { headers }).then(r => r.json())
      ]);

      if (resList.success) {
        setCustomers(resList.data || []);
        if (resList.pagination) setPagination(resList.pagination);
        setSelectedIds([]);
      }

      if (resStats.success) {
        setStats(resStats.stats || {});
      }
    } catch (error) {
      console.error('Failed to load customers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Deleting works on the customer's company record; accounts without one are not deletable here.
  const deletableRows = customers.filter((c) => c.companyId);

  const handleBulkDelete = async () => {
    const companyIds = Array.from(new Set(customers.filter((c) => selectedIds.includes(c.id)).map((c) => c.companyId!)));
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} customers?`)) return;
    try {
      const res = await fetch(`${API_URL}/customers/bulk`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ ids: companyIds })
      });
      const data = await res.json();
      if (!res.ok) alert(`Failed: ${data.message}`);
      else fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (companyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this customer?')) return;
    try {
      const res = await fetch(`${API_URL}/customers/${companyId}`, { method: 'DELETE', headers: authHeader() });
      const data = await res.json();
      if (!res.ok) alert(`Failed: ${data.message}`);
      else fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleOpenCustomer = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/customers/accounts/${id}`, { headers: authHeader() }).then(r => r.json());
      if (res.success) {
        setSelectedCustomer(res.customer);
        setIsDrawerOpen(true);
      }
    } catch (err) {
      console.error('Failed to load customer details', err);
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans bg-[#F8F9FC] min-h-screen relative flex flex-col">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-black text-[#111111]">Customers &amp; Leads</h1>
          <p className="text-sm text-[#6B7280] font-medium mt-1">Every customer account and the profile they have saved</p>
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
        <StatCard icon={<Users className="w-5 h-5 text-purple-600" />} iconBg="bg-purple-50" title="Total Customers" value={stats.totalCustomers} sub="All customer accounts" />
        <StatCard icon={<CheckCircle2 className="w-5 h-5 text-green-600" />} iconBg="bg-green-50" title="Active Customers" value={stats.activeCustomers} sub="Have placed an order" />
        <StatCard icon={<UserPlus className="w-5 h-5 text-amber-600" />} iconBg="bg-amber-50" title="New This Month" value={stats.newThisMonth} sub="Joined this month" />
        <StatCard icon={<Clock className="w-5 h-5 text-blue-600" />} iconBg="bg-blue-50" title="Repeat Customers" value={stats.repeatCustomers} sub="Placed multiple orders" />
        <StatCard icon={<Star className="w-5 h-5 text-pink-600" />} iconBg="bg-pink-50" title="Top Customers" value={stats.topCustomerCount} sub="High value customers" />
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex flex-1 gap-6 relative">
        {/* LIST TABLE */}
        <div className={`bg-white border border-[#E5E7EB] rounded-2xl shadow-sm transition-all duration-300 flex-1 ${isDrawerOpen ? 'w-2/3 hidden lg:block' : 'w-full'}`}>
          {/* Toolbar */}
          <div className="p-4 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:flex-wrap gap-3 justify-between items-stretch sm:items-center bg-[#FDFDFD] rounded-t-2xl">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Search by name, email, phone, company..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-4 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#111111] focus:outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] shadow-sm transition-shadow"
              />
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedIds.length > 0 && userRole === 'ADMIN' && (
            <div className="bg-red-50 border-b border-red-100 px-4 py-2 flex items-center justify-between">
              <span className="text-sm font-bold text-red-800">{selectedIds.length} customer(s) selected</span>
              <button onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm">
                Delete Selected
              </button>
            </div>
          )}

          {/* Table */}
          <div className="table-scroll">
            <table className="w-full min-w-[850px] text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E7EB]">
                  <th className="px-4 py-3 w-10 text-center"><input type="checkbox" className="rounded border-gray-300" disabled={deletableRows.length === 0} checked={deletableRows.length > 0 && selectedIds.length === deletableRows.length} onChange={(e) => setSelectedIds(e.target.checked ? deletableRows.map(c => c.id) : [])} /></th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Contact</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Company</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider text-center">Orders</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider text-right">Total Value</th>
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
                  const label = displayName(c);
                  return (
                    <tr key={c.id} data-cy="customer-row" className="hover:bg-[#F9FAFB] transition-colors cursor-pointer group" onClick={() => handleOpenCustomer(c.id)}>
                      <td className="px-4 py-4 text-center"><input type="checkbox" className="rounded border-gray-300" disabled={!c.companyId} checked={selectedIds.includes(c.id)} onChange={(e) => { e.stopPropagation(); setSelectedIds(prev => prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id]); }} onClick={e=>e.stopPropagation()} /></td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-50 text-[#3B6FEB] flex items-center justify-center font-bold text-xs uppercase border border-blue-100">
                            {label.substring(0, 2)}
                          </div>
                          <p className="text-xs font-bold text-[#111111] flex items-center gap-2">
                            {label}
                            {c.totalValue > 50000 && <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-purple-50 text-purple-600 border border-purple-200 uppercase tracking-wider">Top</span>}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-[#4B5563]">
                          <Phone className="w-3.5 h-3.5 text-[#9CA3AF]" />
                          {dash(c.phone)}
                        </div>
                        {c.email && <p className="text-[10px] text-[#6B7280] mt-0.5 pl-5">{c.email}</p>}
                      </td>
                      <td className="px-4 py-4 text-xs font-bold text-[#111111]">{dash(c.company)}</td>
                      <td className="px-4 py-4 text-center text-xs font-bold text-[#111111]">{c.ordersCount > 0 ? c.ordersCount : '—'}</td>
                      <td className="px-4 py-4 text-right text-xs font-bold text-[#111111]">{c.ordersCount > 0 ? formatCurrency(c.totalValue) : '—'}</td>
                      <td className="px-4 py-4">
                        {c.lastOrderAt ? (
                          <>
                            <p className="text-xs text-[#111111]">{new Date(c.lastOrderAt).toLocaleDateString()}</p>
                            <p className="text-[10px] text-[#6B7280]">{new Date(c.lastOrderAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </>
                        ) : (
                          <span className="text-xs text-[#9CA3AF]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-1.5 text-[#6B7280] hover:text-[#111111] hover:bg-[#F3F4F6] rounded" title="View"><ExternalLink className="w-3.5 h-3.5" /></button>
                          {userRole === 'ADMIN' && c.companyId && (
                            <button onClick={(e) => handleDelete(c.companyId!, e)} className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                          )}
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
            <span>Showing {pagination.total === 0 ? 0 : (page - 1) * pagination.pageSize + 1} to {Math.min(page * pagination.pageSize, pagination.total)} of {pagination.total} customers</span>
            <div className="flex gap-1 items-center">
              <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-2 py-1 border border-[#E5E7EB] rounded hover:bg-[#F3F4F6] disabled:opacity-50">&lt;</button>
              <span className="px-3 font-semibold text-[#111111]">{page}</span>
              <button disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)} className="px-2 py-1 border border-[#E5E7EB] rounded hover:bg-[#F3F4F6] disabled:opacity-50">&gt;</button>
            </div>
          </div>
        </div>

        {/* RIGHT DRAWER */}
        {isDrawerOpen && selectedCustomer && (
          <CustomerDrawer
            key={selectedCustomer.id}
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
type DrawerTab = 'Profile' | 'Orders' | 'Design History' | 'Activity' | 'Notes';

function CustomerDrawer({ customer, onClose, onRefresh }: { customer: CustomerDetail, onClose: () => void, onRefresh: () => void }) {
  const [activeTab, setActiveTab] = useState<DrawerTab>('Profile');
  const [note, setNote] = useState(customer.notes || '');
  const [savingNote, setSavingNote] = useState(false);

  const label = displayName(customer);
  // Internal notes live on the company record, so they need one to exist
  const tabs: DrawerTab[] = ['Profile', 'Orders', 'Design History', 'Activity', ...(customer.companyId ? ['Notes' as const] : [])];

  const profileRows: [string, string | null][] = [
    ['Name', customer.name],
    ['Phone', customer.phone],
    ['Email', customer.email],
    ['Company', customer.company],
    ['Pincode', customer.pincode],
    ['Address', customer.address],
    ['Address Type', customer.addressType],
    ['City', customer.city],
    ['State', customer.state],
    ['GST', customer.gstin],
  ];

  const saveNote = async () => {
    try {
      setSavingNote(true);
      const res = await fetch(`${API_URL}/customers/${customer.companyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ notes: note })
      }).then(r => r.json());
      if (res.success) onRefresh();
    } catch(err) {
      console.error(err);
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <div data-cy="customer-drawer" className="w-full lg:w-1/3 min-w-0 lg:min-w-[380px] max-w-[420px] bg-white border border-[#E5E7EB] rounded-2xl shadow-xl flex flex-col h-[calc(100vh-140px)] sticky top-6 overflow-hidden">

      {/* Drawer Header */}
      <div className="px-5 pt-5 pb-0 border-b border-[#E5E7EB] bg-[#FDFDFD]">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#EEF2FF] text-[#3B6FEB] flex items-center justify-center font-bold text-lg uppercase border border-[#BFDBFE] shadow-sm">
              {label.substring(0, 2)}
            </div>
            <div>
              <h2 className="text-lg font-heading font-black text-[#111111]">{label}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-[10px] text-[#6B7280]">Customer ID: <span className="font-bold text-[#111111]">{customer.id.substring(0,8).toUpperCase()}</span></span>
                <StatusBadge status={customer.status} />
                {customer.totalValue > 50000 && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border text-purple-700 bg-purple-50 border-purple-200">Top Customer</span>}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-[#9CA3AF] hover:text-[#111111] hover:bg-[#F3F4F6] rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mt-5 border-b border-[#E5E7EB] overflow-x-auto hide-scrollbar pb-1">
          {tabs.map((tab) => (
             <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-[11px] font-bold uppercase tracking-wider pb-3 border-b-2 whitespace-nowrap transition-colors ${activeTab === tab ? 'border-[#111111] text-[#111111]' : 'border-transparent text-[#9CA3AF] hover:text-[#4B5563]'}`}
             >
               {tab} {tab === 'Orders' && `(${customer.orders.length})`}
             </button>
          ))}
        </div>
      </div>

      {/* Drawer Content */}
      <div className="flex-1 overflow-y-auto p-5 hide-scrollbar">

        {/* PROFILE TAB */}
        {activeTab === 'Profile' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wider flex items-center gap-1.5 mb-3"><UserCircle className="w-4 h-4"/> Profile</h3>
              <div className="text-xs" data-cy="customer-profile">
                {profileRows.map(([field, value]) => (
                  <div key={field} className="flex justify-between gap-4 border-b border-[#E5E7EB] py-2">
                    <span className="text-[#6B7280] shrink-0">{field}</span>
                    <span className="font-semibold text-[#111111] text-right break-words">{dash(value)}</span>
                  </div>
                ))}
                <div className="flex justify-between gap-4 py-2">
                  <span className="text-[#6B7280]">Joined Date</span>
                  <span className="font-semibold text-[#111111] text-right">{new Date(customer.joinedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wider flex items-center gap-1.5 mb-3"><ShoppingBag className="w-4 h-4"/> Order Summary</h3>
              <div className="grid grid-cols-2 gap-2 text-center border border-[#E5E7EB] rounded-lg p-3 bg-white shadow-sm">
                <div><div className="text-sm font-black text-[#111111]">{customer.ordersCount > 0 ? customer.ordersCount : '—'}</div><div className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider">Orders</div></div>
                <div><div className="text-sm font-black text-[#111111]">{customer.ordersCount > 0 ? formatCurrency(customer.totalValue) : '—'}</div><div className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider">Total Value</div></div>
              </div>
            </div>
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'Orders' && (
          <div className="space-y-3">
             {customer.orders.length === 0 ? (
                <div className="text-center py-12 text-[#9CA3AF]"><ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-50"/> <p className="text-xs">No orders placed yet.</p></div>
             ) : (
                customer.orders.map((ord) => (
                  <div key={ord.id} className="flex items-center justify-between p-3 border border-[#E5E7EB] rounded-lg bg-white">
                    <div>
                      <Link href={`/dashboard/orders/${ord.id}`} className="text-xs font-bold text-[#3B6FEB] hover:underline">{ord.orderNumber || ord.id.substring(0,8)}</Link>
                      <p className="text-[10px] text-[#6B7280] mt-0.5">{new Date(ord.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-[#111111]">{formatCurrency(ord.totalAmount)}</p>
                      <StatusBadge status={ord.status} className="mt-0.5" />
                    </div>
                  </div>
                ))
             )}
          </div>
        )}

        {/* DESIGN HISTORY TAB */}
        {activeTab === 'Design History' && (
          <div className="space-y-3">
             {customer.designHistory.length === 0 ? (
                <div className="text-center py-12 text-[#9CA3AF]"><Palette className="w-8 h-8 mx-auto mb-2 opacity-50"/> <p className="text-xs">No designs created yet.</p></div>
             ) : (
                customer.designHistory.map((d) => {
                  const images = [d.previewFrontUrl, d.previewBackUrl, d.artworkUrl].filter((url): url is string => Boolean(url));
                  return (
                    <div key={d.quoteId} className="p-3 border border-[#E5E7EB] rounded-lg bg-white space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-bold text-[#111111]">{dash(d.product)}</p>
                          <Link href={`/dashboard/quotes/${d.quoteId}`} className="text-[10px] font-bold text-[#3B6FEB] hover:underline">{d.quoteNumber}</Link>
                          {d.orderNumber && <span className="text-[10px] text-[#6B7280]"> • {d.orderNumber}</span>}
                          <p className="text-[10px] text-[#6B7280] mt-0.5">{new Date(d.createdAt).toLocaleDateString()}</p>
                        </div>
                        <StatusBadge status={d.status} />
                      </div>
                      <div className="flex gap-2">
                        {images.map((url) => (
                          <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="w-16 h-16 rounded border border-[#E5E7EB] bg-[#F9FAFB] overflow-hidden">
                            <img src={url} alt="Design" className="w-full h-full object-contain" />
                          </a>
                        ))}
                      </div>
                    </div>
                  );
                })
             )}
          </div>
        )}

        {/* ACTIVITY TAB */}
        {activeTab === 'Activity' && (
          <div className="space-y-3">
            {customer.activity.map((a, i) => (
              <div key={i} className="flex items-start gap-3 text-xs">
                <span className="w-6 h-6 rounded-full bg-[#EEF2FF] text-[#3B6FEB] flex items-center justify-center shrink-0"><History className="w-3 h-3" /></span>
                <div>
                  <p className="font-semibold text-[#111111]">{a.message}</p>
                  <p className="text-[10px] text-[#6B7280] mt-0.5">{new Date(a.at).toLocaleString()}</p>
                </div>
              </div>
            ))}
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

    </div>
  );
}
