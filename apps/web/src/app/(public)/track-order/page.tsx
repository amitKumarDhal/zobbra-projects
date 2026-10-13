'use client';

import React, { useEffect, useState } from 'react';
import {
  Truck,
  Search,
  Loader2,
  Check,
  Package,
  ExternalLink,
  XCircle,
  MessageCircle,
} from 'lucide-react';
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

const SUPPORT_WHATSAPP_URL =
  'https://wa.me/919124449665?text=Hi%20ZOBBRA%20team,%20I%20need%20help%20tracking%20my%20order.';

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<TrackedOrder | null>(null);

  const trackOrder = async (rawId: string) => {
    const id = rawId.trim();
    if (!id) return;

    setLoading(true);
    setError('');
    setOrder(null);
    // Keep the URL shareable, e.g. /track-order?id=ZB001
    window.history.replaceState(null, '', `?id=${encodeURIComponent(id)}`);
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

  // Links like /track-order?id=ZB001 (e.g. from a confirmation message) track immediately.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('id');
    if (id) {
      setOrderId(id);
      trackOrder(id);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    trackOrder(orderId);
  };

  const currentStep = order ? STEPS.findIndex((s) => s.status === order.status) : -1;
  const isCancelled = order?.status === 'CANCELLED';

  return (
    <div className="bg-[#F8F9FC] min-h-[70vh]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-6">
        <div className="text-center space-y-2.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#EEF2FF] border border-[#C7D2FE] rounded-full text-[11px] font-bold tracking-wider text-[#3B6FEB]">
            <Truck className="w-3.5 h-3.5" /> ORDER TRACKING
          </div>
          <h1 className="text-3xl sm:text-4xl font-heading font-black text-[#111111] tracking-tight leading-tight">
            Track Your Order
          </h1>
          <p className="text-[#6B7280] text-sm max-w-md mx-auto">
            Enter the order ID from your confirmation message to see where your order is.
          </p>
        </div>

        {/* Search */}
        <div className="bg-white border border-[#E5E7EB] p-5 sm:p-6 shadow-sm rounded-2xl">
          <form onSubmit={handleSubmit} className="text-sm">
            <label htmlFor="track-order-id" className="block text-xs font-bold text-[#374151] mb-1.5">
              Order ID
            </label>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Package className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="track-order-id"
                  type="text"
                  required
                  maxLength={40}
                  autoComplete="off"
                  spellCheck={false}
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="e.g. ZB001"
                  className="w-full h-11 pl-10 pr-4 bg-white border border-[#D1D5DB] rounded-xl text-[#111111] font-mono uppercase placeholder:normal-case placeholder:font-sans placeholder:text-[#9CA3AF] outline-none focus:border-[#3B6FEB] focus:ring-2 focus:ring-[#3B6FEB]/20 transition-all"
                />
              </div>
              <button
                id="track-order-btn"
                type="submit"
                disabled={loading}
                className="shrink-0 h-11 min-h-0 px-6 bg-[#111111] hover:bg-[#3B6FEB] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
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
              className="mt-4 flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium rounded-xl px-4 py-3"
            >
              <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <p className="mt-4 pt-4 border-t border-[#F1F2F4] text-xs text-[#6B7280] flex flex-wrap items-center gap-x-1.5 gap-y-1">
            Can&apos;t find your order ID?
            <a
              href={SUPPORT_WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-0 inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              <MessageCircle className="w-3.5 h-3.5" /> Ask us on WhatsApp
            </a>
          </p>
        </div>

        {order && (
          <div id="track-order-result" className="bg-white border border-[#E5E7EB] p-5 sm:p-7 shadow-sm rounded-2xl space-y-6">
            {/* Summary */}
            <div className="flex flex-wrap items-start justify-between gap-3 pb-5 border-b border-[#E5E7EB]">
              <div>
                <span className="text-[#6B7280] text-[11px] font-bold uppercase tracking-wider block mb-0.5">
                  Order ID
                </span>
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
                <span>
                  This order has been cancelled.{' '}
                  <a
                    href={SUPPORT_WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-0 font-bold underline"
                  >
                    Contact our team
                  </a>{' '}
                  if you need help.
                </span>
              </div>
            ) : (
              <ol>
                {STEPS.map((step, index) => {
                  const done = index < currentStep || order.status === 'DELIVERED';
                  const active = index === currentStep && !done;
                  const isLast = index === STEPS.length - 1;
                  return (
                    <li key={step.status} className="flex gap-3.5">
                      <div className="flex flex-col items-center">
                        <span
                          className={`w-7 h-7 rounded-full flex items-center justify-center border-2 shrink-0 ${
                            done
                              ? 'bg-[#3B6FEB] border-[#3B6FEB] text-white'
                              : active
                                ? 'bg-[#EEF2FF] border-[#3B6FEB] text-[#3B6FEB] ring-4 ring-[#3B6FEB]/10'
                                : 'bg-white border-[#D1D5DB] text-[#D1D5DB]'
                          }`}
                        >
                          {done ? <Check className="w-4 h-4" /> : <span className="w-2 h-2 rounded-full bg-current" />}
                        </span>
                        {!isLast && (
                          <span className={`w-0.5 flex-1 min-h-[20px] ${done ? 'bg-[#3B6FEB]' : 'bg-[#E5E7EB]'}`} />
                        )}
                      </div>
                      <div className={`pt-1 ${isLast ? '' : 'pb-5'}`}>
                        <p
                          className={`text-sm font-bold flex items-center gap-2 ${
                            done || active ? 'text-[#111111]' : 'text-[#9CA3AF]'
                          }`}
                        >
                          {step.label}
                          {active && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#3B6FEB] bg-[#EEF2FF] px-1.5 py-0.5 rounded">
                              Current
                            </span>
                          )}
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
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs text-[#6B7280] block">Courier</span>
                    <span className="font-bold text-[#111111]">{order.shipment.courierName}</span>
                  </div>
                  <div>
                    <span className="text-xs text-[#6B7280] block">Tracking Number</span>
                    <span className="font-bold text-[#111111] font-mono break-all">{order.shipment.trackingNumber}</span>
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
                    className="min-h-0 inline-flex items-center gap-1.5 text-xs font-bold text-[#3B6FEB] hover:underline"
                  >
                    Track with courier <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            )}

            {/* Items */}
            {order.items.length > 0 && (
              <div className="space-y-2">
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
    </div>
  );
}
