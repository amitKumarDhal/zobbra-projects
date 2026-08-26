'use client';

import React from 'react';
import Link from 'next/link';
import {
  Bell,
  Sparkles,
  ArrowLeft,
  ShoppingBag,
  FileText,
  MessageSquare,
  CreditCard,
  Truck,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AdminNotificationsPage() {
  const adminAlertCategories = [
    {
      icon: MessageSquare,
      title: 'New Inquiries & Leads',
      desc: 'Instant notifications when prospective B2B clients submit merchandise quote requests.',
    },
    {
      icon: FileText,
      title: 'Quote Approvals & Revisions',
      desc: 'Alerts when customers approve quotations, request changes, or confirm artwork mockups.',
    },
    {
      icon: CreditCard,
      title: 'Payments & Revenue',
      desc: 'Real-time alerts for recorded manual bank transfers, online payments, and GST invoicing.',
    },
    {
      icon: ShoppingBag,
      title: 'Order Milestones',
      desc: 'Updates across production stages, cutting, printing, embroidery, QC, and packaging.',
    },
    {
      icon: Truck,
      title: 'Dispatch & Logistics',
      desc: 'Notifications when orders are dispatched, AWB numbers generated, and packages delivered.',
    },
    {
      icon: Users,
      title: 'Customer Registrations',
      desc: 'Alerts when new corporate accounts or enterprise buyers register on the platform.',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* 1. PAGE HEADER */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#EEF2FF] border border-[#C7D2FE] rounded-full text-xs font-bold text-[#3B6FEB]">
          <Sparkles className="w-3.5 h-3.5" /> COMING SOON
        </div>
        <h1 className="text-3xl sm:text-4xl font-heading font-black text-[#111111] tracking-tight">
          Admin Notification Center
        </h1>
        <p className="text-xs sm:text-sm text-[#6B7280] max-w-2xl font-medium">
          Real-time alerts for inquiries, quotes, orders, payments, production, and team activity will be available soon.
        </p>
      </div>

      {/* 2. COMING SOON MAIN CARD */}
      <Card className="bg-white border-[#E5E7EB] p-8 sm:p-10 rounded-2xl shadow-sm space-y-6 text-center">
        <div className="w-20 h-20 bg-[#EEF2FF] text-[#3B6FEB] rounded-3xl flex items-center justify-center mx-auto border border-[#C7D2FE] shadow-sm">
          <Bell className="w-10 h-10" />
        </div>

        <div className="space-y-2 max-w-lg mx-auto">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#3B6FEB] bg-[#EEF2FF] px-3 py-1 rounded-full">
            ADMIN ALERTS • COMING SOON
          </div>
          <h2 className="text-2xl sm:text-3xl font-heading font-black text-[#111111]">
            Real-Time Administrative Alerts
          </h2>
          <p className="text-sm text-[#4B5563] leading-relaxed">
            We're building real-time notifications to keep the management, sales, and operations teams fully synchronized.
          </p>
          <p className="text-xs text-[#6B7280] leading-relaxed pt-1">
            Real-time notification feeds, browser alerts, and automated operational triggers will be displayed here in a future release.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/dashboard" data-cy="back-to-dashboard-btn">
            <Button
              variant="primary"
              className="w-full sm:w-auto px-6 py-3 font-bold flex items-center justify-center gap-2 rounded-xl"
            >
              <ArrowLeft className="w-4 h-4" /> BACK TO DASHBOARD
            </Button>
          </Link>
          <Link href="/dashboard/orders" data-cy="admin-view-orders-btn">
            <Button
              variant="outline"
              className="w-full sm:w-auto px-6 py-3 font-bold border-[#D1D5DB] flex items-center justify-center gap-2 rounded-xl"
            >
              <ShoppingBag className="w-4 h-4 text-[#3B6FEB]" /> VIEW ORDERS
            </Button>
          </Link>
          <Link href="/dashboard/quotes" data-cy="admin-view-quotes-btn">
            <Button
              variant="outline"
              className="w-full sm:w-auto px-6 py-3 font-bold border-[#D1D5DB] flex items-center justify-center gap-2 rounded-xl"
            >
              <FileText className="w-4 h-4 text-[#3B6FEB]" /> VIEW QUOTES
            </Button>
          </Link>
        </div>
      </Card>

      {/* 3. FUTURE ADMIN EVENT ARCHITECTURE */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <CheckCircle2 className="w-4 h-4 text-[#3B6FEB]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
            Planned Operational Alert Categories
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {adminAlertCategories.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.title}
                className="p-5 bg-white border border-[#E5E7EB] rounded-2xl flex items-start gap-4 shadow-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-[#F8F9FC] text-[#3B6FEB] border border-[#E5E7EB] flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-heading font-bold text-sm text-[#111111]">{cat.title}</h4>
                  <p className="text-xs text-[#6B7280] leading-relaxed">{cat.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
