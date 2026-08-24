'use client';

import React from 'react';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function ContactPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">GET IN TOUCH</span>
        <h1 className="text-4xl font-black text-slate-900">We'd Love to Hear From You</h1>
        <p className="text-slate-600 text-sm">Have a custom corporate order inquiry or need help with a quote? Contact our Bhubaneswar team.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 custom-shadow space-y-6">
          <h2 className="text-xl font-bold text-slate-900">Send Us a Message</h2>
          <form className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Your Name</label>
              <input type="text" required placeholder="Rahul Mishra" className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address</label>
              <input type="email" required placeholder="rahul@acme.com" className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Message</label>
              <textarea rows={4} required placeholder="Tell us about your requirement..." className="w-full px-3 py-2 border rounded-lg text-sm"></textarea>
            </div>
            <Button variant="secondary" className="w-full py-3 font-bold">SEND MESSAGE</Button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-8 rounded-3xl space-y-6">
            <h2 className="text-xl font-bold">Contact Information</h2>
            <div className="space-y-4 text-sm text-slate-300">
              <p className="flex items-center gap-3"><MapPin className="w-5 h-5 text-blue-400" /> Plot 402, Fortune Tower, District Center, Bhubaneswar, Odisha - 751012</p>
              <p className="flex items-center gap-3"><Phone className="w-5 h-5 text-blue-400" /> +91 91244 96665</p>
              <p className="flex items-center gap-3"><Mail className="w-5 h-5 text-blue-400" /> hello@zobbra.com</p>
              <p className="flex items-center gap-3"><Clock className="w-5 h-5 text-blue-400" /> Mon - Sat (10:00 AM - 7:00 PM IST)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
