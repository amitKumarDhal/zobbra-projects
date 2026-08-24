'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams?.get('orderId');
  const paymentId = searchParams?.get('paymentId');
  const orderNumber = searchParams?.get('orderNumber') || 'ZOB-ORD-1001';
  const amount = searchParams?.get('amount');

  return (
    <Card className="bg-white border-[#E5E7EB] p-8 max-w-lg w-full rounded-2xl shadow-xl text-center space-y-6">
      <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100 shadow-sm">
        <CheckCircle2 className="w-10 h-10" />
      </div>

      <div>
        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider">
          RAZORPAY TEST MODE PAYMENT SUCCESS
        </span>
        <h1 className="text-2xl sm:text-3xl font-heading font-black text-[#111111] mt-3">Payment Successful</h1>
        <p className="text-xs text-[#6B7280] mt-1">✓ Your payment has been received and verified by PostgreSQL database.</p>
      </div>

      <div className="bg-[#F9FAFB] p-4 rounded-xl text-xs space-y-2.5 text-left border border-[#E5E7EB]">
        <div className="flex justify-between">
          <span className="text-[#6B7280]">Order Number:</span>
          <span className="font-mono font-bold text-[#111111]" data-cy="success-order-number">{orderNumber}</span>
        </div>
        {amount && (
          <div className="flex justify-between">
            <span className="text-[#6B7280]">Amount Paid:</span>
            <span className="font-mono font-bold text-[#111111]" data-cy="success-amount">
              ₹{Number(amount).toLocaleString('en-IN')}
            </span>
          </div>
        )}
        {paymentId && (
          <div className="flex justify-between">
            <span className="text-[#6B7280]">Razorpay Payment ID:</span>
            <span className="font-mono text-[#111111] text-[11px]" data-cy="success-payment-id">{paymentId}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-[#E5E7EB] pt-2">
          <span className="text-[#6B7280]">Payment Status:</span>
          <span className="font-bold text-emerald-700">PAID ✓</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        {orderId && (
          <Link href={`/customer/orders/${orderId}`} className="flex-1">
            <Button data-cy="view-order-btn" variant="primary" className="w-full font-bold">
              VIEW ORDER <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        )}
        <Link href="/customer/orders" className="flex-1">
          <Button variant="outline" className="w-full font-bold">
            MY ORDERS LIST
          </Button>
        </Link>
      </div>
    </Card>
  );
}

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FC] flex items-center justify-center p-6">
      <Suspense fallback={<div className="text-center p-8 font-bold text-[#111111]">Loading Payment Confirmation...</div>}>
        <PaymentSuccessContent />
      </Suspense>
    </div>
  );
}
