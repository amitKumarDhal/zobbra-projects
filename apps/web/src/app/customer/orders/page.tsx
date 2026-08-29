'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { API_URL } from '@/lib/api';

interface CustomerOrder {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  paymentStatus: string;
  subtotal: number;
  gstTotal: number;
  totalAmount: number;
  company?: { name: string };
  customer?: { name: string };
}

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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
    fetchOrders();
  }, []);

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

      {/* Orders Table */}
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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#6B7280] uppercase tracking-wider font-bold">
                  <th className="p-4">Order Number</th>
                  <th className="p-4">Order Date</th>
                  <th className="p-4">Order Status</th>
                  <th className="p-4">Payment Status</th>
                  <th className="p-4 text-right">Total Amount</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] text-[#111111] font-medium">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-[#F9FAFB] transition-colors" data-cy={`order-row-${ord.orderNumber}`}>
                    <td className="p-4 font-mono font-bold text-[#111111]" data-cy="order-number-cell">
                      {ord.orderNumber}
                    </td>
                    <td className="p-4 text-[#6B7280]">{new Date(ord.createdAt).toLocaleDateString('en-IN')}</td>
                    <td className="p-4">
                      <StatusBadge status={ord.status} />
                    </td>
                    <td className="p-4" data-cy="payment-status-cell">
                      <StatusBadge status={ord.paymentStatus} />
                    </td>
                    <td className="p-4 font-mono font-bold text-right text-[#111111]" data-cy="order-total-cell">
                      ₹{ord.totalAmount?.toLocaleString('en-IN')}
                    </td>
                    <td className="p-4 text-center">
                      <Link href={`/customer/orders/${ord.id}`}>
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs font-bold" data-cy="order-pay-now-btn">
                          <ExternalLink className="w-3.5 h-3.5 text-[#3B6FEB]" /> VIEW ORDER
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
