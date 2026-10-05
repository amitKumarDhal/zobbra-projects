'use client';

import React, { useState } from 'react';
import { Truck, Search, Loader2, Check, Package, ExternalLink, XCircle } from 'lucide-react';
import { API_URL } from '@/lib/api';
import { StatusBadge } from '@/components/ui/status-badge';

interface TrackedOrder {
  orderNumber: string;
  status: string;
  placedAt: string;
  updatedAt: string;
  productionStage: string | null;
  items: Array<{ name: string; quantity: number }>;
  shipment: {
    courierName: string;
    trackingNumber: string;
    trackingUrl: string | null;
    status: string;
    dispatchedAt: string;
    deliveredAt: string | null;
  } | null;
}

// Order of the OrderStatus enum (CANCELLED is shown separately)
const STEPS = [
  { status: 'PENDING', label: 'Order Placed', hint: 'We have received your order.' },
  { status: 'CONFIRMED', label: 'Confirmed', hint: 'Your order is confirmed and queued for production.' },
  { status: 'IN_PRODUCTION', label: 'In Production', hint: 'Your products are being printed and finished.' },
  { status: 'READY_FOR_DISPATCH', label: 'Ready to Dispatch', hint: 'Quality checked, packed and awaiting pickup.' },
  { status: 'DISPATCHED', label: 'Dispatched', hint: 'Your order is on its way.' },
  { status: 'DELIVERED', label: 'Delivered', hint: 'Your order has been delivered.' },
];

const PRODUCTION_STAGE_LABELS: Record<string, string> = {
  PENDING: 'Queued',
  PRINTING: 'Printing',
  QUALITY_CHECK: 'Quality Check',
  PACKING: 'Packing',
  READY_TO_DISPATCH: 'Ready to Dispatch',
};

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<TrackedOrder | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = orderId.trim();
    if (!id) return;

    setLoading(true);
    setError('');
    setOrder(null);
    try {
      const res = await fetch(`${API_URL}/orders/track/${encodeURIComponent(id)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setOrder(data.order);
      } else {
        setError(data.message || 'Unable to find this order. Please try again.');
      }
    } catch {
      setError('Unable to reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const currentStep = order ? STEPS.findIndex((s) => s.status === order.status) : -1;
  const isCancelled = order?.status === 'CANCELLED';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 bg-[#F8F9FC]">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#EEF2FF] border border-[#C7D2FE] rounded-full text-xs font-bold text-[#3B6FEB]">
          <Truck className="w-3.5 h-3.5" /> ORDER TRACKING
        </div>
        <h1 className="text-4xl lg:text-[44px] font-heading font-black text-[#111111] leading-tight">
          Track Your Order
        </h1>
        <p className="text-[#6B7280] text-sm max-w-xl mx-auto">
          Enter the order ID from your confirmation message to see where your order is.
        </p>
      </div>

      <div className="bg-white border border-[#E5E7EB] p-6 sm:p-10 shadow-sm rounded-2xl">
        <form onSubmit={handleSubmit} className="text-sm">
          <label htmlFor="track-order-id" className="block font-bold text-[#374151] mb-1.5">
            Order ID <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              id="track-order-id"
              type="text"
              required
              maxLength={40}
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="e.g. ZQB-ORD-2026-1001"
              className="w-full px-4 py-2.5 bg-white border border-[#D1D5DB] rounded-lg text-[#111111] font-mono outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] shadow-sm transition-all"
            />
            <button
              id="track-order-btn"
              type="submit"
              disabled={loading}
              className="shrink-0 px-8 py-2.5 bg-[#111111] hover:bg-[#000000] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {loading ? 'Tracking...' : 'Track Order'}
            </button>
          </div>
        </form>

        {error && (
          <div
            id="track-order-error"
            role="alert"
            className="mt-5 flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium rounded-xl px-4 py-3"
          >
            <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}
      </div>

      {order && (
        <div id="track-order-result" className="bg-white border border-[#E5E7EB] p-6 sm:p-10 shadow-sm rounded-2xl space-y-8">
          {/* Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-[#E5E7EB]">
            <div>
              <span className="text-[#6B7280] text-xs font-bold uppercase tracking-wider block mb-1">Order ID</span>
              <span className="text-xl font-black text-[#111111] font-mono tracking-tight">{order.orderNumber}</span>
              <p className="text-xs text-[#6B7280] mt-1">
                Placed on {formatDate(order.placedAt)} • Last updated {formatDate(order.updatedAt)}
              </p>
            </div>
            <StatusBadge status={order.status} />
          </div>

          {/* Progress */}
          {isCancelled ? (
            <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium rounded-xl px-4 py-3">
              <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
              This order has been cancelled. Please contact our team if you need help.
            </div>
          ) : (
            <ol className="space-y-0">
              {STEPS.map((step, index) => {
                const done = index < currentStep || order.status === 'DELIVERED';
                const active = index === currentStep && !done;
                const isLast = index === STEPS.length - 1;
                return (
                  <li key={step.status} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center border-2 shrink-0 ${
                          done
                            ? 'bg-[#3B6FEB] border-[#3B6FEB] text-white'
                            : active
                              ? 'bg-[#EEF2FF] border-[#3B6FEB] text-[#3B6FEB]'
                              : 'bg-white border-[#D1D5DB] text-[#9CA3AF]'
                        }`}
                      >
                        {done ? <Check className="w-4 h-4" /> : <span className="w-2 h-2 rounded-full bg-current" />}
                      </span>
                      {!isLast && (
                        <span className={`w-0.5 flex-1 min-h-[28px] ${done ? 'bg-[#3B6FEB]' : 'bg-[#E5E7EB]'}`} />
                      )}
                    </div>
                    <div className={isLast ? '' : 'pb-6'}>
                      <p className={`text-sm font-bold ${done || active ? 'text-[#111111]' : 'text-[#9CA3AF]'}`}>
                        {step.label}
                      </p>
                      {active && <p className="text-xs text-[#6B7280] mt-0.5">{step.hint}</p>}
                      {active && step.status === 'IN_PRODUCTION' && order.productionStage && (
                        <p className="text-xs font-semibold text-[#3B6FEB] mt-1">
                          Current stage: {PRODUCTION_STAGE_LABELS[order.productionStage] || order.productionStage}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}

          {/* Shipment */}
          {order.shipment && (
            <div className="bg-[#F8F9FC] border border-[#E5E7EB] rounded-xl p-4 sm:p-5 space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#3B6FEB]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#111111]">Shipment Details</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-xs text-[#6B7280] block">Courier</span>
                  <span className="font-bold text-[#111111]">{order.shipment.courierName}</span>
                </div>
                <div>
                  <span className="text-xs text-[#6B7280] block">Tracking Number</span>
                  <span className="font-bold text-[#111111] font-mono">{order.shipment.trackingNumber}</span>
                </div>
                <div>
                  <span className="text-xs text-[#6B7280] block">Dispatched On</span>
                  <span className="font-bold text-[#111111]">{formatDate(order.shipment.dispatchedAt)}</span>
                </div>
                {order.shipment.deliveredAt && (
                  <div>
                    <span className="text-xs text-[#6B7280] block">Delivered On</span>
                    <span className="font-bold text-[#111111]">{formatDate(order.shipment.deliveredAt)}</span>
                  </div>
                )}
              </div>
              {order.shipment.trackingUrl && (
                <a
                  href={order.shipment.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#3B6FEB] hover:underline"
                >
                  Track with courier <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )}

          {/* Items */}
          {order.items.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-[#3B6FEB]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#111111]">Items in this Order</h3>
              </div>
              <div className="divide-y divide-[#E5E7EB] text-sm">
                {order.items.map((item, i) => (
                  <div key={i} className="py-2.5 flex items-center justify-between gap-3">
                    <span className="font-medium text-[#111111]">{item.name}</span>
                    <span className="text-[#6B7280] font-semibold whitespace-nowrap">{item.quantity} pcs</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
