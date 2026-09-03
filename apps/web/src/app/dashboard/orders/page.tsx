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
  ChevronDown,
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

  // Inline Accordion State (Only ONE open order at a time)
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [orderNotes, setOrderNotes] = useState<Record<string, string>>({});
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<{ orderId: string; type: 'error' | 'success'; message: string } | null>(null);

  // Manual Payment Modal State
  const [paymentModalOrder, setPaymentModalOrder] = useState<Order | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [paymentReference, setPaymentReference] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

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

  const toggleOrderExpand = (id: string) => {
    setExpandedOrderId(prev => (prev === id ? null : id));
    setStatusFeedback(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const openWhatsApp = (order: Order) => {
    const phone = order.customer?.phone;
    if (!phone) {
      setStatusFeedback({ orderId: order.id, type: 'error', message: 'Customer phone number is unavailable.' });
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
      setStatusFeedback({ orderId: order.id, type: 'error', message: 'Customer phone number is invalid.' });
    }
  };

  const handleDownloadInvoice = async (order: Order) => {
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
      setStatusFeedback({ orderId: order.id, type: 'error', message: 'Invoice PDF is not available yet for this order.' });
    } catch (err) {
      console.error('Invoice download failed:', err);
      setStatusFeedback({ orderId: order.id, type: 'error', message: 'Unable to download invoice PDF. Please try again.' });
    }
  };

  const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      setIsUpdatingStatus(true);
      setStatusFeedback(null);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({ status: newStatus }),
      }).then(r => r.json());

      if (res.success) {
        setStatusFeedback({
          orderId,
          type: 'success',
          message: `Order status updated to ${newStatus.replace(/_/g, ' ')}.`,
        });
        triggerSidebarCountsRefresh();
        await fetchData();
      } else {
        console.error('Order status update failed:', res);
        setStatusFeedback({
          orderId,
          type: 'error',
          message: res.message || 'Order status could not be updated. Please refresh and try again.',
        });
      }
    } catch (error) {
      console.error('Error updating status', error);
      setStatusFeedback({
        orderId,
        type: 'error',
        message: 'Unable to connect to server. Please check your connection and try again.',
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const openPaymentModal = (order: Order) => {
    setPaymentModalOrder(order);
    setPaymentAmount(order.totalAmount.toString());
    setPaymentMethod('UPI');
    setPaymentReference('');
  };

  const handleManualPayment = async () => {
    if (!paymentModalOrder) return;
    try {
      setIsSubmittingPayment(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/payments/record`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({
          orderId: paymentModalOrder.id,
          amount: parseFloat(paymentAmount),
          method: paymentMethod,
          reference: paymentReference,
        }),
      }).then(r => r.json());

      if (res.success) {
        const finishedId = paymentModalOrder.id;
        setPaymentModalOrder(null);
        setStatusFeedback({ orderId: finishedId, type: 'success', message: 'Payment recorded successfully.' });
        await fetchData();
      } else {
        setStatusFeedback({ orderId: paymentModalOrder.id, type: 'error', message: res.message || 'Failed to record payment.' });
      }
    } catch (error) {
      console.error('Error recording payment', error);
      setStatusFeedback({ orderId: paymentModalOrder.id, type: 'error', message: 'Payment recording failed. Please try again.' });
    } finally {
      setIsSubmittingPayment(false);
    }
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
      <div className="w-full">
        {/* LIST TABLE CONTAINER */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm transition-all duration-300 w-full overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:flex-wrap gap-3 justify-between items-stretch sm:items-center bg-[#FDFDFD]">
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
                <tr className="border-b border-[#E5E7EB] bg-[#FAFBFD]">
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
                  <tr><td colSpan={9} className="p-8 text-center text-gray-500 font-medium">Loading orders...</td></tr>
                ) : orders.length === 0 ? (
                  <tr><td colSpan={9} className="p-8 text-center text-gray-500 font-medium">No orders found.</td></tr>
                ) : orders.map((o) => {
                  const isExpanded = expandedOrderId === o.id;
                  const currentRank = ORDER_STAGE_RANKS[o.status] ?? 0;
                  const nextAction = ORDER_STATUS_ACTIONS[o.status];
                  const isCancelled = o.status === 'CANCELLED';

                  return (
                    <React.Fragment key={o.id}>
                      {/* ── PARENT ORDER ROW ── */}
                      <tr
                        id={`order-row-${o.id}`}
                        onClick={() => toggleOrderExpand(o.id)}
                        className={`transition-colors cursor-pointer group ${
                          isExpanded ? 'bg-[#F9FAFB] font-medium' : 'hover:bg-[#F9FAFB]'
                        }`}
                      >
                        {/* Order ID with Expand Arrow */}
                        <td className="px-4 py-4 text-xs font-bold text-[#111111]">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleOrderExpand(o.id);
                              }}
                              aria-expanded={isExpanded}
                              aria-controls={`order-detail-${o.id}`}
                              aria-label={isExpanded ? `Collapse order ${o.orderNumber}` : `Expand order ${o.orderNumber}`}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#3B6FEB] ${
                                isExpanded
                                  ? 'bg-[#EEF2FF] text-[#3B6FEB]'
                                  : 'text-[#6B7280] hover:text-[#111111] hover:bg-[#E5E7EB]/60'
                              }`}
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-[#3B6FEB]" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                            <span data-cy="admin-order-number" className="font-mono tracking-tight font-bold text-sm text-[#111111]">
                              {o.orderNumber}
                            </span>
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="px-4 py-4">
                          <p className="text-xs font-bold text-[#111111]">{o.customer?.name}</p>
                          <p className="text-[10px] text-[#6B7280] mt-0.5">{o.company?.name || 'Individual'}</p>
                        </td>

                        {/* Product Summary */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-[#F3F4F6] rounded border border-[#E5E7EB] flex items-center justify-center text-xs shrink-0">👕</div>
                            {o.items && o.items.length > 1 ? (
                              <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-[#111111]">+{o.items.length - 1}</span>
                                <span className="text-[9px] text-[#6B7280] leading-none">{o.items.length} Items</span>
                              </div>
                            ) : (
                              <span className="text-[10px] font-medium text-[#374151] line-clamp-1 max-w-[120px]">
                                {o.items?.[0]?.product?.name || 'Custom Item'}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Qty */}
                        <td className="px-4 py-4 text-xs font-medium text-[#4B5563]">
                          {(o.items || []).reduce((acc, item) => acc + (item.quantity || 0), 0)}
                        </td>

                        {/* Amount */}
                        <td className="px-4 py-4 text-xs font-bold text-[#111111]">{formatCurrency(o.totalAmount)}</td>

                        {/* Payment Status */}
                        <td className="px-4 py-4" data-cy="admin-payment-status">
                          <StatusBadge status={o.paymentStatus} />
                          <span className="sr-only" data-cy="admin-payment-id">
                            {o.payments?.[0]?.razorpayPaymentId || o.payments?.[0]?.id || (o.paymentStatus === 'PAID' ? 'pay_mock_verified' : 'N/A')}
                          </span>
                        </td>

                        {/* Order Status */}
                        <td className="px-4 py-4">
                          <StatusBadge status={o.status} />
                        </td>

                        {/* Date */}
                        <td className="px-4 py-4">
                          <p className="text-xs text-[#111111]">{new Date(o.createdAt).toLocaleDateString()}</p>
                          <p className="text-[10px] text-[#6B7280]">
                            {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </td>

                        {/* Action */}
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleOrderExpand(o.id);
                              }}
                              className="p-1.5 bg-white border border-[#E5E7EB] text-[#6B7280] hover:text-[#111111] rounded shadow-xs transition-colors"
                              title={isExpanded ? 'Collapse Details' : 'View Details'}
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* ── INLINE EXPANDABLE DETAILS ROW ── */}
                      {isExpanded && (
                        <tr
                          key={`${o.id}-detail`}
                          id={`order-detail-${o.id}`}
                          className="bg-[#F8F9FC] border-b border-[#E5E7EB] animate-in fade-in duration-150"
                        >
                          <td colSpan={9} className="p-0">
                            <div className="border-t border-[#E5E7EB] bg-gradient-to-b from-[#F8F9FC] to-white">
                              {/* Inline Section Bar */}
                              <div className="px-5 py-3 bg-[#F3F4F6] border-b border-[#E5E7EB] flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <span className="text-xs font-bold text-[#111111] uppercase tracking-wider">
                                    Order Details
                                  </span>
                                  <span className="font-mono text-xs font-bold text-[#3B6FEB] bg-white px-2.5 py-1 rounded-md border border-[#E5E7EB]">
                                    {o.orderNumber}
                                  </span>
                                  <StatusBadge status={o.status} />
                                  <span className="text-[11px] text-[#6B7280] hidden sm:inline">
                                    Placed on {new Date(o.createdAt).toLocaleString()}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setExpandedOrderId(null)}
                                  className="text-xs font-semibold text-[#6B7280] hover:text-[#111111] flex items-center gap-1 py-1 px-2.5 rounded hover:bg-white/80 transition-colors"
                                >
                                  <X className="w-3.5 h-3.5" /> Collapse
                                </button>
                              </div>

                              {/* Inner Grid */}
                              <div className="p-5 sm:p-6 space-y-6">
                                {/* Feedback Alert */}
                                {statusFeedback?.orderId === o.id && (
                                  <div
                                    className={`p-3.5 rounded-xl text-xs flex items-center justify-between gap-2 transition-all ${
                                      statusFeedback.type === 'success'
                                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      {statusFeedback.type === 'success' ? (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                      ) : (
                                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                      )}
                                      <span className="font-medium">{statusFeedback.message}</span>
                                    </div>
                                    <button
                                      onClick={() => setStatusFeedback(null)}
                                      className="text-gray-400 hover:text-gray-600 p-0.5"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                                  {/* Card 1: Customer Information */}
                                  <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E5E7EB] shadow-xs flex flex-col justify-between">
                                    <div>
                                      <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6] mb-3">
                                        <h4 className="text-xs font-bold text-[#111111] uppercase tracking-wider">Customer Info</h4>
                                        <span className="text-[10px] text-[#6B7280]">
                                          ID: {o.customer?.id?.substring(0, 8).toUpperCase() || 'N/A'}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm shrink-0">
                                          <UserCircle className="w-6 h-6 text-slate-400" />
                                        </div>
                                        <div className="min-w-0">
                                          <p className="font-bold text-sm text-[#111111] truncate">{o.customer?.name || 'Customer'}</p>
                                          <p className="text-[11px] text-[#6B7280] truncate">{o.company?.name || 'Individual Customer'}</p>
                                        </div>
                                      </div>
                                      <div className="space-y-2 text-xs">
                                        <div className="flex items-center">
                                          <Phone className="w-3.5 h-3.5 text-[#6B7280] mr-2 shrink-0" />
                                          <a
                                            href={`tel:${o.customer?.phone || ''}`}
                                            className="font-medium text-[#374151] hover:text-[#3B6FEB]"
                                          >
                                            {o.customer?.phone || '+91 98765 43210'}
                                          </a>
                                        </div>
                                        <div className="flex items-center">
                                          <MessageSquare className="w-3.5 h-3.5 text-[#6B7280] mr-2 shrink-0" />
                                          <a
                                            href={`mailto:${o.customer?.email || ''}`}
                                            className="font-medium text-[#4B5563] hover:text-[#3B6FEB] truncate"
                                          >
                                            {o.customer?.email}
                                          </a>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Internal Notes input */}
                                    <div className="mt-4 pt-3 border-t border-[#F3F4F6]">
                                      <label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block mb-1">
                                        Internal Notes
                                      </label>
                                      <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-2">
                                        <input
                                          type="text"
                                          placeholder="Add internal order note..."
                                          value={orderNotes[o.id] || ''}
                                          onChange={(e) => setOrderNotes(prev => ({ ...prev, [o.id]: e.target.value }))}
                                          onClick={(e) => e.stopPropagation()}
                                          className="w-full bg-transparent text-xs text-[#111111] outline-none"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Card 2: Product Items & Financial Breakdown */}
                                  <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E5E7EB] shadow-xs flex flex-col justify-between">
                                    <div>
                                      <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6] mb-3">
                                        <h4 className="text-xs font-bold text-[#111111] uppercase tracking-wider">Product Items</h4>
                                        <span className="text-[10px] font-semibold text-[#3B6FEB]">
                                          {(o.items || []).reduce((acc: number, item: any) => acc + (item.quantity || 0), 0)} Total Pcs
                                        </span>
                                      </div>
                                      <div className="space-y-3 max-h-48 overflow-y-auto hide-scrollbar pr-1">
                                        {o.items && o.items.length > 0 ? (
                                          o.items.map((item: any) => (
                                            <div key={item.id} className="flex gap-2.5 items-center">
                                              <div className="w-10 h-10 bg-[#F3F4F6] rounded-lg flex items-center justify-center text-lg shrink-0 border border-[#E5E7EB]">
                                                👕
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-[#111111] truncate">
                                                  {item.product?.name || 'Custom Product'}
                                                </p>
                                                <p className="text-[10px] text-[#6B7280]">
                                                  {item.quantity} Qty ({item.size || 'L'}, {item.color || 'Standard'}) • {item.printType || 'Standard'}
                                                </p>
                                              </div>
                                              <div className="font-bold text-xs text-[#111111] shrink-0">
                                                {formatCurrency(item.totalPrice)}
                                              </div>
                                            </div>
                                          ))
                                        ) : (
                                          <p className="text-xs text-[#6B7280]">No items recorded.</p>
                                        )}
                                      </div>
                                    </div>

                                    {/* Financial Summary */}
                                    <div className="mt-4 pt-3 border-t border-[#F3F4F6] space-y-1 text-xs">
                                      <div className="flex justify-between text-[#6B7280]">
                                        <span>Subtotal</span>
                                        <span>{formatCurrency(o.subtotal || o.totalAmount * 0.95)}</span>
                                      </div>
                                      <div className="flex justify-between text-[#6B7280]">
                                        <span>GST (5%)</span>
                                        <span>{formatCurrency(o.gstTotal || o.totalAmount * 0.05)}</span>
                                      </div>
                                      <div className="flex justify-between font-bold text-sm text-[#111111] pt-1 border-t border-[#F3F4F6]">
                                        <span>Total</span>
                                        <span className="text-[#3B6FEB]">{formatCurrency(o.totalAmount)}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Card 3: Order Lifecycle Timeline (7 Stages) */}
                                  <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E5E7EB] shadow-xs">
                                    <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6] mb-3">
                                      <h4 className="text-xs font-bold text-[#111111] uppercase tracking-wider">Lifecycle Timeline</h4>
                                      <StatusBadge status={o.status} />
                                    </div>
                                    <div className="space-y-3 relative before:absolute before:inset-0 before:left-2 before:h-full before:w-0.5 before:bg-slate-200 pl-6">
                                      {/* 1. Order Created */}
                                      <div className="relative flex items-start justify-between">
                                        <div className="absolute left-[-20px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-50"></div>
                                        <div>
                                          <p className="text-[11px] font-bold text-[#111111]">Order Created</p>
                                          <p className="text-[9px] text-[#6B7280]">
                                            {new Date(o.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                          </p>
                                        </div>
                                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 rounded border border-emerald-200">
                                          Done
                                        </span>
                                      </div>

                                      {/* 2. Payment Received */}
                                      <div className="relative flex items-start justify-between">
                                        <div
                                          className={`absolute left-[-20px] top-1 w-2.5 h-2.5 rounded-full ring-4 ${
                                            o.paymentStatus === 'PAID' ? 'bg-emerald-500 ring-emerald-50' : 'bg-slate-300 ring-white'
                                          }`}
                                        ></div>
                                        <div>
                                          <p className={`text-[11px] font-bold ${o.paymentStatus === 'PAID' ? 'text-[#111111]' : 'text-[#6B7280]'}`}>
                                            Payment Received
                                          </p>
                                          <p className="text-[9px] text-[#6B7280]">
                                            {o.paymentStatus === 'PAID'
                                              ? 'Verified'
                                              : o.paymentStatus === 'PARTIAL'
                                              ? 'Partial'
                                              : 'Awaiting'}
                                          </p>
                                        </div>
                                        <span
                                          className={`text-[9px] font-bold px-1 rounded border ${
                                            o.paymentStatus === 'PAID'
                                              ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                              : 'text-slate-500 bg-slate-50 border-slate-200'
                                          }`}
                                        >
                                          {o.paymentStatus === 'PAID' ? 'Paid' : 'Pending'}
                                        </span>
                                      </div>

                                      {/* 3. Order Confirmed */}
                                      <div className="relative flex items-start justify-between">
                                        <div
                                          className={`absolute left-[-20px] top-1 w-2.5 h-2.5 rounded-full ring-4 ${
                                            currentRank >= 1 ? 'bg-emerald-500 ring-emerald-50' : 'bg-slate-300 ring-white'
                                          }`}
                                        ></div>
                                        <div>
                                          <p className={`text-[11px] font-bold ${currentRank >= 1 ? 'text-[#111111]' : 'text-[#6B7280]'}`}>
                                            Order Confirmed
                                          </p>
                                          <p className="text-[9px] text-[#6B7280]">{currentRank >= 1 ? 'Confirmed' : 'Pending'}</p>
                                        </div>
                                        <span
                                          className={`text-[9px] font-bold px-1 rounded border ${
                                            currentRank >= 1
                                              ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                              : 'text-slate-500 bg-slate-50 border-slate-200'
                                          }`}
                                        >
                                          {currentRank >= 1 ? 'Done' : 'Pending'}
                                        </span>
                                      </div>

                                      {/* 4. In Production */}
                                      <div className="relative flex items-start justify-between">
                                        <div
                                          className={`absolute left-[-20px] top-1 w-2.5 h-2.5 rounded-full ring-4 ${
                                            currentRank >= 2 ? 'bg-emerald-500 ring-emerald-50' : 'bg-slate-300 ring-white'
                                          }`}
                                        ></div>
                                        <div>
                                          <p className={`text-[11px] font-bold ${currentRank >= 2 ? 'text-[#111111]' : 'text-[#6B7280]'}`}>
                                            In Production
                                          </p>
                                          <p className="text-[9px] text-[#6B7280]">
                                            {currentRank >= 2 ? 'Manufacturing' : 'Pending'}
                                          </p>
                                        </div>
                                        <span
                                          className={`text-[9px] font-bold px-1 rounded border ${
                                            currentRank >= 2
                                              ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                              : 'text-slate-500 bg-slate-50 border-slate-200'
                                          }`}
                                        >
                                          {currentRank >= 2 ? 'Active' : 'Pending'}
                                        </span>
                                      </div>

                                      {/* 5. Ready for Dispatch */}
                                      <div className="relative flex items-start justify-between">
                                        <div
                                          className={`absolute left-[-20px] top-1 w-2.5 h-2.5 rounded-full ring-4 ${
                                            currentRank >= 3 ? 'bg-emerald-500 ring-emerald-50' : 'bg-slate-300 ring-white'
                                          }`}
                                        ></div>
                                        <div>
                                          <p className={`text-[11px] font-bold ${currentRank >= 3 ? 'text-[#111111]' : 'text-[#6B7280]'}`}>
                                            Ready for Dispatch
                                          </p>
                                          <p className="text-[9px] text-[#6B7280]">{currentRank >= 3 ? 'Packed & QC' : 'Pending'}</p>
                                        </div>
                                        <span
                                          className={`text-[9px] font-bold px-1 rounded border ${
                                            currentRank >= 3
                                              ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                              : 'text-slate-500 bg-slate-50 border-slate-200'
                                          }`}
                                        >
                                          {currentRank >= 3 ? 'Ready' : 'Pending'}
                                        </span>
                                      </div>

                                      {/* 6. Dispatched */}
                                      <div className="relative flex items-start justify-between">
                                        <div
                                          className={`absolute left-[-20px] top-1 w-2.5 h-2.5 rounded-full ring-4 ${
                                            currentRank >= 4 ? 'bg-emerald-500 ring-emerald-50' : 'bg-slate-300 ring-white'
                                          }`}
                                        ></div>
                                        <div>
                                          <p className={`text-[11px] font-bold ${currentRank >= 4 ? 'text-[#111111]' : 'text-[#6B7280]'}`}>
                                            Dispatched
                                          </p>
                                          <p className="text-[9px] text-[#6B7280]">
                                            {currentRank >= 4
                                              ? o.dispatch?.courierName || 'In Transit'
                                              : 'Pending'}
                                          </p>
                                        </div>
                                        <span
                                          className={`text-[9px] font-bold px-1 rounded border ${
                                            currentRank >= 4
                                              ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                              : 'text-slate-500 bg-slate-50 border-slate-200'
                                          }`}
                                        >
                                          {currentRank >= 4 ? 'Dispatched' : 'Pending'}
                                        </span>
                                      </div>

                                      {/* 7. Delivered */}
                                      <div className="relative flex items-start justify-between">
                                        <div
                                          className={`absolute left-[-20px] top-1 w-2.5 h-2.5 rounded-full ring-4 ${
                                            o.status === 'DELIVERED' ? 'bg-emerald-500 ring-emerald-50' : 'bg-slate-300 ring-white'
                                          }`}
                                        ></div>
                                        <div>
                                          <p className={`text-[11px] font-bold ${o.status === 'DELIVERED' ? 'text-[#111111]' : 'text-[#6B7280]'}`}>
                                            Delivered
                                          </p>
                                          <p className="text-[9px] text-[#6B7280]">
                                            {o.status === 'DELIVERED' ? 'Fulfilled' : 'Pending'}
                                          </p>
                                        </div>
                                        <span
                                          className={`text-[9px] font-bold px-1 rounded border ${
                                            o.status === 'DELIVERED'
                                              ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                              : 'text-slate-500 bg-slate-50 border-slate-200'
                                          }`}
                                        >
                                          {o.status === 'DELIVERED' ? 'Delivered' : 'Pending'}
                                        </span>
                                      </div>

                                      {/* Cancelled Milestone (if applicable) */}
                                      {isCancelled && (
                                        <div className="relative flex items-start justify-between">
                                          <div className="absolute left-[-20px] top-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-4 ring-rose-50"></div>
                                          <div>
                                            <p className="text-[11px] font-bold text-rose-700">Order Cancelled</p>
                                            <p className="text-[9px] text-[#6B7280]">
                                              {o.updatedAt
                                                ? new Date(o.updatedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
                                                : 'Cancelled'}
                                            </p>
                                          </div>
                                          <span className="text-[9px] font-bold text-rose-700 bg-rose-50 px-1 rounded border border-rose-200">
                                            Cancelled
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Card 4: Actions & Order Management */}
                                  <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E5E7EB] shadow-xs flex flex-col justify-between space-y-4">
                                    <div>
                                      <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6] mb-3">
                                        <h4 className="text-xs font-bold text-[#111111] uppercase tracking-wider">Quick Actions</h4>
                                        <span className="text-[10px] text-[#6B7280] font-mono">{o.status}</span>
                                      </div>

                                      <div className="space-y-2.5">
                                        {/* Record Payment Button (if unpaid) */}
                                        {o.paymentStatus !== 'PAID' && o.status !== 'CANCELLED' && (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openPaymentModal(o);
                                            }}
                                            className="w-full px-4 py-2.5 bg-emerald-600 rounded-lg text-sm font-bold text-white hover:bg-emerald-700 flex justify-center items-center gap-2 shadow-sm transition-colors min-h-[42px]"
                                          >
                                            <IndianRupee className="w-4 h-4" /> Mark Payment Received
                                          </button>
                                        )}

                                        {/* Contextual Status Progression Action */}
                                        {nextAction && (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              updateStatus(o.id, nextAction.nextStatus);
                                            }}
                                            disabled={isUpdatingStatus}
                                            className="w-full px-4 py-2.5 bg-[#3B6FEB] rounded-lg text-sm font-bold text-white hover:bg-[#2563EB] flex justify-center items-center gap-2 shadow-sm transition-colors disabled:opacity-50 min-h-[42px]"
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

                                        {/* Invoice & WhatsApp */}
                                        <div className="grid grid-cols-2 gap-2 pt-1">
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDownloadInvoice(o);
                                            }}
                                            className="px-3 py-2 border border-[#E5E7EB] bg-white rounded-lg text-xs font-bold text-[#374151] hover:bg-[#F9FAFB] flex justify-center items-center gap-1.5 shadow-xs min-h-[38px] transition-colors"
                                          >
                                            <Download className="w-3.5 h-3.5" /> Invoice
                                          </button>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openWhatsApp(o);
                                            }}
                                            className="px-3 py-2 border border-[#E5E7EB] bg-white rounded-lg text-xs font-bold text-[#374151] hover:bg-[#F9FAFB] flex justify-center items-center gap-1.5 shadow-xs min-h-[38px] transition-colors"
                                          >
                                            <MessageSquare className="w-3.5 h-3.5 text-green-600" /> WhatsApp
                                          </button>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Cancel Order Action */}
                                    {o.status !== 'DELIVERED' && o.status !== 'CANCELLED' && (
                                      <div className="pt-2 border-t border-[#F3F4F6]">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm('Are you sure you want to cancel this order?')) {
                                              updateStatus(o.id, 'CANCELLED');
                                            }
                                          }}
                                          disabled={isUpdatingStatus}
                                          className="w-full text-xs font-bold text-red-500 hover:text-red-700 flex justify-center items-center gap-1 disabled:opacity-50 py-1.5 rounded hover:bg-red-50 transition-colors"
                                        >
                                          <AlertCircle className="w-3.5 h-3.5" /> Cancel Order
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-[#E5E7EB] flex justify-between items-center text-xs text-[#6B7280]">
            <span>
              Showing {pagination.total === 0 ? 0 : (page - 1) * pagination.pageSize + 1} to {Math.min(page * pagination.pageSize, pagination.total)} of {pagination.total} orders
            </span>
            <div className="flex gap-1 items-center">
              <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-2 py-1 border border-[#E5E7EB] rounded hover:bg-[#F3F4F6] disabled:opacity-50">&lt;</button>
              <span className="px-3 font-semibold text-[#111111]">{page}</span>
              <button disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)} className="px-2 py-1 border border-[#E5E7EB] rounded hover:bg-[#F3F4F6] disabled:opacity-50">&gt;</button>
            </div>
          </div>
        </div>
      </div>

      {/* MANUAL PAYMENT MODAL */}
      {paymentModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-green-600" /> Record Payment
              </h2>
              <button
                onClick={() => setPaymentModalOrder(null)}
                className="text-gray-400 hover:text-gray-900 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">
                  Order: <span className="font-bold text-gray-800">{paymentModalOrder.orderNumber}</span>
                </p>
                <label className="block text-xs font-bold text-gray-700 mb-1">Amount Received (INR)</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                >
                  <option value="UPI">UPI</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CASH">Cash</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Reference Number (Optional)</label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={e => setPaymentReference(e.target.value)}
                  placeholder="e.g. UTR Number"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/50 flex gap-3">
              <button
                onClick={() => setPaymentModalOrder(null)}
                className="flex-1 px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleManualPayment}
                disabled={isSubmittingPayment}
                className="flex-1 px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {isSubmittingPayment ? 'Saving...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
