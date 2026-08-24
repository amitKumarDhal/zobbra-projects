'use client';

import React from 'react';
import { Settings, Shield, Mail, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900">System & Company Settings</h1>
        <p className="text-xs text-slate-500 font-semibold">Configure GST details, Cloudinary image upload & Resend email integration.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 custom-shadow space-y-6">
        <h3 className="font-bold text-slate-900 text-sm uppercase">1. Company & GST Configuration</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Company Name</label>
            <input type="text" defaultValue="Zobra Prints & Merchandise" className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">GSTIN Number</label>
            <input type="text" defaultValue="21ABCDE1234F1Z5" className="w-full px-3 py-2 border rounded-lg text-sm font-mono" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Registered Address</label>
          <input type="text" defaultValue="Plot 402, Fortune Tower, District Center, Bhubaneswar, Odisha - 751012" className="w-full px-3 py-2 border rounded-lg text-sm" />
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 custom-shadow space-y-6">
        <h3 className="font-bold text-slate-900 text-sm uppercase">2. Integrations</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-3">
              <ImageIcon className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-bold text-xs text-slate-900">Cloudinary Asset Storage</p>
                <p className="text-[11px] text-slate-500">Configured: demo_zobra</p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-600">CONNECTED</span>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-indigo-600" />
              <div>
                <p className="font-bold text-xs text-slate-900">Resend Email Dispatch API</p>
                <p className="text-[11px] text-slate-500">For quote PDFs & shipment notifications</p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-600">ACTIVE</span>
          </div>
        </div>
      </div>

      <Button variant="secondary" className="py-3 px-8 font-bold">SAVE SETTINGS</Button>
    </div>
  );
}
