'use client';

import React from 'react';
import { Globe, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function AdminCMSPage() {
  const cmsItems = [
    { type: 'TESTIMONIAL', title: 'Outstanding Quality & Speedy Turnaround!', author: 'Rahul Mishra @ Acme Tech' },
    { type: 'FAQ', title: 'What is the minimum order quantity (MOQ)?', author: 'System' },
    { type: 'BLOG', title: 'Complete Guide to Corporate Swag & Merch Branding in 2026', author: 'Zobra Editorial' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">CMS & Public Content</h1>
          <p className="text-xs text-slate-500 font-semibold">Manage homepage banners, blogs, customer testimonials & FAQs.</p>
        </div>
        <Button variant="secondary" className="gap-2">
          <Plus className="w-4 h-4" /> ADD CONTENT
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 custom-shadow overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
            <tr>
              <th className="p-4">Type</th>
              <th className="p-4">Title</th>
              <th className="p-4">Author</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {cmsItems.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="p-4 font-bold text-blue-600">{item.type}</td>
                <td className="p-4 font-bold text-slate-900">{item.title}</td>
                <td className="p-4 text-slate-500">{item.author}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
