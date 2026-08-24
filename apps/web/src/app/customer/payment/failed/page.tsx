'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { XCircle, RefreshCw, ArrowLeft, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

function PaymentFailedContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams?.get('orderId');
  const reason = searchParams?.get('reason') || 'Transaction was declined or cancelled';

  return (
    <Card className="bg-white border-[#E5E7EB] p-8 max-w-lg w-full rounded-2xl shadow-xl text-center space-y-6">
      <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto border border-rose-100 shadow-sm">
        <XCircle className="w-10 h-10" />
      </div>

      <div>
        <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-full uppercase tracking-wider">
          RAZORPAY TEST MODE PAYMENT FAILED
        </span>
        <h1 className="text-2xl sm:text-3xl font-heading font-black text-[#111111] mt-3">Payment Failed</h1>
        <p className="text-xs text-[#6B7280] mt-1">Your payment could not be completed. The order remains PAYMENT PENDING.</p>
      </div>

      <div className="bg-rose-50/50 p-4 rounded-xl text-xs text-rose-800 border border-rose-200 text-left flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Reason for failure:</p>
          <p className="text-[11px] mt-0.5 text-rose-700">{reason}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        {orderId ? (
          <Link href={`/customer/orders/${orderId}`} className="flex-1">
            <Button data-cy="try-again-btn" variant="primary" className="w-full font-bold">
              <RefreshCw className="w-4 h-4 mr-1.5" /> TRY AGAIN
            </Button>
          </Link>
        ) : (
          <Link href="/customer/orders" className="flex-1">
            <Button variant="primary" className="w-full font-bold">
              BACK TO ORDERS
            </Button>
          </Link>
        )}
        <Link href="/customer/orders" className="flex-1">
          <Button variant="outline" className="w-full font-bold">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> BACK TO ORDERS
          </Button>
        </Link>
      </div>
    </Card>
  );
}

export default function PaymentFailedPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FC] flex items-center justify-center p-6">
      <Suspense fallback={<div className="text-center p-8 font-bold text-[#111111]">Loading Payment Status...</div>}>
        <PaymentFailedContent />
      </Suspense>
    </div>
  );
}
