'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Package,
  ShieldCheck,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { API_URL } from '@/lib/api';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  quoteId?: string;
  status: string;
  paymentStatus: string;
  subtotal: number;
  gstTotal: number;
  totalAmount: number;
  createdAt: string;
  customer?: { name: string; email: string; phone?: string };
  company?: { name: string; gstin?: string; address?: string };
  items?: Array<{
    id: string;
    product?: { name: string };
    printType: string;
    color: string;
    size: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  payments?: Array<{
    id: string;
    razorpayPaymentId?: string;
    razorpayOrderId?: string;
    amount: number;
    status: string;
    createdAt: string;
  }>;
}

export default function CustomerOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [processingPayment, setProcessingPayment] = useState<boolean>(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const fetchOrderDetail = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('zobra_token') : null;
      const res = await fetch(`${API_URL}/orders/${id}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (res.ok && data.success && data.order) {
        setOrder(data.order);
      }
    } catch (err) {
      console.error('Failed to load order detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchOrderDetail();
  }, [id]);

  const openWhatsApp = async () => {
    if (!order?.quoteId) return alert('No quote attached to this order for WhatsApp link generation.');
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

  const isPaid = order.paymentStatus === 'PAID';

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header */}
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

        {/* Action Button */}
        {!isPaid ? (
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              size="lg"
              disabled
              className="gap-2 font-bold px-6 shadow-sm opacity-60 cursor-not-allowed"
            >
              <CreditCard className="w-5 h-5" />
              ONLINE PAYMENT — COMING SOON
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={openWhatsApp}
              className="gap-2 font-bold px-6 shadow-md bg-[#25D366] hover:bg-[#128C7E] text-white border-none"
            >
              <MessageSquare className="w-5 h-5" />
              CONTACT SALES ON WHATSAPP
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2 rounded-xl text-xs font-bold shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>PAYMENT COMPLETED & VERIFIED</span>
          </div>
        )}
      </div>

      {paymentError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{paymentError}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Items & Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white border-[#E5E7EB] p-6 shadow-sm">
            <h2 className="text-base font-heading font-bold text-[#111111] mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 text-[#3B6FEB]" /> Order Items
            </h2>
            <div className="divide-y divide-[#E5E7EB]">
              {order.items?.map((item) => (
                <div key={item.id} className="py-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-[#111111] text-sm">{item.product?.name || 'Custom Merchandise'}</h3>
                    <p className="text-xs text-[#6B7280] mt-1">
                      Color: <span className="font-semibold text-[#111111]">{item.color}</span> | Size: <span className="font-semibold text-[#111111]">{item.size}</span> | Print: <span className="font-semibold text-[#111111]">{item.printType}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-[#111111] text-sm">₹{item.totalPrice.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-[#6B7280]">{item.quantity} Pcs @ ₹{item.unitPrice}/pc</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Payment Activity */}
          {order.payments && order.payments.length > 0 && (
            <Card className="bg-white border-[#E5E7EB] p-6 shadow-sm">
              <h2 className="text-base font-heading font-bold text-[#111111] mb-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Payment Audit Trail
              </h2>
              <div className="space-y-2.5">
                {order.payments.map((p) => (
                  <div key={p.id} className="p-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs flex justify-between items-center">
                    <div>
                      <p className="font-mono font-bold text-[#111111]">Payment ID: {p.razorpayPaymentId || p.razorpayOrderId}</p>
                      <p className="text-[#6B7280] text-[11px] mt-0.5">{new Date(p.createdAt).toLocaleString('en-IN')}</p>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right Col: Price Summary Card */}
        <div>
          <Card className="bg-white border-[#E5E7EB] p-6 shadow-sm space-y-4">
            <h2 className="text-base font-heading font-bold text-[#111111] pb-3 border-b border-[#E5E7EB]">Payment Summary</h2>
            
            <div className="space-y-2.5 text-xs text-[#6B7280]">
              <div className="flex justify-between">
                <span>Merchandise Subtotal</span>
                <span className="font-mono font-bold text-[#111111]">₹{order.subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>GST (5%)</span>
                <span className="font-mono font-bold text-[#111111]">₹{order.gstTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-[#E5E7EB] text-sm font-bold text-[#111111]">
                <span>Total Amount</span>
                <span className="font-mono font-bold text-base text-[#111111]" data-cy="order-total-amount">
                  ₹{order.totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {!isPaid && (
              <div className="mt-4 space-y-3">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                   <p className="text-xs text-amber-800 font-medium flex gap-2">
                     <AlertCircle className="w-4 h-4 shrink-0" />
                     Payment will be arranged with our sales team after order confirmation.
                   </p>
                </div>
                <Button
                  data-cy="contact-sales-btn"
                  variant="primary"
                  onClick={openWhatsApp}
                  className="w-full font-bold py-3 shadow-sm bg-[#25D366] hover:bg-[#128C7E] text-white border-none flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" /> CONTACT SALES ON WHATSAPP
                </Button>
                <Button
                  variant="outline"
                  disabled
                  className="w-full font-bold py-3 shadow-sm opacity-60 cursor-not-allowed"
                >
                  ONLINE PAYMENT — COMING SOON
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
