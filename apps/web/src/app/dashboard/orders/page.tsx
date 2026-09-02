'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Download,
  MoreVertical,
  MessageSquare,
  Phone,
  X,
  ShoppingCart,
  IndianRupee,
  Clock,
  CheckCircle2,
  UserCircle,
  AlertCircle,
  ChevronRight,
  Plus,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';

import { API_URL } from '@/lib/api';
import { buildWhatsAppUrl, getOrderWhatsAppMessage } from '@/lib/whatsapp';
import { triggerSidebarCountsRefresh } from '@/hooks/useAdminSidebarCounts';

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
  updatedAt?: string;
  customer: { id: string; name: string; email: string; phone?: string };
  company?: { id: string; name: string; gstin?: string };
  items: any[];
  payments: any[];
  invoices?: any[];
  production?: any;
  dispatch?: any;
}

// Status -> Primary Allowed Transition mapping for the UI
interface OrderStatusAction {
  nextStatus: OrderStatus;
  label: string;
}

const ORDER_STATUS_ACTIONS: Partial<Record<OrderStatus, OrderStatusAction>> = {
  PENDING: {
    nextStatus: 'CONFIRMED',
    label: 'Confirm Order',
  },
  CONFIRMED: {
    nextStatus: 'IN_PRODUCTION',
    label: 'Start Production',
  },
  IN_PRODUCTION: {
    nextStatus: 'READY_FOR_DISPATCH',
    label: 'Mark Ready for Dispatch',
  },
  READY_FOR_DISPATCH: {
    nextStatus: 'DISPATCHED',
    label: 'Mark as Dispatched',
  },
  DISPATCHED: {
    nextStatus: 'DELIVERED',
    label: 'Mark as Delivered',
  },
};

const ORDER_STAGE_RANKS: Record<OrderStatus, number> = {
  PENDING: 0,
  CONFIRMED: 1,
  IN_PRODUCTION: 2,
  READY_FOR_DISPATCH: 3,
  DISPATCHED: 4,
  DELIVERED: 5,
  CANCELLED: -1,
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<any>({ total: 0, pending: 0, confirmed: 0, completed: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [filterPayment, setFilterPayment] = useState('All Payment');

  // Drawer State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, pageSize: 10 });

  useEffect(() => {
    fetchData();
  }, [search, filterStatus, filterPayment, page]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filterStatus !== 'All Status') params.append('status', filterStatus);
      if (filterPayment !== 'All Payment') params.append('paymentStatus', filterPayment);
      params.append('page', String(page));

      const [resList, resStats] = await Promise.all([
        fetch(`${API_URL}/orders?${params.toString()}`, { headers }).then(r => r.json()),
        fetch(`${API_URL}/orders/stats`, { headers }).then(r => r.json())
      ]);

      if (resList.success) {
        setOrders(resList.data || resList.orders || []);
        if (resList.pagination) setPagination(resList.pagination);
      }

      if (resStats.success) {
        setStats(resStats.stats || {});
        triggerSidebarCountsRefresh();
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
      if (res.success && res.order) {
        setSelectedOrder(res.order);
        setIsDrawerOpen(true);
      }
    } catch (err) {
      console.error('Failed to load order details', err);
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
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <button className="bg-white border border-[#E5E7EB] text-[#111111] px-4 sm:px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm hover:bg-[#F9FAFB] transition-colors flex items-center gap-2 min-h-[44px]">
            <Download className="w-4 h-4"/> Export
          </button>
          <Link href="/dashboard/quotes?status=APPROVED" className="bg-[#3B6FEB] text-white px-4 sm:px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm hover:bg-[#2563EB] transition-colors flex items-center gap-2 min-h-[44px]">
            <Plus className="w-4 h-4" /> New Order
          </Link>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
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
          <div className="p-4 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:flex-wrap gap-3 justify-between items-stretch sm:items-center bg-[#FDFDFD] rounded-t-2xl">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Search order by ID, customer..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-4 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#111111] focus:outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] shadow-sm transition-shadow"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                className="px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#374151] outline-none hover:bg-[#F9FAFB]"
              >
                <option value="All Status">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="IN_PRODUCTION">In Production</option>
                <option value="READY_FOR_DISPATCH">Ready for Dispatch</option>
                <option value="DISPATCHED">Dispatched</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <select
                value={filterPayment}
                onChange={(e) => { setFilterPayment(e.target.value); setPage(1); }}
                className="px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#374151] outline-none hover:bg-[#F9FAFB]"
              >
                <option value="All Payment">All Payment</option>
                <option value="PENDING">Unpaid</option>
                <option value="PARTIAL">Partial</option>
                <option value="PAID">Paid</option>
              </select>
              {(filterStatus !== 'All Status' || filterPayment !== 'All Payment' || search) && (
                <button
                  onClick={() => { setFilterStatus('All Status'); setFilterPayment('All Payment'); setSearch(''); setPage(1); }}
                  className="px-3 py-2 text-xs font-bold text-gray-500 hover:text-[#111111] hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="table-scroll">
            <table className="w-full min-w-[850px] text-left border-collapse">
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
                         {o.items && o.items.length > 1 ? (
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-[#111111]">+{o.items.length - 1}</span>
                              <span className="text-[9px] text-[#6B7280] leading-none">{o.items.length} Items</span>
                            </div>
                         ) : (
                            <span className="text-[10px] font-medium text-[#374151] line-clamp-1 max-w-[100px]">{o.items?.[0]?.product?.name || 'Custom Item'}</span>
                         )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs font-medium text-[#4B5563]">{(o.items || []).reduce((acc, item) => acc + (item.quantity || 0), 0)}</td>
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
            <span>Showing {pagination.total === 0 ? 0 : (page - 1) * pagination.pageSize + 1} to {Math.min(page * pagination.pageSize, pagination.total)} of {pagination.total} orders</span>
            <div className="flex gap-1 items-center">
              <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-2 py-1 border border-[#E5E7EB] rounded hover:bg-[#F3F4F6] disabled:opacity-50">&lt;</button>
              <span className="px-3 font-semibold text-[#111111]">{page}</span>
              <button disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)} className="px-2 py-1 border border-[#E5E7EB] rounded hover:bg-[#F3F4F6] disabled:opacity-50">&gt;</button>
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
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  // Manual Payment State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(order.totalAmount.toString());
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [paymentReference, setPaymentReference] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Sync paymentAmount whenever order updates
  useEffect(() => {
    setPaymentAmount(order.totalAmount.toString());
    setStatusFeedback(null);
  }, [order.id, order.totalAmount, order.status]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const openWhatsApp = () => {
    const phone = order.customer?.phone;
    if (!phone) {
      setStatusFeedback({ type: 'error', message: 'Customer phone number is unavailable.' });
      return;
    }
    const url = buildWhatsAppUrl(
      phone,
      getOrderWhatsAppMessage({
        customerName: order.customer?.name,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
      })
    );
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      setStatusFeedback({ type: 'error', message: 'Customer phone number is invalid.' });
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      const token = localStorage.getItem('token');
      const invoiceId = order.invoices?.[0]?.id;
      if (invoiceId) {
        const res = await fetch(`${API_URL}/invoices/${invoiceId}/pdf`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          const invoiceNum = order.invoices?.[0]?.invoiceNumber || order.orderNumber;
          a.download = `Invoice-${invoiceNum}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          return;
        }
      }
      // If invoice not created yet or PDF direct route
      setStatusFeedback({ type: 'error', message: 'Invoice PDF is not available yet for this order.' });
    } catch (err) {
      console.error('Invoice download failed:', err);
      setStatusFeedback({ type: 'error', message: 'Unable to download invoice PDF. Please try again.' });
    }
  };

  const updateStatus = async (newStatus: OrderStatus) => {
    try {
      setIsUpdatingStatus(true);
      setStatusFeedback(null);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ status: newStatus })
      }).then(r => r.json());

      if (res.success) {
         setStatusFeedback({
           type: 'success',
           message: `Order status updated to ${newStatus.replace(/_/g, ' ')}.`
         });
         triggerSidebarCountsRefresh();
         onRefresh();
      } else {
         console.error('Order status transition error from backend:', res);
         setStatusFeedback({
           type: 'error',
           message: res.message || 'Order status could not be updated. Please refresh and try again.'
         });
      }
    } catch (error) {
      console.error('Error updating status', error);
      setStatusFeedback({
        type: 'error',
        message: 'Unable to connect to server. Please check your connection and try again.'
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleManualPayment = async () => {
    try {
      setIsSubmittingPayment(true);
      setStatusFeedback(null);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/payments/record`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
          orderId: order.id,
          amount: parseFloat(paymentAmount),
          method: paymentMethod,
          reference: paymentReference
        })
      }).then(r => r.json());

      if (res.success) {
         setShowPaymentModal(false);
         setStatusFeedback({ type: 'success', message: 'Payment recorded successfully.' });
         onRefresh();
      } else {
         setStatusFeedback({ type: 'error', message: res.message || 'Failed to record payment.' });
      }
    } catch (error) {
      console.error('Error recording payment', error);
      setStatusFeedback({ type: 'error', message: 'Payment recording failed. Please try again.' });
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // Determine current contextual status progression action
  const nextAction = ORDER_STATUS_ACTIONS[order.status];
  const currentRank = ORDER_STAGE_RANKS[order.status] ?? 0;
  const isCancelled = order.status === 'CANCELLED';

  return (
    <div className="w-full lg:w-1/3 min-w-0 lg:min-w-[380px] bg-white border border-[#E5E7EB] rounded-2xl shadow-xl flex flex-col h-[calc(100vh-140px)] sticky top-6 overflow-hidden">

      {/* Drawer Header */}
      <div className="p-5 border-b border-[#E5E7EB] flex items-start justify-between bg-[#FDFDFD]">
        <div>
          <h2 className="text-lg font-heading font-black text-[#111111]">Order Details</h2>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-sm font-bold text-[#111111]">{order.orderNumber}</span>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-[10px] text-[#6B7280] mt-1">{new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <button onClick={onClose} className="p-1.5 text-[#9CA3AF] hover:text-[#111111] hover:bg-[#F3F4F6] rounded-lg transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6 hide-scrollbar">

        {/* Status Feedback Alert */}
        {statusFeedback && (
          <div className={`p-3.5 rounded-xl text-xs flex items-center justify-between gap-2 transition-all ${
            statusFeedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            <div className="flex items-center gap-2">
              {statusFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span className="font-medium">{statusFeedback.message}</span>
            </div>
            <button onClick={() => setStatusFeedback(null)} className="text-gray-400 hover:text-gray-600 p-0.5">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Customer Information */}
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm">
              <UserCircle className="w-6 h-6 text-slate-400" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm text-[#111111]">{order.customer?.name || 'Customer'}</p>
              <p className="text-[11px] text-[#6B7280]">{order.company?.name || 'Corporate Solutions'}</p>
            </div>
          </div>
          <div className="mt-3 space-y-2 text-xs">
            <div className="flex items-center"><Phone className="w-3.5 h-3.5 text-[#6B7280] mr-2"/> <span className="font-semibold text-[#374151]">{order.customer?.phone || '+91 98765 43210'}</span></div>
            <div className="flex items-center"><MessageSquare className="w-3.5 h-3.5 text-[#6B7280] mr-2"/> <span className="font-medium text-[#4B5563]">{order.customer?.email}</span></div>
          </div>
        </div>

        {/* Product Summary */}
        <div>
          <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wider mb-3">Product</h3>
          <div className="space-y-3">
             {order.items && order.items.map(item => (
                <div key={item.id} className="flex gap-3 items-center">
                   <div className="w-12 h-12 bg-[#F3F4F6] rounded-lg flex items-center justify-center text-xl shadow-sm border border-[#E5E7EB]">👕</div>
                   <div className="flex-1">
                     <p className="text-xs font-bold text-[#111111]">{item.product?.name || 'Custom Product'}</p>
                     <p className="text-[10px] text-[#6B7280] mt-0.5">{item.quantity} Qty ({item.size || 'L'}, {item.color || 'Standard'})</p>
                   </div>
                   <div className="font-bold text-sm text-[#111111]">{formatCurrency(item.totalPrice)}</div>
                </div>
             ))}
          </div>
        </div>

        {/* Order Lifecycle Timeline */}
        <div>
          <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wider mb-3">Order Timeline</h3>
          <div className="space-y-4 relative before:absolute before:inset-0 before:left-2.5 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-slate-200 before:via-slate-200 before:to-slate-100 pl-8">

            {/* 1. Order Created */}
            <div className="relative flex items-start justify-between">
              <div className="absolute left-[-24px] top-1 w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-50"></div>
              <div>
                <p className="text-xs font-bold text-[#111111]">Order Created</p>
                <p className="text-[10px] text-[#6B7280]">{new Date(order.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Completed</span>
            </div>

            {/* 2. Payment Received */}
            <div className="relative flex items-start justify-between">
              <div className={`absolute left-[-24px] top-1 w-3 h-3 rounded-full ring-4 ${
                order.paymentStatus === 'PAID' ? 'bg-emerald-500 ring-emerald-50' : 'bg-slate-300 ring-white'
              }`}></div>
              <div>
                <p className={`text-xs font-bold ${order.paymentStatus === 'PAID' ? 'text-[#111111]' : 'text-[#6B7280]'}`}>Payment Received</p>
                <p className="text-[10px] text-[#6B7280]">
                  {order.paymentStatus === 'PAID' && order.payments?.[0]
                    ? new Date(order.payments[0].createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
                    : order.paymentStatus === 'PARTIAL'
                    ? 'Partial Payment'
                    : 'Awaiting Payment'}
                </p>
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                order.paymentStatus === 'PAID'
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  : 'text-slate-500 bg-slate-50 border-slate-200'
              }`}>
                {order.paymentStatus === 'PAID' ? 'Paid' : 'Pending'}
              </span>
            </div>

            {/* 3. Order Confirmed */}
            <div className="relative flex items-start justify-between">
              <div className={`absolute left-[-24px] top-1 w-3 h-3 rounded-full ring-4 ${
                currentRank >= 1 ? 'bg-emerald-500 ring-emerald-50' : 'bg-slate-300 ring-white'
              }`}></div>
              <div>
                <p className={`text-xs font-bold ${currentRank >= 1 ? 'text-[#111111]' : 'text-[#6B7280]'}`}>Order Confirmed</p>
                <p className="text-[10px] text-[#6B7280]">{currentRank >= 1 ? 'Confirmed by Admin' : 'Pending confirmation'}</p>
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                currentRank >= 1
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  : 'text-slate-500 bg-slate-50 border-slate-200'
              }`}>
                {currentRank >= 1 ? 'Confirmed' : 'Pending'}
              </span>
            </div>

            {/* 4. In Production */}
            <div className="relative flex items-start justify-between">
              <div className={`absolute left-[-24px] top-1 w-3 h-3 rounded-full ring-4 ${
                currentRank >= 2 ? 'bg-emerald-500 ring-emerald-50' : 'bg-slate-300 ring-white'
              }`}></div>
              <div>
                <p className={`text-xs font-bold ${currentRank >= 2 ? 'text-[#111111]' : 'text-[#6B7280]'}`}>In Production</p>
                <p className="text-[10px] text-[#6B7280]">
                  {currentRank >= 2
                    ? (order.production?.startedAt ? new Date(order.production.startedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Manufacturing & Printing')
                    : 'Awaiting production'}
                </p>
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                currentRank >= 2
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  : 'text-slate-500 bg-slate-50 border-slate-200'
              }`}>
                {currentRank >= 2 ? 'In Production' : 'Pending'}
              </span>
            </div>

            {/* 5. Ready for Dispatch */}
            <div className="relative flex items-start justify-between">
              <div className={`absolute left-[-24px] top-1 w-3 h-3 rounded-full ring-4 ${
                currentRank >= 3 ? 'bg-emerald-500 ring-emerald-50' : 'bg-slate-300 ring-white'
              }`}></div>
              <div>
                <p className={`text-xs font-bold ${currentRank >= 3 ? 'text-[#111111]' : 'text-[#6B7280]'}`}>Ready for Dispatch</p>
                <p className="text-[10px] text-[#6B7280]">
                  {currentRank >= 3
                    ? (order.production?.completedAt ? new Date(order.production.completedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Quality checked & packed')
                    : 'Pending packaging'}
                </p>
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                currentRank >= 3
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  : 'text-slate-500 bg-slate-50 border-slate-200'
              }`}>
                {currentRank >= 3 ? 'Ready' : 'Pending'}
              </span>
            </div>

            {/* 6. Dispatched */}
            <div className="relative flex items-start justify-between">
              <div className={`absolute left-[-24px] top-1 w-3 h-3 rounded-full ring-4 ${
                currentRank >= 4 ? 'bg-emerald-500 ring-emerald-50' : 'bg-slate-300 ring-white'
              }`}></div>
              <div>
                <p className={`text-xs font-bold ${currentRank >= 4 ? 'text-[#111111]' : 'text-[#6B7280]'}`}>Dispatched</p>
                <p className="text-[10px] text-[#6B7280]">
                  {currentRank >= 4
                    ? (order.dispatch?.courierName ? `${order.dispatch.courierName} (${order.dispatch.trackingNumber || 'Tracked'})` : (order.dispatch?.dispatchedAt ? new Date(order.dispatch.dispatchedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'In Transit'))
                    : 'Pending dispatch'}
                </p>
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                currentRank >= 4
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  : 'text-slate-500 bg-slate-50 border-slate-200'
              }`}>
                {currentRank >= 4 ? 'Dispatched' : 'Pending'}
              </span>
            </div>

            {/* 7. Delivered */}
            <div className="relative flex items-start justify-between">
              <div className={`absolute left-[-24px] top-1 w-3 h-3 rounded-full ring-4 ${
                order.status === 'DELIVERED' ? 'bg-emerald-500 ring-emerald-50' : 'bg-slate-300 ring-white'
              }`}></div>
              <div>
                <p className={`text-xs font-bold ${order.status === 'DELIVERED' ? 'text-[#111111]' : 'text-[#6B7280]'}`}>Delivered</p>
                <p className="text-[10px] text-[#6B7280]">
                  {order.status === 'DELIVERED'
                    ? (order.dispatch?.deliveredAt ? new Date(order.dispatch.deliveredAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Delivered to Customer')
                    : 'Pending delivery'}
                </p>
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                order.status === 'DELIVERED'
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  : 'text-slate-500 bg-slate-50 border-slate-200'
              }`}>
                {order.status === 'DELIVERED' ? 'Delivered' : 'Pending'}
              </span>
            </div>

            {/* Cancelled State Milestone (if applicable) */}
            {isCancelled && (
              <div className="relative flex items-start justify-between">
                <div className="absolute left-[-24px] top-1 w-3 h-3 rounded-full bg-rose-500 ring-4 ring-rose-50"></div>
                <div>
                  <p className="text-xs font-bold text-rose-700">Order Cancelled</p>
                  <p className="text-[10px] text-[#6B7280]">
                    {order.updatedAt ? new Date(order.updatedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Cancelled'}
                  </p>
                </div>
                <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">Cancelled</span>
              </div>
            )}

          </div>
        </div>

        {/* Notes */}
        <div>
          <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wider mb-2">Notes</h3>
          <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-3">
             <input type="text" placeholder="Add internal notes..." className="w-full bg-transparent text-xs outline-none" value={note} onChange={e=>setNote(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Drawer Actions */}
      <div className="p-4 border-t border-[#E5E7EB] bg-[#FDFDFD] flex flex-col gap-3">

        {/* Record Payment Button (if unpaid) */}
        {order.paymentStatus !== 'PAID' && order.status !== 'CANCELLED' && (
          <button
            onClick={() => setShowPaymentModal(true)}
            className="w-full px-4 py-2.5 bg-emerald-600 rounded-lg text-sm font-bold text-white hover:bg-emerald-700 flex justify-center items-center gap-2 shadow-sm transition-colors min-h-[44px]"
          >
            <IndianRupee className="w-4 h-4" /> Mark Payment Received
          </button>
        )}

        {/* Contextual Status Progression Action */}
        {nextAction && (
          <button
            onClick={() => updateStatus(nextAction.nextStatus)}
            disabled={isUpdatingStatus}
            className="w-full px-4 py-2.5 bg-[#3B6FEB] rounded-lg text-sm font-bold text-white hover:bg-[#2563EB] flex justify-center items-center gap-2 shadow-sm transition-colors disabled:opacity-50 min-h-[44px]"
          >
            {isUpdatingStatus ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Updating Status...
              </>
            ) : (
              <>
                {nextAction.label} <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        )}

        {/* Action Buttons: Invoice & WhatsApp */}
        <div className="flex gap-3">
          <button
            onClick={handleDownloadInvoice}
            className="px-4 py-2 border border-[#E5E7EB] bg-white rounded-lg text-xs font-bold text-[#374151] hover:bg-[#F9FAFB] flex-1 flex justify-center items-center gap-1.5 shadow-sm min-h-[40px] transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Invoice
          </button>
          <button
            onClick={openWhatsApp}
            className="px-4 py-2 border border-[#E5E7EB] bg-white rounded-lg text-xs font-bold text-[#374151] hover:bg-[#F9FAFB] flex-1 flex justify-center items-center gap-1.5 shadow-sm min-h-[40px] transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5 text-green-600" /> WhatsApp
          </button>
        </div>

        {/* Cancel Order Action */}
        {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
           <button
             onClick={() => { if(confirm('Are you sure you want to cancel this order?')) updateStatus('CANCELLED'); }}
             disabled={isUpdatingStatus}
             className="w-full text-[11px] font-bold text-red-500 hover:text-red-700 mt-1 flex justify-center items-center gap-1 disabled:opacity-50 py-1"
           >
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
