'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Plus, CreditCard, CheckCircle2, Clock, AlertTriangle, RefreshCw, MoreVertical, Eye, Settings, FileText, ChevronRight, X } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import Link from 'next/link';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';

const API_URL = 'http://localhost:5000/api/v1';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ totalCollection: 0, received: 0, pending: 0, overdue: 0, refunded: 0, percentages: {}, methods: [], overdueInvoices: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [filterMethod, setFilterMethod] = useState('All Payment Methods');
  const [filterDate, setFilterDate] = useState('All Date Range');
  
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, pageSize: 10 });
  
  // Modal states
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, [search, filterStatus, filterMethod, filterDate, page]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const qs = new URLSearchParams({ search, page: String(page) });
      if (filterStatus !== 'All Status') qs.append('status', filterStatus);
      if (filterMethod !== 'All Payment Methods') qs.append('method', filterMethod);
      if (filterDate !== 'All Date Range') qs.append('dateRange', filterDate);

      const [resList, resStats] = await Promise.all([
        fetch(`${API_URL}/payments?${qs.toString()}`, { headers }).then(r => r.json()),
        fetch(`${API_URL}/payments/stats`, { headers }).then(r => r.json())
      ]);

      if (resList.success) {
        setPayments(resList.data || []);
        if(resList.pagination) setPagination(resList.pagination);
      }
      if (resStats.success) {
         setStats(resStats.stats);
      }
    } catch (error) {
      console.error('Failed to load payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
  };

  const getStatusColor = (status: string) => {
     switch (status) {
        case 'PAID':
        case 'SUCCESS': return 'text-green-700 bg-green-50 border-green-200';
        case 'PARTIAL': return 'text-orange-700 bg-orange-50 border-orange-200';
        case 'OVERDUE': return 'text-red-700 bg-red-50 border-red-200';
        case 'PENDING': return 'text-orange-700 bg-orange-50 border-orange-200';
        default: return 'text-gray-600 bg-gray-50 border-gray-200';
     }
  };

  const getStatusText = (paymentStatus: string, orderStatus: string, createdDate: string) => {
     if (paymentStatus === 'SUCCESS' && orderStatus === 'PAID') return 'Paid';
     if (paymentStatus === 'SUCCESS' && orderStatus === 'PARTIAL') return 'Partial';
     if (orderStatus === 'PENDING' && new Date(createdDate).getTime() < (Date.now() - 30 * 24 * 60 * 60 * 1000)) return 'Overdue';
     if (paymentStatus === 'PENDING') return 'Pending';
     return paymentStatus;
  };

  const pieData = [
    { name: 'Paid', value: stats.received || 0, color: '#10B981' },
    { name: 'Partial', value: stats.pending || 0, color: '#F59E0B' },
    { name: 'Overdue', value: stats.overdue || 0, color: '#EF4444' },
  ].filter(d => d.value > 0);

  // If no data, show empty state in pie
  if (pieData.length === 0) pieData.push({ name: 'No Data', value: 1, color: '#E5E7EB' });

  return (
    <div className="space-y-6 pb-12 font-sans bg-[#F8F9FC] min-h-screen relative flex flex-col">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-black text-[#111111]">Payments</h1>
          <div className="text-sm text-[#6B7280] font-medium mt-1 flex items-center gap-2">
            Dashboard <span className="text-[#D1D5DB]">&gt;</span> Payments
          </div>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard icon={<CreditCard className="w-5 h-5 text-blue-600" />} iconBg="bg-blue-50" title="Total Collection" value={formatINR(stats.totalCollection)} sub="This Month" />
        <StatCard icon={<CheckCircle2 className="w-5 h-5 text-green-600" />} iconBg="bg-green-50" title="Received" value={formatINR(stats.received)} sub={`${stats.percentages.received?.toFixed(2) || 0}% of total`} />
        <StatCard icon={<Clock className="w-5 h-5 text-orange-600" />} iconBg="bg-orange-50" title="Pending" value={formatINR(stats.pending)} sub={`${stats.percentages.pending?.toFixed(2) || 0}% of total`} />
        <StatCard icon={<AlertTriangle className="w-5 h-5 text-red-600" />} iconBg="bg-red-50" title="Overdue" value={formatINR(stats.overdue)} sub={`${stats.percentages.overdue?.toFixed(2) || 0}% of total`} />
        <StatCard icon={<RefreshCw className="w-5 h-5 text-purple-600" />} iconBg="bg-purple-50" title="Refunded" value={formatINR(stats.refunded)} sub="This Month" />
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
                placeholder="Search by order no., invoice no., customer..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#111111] focus:outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] shadow-sm transition-shadow"
              />
            </div>
            <div className="flex items-center gap-2">
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#374151] outline-none hover:bg-[#F9FAFB]">
                <option>All Status</option>
                <option value="SUCCESS">Paid</option>
                <option value="PARTIAL">Partial</option>
                <option value="PENDING">Pending</option>
                <option value="Overdue">Overdue</option>
              </select>
              <select value={filterMethod} onChange={e => setFilterMethod(e.target.value)} className="px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#374151] outline-none hover:bg-[#F9FAFB] hidden sm:block">
                <option>All Payment Methods</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
              </select>
              <select value={filterDate} onChange={e => setFilterDate(e.target.value)} className="px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#374151] outline-none hover:bg-[#F9FAFB] hidden sm:block">
                <option>All Date Range</option>
                <option value="This Month">This Month</option>
              </select>
              <button className="flex items-center gap-2 px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm font-semibold text-[#374151] hover:bg-[#F9FAFB] transition-colors bg-white">
                <Filter className="w-4 h-4" /> <span className="hidden sm:inline">Filter</span>
              </button>
              <button className="flex items-center gap-2 px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm font-semibold text-[#374151] hover:bg-[#F9FAFB] transition-colors bg-white">
                <Download className="w-4 h-4" /> <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#FDFDFD]">
                  <th className="px-4 py-3 w-10 text-center"><input type="checkbox" className="rounded border-gray-300" /></th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Invoice / Order</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider text-right">Order Amount</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider text-right">Received Amount</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider text-right">Due Amount</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider text-center">Payment Method</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider text-center">Payment Date</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider text-center">Status</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {loading ? (
                  <tr><td colSpan={10} className="p-8 text-center text-gray-500 font-medium">Loading payments...</td></tr>
                ) : payments.length === 0 ? (
                  <tr><td colSpan={10} className="p-8 text-center flex flex-col items-center">
                    <CreditCard className="w-12 h-12 text-gray-300 mb-2"/>
                    <p className="text-[#111111] font-bold text-sm">No payments found</p>
                    <p className="text-[#6B7280] text-xs mt-1">Adjust filters or record a new payment</p>
                  </td></tr>
                ) : payments.map((payment) => {
                  const uiStatus = getStatusText(payment.status, payment.order.paymentStatus, payment.createdAt);
                  
                  return (
                    <tr key={payment.id} className="hover:bg-[#F9FAFB] transition-colors group">
                      <td className="px-4 py-4 text-center">
                         <input type="checkbox" className="rounded border-gray-300 w-4 h-4 text-blue-600 focus:ring-blue-600 cursor-pointer" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                           <span className="text-xs font-bold text-[#3B6FEB]">{payment.order.invoices?.[0]?.invoiceNumber || '—'}</span>
                           <span className="text-[10px] font-medium text-[#6B7280]">{payment.order.orderNumber}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                           <span className="text-xs font-bold text-[#111111] truncate max-w-[120px]">{payment.order.customer.name}</span>
                           <span className="text-[10px] font-medium text-[#6B7280] truncate max-w-[120px]">{payment.order.customer.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <p className="text-xs font-bold text-[#111111]">{formatINR(payment.order.totalAmount)}</p>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <p className="text-xs font-bold text-[#111111]">{payment.status === 'SUCCESS' ? formatINR(payment.amount) : formatINR(0)}</p>
                      </td>
                      <td className="px-4 py-4 text-right">
                         {/* Approximated Due for display: order total - payment amount. Note: true due requires aggregating all payments for order */}
                        <p className={`text-xs font-bold ${payment.status === 'SUCCESS' && payment.order.paymentStatus === 'PAID' ? 'text-[#111111]' : 'text-red-600'}`}>
                           {payment.status === 'SUCCESS' && payment.order.paymentStatus === 'PAID' ? formatINR(0) : formatINR(payment.order.totalAmount - (payment.status === 'SUCCESS' ? payment.amount : 0))}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${payment.method ? 'text-blue-700 bg-blue-50 border border-blue-200' : 'text-gray-500'}`}>
                           {payment.method?.replace('_', ' ') || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex flex-col">
                           <span className="text-xs font-semibold text-[#374151]">{new Date(payment.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                           <span className="text-[10px] text-[#6B7280]">{new Date(payment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md border ${getStatusColor(uiStatus.toUpperCase())}`}>
                          {uiStatus}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-1.5 text-[#6B7280] hover:text-[#111111] hover:bg-[#F3F4F6] rounded" title="View"><Eye className="w-3.5 h-3.5" /></button>
                          <button className="p-1.5 text-[#6B7280] hover:text-[#111111] hover:bg-[#F3F4F6] rounded" title="Download"><Download className="w-3.5 h-3.5" /></button>
                          <button className="p-1.5 text-[#6B7280] hover:text-[#111111] hover:bg-[#F3F4F6] rounded" title="Options"><MoreVertical className="w-3.5 h-3.5" /></button>
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
            <span>Showing {(page - 1) * pagination.pageSize + 1} to {Math.min(page * pagination.pageSize, pagination.total)} of {pagination.total} payments</span>
            <div className="flex gap-1 items-center">
              <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-2 py-1 border border-[#E5E7EB] rounded hover:bg-[#F3F4F6] disabled:opacity-50">&lt;</button>
              <span className="px-3 font-semibold text-[#111111] bg-blue-50 text-blue-700 py-1 rounded">{page}</span>
              <button disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)} className="px-2 py-1 border border-[#E5E7EB] rounded hover:bg-[#F3F4F6] disabled:opacity-50">&gt;</button>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR - Charts & Overviews */}
        <div className="w-full lg:w-[320px] flex flex-col gap-6 shrink-0">
           
           {/* Payment Overview Chart */}
           <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-[#111111] mb-6">Payment Overview</h3>
              <div className="flex items-center justify-between">
                 <div className="h-[120px] w-[120px]">
                    <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                          <Pie data={pieData} innerRadius={35} outerRadius={55} paddingAngle={2} dataKey="value" stroke="none">
                             {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                          </Pie>
                          <RechartsTooltip formatter={(value: any) => formatINR(Number(value))} />
                       </PieChart>
                    </ResponsiveContainer>
                 </div>
                 <div className="flex flex-col gap-3 flex-1 pl-4">
                    <div className="flex flex-col">
                       <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#10B981]"></span><span className="text-[10px] font-bold text-[#6B7280]">Paid</span></div>
                       <span className="text-xs font-bold text-[#111111] ml-3.5">{formatINR(stats.received)} <span className="text-[10px] text-gray-400 font-normal">({stats.percentages.received?.toFixed(2)}%)</span></span>
                    </div>
                    <div className="flex flex-col">
                       <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span><span className="text-[10px] font-bold text-[#6B7280]">Partial</span></div>
                       <span className="text-xs font-bold text-[#111111] ml-3.5">{formatINR(stats.pending)} <span className="text-[10px] text-gray-400 font-normal">({stats.percentages.pending?.toFixed(2)}%)</span></span>
                    </div>
                    <div className="flex flex-col">
                       <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#EF4444]"></span><span className="text-[10px] font-bold text-[#6B7280]">Overdue</span></div>
                       <span className="text-xs font-bold text-[#111111] ml-3.5">{formatINR(stats.overdue)} <span className="text-[10px] text-gray-400 font-normal">({stats.percentages.overdue?.toFixed(2)}%)</span></span>
                    </div>
                 </div>
              </div>
           </div>

           {/* Payment Methods */}
           <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-[#111111] mb-4">Payment Methods</h3>
              <div className="space-y-3">
                 {stats.methods.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-2">No methods recorded yet.</p>
                 ) : stats.methods.map((m: any, i: number) => (
                    <div key={i} className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          <CreditCard className="w-3.5 h-3.5 text-[#6B7280]" />
                          <span className="text-xs font-semibold text-[#374151]">{m.method}</span>
                       </div>
                       <div className="text-right">
                          <span className="text-xs font-bold text-[#111111] block">{formatINR(m.amount)}</span>
                          <span className="text-[9px] text-[#6B7280]">({m.percentage.toFixed(2)}%)</span>
                       </div>
                    </div>
                 ))}
              </div>
           </div>

           {/* Overdue Invoices List */}
           <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold text-[#111111]">Overdue Invoices</h3>
                 <button className="text-[10px] font-bold text-[#3B6FEB] hover:underline">View All</button>
              </div>
              <div className="space-y-4">
                 {stats.overdueInvoices.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-2">No overdue invoices.</p>
                 ) : stats.overdueInvoices.map((inv: any) => {
                    const daysOverdue = Math.floor((Date.now() - new Date(inv.dueDate).getTime()) / (1000 * 3600 * 24));
                    return (
                       <div key={inv.id} className="flex items-start justify-between pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                          <div>
                             <span className="text-[11px] font-bold text-[#111111] block">{inv.invoiceNumber}</span>
                             <span className="text-[10px] text-[#6B7280] truncate max-w-[140px] block">{inv.order.customer.name}</span>
                             <span className="text-[9px] font-medium text-gray-400">{new Date(inv.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          </div>
                          <div className="text-right">
                             <span className="text-xs font-bold text-[#111111] block">{formatINR(inv.amount)}</span>
                             <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1 rounded">{daysOverdue} Days</span>
                          </div>
                       </div>
                    )
                 })}
              </div>
           </div>

           {/* Quick Actions */}
           <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-[#111111] mb-4">Quick Actions</h3>
              <div className="grid grid-cols-4 gap-2 text-center">
                 <button onClick={() => setIsRecordModalOpen(true)} className="flex flex-col items-center gap-1 p-2 rounded hover:bg-gray-50 group">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100 group-hover:bg-blue-100 transition-colors"><Plus className="w-4 h-4 text-blue-600"/></div>
                    <span className="text-[9px] font-bold text-gray-600 leading-tight">Record<br/>Payment</span>
                 </button>
                 <button className="flex flex-col items-center gap-1 p-2 rounded hover:bg-gray-50 group">
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center border border-gray-200 group-hover:bg-gray-100 transition-colors"><FileText className="w-4 h-4 text-gray-600"/></div>
                    <span className="text-[9px] font-bold text-gray-600 leading-tight">Payment<br/>Report</span>
                 </button>
                 <button className="flex flex-col items-center gap-1 p-2 rounded hover:bg-gray-50 group opacity-50 cursor-not-allowed" title="Not Implemented">
                    <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center border border-purple-100 group-hover:bg-purple-100 transition-colors"><RefreshCw className="w-4 h-4 text-purple-600"/></div>
                    <span className="text-[9px] font-bold text-gray-600 leading-tight">Refund<br/>&nbsp;</span>
                 </button>
                 <button className="flex flex-col items-center gap-1 p-2 rounded hover:bg-gray-50 group">
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center border border-gray-200 group-hover:bg-gray-100 transition-colors"><Settings className="w-4 h-4 text-gray-600"/></div>
                    <span className="text-[9px] font-bold text-gray-600 leading-tight">Settings<br/>&nbsp;</span>
                 </button>
              </div>
           </div>
        </div>

      </div>
      
      {/* RECORD PAYMENT MODAL */}
      <RecordPaymentModal 
         isOpen={isRecordModalOpen} 
         onClose={() => setIsRecordModalOpen(false)} 
         onSuccess={() => { setIsRecordModalOpen(false); fetchData(); }}
      />
    </div>
  );
}


// -------------------------------------------------------------------------------------------------
// RECORD PAYMENT MODAL COMPONENT
// -------------------------------------------------------------------------------------------------
function RecordPaymentModal({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess: () => void }) {
   const [orderId, setOrderId] = useState('');
   const [amount, setAmount] = useState('');
   const [method, setMethod] = useState('Bank Transfer');
   const [reference, setReference] = useState('');
   const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
   const [notes, setNotes] = useState('');
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState('');

   if (!isOpen) return null;

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setLoading(true);
      try {
         const res = await fetch(`${API_URL}/payments/record`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: JSON.stringify({ orderId, amount, method, reference, date, notes })
         }).then(r => r.json());

         if (res.success) {
            onSuccess();
         } else {
            setError(res.message || 'Failed to record payment');
         }
      } catch (err: any) {
         setError(err.message);
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
         <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
               <div>
                  <h2 className="text-lg font-bold text-[#111111]">Record Manual Payment</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Log an offline bank transfer, cash, or UPI payment</p>
               </div>
               <button onClick={onClose} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                  <X className="w-4 h-4" />
               </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 overflow-y-auto">
               {error && <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-100">{error}</div>}
               
               <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Order ID</label>
                  <input required type="text" value={orderId} onChange={e => setOrderId(e.target.value)} placeholder="e.g. ord_..." className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium" />
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Amount Paid (₹)</label>
                     <input required type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium" />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Payment Method</label>
                     <select value={method} onChange={e => setMethod(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium appearance-none">
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="UPI">UPI</option>
                        <option value="Cash">Cash</option>
                        <option value="Cheque">Cheque</option>
                        <option value="Other">Other</option>
                     </select>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Reference No.</label>
                     <input type="text" value={reference} onChange={e => setReference(e.target.value)} placeholder="UTR or Txn ID" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium" />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Payment Date</label>
                     <input required type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium" />
                  </div>
               </div>

               <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Internal Notes (Optional)</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add any details about this payment..." rows={2} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium resize-none" />
               </div>

               <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                  <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors">Cancel</button>
                  <button type="submit" disabled={loading} className="px-6 py-2.5 bg-[#3B6FEB] hover:bg-[#2563EB] text-white text-sm font-bold rounded-lg shadow-sm transition-colors disabled:opacity-50">
                     {loading ? 'Recording...' : 'Record Payment'}
                  </button>
               </div>
            </form>
         </div>
      </div>
   );
}
