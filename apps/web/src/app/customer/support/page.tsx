'use client';

import React, { useState } from 'react';
import { Phone, Mail, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { StatusBadge } from '@/components/ui/status-badge';

export default function CustomerSupportPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const tickets = [
    { id: 'TCK-551', subject: 'Change Print Placement for Order #ORD-5001', status: 'IN_PROGRESS', date: '05 Aug 2026' },
    { id: 'TCK-402', subject: 'GST ITC Invoice Copy Request', status: 'COMPLETED', date: '20 Jul 2026' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EEF2FF] text-[#3B6FEB] uppercase tracking-wider mb-2">
            CLIENT HELP
          </div>
          <h1 className="text-3xl sm:text-4xl font-heading font-black text-[#111111] tracking-tight">
            Customer Support
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-1 font-medium">
            Contact your dedicated account manager or track ongoing support tickets.
          </p>
        </div>
        <Button type="button" data-cy="submit-ticket-cta" variant="primary" size="sm" className="gap-2 font-bold" onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4" /> SUBMIT NEW TICKET
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="bg-white border-[#E5E7EB] p-6 space-y-2 shadow-sm">
          <Phone className="w-6 h-6 text-[#3B6FEB]" />
          <h3 className="font-heading font-bold text-base text-[#111111]">Dedicated Account Manager</h3>
          <p className="text-xs text-[#6B7280]">+91 91244 96665 • Mon - Sat (10 AM - 7 PM IST)</p>
        </Card>
        <Card className="bg-white border-[#E5E7EB] p-6 space-y-2 shadow-sm">
          <Mail className="w-6 h-6 text-[#3B6FEB]" />
          <h3 className="font-heading font-bold text-base text-[#111111]">Priority Email Desk</h3>
          <p className="text-xs text-[#6B7280]">support@zobbra.com • Average Response &lt; 2 Hours</p>
        </Card>
      </div>

      <Card className="bg-white border-[#E5E7EB] p-6 space-y-4 shadow-sm">
        <h3 className="font-heading font-bold text-lg text-[#111111]">My Support Tickets</h3>
        <div className="space-y-3">
          {tickets.map((t) => (
            <div key={t.id} className="p-4 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] flex items-center justify-between text-xs">
              <div>
                <span className="font-mono font-bold text-[#3B6FEB]">{t.id}</span>
                <h4 className="font-bold text-[#111111] text-xs sm:text-sm mt-0.5">{t.subject}</h4>
                <span className="text-[11px] text-[#6B7280]">Opened on {t.date}</span>
              </div>
              <StatusBadge status={t.status} />
            </div>
          ))}
        </div>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Submit Support Ticket">
        {submitted ? (
          <div className="text-center py-6 space-y-3">
            <h4 className="text-lg font-heading font-bold text-[#111111]">Ticket Submitted!</h4>
            <p className="text-xs text-[#6B7280]">Ticket #TCK-552 created. Your account manager will get back shortly.</p>
            <Button variant="primary" onClick={() => { setSubmitted(false); setModalOpen(false); }}>Close</Button>
          </div>
        ) : (
          <form className="space-y-4 text-xs" onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}>
            <div className="space-y-1">
              <label className="block font-bold text-[#6B7280] uppercase">Subject</label>
              <input
                type="text"
                required
                placeholder="Issue description..."
                className="w-full px-3.5 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-[#111111] focus:outline-none focus:border-[#3B6FEB] focus:bg-white font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="block font-bold text-[#6B7280] uppercase">Details</label>
              <textarea
                rows={4}
                required
                placeholder="Describe your request..."
                className="w-full px-3.5 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-[#111111] focus:outline-none focus:border-[#3B6FEB] focus:bg-white font-medium"
              />
            </div>
            <Button variant="primary" className="w-full font-bold">SUBMIT TICKET</Button>
          </form>
        )}
      </Modal>
    </div>
  );
}
