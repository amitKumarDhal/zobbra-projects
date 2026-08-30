import React from 'react';
import { CreditCard, Mail } from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';

export default function PaymentEmailSettings({ settings }: { settings: any }) {
  return (
    <div className="space-y-6">
      {/* Payment Settings */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB]">
        <div className="p-6 border-b border-[#E5E7EB] flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#111111]">Payment Settings</h2>
            <p className="text-sm text-[#6B7280]">Manage payment gateways and methods</p>
          </div>
        </div>
        
        <div className="p-6">
          <div className="flex items-start justify-between border border-[#E5E7EB] rounded-xl p-5">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-[#02042B] rounded-lg flex items-center justify-center text-white font-black italic text-xs">
                RZP
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#111111] flex items-center gap-2">
                  Razorpay
                  {settings.razorpayConfigured && (
                     <StatusBadge status="ACTIVE" />
                  )}
                </h3>
                <p className="text-xs text-[#6B7280] mt-1">Accept payments via UPI, Credit/Debit Cards, and Netbanking.</p>
                
                {settings.razorpayConfigured && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg inline-block">
                    <p className="text-xs text-[#374151] font-mono">Key ID: rzp_test_****1234</p>
                  </div>
                )}
              </div>
            </div>
            <button className="text-[#3B6FEB] text-sm font-bold hover:underline">
              {settings.razorpayConfigured ? 'Test Connection' : 'Configure'}
            </button>
          </div>
        </div>
      </div>

      {/* Email Settings */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB]">
        <div className="p-6 border-b border-[#E5E7EB] flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#111111]">Email Settings</h2>
            <p className="text-sm text-[#6B7280]">Configure system email delivery</p>
          </div>
        </div>
        
        <div className="p-6">
          <div className="flex items-start justify-between border border-[#E5E7EB] rounded-xl p-5">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center text-white font-bold text-lg">
                R
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#111111] flex items-center gap-2">
                  Resend
                  {settings.resendConfigured ? (
                     <StatusBadge status="ACTIVE" />
                  ) : (
                     <StatusBadge status="FAILED" label="Not Configured" />
                  )}
                </h3>
                <p className="text-xs text-[#6B7280] mt-1">Send transactional emails and invoices.</p>
                
                <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2">
                   <div>
                     <p className="text-[10px] text-[#6B7280] uppercase font-bold">Sender Email</p>
                     <p className="text-xs text-[#111111] font-medium mt-0.5">no-reply@zobra.com</p>
                   </div>
                   <div>
                     <p className="text-[10px] text-[#6B7280] uppercase font-bold">Sender Name</p>
                     <p className="text-xs text-[#111111] font-medium mt-0.5">ZOBBRA Admin</p>
                   </div>
                </div>
              </div>
            </div>
            <button 
              className={`text-sm font-bold hover:underline ${settings.resendConfigured ? 'text-[#3B6FEB]' : 'text-gray-400 cursor-not-allowed'}`}
              disabled={!settings.resendConfigured}
            >
              Send Test Email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
