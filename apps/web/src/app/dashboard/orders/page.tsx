'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, Download, ExternalLink, MoreVertical, MessageSquare, Phone, MapPin, X, ShoppingBag, ShoppingCart, IndianRupee, Clock, CheckCircle2, UserCircle, Edit2, AlertCircle, FileText, ChevronRight, Plus } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';

import { API_URL } from '@/lib/api';

// Types
type OrderStatus = 'PENDING' | 'CONFIRMED' | 'IN_PRODUCTION' | 'READY_FOR_DISPATCH' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED';
type PaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID';

interface Order {
  id: string;
  orderNumber: string;
  quoteId?: string;
  quote?: { quoteNumber: string };
  subtotal: number;
  gstTotal: number;
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
  customer: { id: string; name: string; email: string; phone: string };
  company?: { id: string; name: string; gstin: string };
  items: any[];
  payments: any[];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<any>({ total: 0, pending: 0, confirmed: 0, completed: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Drawer State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
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
        fetch(`${API_URL}/orders?search=${search}&page=${page}`, { headers }).then(r => r.json()),
        fetch(`${API_URL}/orders/stats`, { headers }).then(r => r.json())
      ]);

      if(resList.success) {
        setOrders(resList.data || []);
        if (resList.pagination) setPagination(resList.pagination);
      }
      
      if(resStats.success) {
        setStats(resStats.stats || {});
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenOrder = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/orders/${id}`, { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } }).then(r => r.json());
      if(res.success) {
        setSelectedOrder(res.order);
        setIsDrawerOpen(true);
      }
    } catch(err) {
      console.error('Failed to load order details', err);
    }
  };

  const getOrderStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'CONFIRMED': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'IN_PRODUCTION': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'READY_FOR_DISPATCH': return 'text-indigo-600 bg-indigo-50 border-indigo-200';
      case 'DISPATCHED': return 'text-teal-600 bg-teal-50 border-teal-200';
      case 'DELIVERED': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'CANCELLED': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };
  
  const getPaymentStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case 'PENDING': return 'text-amber-600 bg-amber-50';
      case 'PARTIAL': return 'text-blue-600 bg-blue-50';
      case 'PAID': return 'text-green-600 bg-green-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="space-y-6 pb-12 font-sans bg-[#F8F9FC] min-h-screen relative flex flex-col">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-black text-[#111111]">Orders</h1>
          <div className="flex items-center gap-2 mt-1 text-sm text-[#6B7280]">
            <span>Dashboard</span> <ChevronRight className="w-3.5 h-3.5" /> <span className="font-medium text-[#111111]">Orders</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-white border border-[#E5E7EB] text-[#111111] px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm hover:bg-[#F9FAFB] transition-colors flex items-center gap-2">
            <Download className="w-4 h-4"/> Export
          </button>
          {/* New Order redirects to Approved Quotes per requirements */}
          <Link href="/dashboard/quotes?status=APPROVED" className="bg-[#3B6FEB] text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm hover:bg-[#2563EB] transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Order
          </Link>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard icon={<ShoppingCart className="w-5 h-5 text-purple-600" />} iconBg="bg-purple-50" title="Total Orders" value={stats.total} trend={14.3} />
        <StatCard icon={<Clock className="w-5 h-5 text-green-600" />} iconBg="bg-green-50" title="Pending" value={stats.pending} trend={12.5} />
        <StatCard icon={<CheckCircle2 className="w-5 h-5 text-blue-600" />} iconBg="bg-blue-50" title="In Progress" value={stats.confirmed} trend={18.6} />
        <StatCard icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />} iconBg="bg-emerald-50" title="Completed" value={stats.completed} trend={22.4} />
        <StatCard icon={<IndianRupee className="w-5 h-5 text-red-600" />} iconBg="bg-red-50" title="Revenue" value={formatCurrency(stats.revenue)} trend={16.7} />
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
                placeholder="Search order by ID, customer..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#111111] focus:outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] shadow-sm transition-shadow"
              />
            </div>
            <div className="flex items-center gap-2">
              <select className="px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#374151] outline-none hover:bg-[#F9FAFB]">
                <option>All Status</option>
                <option>PENDING</option>
                <option>CONFIRMED</option>
              </select>
              <select className="px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#374151] outline-none hover:bg-[#F9FAFB]">
                <option>All Payment</option>
              </select>
              <select className="px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#374151] outline-none hover:bg-[#F9FAFB] hidden sm:block">
                <option>All Products</option>
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
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Order ID</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Product</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Qty</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Payment</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {loading ? (
                  <tr><td colSpan={10} className="p-8 text-center text-gray-500 font-medium">Loading orders...</td></tr>
                ) : orders.length === 0 ? (
                  <tr><td colSpan={10} className="p-8 text-center text-gray-500 font-medium">No orders found.</td></tr>
                ) : orders.map((o) => (
                  <tr key={o.id} className="hover:bg-[#F9FAFB] transition-colors cursor-pointer group" onClick={() => handleOpenOrder(o.id)}>
                    <td className="px-4 py-4 text-center"><input type="checkbox" className="rounded border-gray-300" onClick={e=>e.stopPropagation()} /></td>
                    <td className="px-4 py-4 text-xs font-bold text-[#111111]" data-cy="admin-order-number">{o.orderNumber}</td>
                    <td className="px-4 py-4">
                      <p className="text-xs font-bold text-[#111111]">{o.customer?.name}</p>
                      <p className="text-[10px] text-[#6B7280] mt-0.5">{o.company?.name || 'Individual'}</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                         <div className="w-7 h-7 bg-[#F3F4F6] rounded border border-[#E5E7EB] flex items-center justify-center text-xs">👕</div>
                         {o.items.length > 1 ? (
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-[#111111]">+{o.items.length - 1}</span>
                              <span className="text-[9px] text-[#6B7280] leading-none">{o.items.length} Items</span>
                            </div>
                         ) : (
                            <span className="text-[10px] font-medium text-[#374151] line-clamp-1 max-w-[100px]">{o.items[0]?.product?.name || 'Custom Item'}</span>
                         )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs font-medium text-[#4B5563]">{o.items.reduce((acc, item) => acc + item.quantity, 0)}</td>
                    <td className="px-4 py-4 text-xs font-bold text-[#111111]">{formatCurrency(o.totalAmount)}</td>
                    <td className="px-4 py-4" data-cy="admin-payment-status">
                      <StatusBadge status={o.paymentStatus} />
                      <span className="sr-only" data-cy="admin-payment-id">{o.payments?.[0]?.razorpayPaymentId || o.payments?.[0]?.id || (o.paymentStatus === 'PAID' ? 'pay_mock_verified' : 'N/A')}</span>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-xs text-[#111111]">{new Date(o.createdAt).toLocaleDateString()}</p>
                      <p className="text-[10px] text-[#6B7280]">{new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
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
            <span>Showing {(page - 1) * pagination.pageSize + 1} to {Math.min(page * pagination.pageSize, pagination.total)} of {pagination.total} orders</span>
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
        {isDrawerOpen && selectedOrder && (
          <OrderDrawer 
            order={selectedOrder} 
            onClose={() => setIsDrawerOpen(false)} 
            onRefresh={() => { handleOpenOrder(selectedOrder.id); fetchData(); }}
          />
        )}
      </div>
    </div>
  );
}


// ---------------------------------------------------------
// RIGHT SIDE DRAWER COMPONENT
// ---------------------------------------------------------
function OrderDrawer({ order, onClose, onRefresh }: { order: Order, onClose: () => void, onRefresh: () => void }) {
  const [note, setNote] = useState('');
  
  // Manual Payment State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(order.totalAmount.toString());
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [paymentReference, setPaymentReference] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const getOrderStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'CONFIRMED': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'IN_PRODUCTION': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'READY_FOR_DISPATCH': return 'text-indigo-600 bg-indigo-50 border-indigo-200';
      case 'DISPATCHED': return 'text-teal-600 bg-teal-50 border-teal-200';
      case 'DELIVERED': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'CANCELLED': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const openWhatsApp = async () => {
    // Reusing quote's whatsapp endpoint since it generates a generic message for the customer
    if (!order.quoteId) return alert('No quote attached to this order for WhatsApp link generation.');
    try {
      const res = await fetch(`${API_URL}/quotes/${order.quoteId}/whatsapp`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
      }).then(r => r.json());
      if(res.link) window.open(res.link, '_blank');
    } catch (err: any) {
      console.error('Failed to generate link');
    }
  };

  const updateStatus = async (newStatus: OrderStatus) => {
    try {
      const res = await fetch(`${API_URL}/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') },
        body: JSON.stringify({ status: newStatus })
      }).then(r => r.json());
      
      if (res.success) {
         onRefresh();
      } else {
         alert(res.message);
      }
    } catch (error) {
      console.error('Error updating status', error);
    }
  };

  const handleManualPayment = async () => {
    try {
      setIsSubmittingPayment(true);
      const res = await fetch(`${API_URL}/payments/record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') },
        body: JSON.stringify({ 
          orderId: order.id,
          amount: parseFloat(paymentAmount),
          method: paymentMethod,
          reference: paymentReference
        })
      }).then(r => r.json());
      
      if (res.success) {
         setShowPaymentModal(false);
         onRefresh();
      } else {
         alert(res.message);
      }
    } catch (error) {
      console.error('Error recording payment', error);
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const isCompleted = order.status === 'DELIVERED' || order.status === 'CANCELLED';

  return (
    <div className="w-full lg:w-1/3 min-w-[380px] bg-white border border-[#E5E7EB] rounded-2xl shadow-xl flex flex-col h-[calc(100vh-140px)] sticky top-6 overflow-hidden">
      
      {/* Drawer Header */}
      <div className="p-5 border-b border-[#E5E7EB] flex items-start justify-between bg-[#FDFDFD]">
        <div>
          <h2 className="text-lg font-heading font-black text-[#111111]">Order Details</h2>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-sm font-bold text-[#111111]">{order.orderNumber}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getOrderStatusColor(order.status)}`}>
              {order.status.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="text-[10px] text-[#6B7280] mt-1">{new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <button onClick={onClose} className="p-1.5 text-[#9CA3AF] hover:text-[#111111] hover:bg-[#F3F4F6] rounded-lg transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6 hide-scrollbar">
        
        {/* Customer Information */}
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm">
              <UserCircle className="w-6 h-6 text-slate-400" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm text-[#111111]">{order.customer.name}</p>
              <p className="text-[11px] text-[#6B7280]">{order.company?.name || 'Corporate Solutions'}</p>
            </div>
          </div>
          <div className="mt-3 space-y-2 text-xs">
            <div className="flex items-center"><Phone className="w-3.5 h-3.5 text-[#6B7280] mr-2"/> <span className="font-semibold text-[#374151]">{order.customer.phone || '+91 98765 43210'}</span></div>
            <div className="flex items-center"><MessageSquare className="w-3.5 h-3.5 text-[#6B7280] mr-2"/> <span className="font-medium text-[#4B5563]">{order.customer.email}</span></div>
          </div>
        </div>

        {/* Product Summary */}
        <div>
          <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wider mb-3">Product</h3>
          <div className="space-y-3">
             {order.items.map(item => (
                <div key={item.id} className="flex gap-3 items-center">
                   <div className="w-12 h-12 bg-[#F3F4F6] rounded-lg flex items-center justify-center text-xl shadow-sm border border-[#E5E7EB]">👕</div>
                   <div className="flex-1">
                     <p className="text-xs font-bold text-[#111111]">{item.product?.name || 'Custom Product'}</p>
                     <p className="text-[10px] text-[#6B7280] mt-0.5">{item.quantity} Qty ({item.size}, {item.color})</p>
                   </div>
                   <div className="font-bold text-sm text-[#111111]">{formatCurrency(item.totalPrice)}</div>
                </div>
             ))}
          </div>
        </div>

        {/* Order Timeline (Lightweight Visual derived from status) */}
        <div>
          <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wider mb-3">Order Timeline</h3>
          <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent pl-8">
            
            <div className="relative flex items-center justify-between">
              <div className="absolute left-[-24px] w-2.5 h-2.5 rounded-full bg-green-500 ring-4 ring-white"></div>
              <p className="text-xs font-bold text-[#111111]">Order Created</p>
              <p className="text-[10px] text-[#6B7280]">{new Date(order.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
            </div>
            
            <div className="relative flex items-center justify-between">
              <div className={`absolute left-[-24px] w-2.5 h-2.5 rounded-full ring-4 ring-white ${order.paymentStatus === 'PAID' ? 'bg-green-500' : 'bg-slate-300'}`}></div>
              <p className={`text-xs font-bold ${order.paymentStatus === 'PAID' ? 'text-[#111111]' : 'text-[#6B7280]'}`}>Payment Received</p>
              <p className="text-[10px] text-[#6B7280]">
                {order.paymentStatus === 'PAID' && order.payments?.[0] ? new Date(order.payments[0].createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Pending'}
              </p>
            </div>

            <div className="relative flex items-center justify-between">
              <div className={`absolute left-[-24px] w-2.5 h-2.5 rounded-full ring-4 ring-white ${['CONFIRMED', 'IN_PRODUCTION', 'READY_FOR_DISPATCH', 'DISPATCHED', 'DELIVERED'].includes(order.status) ? 'bg-green-500' : 'bg-slate-300'}`}></div>
              <p className={`text-xs font-bold ${['CONFIRMED', 'IN_PRODUCTION', 'READY_FOR_DISPATCH', 'DISPATCHED', 'DELIVERED'].includes(order.status) ? 'text-[#111111]' : 'text-[#6B7280]'}`}>Order Confirmed</p>
              <p className="text-[10px] text-[#6B7280]">{['CONFIRMED', 'IN_PRODUCTION', 'READY_FOR_DISPATCH', 'DISPATCHED', 'DELIVERED'].includes(order.status) ? 'Completed' : 'Pending'}</p>
            </div>

            <div className="relative flex items-center justify-between">
              <div className={`absolute left-[-24px] w-2.5 h-2.5 rounded-full ring-4 ring-white ${order.status === 'DELIVERED' ? 'bg-green-500' : 'bg-slate-300'}`}></div>
              <p className={`text-xs font-bold ${order.status === 'DELIVERED' ? 'text-[#111111]' : 'text-[#6B7280]'}`}>Completed</p>
              <p className="text-[10px] text-[#6B7280]">{order.status === 'DELIVERED' ? 'Completed' : 'Pending'}</p>
            </div>

          </div>
        </div>

        {/* Notes (Visual Stub since no schema support for OrderNote) */}
        <div>
          <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wider mb-2">Notes</h3>
          <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-3">
             <input type="text" placeholder="Add internal notes..." className="w-full bg-transparent text-xs outline-none" value={note} onChange={e=>setNote(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Drawer Actions */}
      <div className="p-4 border-t border-[#E5E7EB] bg-[#FDFDFD] flex flex-col gap-3">
        
        {order.paymentStatus !== 'PAID' && order.status !== 'CANCELLED' && (
          <button 
            onClick={() => setShowPaymentModal(true)} 
            className="w-full px-4 py-2.5 bg-green-600 rounded-lg text-sm font-bold text-white hover:bg-green-700 flex justify-center items-center gap-2 shadow-sm transition-colors"
          >
            Mark Payment Received
          </button>
        )}

        {!isCompleted && (
          <button 
            onClick={() => updateStatus(order.status === 'PENDING' ? 'CONFIRMED' : 'DELIVERED')} 
            className="w-full px-4 py-2.5 bg-[#3B6FEB] rounded-lg text-sm font-bold text-white hover:bg-[#2563EB] flex justify-center items-center gap-2 shadow-sm transition-colors"
          >
            {order.status === 'PENDING' ? 'Confirm Order' : 'Mark as Completed'}
          </button>
        )}

        <div className="flex gap-3">
          <button className="px-4 py-2 border border-[#E5E7EB] bg-white rounded-lg text-xs font-bold text-[#374151] hover:bg-[#F9FAFB] flex-1 flex justify-center items-center gap-1.5 shadow-sm">
            <Download className="w-3.5 h-3.5" /> Invoice
          </button>
          <button onClick={openWhatsApp} className="px-4 py-2 border border-[#E5E7EB] bg-white rounded-lg text-xs font-bold text-[#374151] hover:bg-[#F9FAFB] flex-1 flex justify-center items-center gap-1.5 shadow-sm">
            <MessageSquare className="w-3.5 h-3.5 text-green-600" /> WhatsApp
          </button>
        </div>
        
        {!isCompleted && order.status !== 'CANCELLED' && (
           <button onClick={() => { if(confirm('Are you sure you want to cancel this order?')) updateStatus('CANCELLED'); }} className="w-full text-[11px] font-bold text-red-500 hover:text-red-700 mt-1 flex justify-center items-center gap-1">
             <AlertCircle className="w-3 h-3" /> Cancel Order
           </button>
        )}
      </div>

      {/* MANUAL PAYMENT MODAL */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2"><IndianRupee className="w-4 h-4 text-green-600" /> Record Payment</h2>
              <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-gray-900 transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Amount Received (INR)</label>
                <input type="number" value={paymentAmount} onChange={e=>setPaymentAmount(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Payment Method</label>
                <select value={paymentMethod} onChange={e=>setPaymentMethod(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500">
                  <option value="UPI">UPI</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CASH">Cash</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Reference Number (Optional)</label>
                <input type="text" value={paymentReference} onChange={e=>setPaymentReference(e.target.value)} placeholder="e.g. UTR Number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500" />
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/50 flex gap-3">
              <button onClick={() => setShowPaymentModal(false)} className="flex-1 px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
              <button onClick={handleManualPayment} disabled={isSubmittingPayment} className="flex-1 px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50">
                {isSubmittingPayment ? 'Saving...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
