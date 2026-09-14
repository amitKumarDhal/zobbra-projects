'use client';

import React, { Suspense } from 'react';
import { Loader2, PlusCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCustomerUser } from '@/hooks/useCustomerUser';
import SimplifiedQuoteForm from '@/components/shared/SimplifiedQuoteForm';

function CustomerCreateQuoteContent() {
  const router = useRouter();
  const { user } = useCustomerUser();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#111111] flex items-center gap-2">
          <PlusCircle className="w-6 h-6 text-[#3B6FEB]" />
          Create New Quote
        </h1>
      </div>

      <div className="max-w-3xl bg-white border border-[#E5E7EB] p-6 sm:p-10 shadow-sm rounded-2xl">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-[#111111]">Quote Requirements</h2>
          <p className="text-sm text-[#6B7280]">
            Submit your requirements below and our sales team will generate your customized pricing.
          </p>
        </div>

        <SimplifiedQuoteForm 
          isCustomer={true} 
          initialData={{ 
            name: user?.name, 
            phone: user?.phone 
          }}
          onSuccess={() => {
            // Wait 2.5s to let user see success message then redirect
            setTimeout(() => {
              router.push('/customer/quotes');
            }, 2500);
          }}
        />
      </div>
    </div>
  );
}

export default function CreateQuoteWizardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[400px] flex flex-col items-center justify-center text-gray-500 py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#3B6FEB] mb-3" />
          <p className="text-sm font-medium">Loading...</p>
        </div>
      }
    >
      <CustomerCreateQuoteContent />
    </Suspense>
  );
}
