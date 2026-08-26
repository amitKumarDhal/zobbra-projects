'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Truck,
  Package,
  Clock,
  ArrowLeft,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  Building2,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { API_URL } from '@/lib/api';
import { buildWhatsAppUrl } from '@/lib/whatsapp';

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

export default function CustomerTrackingPage() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('Customer');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const uStr = localStorage.getItem('user') || localStorage.getItem('zobra_user');
      if (uStr) {
        try {
          const u = JSON.parse(uStr);
          if (u.name) setUserName(u.name);
          if (u.phone) setUserPhone(u.phone);
        } catch (_err) {
          // ignore
        }
      }
    }

    const fetchOrders = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('zobra_token') : null;
        const res = await fetch(`${API_URL}/orders?pageSize=5`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const data = await res.json();
        if (res.ok && data.success && Array.isArray(data.orders || data.data)) {
          setOrders(data.orders || data.data);
        }
      } catch (err) {
        console.error('Failed to load customer orders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const whatsappMessage = `Hello ${userName},

This is ZOBBRA Sales regarding shipment updates for your active orders.

We are coordinating dispatch and logistics for your production orders.

Thank you,
ZOBBRA Team`;

  const whatsappUrl = userPhone
    ? buildWhatsAppUrl(userPhone, whatsappMessage)
    : buildWhatsAppUrl('919124449666', whatsappMessage);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* 1. PAGE HEADER */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#EEF2FF] border border-[#C7D2FE] rounded-full text-xs font-bold text-[#3B6FEB]">
          <Sparkles className="w-3.5 h-3.5" /> COMING SOON
        </div>
        <h1 className="text-3xl sm:text-4xl font-heading font-black text-[#111111] tracking-tight">
          Shipment Tracking
        </h1>
        <p className="text-xs sm:text-sm text-[#6B7280] max-w-xl font-medium">
          Live shipment tracking will be available soon.
        </p>
      </div>

      {/* 2. COMING SOON CARD */}
      <Card className="bg-white border-[#E5E7EB] p-8 sm:p-10 rounded-2xl shadow-sm space-y-6 text-center">
        <div className="w-20 h-20 bg-[#EEF2FF] text-[#3B6FEB] rounded-3xl flex items-center justify-center mx-auto border border-[#C7D2FE] shadow-sm">
          <Truck className="w-10 h-10" />
        </div>

        <div className="space-y-2 max-w-md mx-auto">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#3B6FEB] bg-[#EEF2FF] px-3 py-1 rounded-full">
            SHIPMENT TRACKING • COMING SOON
          </div>
          <h2 className="text-2xl sm:text-3xl font-heading font-black text-[#111111]">
            Real-Time Courier Tracking
          </h2>
          <p className="text-sm text-[#4B5563] leading-relaxed">
            Track your ZOBBRA orders from dispatch to delivery with real-time courier updates.
          </p>
          <p className="text-xs text-[#6B7280] leading-relaxed pt-1">
            Courier tracking integration is currently under development. In the meantime, our logistics team coordinates order dispatch and delivers tracking slips via WhatsApp and email.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/customer/orders" data-cy="back-to-orders-btn">
            <Button
              variant="primary"
              className="w-full sm:w-auto px-6 py-3 font-bold flex items-center justify-center gap-2 rounded-xl"
            >
              <ArrowLeft className="w-4 h-4" /> BACK TO MY ORDERS
            </Button>
          </Link>
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-cy="tracking-whatsapp-btn"
              className="w-full sm:w-auto px-6 py-3 font-bold bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl shadow-sm transition-colors text-sm flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4" /> CONTACT SALES ON WHATSAPP
            </a>
          )}
        </div>
      </Card>

      {/* 3. REAL PRODUCTION & ORDER STATUS SECTION (From Database) */}
      {!loading && orders.length > 0 && (
        <Card className="bg-white border-[#E5E7EB] p-6 sm:p-8 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6]">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-[#3B6FEB]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                Active Production Orders
              </h3>
            </div>
            <Link
              href="/customer/orders"
              className="text-xs font-bold text-[#3B6FEB] hover:underline flex items-center gap-1"
            >
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-[#E5E7EB]">
            {orders.slice(0, 3).map((ord) => (
              <div key={ord.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#111111] text-sm">{ord.orderNumber}</span>
                    <StatusBadge status={ord.status} />
                  </div>
                  <p className="text-[#6B7280] text-[11px] mt-0.5">
                    Placed on {new Date(ord.createdAt).toLocaleDateString('en-IN')} • Amount: ₹{ord.totalAmount.toLocaleString('en-IN')}
                  </p>
                </div>
                <Link href={`/customer/orders/${ord.id}`}>
                  <Button variant="outline" size="sm" className="font-bold border-[#D1D5DB] text-xs">
                    Order Details
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 4. LOGISTICS & DISPATCH GUARANTEE */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[#374151]">
        <div className="p-4 bg-white border border-[#E5E7EB] rounded-xl flex items-start gap-3 shadow-sm">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-[#111111]">100% Quality Inspected</h4>
            <p className="text-[#6B7280] text-[11px] mt-0.5">Every unit undergoes strict QC before packing and dispatch.</p>
          </div>
        </div>
        <div className="p-4 bg-white border border-[#E5E7EB] rounded-xl flex items-start gap-3 shadow-sm">
          <Clock className="w-5 h-5 text-[#3B6FEB] shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-[#111111]">Direct WhatsApp Updates</h4>
            <p className="text-[#6B7280] text-[11px] mt-0.5">Dispatch slips & docket numbers shared directly via WhatsApp.</p>
          </div>
        </div>
        <div className="p-4 bg-white border border-[#E5E7EB] rounded-xl flex items-start gap-3 shadow-sm">
          <Building2 className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-[#111111]">Doorstep Delivery</h4>
            <p className="text-[#6B7280] text-[11px] mt-0.5">Pan-India air & surface express delivery to your facility.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
