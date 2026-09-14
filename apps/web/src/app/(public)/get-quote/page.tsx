'use client';

import React, { Suspense } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import SimplifiedQuoteForm from '@/components/shared/SimplifiedQuoteForm';

function GetQuotePageContent() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 bg-[#F8F9FC]">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#EEF2FF] border border-[#C7D2FE] rounded-full text-xs font-bold text-[#3B6FEB]">
          <Sparkles className="w-3.5 h-3.5" /> B2B CUSTOM MERCHANDISE QUOTE
        </div>
        <h1 className="text-4xl lg:text-[44px] font-heading font-black text-[#111111] leading-tight">
          Request Merchandise Quote
        </h1>
        <p className="text-[#6B7280] text-sm max-w-xl mx-auto">
          Tell us what you need. Our team will review your requirements and provide bulk pricing and a digital proof.
        </p>
      </div>

      <div className="bg-white border-[#E5E7EB] p-6 sm:p-10 shadow-sm rounded-2xl">
        <SimplifiedQuoteForm isCustomer={false} />
      </div>
    </div>
  );
}

export default function GetQuotePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[400px] flex flex-col items-center justify-center text-gray-500 py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#3B6FEB] mb-3" />
          <p className="text-sm font-medium">Loading quote configurator...</p>
        </div>
      }
    >
      <GetQuotePageContent />
    </Suspense>
  );
}
