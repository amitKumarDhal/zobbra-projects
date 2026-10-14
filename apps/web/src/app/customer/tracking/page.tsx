'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Truck,
  Package,
  MessageSquare,
  Sparkles,
  ChevronRight,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { API_URL } from '@/lib/api';
import { buildWhatsAppUrl } from '@/lib/whatsapp';

// ZOBBRA sales WhatsApp line — customers message the team, never themselves
const SALES_WHATSAPP = '919124449665';

interface OrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  createdAt: string;
  items?: Array<{
    id: string;
    product?: { name: string };
    quantity: number;
  }>;
}

function itemsSummary(order: OrderSummary): string | null {
  const items = order.items || [];
  if (items.length === 0) return null;
  const first = items[0].product?.name || 'Item';
  return items.length > 1 ? `${first} + ${items.length - 1} more` : first;
}

function shipmentEnquiryUrl(orderNumber?: string): string | null {
  const message = orderNumber
    ? `Hi ZOBBRA team, could you share the shipment status for order ${orderNumber}?`
    : 'Hi ZOBBRA team, could you share the shipment status of my orders?';
  return buildWhatsAppUrl(SALES_WHATSAPP, message);
}

export default function CustomerTrackingPage() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('zobra_token');
      const res = await fetch(`${API_URL}/orders?pageSize=5`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(`Orders request failed (${res.status})`);
      const list = data.orders || data.data;
      setOrders(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load customer orders:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const generalEnquiryUrl = shipmentEnquiryUrl();

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 pb-12">
      {/* 1. PAGE HEADER */}
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-heading font-black text-[#111111] tracking-tight">
          Shipment Tracking
        </h1>
        <p className="text-xs sm:text-sm text-[#6B7280] max-w-xl font-medium">
          Check the status of your recent orders. Live shipment tracking will be available soon.
        </p>
      </div>

      {/* 2. COMING SOON NOTICE — compact, so the customer's orders stay in view */}
      <Card
        className="bg-white border-[#E5E7EB] p-5 sm:p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center gap-4"
        data-cy="tracking-coming-soon"
      >
        <div className="w-12 h-12 bg-[#EEF2FF] text-[#3B6FEB] rounded-2xl flex items-center justify-center border border-[#C7D2FE] shrink-0">
          <Truck className="w-6 h-6" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-heading font-bold text-[#111111]">
              Real-Time Courier Tracking
            </h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#EEF2FF] rounded-full text-[10px] font-bold text-[#3B6FEB] uppercase tracking-wider">
              <Sparkles className="w-3 h-3" /> COMING SOON
            </span>
          </div>
          <p className="text-xs text-[#6B7280] leading-relaxed">
            Courier tracking integration is currently under development. Until then, we send your
            dispatch slip and docket number on WhatsApp and email as soon as your order ships.
          </p>
        </div>
        {generalEnquiryUrl && (
          <a
            href={generalEnquiryUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-cy="tracking-whatsapp-btn"
            className="w-full sm:w-auto shrink-0 px-4 py-2.5 font-bold bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl shadow-sm transition-colors text-xs flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-4 h-4" /> ASK ON WHATSAPP
          </a>
        )}
      </Card>

      {/* 3. RECENT ORDERS (from the database) */}
      <Card className="bg-white border-[#E5E7EB] p-5 sm:p-6 rounded-2xl shadow-sm space-y-2">
        <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6]">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-[#3B6FEB]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
              Your Recent Orders
            </h3>
          </div>
          <Link
            href="/customer/orders"
            data-cy="view-all-orders-btn"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#3B6FEB] hover:underline"
          >
            View All <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="divide-y divide-[#F3F4F6]" data-cy="tracking-orders-loading">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="py-4 flex items-center justify-between gap-3 animate-pulse">
                <div className="space-y-2">
                  <div className="w-32 h-4 bg-gray-200 rounded" />
                  <div className="w-48 h-3 bg-gray-200 rounded" />
                </div>
                <div className="w-24 h-8 bg-gray-200 rounded-lg" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="py-8 text-center space-y-3" data-cy="tracking-orders-error">
            <AlertCircle className="w-6 h-6 text-rose-500 mx-auto" />
            <p className="text-xs text-[#6B7280]">We couldn&apos;t load your orders right now.</p>
            <Button variant="outline" size="sm" onClick={fetchOrders} className="font-bold text-xs gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> TRY AGAIN
            </Button>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-8 text-center space-y-3" data-cy="tracking-orders-empty">
            <p className="text-sm font-bold text-[#111111]">No orders yet</p>
            <p className="text-xs text-[#6B7280]">
              Once you place an order, its status will show up here.
            </p>
            <Link href="/customer/products" className="inline-block">
              <Button variant="primary" size="sm" className="font-bold text-xs">
                BROWSE PRODUCTS
              </Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[#F3F4F6]" data-cy="tracking-orders-list">
            {orders.map((ord) => {
              const summary = itemsSummary(ord);
              const enquiryUrl = shipmentEnquiryUrl(ord.orderNumber);
              return (
                <div
                  key={ord.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-[#111111] text-sm">{ord.orderNumber}</span>
                      <StatusBadge status={ord.status} />
                    </div>
                    {summary && <p className="text-[#374151] mt-1 truncate">{summary}</p>}
                    <p className="text-[#6B7280] text-[11px] mt-0.5">
                      Placed {new Date(ord.createdAt).toLocaleDateString('en-IN')} • ₹
                      {Number(ord.totalAmount || 0).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {enquiryUrl && (
                      <a
                        href={enquiryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Ask about shipment for order ${ord.orderNumber} on WhatsApp`}
                        className="inline-flex items-center gap-1.5 px-3 rounded-lg text-xs font-bold text-[#128C7E] hover:bg-emerald-50 transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Ask
                      </a>
                    )}
                    <Link href={`/customer/orders/${ord.id}`}>
                      <Button variant="outline" size="sm" className="font-bold border-[#D1D5DB] text-xs">
                        Order Details
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
