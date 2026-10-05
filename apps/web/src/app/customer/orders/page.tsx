'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Package, ChevronDown, ChevronUp, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { API_URL } from '@/lib/api';
import { CustomerOrderDetails, CustomerOrderDetail } from '@/components/orders/CustomerOrderDetails';
import { fetchCustomerOrder, getStoredCustomerPhone } from '@/lib/customerOrders';

interface CustomerOrder {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  paymentStatus: string;
  subtotal: number;
  gstTotal: number;
  totalAmount: number;
  artworkUrl?: string;
  previewFrontUrl?: string;
  previewBackUrl?: string;
  company?: { name: string };
  customer?: { name: string };
  items?: Array<{ quantity: number; product?: { name: string; images?: string[] } }>;
}

type DetailState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; order: CustomerOrderDetail };

// Shared column template for the header and every order row (desktop)
const COLUMNS = 'md:grid md:grid-cols-[minmax(0,1.5fr)_minmax(0,1.6fr)_minmax(0,0.8fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_40px] md:items-center md:gap-4';

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  // Accordion: at most one order is open; its details render directly below its row.
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  // Details already loaded this visit, so reopening an order does not fetch again.
  const [details, setDetails] = useState<Record<string, DetailState>>({});
  const [storedPhone, setStoredPhone] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('zobra_token') : null;
      const res = await fetch(`${API_URL}/orders`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const orderList = Array.isArray(data.data) ? data.data : Array.isArray(data.orders) ? data.orders : [];
        setOrders(orderList);
      }
    } catch (err) {
      console.error('Failed to load customer orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setStoredPhone(getStoredCustomerPhone());
    fetchOrders();
  }, []);

  const loadDetail = useCallback(async (orderId: string) => {
    setDetails((prev) => ({ ...prev, [orderId]: { status: 'loading' } }));
    try {
      const order = await fetchCustomerOrder(orderId);
      setDetails((prev) => ({ ...prev, [orderId]: { status: 'ready', order } }));
    } catch {
      setDetails((prev) => ({ ...prev, [orderId]: { status: 'error' } }));
    }
  }, []);

  const toggleOrder = (orderId: string) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      return;
    }
    setExpandedOrderId(orderId);
    if (details[orderId]?.status !== 'ready') loadDetail(orderId);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EEF2FF] text-[#3B6FEB] uppercase tracking-wider mb-2">
            PURCHASE ORDERS
          </div>
          <h1 className="text-3xl sm:text-4xl font-heading font-black text-[#111111] tracking-tight">
            My Orders
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-1 font-medium">
            Track corporate order status, production progress, and payment records.
          </p>
        </div>
        <Link href="/customer/products">
          <Button variant="primary" size="sm" className="gap-2 font-bold">
            <Package className="w-4 h-4" /> BROWSE PRODUCTS
          </Button>
        </Link>
      </div>

      {/* Orders list */}
      <Card className="bg-white border-[#E5E7EB] p-0 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 space-y-3">
            <div className="h-6 w-1/3 bg-gray-100 animate-pulse rounded" />
            <div className="h-10 w-full bg-gray-50 animate-pulse rounded" />
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#111111]">No Active Orders</h3>
            <p className="text-xs text-[#6B7280] mt-1 max-w-sm mx-auto">
              You haven't converted any quotes to an order yet. Browse products or check approved quotes to create an order.
            </p>
            <Link href="/customer/quotes">
              <Button variant="outline" size="sm" className="mt-4 font-bold">
                VIEW APPROVED QUOTES
              </Button>
            </Link>
          </div>
        ) : (
          <div className="text-xs" data-cy="orders-list">
            <div className={`hidden ${COLUMNS} px-4 py-3.5 bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#6B7280] uppercase tracking-wider font-bold`}>
              <span>Order Number</span>
              <span>Product</span>
              <span>Order Date</span>
              <span>Order Status</span>
              <span>Payment Status</span>
              <span className="text-right">Total Amount</span>
              <span className="sr-only">Details</span>
            </div>

            <ul className="divide-y divide-[#E5E7EB] text-[#111111] font-medium">
              {orders.map((ord) => {
                const expanded = expandedOrderId === ord.id;
                const detail = details[ord.id];
                const panelId = `order-panel-${ord.id}`;
                const firstItem = ord.items?.[0];
                const totalQty = (ord.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0);
                // The product's own catalog image; the customer's design preview is the fallback
                const productImage = firstItem?.product?.images?.[0] || ord.previewFrontUrl || ord.artworkUrl;
                const Arrow = expanded ? ChevronUp : ChevronDown;

                return (
                  <li key={ord.id} data-cy={`order-row-${ord.orderNumber}`} data-expanded={expanded}>
                    {/* The whole row toggles its details. It is a div (not a link): no navigation. */}
                    <div
                      role="button"
                      tabIndex={0}
                      aria-expanded={expanded}
                      aria-controls={panelId}
                      data-cy="order-row-toggle"
                      onClick={() => toggleOrder(ord.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleOrder(ord.id);
                        }
                      }}
                      className={`${COLUMNS} flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-4 cursor-pointer transition-colors outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#3B6FEB] ${
                        expanded ? 'bg-[#F5F7FF]' : 'hover:bg-[#F9FAFB]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 font-mono font-bold" data-cy="order-number-cell">
                        <span className="truncate">{ord.orderNumber}</span>
                      </div>

                      <div className="order-last md:order-none basis-full md:basis-auto min-w-0 flex items-center gap-3 text-[#374151]" data-cy="order-product-cell">
                        <span className="w-11 h-11 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] overflow-hidden shrink-0 flex items-center justify-center">
                          {productImage ? (
                            <img
                              src={productImage}
                              alt={firstItem?.product?.name || 'Product'}
                              loading="lazy"
                              data-cy="order-product-image"
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <Package className="w-5 h-5 text-gray-300" aria-label="No product image" />
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-[#111111]">{firstItem?.product?.name || 'Custom Merchandise'}</span>
                          {totalQty > 0 && (
                            <span className="text-[11px] text-[#6B7280]">
                              {totalQty} pcs{(ord.items?.length || 0) > 1 ? ` · ${ord.items!.length} items` : ''}
                            </span>
                          )}
                        </span>
                      </div>

                      <span className="text-[#6B7280] ml-auto md:ml-0">{new Date(ord.createdAt).toLocaleDateString('en-IN')}</span>

                      <span data-cy="order-status-cell">
                        <StatusBadge status={ord.status} />
                      </span>
                      <span data-cy="payment-status-cell">
                        <StatusBadge status={ord.paymentStatus} />
                      </span>

                      <span className="font-mono font-bold md:text-right ml-auto md:ml-0" data-cy="order-total-cell">
                        ₹{ord.totalAmount?.toLocaleString('en-IN')}
                      </span>

                      <span
                        className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 md:justify-self-end ${
                          expanded ? 'bg-[#3B6FEB] border-[#3B6FEB] text-white' : 'bg-white border-[#E5E7EB] text-[#374151]'
                        }`}
                        data-cy={expanded ? 'order-arrow-up' : 'order-arrow-down'}
                        aria-hidden="true"
                      >
                        <Arrow className="w-4 h-4" />
                      </span>
                    </div>

                    {expanded && (
                      <div id={panelId} data-cy="order-panel" className="px-3 sm:px-4 py-4 bg-[#F8F9FC] border-t border-[#E5E7EB]">
                        {detail?.status === 'ready' ? (
                          <CustomerOrderDetails order={detail.order} fallbackPhone={storedPhone} />
                        ) : detail?.status === 'error' ? (
                          <div
                            role="alert"
                            data-cy="order-panel-error"
                            className="flex flex-wrap items-center gap-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold"
                          >
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span className="flex-1 min-w-[160px]">We couldn&apos;t load this order&apos;s details. Please try again.</span>
                            <Button variant="outline" size="sm" className="gap-1.5 text-xs font-bold" onClick={() => loadDetail(ord.id)}>
                              <RefreshCw className="w-3.5 h-3.5" /> TRY AGAIN
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-3" data-cy="order-panel-loading" aria-busy="true">
                            <div className="h-5 w-40 bg-gray-200 animate-pulse rounded" />
                            <div className="h-24 w-full bg-gray-100 animate-pulse rounded-xl" />
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </Card>
    </div>
  );
}
