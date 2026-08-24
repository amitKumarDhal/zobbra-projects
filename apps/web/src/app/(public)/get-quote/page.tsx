'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';

export default function GetQuotePage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 bg-[#F8F9FC]">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#EEF2FF] border border-[#C7D2FE] rounded-full text-xs font-semibold text-[#3B6FEB]">
          INSTANT QUOTATION
        </div>
        <h1 className="text-4xl lg:text-[42px] font-heading font-black text-[#111111] leading-tight">Request Merchandise Quote</h1>
        <p className="text-[#6B7280] text-sm">Fill the form below to receive a custom bulk pricing quotation & 3D proof.</p>
      </div>

      <Card className="bg-white border-[#E5E7EB] p-8 shadow-sm">
        {submitted ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 bg-[#EEF2FF] text-[#3B6FEB] rounded-full flex items-center justify-center mx-auto text-2xl font-bold border border-[#C7D2FE]">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-heading font-bold text-[#111111]">Quote Request Submitted!</h3>
            <p className="text-[#6B7280] text-sm max-w-md mx-auto leading-relaxed">
              Thank you for inquiring with ZOBBRA Prints. Our sales team will get back to you within 24 hours.
            </p>
            <button onClick={() => setSubmitted(false)} className="px-6 py-2.5 bg-[#111111] hover:bg-[#000000] text-white text-sm font-semibold rounded-lg transition-colors mt-4">
              Submit Another Request
            </button>
          </div>
        ) : (
          <form className="space-y-5 text-sm" onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}>
            <div>
              <label className="block font-bold text-[#374151] mb-1.5">Company / Organization Name *</label>
              <input type="text" required placeholder="Acme Tech Pvt Ltd" className="w-full px-4 py-3 bg-white border border-[#D1D5DB] rounded-lg text-[#111111] outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] shadow-sm transition-all" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block font-bold text-[#374151] mb-1.5">Contact Name *</label>
                <input type="text" required placeholder="Rahul Mishra" className="w-full px-4 py-3 bg-white border border-[#D1D5DB] rounded-lg text-[#111111] outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] shadow-sm transition-all" />
              </div>
              <div>
                <label className="block font-bold text-[#374151] mb-1.5">Phone Number *</label>
                <input type="tel" required placeholder="+91 98765 43210" className="w-full px-4 py-3 bg-white border border-[#D1D5DB] rounded-lg text-[#111111] outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] shadow-sm transition-all" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block font-bold text-[#374151] mb-1.5">Category</label>
                <select className="w-full px-4 py-3 bg-white border border-[#D1D5DB] rounded-lg text-[#111111] outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] shadow-sm transition-all">
                  <option>Polo T-Shirts</option>
                  <option>Cotton Caps</option>
                  <option>Hoodies</option>
                  <option>Executive Backpacks</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-[#374151] mb-1.5">Estimated Quantity *</label>
                <input type="number" required defaultValue="100" min="20" className="w-full px-4 py-3 bg-white border border-[#D1D5DB] rounded-lg text-[#111111] outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] shadow-sm transition-all" />
              </div>
            </div>
            <div>
              <label className="block font-bold text-[#374151] mb-1.5">Customization Requirements</label>
              <textarea rows={3} placeholder="Mention print placement (Front/Back/Embroidery), deadline, etc." className="w-full px-4 py-3 bg-white border border-[#D1D5DB] rounded-lg text-[#111111] outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] shadow-sm transition-all"></textarea>
            </div>
            <button type="submit" className="w-full py-3.5 bg-[#111111] hover:bg-[#000000] text-white text-sm font-semibold rounded-lg shadow-sm transition-colors mt-2">
              SUBMIT QUOTE REQUEST
            </button>
          </form>
        )}
      </Card>
    </div>
  );
}
