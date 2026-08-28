'use client';

import React, { useState, useEffect } from 'react';
import { User, Building2, MapPin, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCustomerUser } from '@/hooks/useCustomerUser';

export default function CustomerProfilePage() {
  const { user, loading } = useCustomerUser();
  const [saved, setSaved] = useState(false);

  // Controlled form state — populated from auth once loaded
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [gstin, setGstin] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name ?? '');
      setEmail(user.email ?? '');
      setPhone(user.phone ?? '');
      setCompanyName(user.company?.name ?? '');
      setGstin(user.company?.gstin ?? '');
      setAddress(user.company?.address ?? '');
    }
  }, [user]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    // Update localStorage with the new name so all components reflect the change instantly
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('user') || localStorage.getItem('zobra_user');
        if (cached) {
          const parsed = JSON.parse(cached);
          const updated = {
            ...parsed,
            name,
            email,
            phone,
            company: parsed.company ? { ...parsed.company, name: companyName, gstin, address } : undefined,
          };
          localStorage.setItem('user', JSON.stringify(updated));
          localStorage.setItem('zobra_user', JSON.stringify(updated));
        }
      } catch {
        // ignore
      }
    }
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EEF2FF] text-[#3B6FEB] uppercase tracking-wider mb-2">
          COMPANY ACCOUNT
        </div>
        <h1 className="text-3xl sm:text-4xl font-heading font-black text-[#111111] tracking-tight">
          Company Profile &amp; Settings
        </h1>
        <p className="text-xs sm:text-sm text-[#6B7280] mt-1 font-medium">
          Manage B2B company GST registration, billing addresses, and account contacts.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Company & GST Details */}
        <Card className="bg-white border-[#E5E7EB] p-6 sm:p-8 space-y-4 shadow-sm">
          <h3 className="font-heading font-bold text-lg text-[#111111] flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#3B6FEB]" /> Company &amp; GST Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="block font-bold text-[#6B7280] uppercase">Company Registered Name</label>
              <input
                type="text"
                data-cy="profile-company-name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Your company name"
                className="w-full px-3.5 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-[#111111] font-medium focus:outline-none focus:border-[#3B6FEB] focus:bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="block font-bold text-[#6B7280] uppercase">GSTIN Number</label>
              <input
                type="text"
                data-cy="profile-gstin"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                placeholder="22AAAAA0000A1Z5"
                className="w-full px-3.5 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-[#111111] font-mono font-bold focus:outline-none focus:border-[#3B6FEB] focus:bg-white"
              />
            </div>
          </div>
        </Card>

        {/* Contact Person Details */}
        <Card className="bg-white border-[#E5E7EB] p-6 sm:p-8 space-y-4 shadow-sm">
          <h3 className="font-heading font-bold text-lg text-[#111111] flex items-center gap-2">
            <User className="w-5 h-5 text-[#3B6FEB]" /> Primary Contact Person
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <label className="block font-bold text-[#6B7280] uppercase">Full Name</label>
              <input
                type="text"
                data-cy="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full px-3.5 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-[#111111] font-medium focus:outline-none focus:border-[#3B6FEB] focus:bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="block font-bold text-[#6B7280] uppercase">Work Email</label>
              <input
                type="email"
                data-cy="profile-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-3.5 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-[#111111] font-medium focus:outline-none focus:border-[#3B6FEB] focus:bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="block font-bold text-[#6B7280] uppercase">Phone Number</label>
              <input
                type="tel"
                data-cy="profile-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-[#111111] font-medium focus:outline-none focus:border-[#3B6FEB] focus:bg-white"
              />
            </div>
          </div>
        </Card>

        {/* Shipping Address */}
        <Card className="bg-white border-[#E5E7EB] p-6 sm:p-8 space-y-4 shadow-sm">
          <h3 className="font-heading font-bold text-lg text-[#111111] flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#3B6FEB]" /> Default Delivery Address
          </h3>
          <div>
            <textarea
              rows={3}
              data-cy="profile-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Your registered delivery address"
              className="w-full px-3.5 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-xs text-[#111111] font-medium focus:outline-none focus:border-[#3B6FEB] focus:bg-white"
            />
          </div>
        </Card>

        <div className="flex items-center gap-4">
          <Button variant="primary" size="lg" className="font-bold px-8" data-cy="profile-save-btn">
            {saved ? <span className="flex items-center gap-2"><Check className="w-4 h-4" /> SAVED CHANGES</span> : 'SAVE PROFILE'}
          </Button>
        </div>
      </form>
    </div>
  );
}
