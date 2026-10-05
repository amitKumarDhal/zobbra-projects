'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { buildWhatsAppUrl, getOrderWhatsAppMessage } from '@/lib/whatsapp';
import { CustomerOrderDetails, CustomerOrderDetail } from '@/components/orders/CustomerOrderDetails';
import { fetchCustomerOrder, getStoredCustomerPhone } from '@/lib/customerOrders';

/**
 * Direct link to a single order (kept for existing deep links, e.g. notifications and payment
 * pages). The My Orders list shows the same details inline instead of navigating here.
 */
export default function CustomerOrderDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [order, setOrder] = useState<CustomerOrderDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [storedPhone, setStoredPhone] = useState<string | null>(null);

  useEffect(() => {
    setStoredPhone(getStoredCustomerPhone());
    if (!id) return;
    let cancelled = false;
    fetchCustomerOrder(id)
      .then((data) => {
        if (!cancelled) setOrder(data);
      })
      .catch(() => {
        // Not found or not this customer's order: the "Order Not Found" state below is shown
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-200 animate-pulse rounded-lg" />
        <div className="h-64 w-full bg-gray-100 animate-pulse rounded-xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-12 text-center bg-white border border-[#E5E7EB] rounded-2xl shadow-sm">
        <h2 className="text-xl font-heading font-bold text-[#111111]">Order Not Found</h2>
        <Link href="/customer/orders">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Orders
          </Button>
        </Link>
      </div>
    );
  }

  const effectivePhone = order.customer?.phone || storedPhone;
  const whatsappUrl =
    order.paymentStatus !== 'PAID' && effectivePhone
      ? buildWhatsAppUrl(
          effectivePhone,
          getOrderWhatsAppMessage({
            customerName: order.customer?.name,
            orderNumber: order.orderNumber,
            totalAmount: order.totalAmount,
          })
        )
      : null;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/customer/orders" className="text-xs text-[#6B7280] hover:text-[#111111] flex items-center gap-1 font-bold mb-2 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> BACK TO MY ORDERS
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl sm:text-4xl font-heading font-black text-[#111111]">{order.orderNumber}</h1>
            <StatusBadge status={order.paymentStatus} />
          </div>
          <p className="text-xs text-[#6B7280] mt-1 font-medium">Order Placed on {new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
        </div>

        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-cy="contact-sales-header-btn"
            className="inline-flex items-center gap-2 font-bold px-6 py-2.5 shadow-md bg-[#25D366] hover:bg-[#128C7E] text-white border-none rounded-lg transition-colors text-sm"
          >
            <MessageSquare className="w-5 h-5" />
            CONTACT SALES ON WHATSAPP
          </a>
        )}
      </div>

      <CustomerOrderDetails order={order} fallbackPhone={storedPhone} />
    </div>
  );
}
