'use client';

import React from 'react';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export default function ContactPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div>
        <Badge variant="default" className="mb-2">CONTACT</Badge>
        <h1 className="text-3xl font-black text-white">Get in Touch</h1>
        <p className="text-slate-400 text-xs mt-1">Have custom order inquiries or need a corporate catalog?</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-slate-900 border-slate-800 p-8 space-y-4">
          <h2 className="font-bold text-white text-lg">Send Message</h2>
          <form className="space-y-4 text-xs" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="block font-bold text-slate-400 uppercase mb-1">Company / Your Name</label>
              <input type="text" placeholder="Acme Tech" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none" />
            </div>
            <div>
              <label className="block font-bold text-slate-400 uppercase mb-1">Email Address</label>
              <input type="email" placeholder="rahul@acme.com" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none" />
            </div>
            <div>
              <label className="block font-bold text-slate-400 uppercase mb-1">Message</label>
              <textarea rows={4} placeholder="Describe your merch requirement..." className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none"></textarea>
            </div>
            <Button variant="default" className="w-full font-bold">SEND MESSAGE</Button>
          </form>
        </Card>

        <Card className="bg-slate-900 border-slate-800 p-8 space-y-6 text-xs text-slate-300">
          <h2 className="font-bold text-white text-lg">Office & Support</h2>
          <div className="space-y-4">
            <p className="flex items-center gap-3"><MapPin className="w-5 h-5 text-blue-400" /> Plot 402, Fortune Tower, District Center, Bhubaneswar, Odisha - 751012</p>
            <p className="flex items-center gap-3"><Phone className="w-5 h-5 text-blue-400" /> +91 91244 96665</p>
            <p className="flex items-center gap-3"><Mail className="w-5 h-5 text-blue-400" /> hello@zobbra.com</p>
            <p className="flex items-center gap-3"><Clock className="w-5 h-5 text-blue-400" /> Mon - Sat (10:00 AM - 7:00 PM IST)</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
