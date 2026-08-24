'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Plus, Tag, CheckCircle2, AlertCircle, Calendar, RefreshCw, Edit2, Copy, Trash2, X } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';

import { API_URL } from '@/lib/api';

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ totalCoupons: 0, activeCoupons: 0, inactiveCoupons: 0, expiredCoupons: 0, totalUsageAmount: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [filterDiscountType, setFilterDiscountType] = useState('All Discount Type');
  
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, pageSize: 10 });
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [search, filterStatus, filterDiscountType, page]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const qs = new URLSearchParams({ search, page: String(page) });
      if (filterStatus !== 'All Status') qs.append('status', filterStatus);
      if (filterDiscountType !== 'All Discount Type') qs.append('discountType', filterDiscountType);

      const [resList, resStats] = await Promise.all([
        fetch(`${API_URL}/coupons?${qs.toString()}`, { headers }).then(r => r.json()),
        fetch(`${API_URL}/coupons/stats`, { headers }).then(r => r.json())
      ]);

      if (resList.success) {
        setCoupons(resList.data || []);
        if(resList.pagination) setPagination(resList.pagination);
      }
      if (resStats.success) {
         setStats(resStats.stats);
      }
    } catch (error) {
      console.error('Failed to load coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (id: string) => {
     if(!confirm('Are you sure you want to deactivate this coupon?')) return;
     try {
        const token = localStorage.getItem('token');
        await fetch(`${API_URL}/coupons/${id}`, {
           method: 'DELETE',
           headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchData();
     } catch (e) {
        console.error(e);
     }
  };

  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
  };

  const getStatusColor = (status: string) => {
     switch (status) {
        case 'ACTIVE': return 'text-green-700 bg-green-50 border-green-200';
        case 'INACTIVE': return 'text-orange-700 bg-orange-50 border-orange-200';
        case 'EXPIRED': return 'text-red-700 bg-red-50 border-red-200';
        default: return 'text-gray-600 bg-gray-50 border-gray-200';
     }
  };

  // Pie chart data for "Total Usage" logic (Placeholder logic using total vs used, adapt as needed)
  const totalLimitSimulated = stats.totalUsageAmount > 0 ? stats.totalUsageAmount * 1.5 : 100;
  const pieData = [
    { name: 'Used', value: stats.totalUsageAmount, color: '#10B981' },
    { name: 'Unused', value: totalLimitSimulated - stats.totalUsageAmount, color: '#3B82F6' },
  ];
  if (stats.totalUsageAmount === 0) {
      pieData[0].value = 0;
      pieData[1].value = 1;
      pieData[1].color = '#E5E7EB';
  }

  const handleEdit = (c: any) => {
     setEditingCoupon(c);
     setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-6 pb-12 font-sans bg-[#F8F9FC] min-h-screen relative flex flex-col">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-black text-[#111111]">Coupons</h1>
          <div className="text-sm text-[#6B7280] font-medium mt-1 flex items-center gap-2">
            Dashboard <span className="text-[#D1D5DB]">&gt;</span> Coupons
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-[#E5E7EB] bg-white rounded-lg text-sm font-bold text-[#374151] hover:bg-[#F9FAFB] transition-colors shadow-sm">
            <Download className="w-4 h-4" /> Export
          </button>
          <button 
             onClick={() => { setEditingCoupon(null); setIsDrawerOpen(true); }}
             className="flex items-center gap-2 px-4 py-2 bg-[#3B6FEB] hover:bg-[#2563EB] text-white rounded-lg text-sm font-bold transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add New Coupon
          </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard icon={<Tag className="w-5 h-5 text-purple-600" />} iconBg="bg-purple-50" title="Total Coupons" value={stats.totalCoupons} sub="All coupons" />
        <StatCard icon={<CheckCircle2 className="w-5 h-5 text-green-600" />} iconBg="bg-green-50" title="Active Coupons" value={stats.activeCoupons} sub={`${stats.totalCoupons > 0 ? ((stats.activeCoupons/stats.totalCoupons)*100).toFixed(2) : 0}% of total`} />
        <StatCard icon={<AlertCircle className="w-5 h-5 text-orange-600" />} iconBg="bg-orange-50" title="Inactive Coupons" value={stats.inactiveCoupons} sub={`${stats.totalCoupons > 0 ? ((stats.inactiveCoupons/stats.totalCoupons)*100).toFixed(2) : 0}% of total`} />
        <StatCard icon={<Calendar className="w-5 h-5 text-red-600" />} iconBg="bg-red-50" title="Expired Coupons" value={stats.expiredCoupons} sub={`${stats.totalCoupons > 0 ? ((stats.expiredCoupons/stats.totalCoupons)*100).toFixed(2) : 0}% of total`} />
        <StatCard icon={<RefreshCw className="w-5 h-5 text-blue-600" />} iconBg="bg-blue-50" title="Total Usage" value={formatINR(stats.totalUsageAmount)} sub="This Month" />
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex flex-col lg:flex-row gap-6 relative">
        {/* LIST TABLE - Left Side */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm transition-all duration-300 flex-1 overflow-hidden flex flex-col">
          {/* Toolbar */}
          <div className="p-4 border-b border-[#E5E7EB] flex flex-wrap gap-3 justify-between items-center bg-[#FDFDFD]">
            <div className="relative flex-1 min-w-[250px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
              <input 
                type="text" 
                placeholder="Search coupons by code or name..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#111111] focus:outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] shadow-sm transition-shadow"
              />
            </div>
            <div className="flex items-center gap-2">
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#374151] outline-none hover:bg-[#F9FAFB]">
                <option>All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="EXPIRED">Expired</option>
              </select>
              <select value={filterDiscountType} onChange={e => setFilterDiscountType(e.target.value)} className="px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#374151] outline-none hover:bg-[#F9FAFB] hidden sm:block">
                <option>All Discount Type</option>
                <option value="Percentage">Percentage</option>
                <option value="Fixed Amount">Fixed Amount</option>
              </select>
              <button className="flex items-center gap-2 px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm font-semibold text-[#374151] hover:bg-[#F9FAFB] transition-colors bg-white">
                <Filter className="w-4 h-4" /> <span className="hidden sm:inline">Filter</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#FDFDFD]">
                  <th className="px-4 py-3 w-10 text-center"><input type="checkbox" className="rounded border-gray-300" /></th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Coupon Code</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Coupon Name</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider text-right">Discount</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider text-center">Type</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider text-right">Min. Order</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider text-center">Usage / Limit</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider text-center">Valid From - To</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider text-center">Status</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {loading ? (
                  <tr><td colSpan={10} className="p-8 text-center text-gray-500 font-medium">Loading coupons...</td></tr>
                ) : coupons.length === 0 ? (
                  <tr><td colSpan={10} className="p-8 text-center flex flex-col items-center">
                    <Tag className="w-12 h-12 text-gray-300 mb-2"/>
                    <p className="text-[#111111] font-bold text-sm">No coupons found</p>
                    <p className="text-[#6B7280] text-xs mt-1">Adjust filters or create your first coupon.</p>
                  </td></tr>
                ) : coupons.map((coupon) => {
                  
                  const isPercentage = coupon.discountType === 'PERCENTAGE';
                  const discountDisplay = isPercentage ? `${coupon.discountValue}% OFF` : `${formatINR(coupon.discountValue)} OFF`;
                  
                  const usagePercent = coupon.usageLimit ? Math.min((coupon.usageCount / coupon.usageLimit) * 100, 100) : 0;
                  
                  return (
                    <tr key={coupon.id} className="hover:bg-[#F9FAFB] transition-colors group">
                      <td className="px-4 py-4 text-center">
                         <input type="checkbox" className="rounded border-gray-300 w-4 h-4 text-blue-600 focus:ring-blue-600 cursor-pointer" />
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs font-bold text-[#3B6FEB] bg-blue-50 px-2 py-1 rounded">{coupon.code}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs font-bold text-[#111111] truncate max-w-[120px]">{coupon.name}</span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className={`text-xs font-bold ${isPercentage ? 'text-green-700' : 'text-blue-700'}`}>{discountDisplay}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-[10px] font-medium text-[#6B7280]">{isPercentage ? 'Percentage' : 'Fixed Amount'}</span>
                      </td>
                      <td className="px-4 py-4 text-right">
                         <span className="text-xs font-bold text-[#111111]">{coupon.minimumOrderAmount ? formatINR(coupon.minimumOrderAmount) : '—'}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col items-center">
                           <span className="text-xs font-bold text-[#111111]">{coupon.usageCount} / {coupon.usageLimit || '∞'}</span>
                           {coupon.usageLimit && (
                              <div className="w-16 h-1 bg-gray-200 rounded-full mt-1 overflow-hidden">
                                 <div className={`h-full ${usagePercent >= 100 ? 'bg-red-500' : usagePercent >= 80 ? 'bg-orange-500' : 'bg-green-500'}`} style={{ width: `${usagePercent}%` }}></div>
                              </div>
                           )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex flex-col">
                           <span className="text-[10px] font-semibold text-[#374151]">{new Date(coupon.startAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                           <span className="text-[10px] text-[#6B7280]">{new Date(coupon.endAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md border ${getStatusColor(coupon.status)}`}>
                          {coupon.status.charAt(0) + coupon.status.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(coupon)} className="p-1.5 text-[#6B7280] hover:text-[#111111] hover:bg-[#F3F4F6] rounded" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button className="p-1.5 text-[#6B7280] hover:text-[#111111] hover:bg-[#F3F4F6] rounded" title="Duplicate"><Copy className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDeactivate(coupon.id)} className="p-1.5 text-[#6B7280] hover:text-red-600 hover:bg-red-50 rounded" title="Deactivate/Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="p-4 border-t border-[#E5E7EB] flex justify-between items-center text-xs text-[#6B7280] bg-[#FDFDFD]">
            <span>Showing {(page - 1) * pagination.pageSize + 1} to {Math.min(page * pagination.pageSize, pagination.total)} of {pagination.total} coupons</span>
            <div className="flex gap-1 items-center">
              <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-2 py-1 border border-[#E5E7EB] rounded hover:bg-[#F3F4F6] disabled:opacity-50">&lt;</button>
              <span className="px-3 font-semibold text-[#111111] bg-blue-50 text-blue-700 py-1 rounded">{page}</span>
              <button disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)} className="px-2 py-1 border border-[#E5E7EB] rounded hover:bg-[#F3F4F6] disabled:opacity-50">&gt;</button>
            </div>
          </div>
        </div>

      </div>

      {/* RIGHT DRAWER: Add/Edit Coupon */}
      {isDrawerOpen && (
         <CouponDrawer 
            coupon={editingCoupon}
            onClose={() => setIsDrawerOpen(false)}
            onSuccess={() => { setIsDrawerOpen(false); fetchData(); }}
         />
      )}

    </div>
  );
}


// -------------------------------------------------------------------------------------------------
// ADD / EDIT COUPON DRAWER
// -------------------------------------------------------------------------------------------------
function CouponDrawer({ coupon, onClose, onSuccess }: { coupon?: any, onClose: () => void, onSuccess: () => void }) {
   const [formData, setFormData] = useState({
      code: coupon?.code || '',
      name: coupon?.name || '',
      description: coupon?.description || '',
      discountType: coupon?.discountType || 'PERCENTAGE',
      discountValue: coupon?.discountValue || '',
      minimumOrderAmount: coupon?.minimumOrderAmount || '',
      maximumDiscount: coupon?.maximumDiscount || '',
      startAt: coupon?.startAt ? new Date(coupon.startAt).toISOString().substring(0, 10) : new Date().toISOString().substring(0, 10),
      endAt: coupon?.endAt ? new Date(coupon.endAt).toISOString().substring(0, 10) : new Date(Date.now() + 30*24*60*60*1000).toISOString().substring(0, 10),
      usageLimit: coupon?.usageLimit || '',
      status: coupon?.status || 'ACTIVE'
   });

   const [loading, setLoading] = useState(false);
   const [error, setError] = useState('');

   const handleChange = (e: any) => {
      setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
   };

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setLoading(true);
      try {
         const method = coupon ? 'PUT' : 'POST';
         const url = coupon ? `${API_URL}/coupons/${coupon.id}` : `${API_URL}/coupons`;
         
         const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: JSON.stringify(formData)
         }).then(r => r.json());

         if (res.success) {
            onSuccess();
         } else {
            setError(res.message || 'Failed to save coupon');
         }
      } catch (err: any) {
         setError(err.message);
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm transition-opacity">
         <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-slide-in-right">
            
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
               <h2 className="text-lg font-bold text-[#111111]">{coupon ? 'Edit Coupon' : 'Add New Coupon'}</h2>
               <button onClick={onClose} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"><X className="w-4 h-4" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto flex flex-col gap-5">
               {error && <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-100">{error}</div>}
               
               <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Coupon Code *</label>
                  <input required name="code" value={formData.code} onChange={handleChange} disabled={!!coupon} placeholder="e.g. WELCOME10" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold uppercase disabled:opacity-50" />
               </div>

               <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Coupon Name *</label>
                  <input required name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Welcome Discount" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium" />
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Discount Type *</label>
                     <select name="discountType" value={formData.discountType} onChange={handleChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium appearance-none">
                        <option value="PERCENTAGE">Percentage</option>
                        <option value="FIXED_AMOUNT">Fixed Amount</option>
                     </select>
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Discount Value *</label>
                     <input required type="number" step="0.01" name="discountValue" value={formData.discountValue} onChange={handleChange} placeholder={formData.discountType === 'PERCENTAGE' ? 'e.g. 10' : 'e.g. 500'} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium" />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Minimum Order Amount</label>
                     <input type="number" step="0.01" name="minimumOrderAmount" value={formData.minimumOrderAmount} onChange={handleChange} placeholder="Optional" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium" />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Maximum Discount</label>
                     <input type="number" step="0.01" name="maximumDiscount" value={formData.maximumDiscount} onChange={handleChange} placeholder="Optional" disabled={formData.discountType === 'FIXED_AMOUNT'} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium disabled:opacity-50" />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Start Date *</label>
                     <input required type="date" name="startAt" value={formData.startAt} onChange={handleChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium" />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">End Date *</label>
                     <input required type="date" name="endAt" value={formData.endAt} onChange={handleChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium" />
                  </div>
               </div>

               <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Usage Limit</label>
                  <input type="number" name="usageLimit" value={formData.usageLimit} onChange={handleChange} placeholder="Leave empty for unlimited" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium" />
               </div>

               <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Status</label>
                  <div className="flex gap-4 items-center">
                     <label className="flex items-center gap-2 text-sm font-bold text-[#111111] cursor-pointer">
                        <input type="radio" name="status" value="ACTIVE" checked={formData.status === 'ACTIVE'} onChange={handleChange} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                        <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span> Active
                     </label>
                     <label className="flex items-center gap-2 text-sm font-bold text-[#111111] cursor-pointer">
                        <input type="radio" name="status" value="INACTIVE" checked={formData.status === 'INACTIVE'} onChange={handleChange} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                        <span className="w-2 h-2 rounded-full bg-orange-500 inline-block"></span> Inactive
                     </label>
                  </div>
               </div>

               <div className="mt-auto pt-4 border-t border-gray-100 flex justify-end gap-3">
                  <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors">Cancel</button>
                  <button type="submit" disabled={loading} className="px-6 py-2.5 bg-[#3B6FEB] hover:bg-[#2563EB] text-white text-sm font-bold rounded-lg shadow-sm transition-colors disabled:opacity-50">
                     {loading ? 'Saving...' : 'Save Coupon'}
                  </button>
               </div>
            </form>
         </div>
      </div>
   );
}
