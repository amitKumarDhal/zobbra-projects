'use client';

import React from 'react';
import { Building2, Mail, Phone, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function AdminCustomersPage() {
  const companies = [
    {
      id: '1',
      name: 'Acme Technologies Pvt Ltd',
      gstin: '21ABCDE1234F1Z5',
      contact: 'Rahul Mishra (HR Lead)',
      email: 'client@acme.com',
      phone: '+91 99370 98765',
      city: 'Bhubaneswar, Odisha',
      totalOrders: 3,
    },
    {
      id: '2',
      name: 'Zepto Logistics India Pvt Ltd',
      gstin: '27AAACZ9999C1Z9',
      contact: 'Siddharth Rao (Operations)',
      email: 'merch@zepto.in',
      phone: '+91 98200 11223',
      city: 'Mumbai, Maharashtra',
      totalOrders: 8,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Customer Management (CRM)</h1>
          <p className="text-xs text-slate-500 font-semibold">Corporate clients, GST registration numbers & order history.</p>
        </div>
        <Button variant="secondary" className="gap-2">
          <Plus className="w-4 h-4" /> ADD NEW COMPANY
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 custom-shadow overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
            <tr>
              <th className="p-4">Company Name</th>
              <th className="p-4">GSTIN</th>
              <th className="p-4">Primary Contact</th>
              <th className="p-4">Location</th>
              <th className="p-4">Total Orders</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {companies.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="p-4 font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" /> {c.name}
                </td>
                <td className="p-4 font-mono font-bold text-slate-800">{c.gstin}</td>
                <td className="p-4 space-y-0.5">
                  <p className="font-bold text-slate-900">{c.contact}</p>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1"><Mail className="w-3 h-3" /> {c.email}</p>
                </td>
                <td className="p-4">{c.city}</td>
                <td className="p-4 font-bold text-blue-600">{c.totalOrders} Orders</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
