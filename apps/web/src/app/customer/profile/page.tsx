'use client';

import React, { useState, useEffect } from 'react';
import { User, Building2, MapPin, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCustomerUser } from '@/hooks/useCustomerUser';
import { API_URL } from '@/lib/api';

const ADDRESS_TYPES = ['Office', 'Home', 'Warehouse', 'Other'];

const fieldClass =
  'w-full px-3.5 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-[#111111] font-medium focus:outline-none focus:border-[#3B6FEB] focus:bg-white';
const labelClass = 'block font-bold text-[#6B7280] uppercase';

export default function CustomerProfilePage() {
  const { user, loading } = useCustomerUser();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Controlled form state — populated from auth once loaded
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [gstin, setGstin] = useState('');
  const [address, setAddress] = useState('');
  const [addressType, setAddressType] = useState('');
  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name ?? '');
      setEmail(user.email ?? '');
      setPhone(user.phone ?? '');
      setCompanyName(user.company?.name ?? '');
      setGstin(user.company?.gstin ?? '');
      setAddress(user.company?.address ?? '');
      setAddressType(user.company?.addressType ?? '');
      setPincode(user.company?.pincode ?? '');
      setCity(user.company?.city ?? '');
      setState(user.company?.state ?? '');
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('zobra_token');
      // The account is identified by the session token; the phone is the login identity and is not sent.
      const res = await fetch(`${API_URL}/auth/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name, email, companyName, gstin, address, addressType, pincode, city, state }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        setError(data?.errors?.[0]?.message || data?.message || 'Could not save your profile. Please try again.');
        return;
      }

      // Keep the cached session in sync so every component reflects the change instantly
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('zobra_user', JSON.stringify(data.user));
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('zobra_token', data.token);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setSaving(false);
    }
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
              <label className={labelClass}>Company Registered Name</label>
              <input
                type="text"
                data-cy="profile-company-name"
                maxLength={160}
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Your company name"
                className={fieldClass}
              />
            </div>
            <div className="space-y-1">
              <label className={labelClass}>GSTIN Number</label>
              <input
                type="text"
                data-cy="profile-gstin"
                maxLength={20}
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                placeholder="22AAAAA0000A1Z5"
                className={`${fieldClass} font-mono font-bold`}
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
              <label className={labelClass}>Full Name</label>
              <input
                type="text"
                data-cy="profile-name"
                maxLength={120}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className={fieldClass}
              />
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Work Email</label>
              <input
                type="email"
                data-cy="profile-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className={fieldClass}
              />
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Phone Number</label>
              <input
                type="tel"
                data-cy="profile-phone"
                value={phone}
                readOnly
                title="Your verified WhatsApp number is your login and cannot be changed here."
                className={`${fieldClass} text-[#6B7280] cursor-not-allowed`}
              />
              <p className="text-[10px] text-[#9CA3AF]">Verified login number</p>
            </div>
          </div>
        </Card>

        {/* Shipping Address */}
        <Card className="bg-white border-[#E5E7EB] p-6 sm:p-8 space-y-4 shadow-sm">
          <h3 className="font-heading font-bold text-lg text-[#111111] flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#3B6FEB]" /> Default Delivery Address
          </h3>
          <div className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className={labelClass}>Address</label>
              <textarea
                rows={3}
                data-cy="profile-address"
                maxLength={500}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Your registered delivery address"
                className={fieldClass}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className={labelClass}>Address Type</label>
                <select
                  data-cy="profile-address-type"
                  value={addressType}
                  onChange={(e) => setAddressType(e.target.value)}
                  className={fieldClass}
                >
                  <option value="">Select type</option>
                  {ADDRESS_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className={labelClass}>Pincode</label>
                <input
                  type="text"
                  inputMode="numeric"
                  data-cy="profile-pincode"
                  maxLength={12}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="751001"
                  className={fieldClass}
                />
              </div>
              <div className="space-y-1">
                <label className={labelClass}>City</label>
                <input
                  type="text"
                  data-cy="profile-city"
                  maxLength={80}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City"
                  className={fieldClass}
                />
              </div>
              <div className="space-y-1">
                <label className={labelClass}>State</label>
                <input
                  type="text"
                  data-cy="profile-state"
                  maxLength={80}
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="State"
                  className={fieldClass}
                />
              </div>
            </div>
          </div>
        </Card>

        {error && (
          <p role="alert" data-cy="profile-error" className="text-sm font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        <div className="flex items-center gap-4">
          <Button variant="primary" size="lg" className="font-bold px-8" data-cy="profile-save-btn" disabled={saving}>
            {saving ? (
              <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> SAVING...</span>
            ) : saved ? (
              <span className="flex items-center gap-2"><Check className="w-4 h-4" /> SAVED CHANGES</span>
            ) : (
              'SAVE PROFILE'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
