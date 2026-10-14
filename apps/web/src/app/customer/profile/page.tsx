'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, Building2, MapPin, Check, Loader2, Lock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCustomerUser, CustomerUser, notifyCustomerUserUpdated } from '@/hooks/useCustomerUser';
import { API_URL } from '@/lib/api';

const ADDRESS_TYPES = ['Office', 'Home', 'Warehouse', 'Other'];

// GSTIN: 2-digit state code, 10-char PAN, entity number, 'Z', checksum
const GSTIN_PATTERN = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const PINCODE_PATTERN = /^\d{6}$/;

const fieldClass =
  'w-full px-3.5 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-[#111111] font-medium focus:outline-none focus:border-[#3B6FEB] focus:bg-white';
const invalidClass = 'border-rose-400 focus:border-rose-500';
const labelClass = 'flex items-center justify-between font-bold text-[#6B7280] uppercase';
const hintClass = 'text-[11px] text-[#9CA3AF]';
const errorTextClass = 'text-[11px] font-medium text-rose-600';

interface ProfileForm {
  name: string;
  email: string;
  companyName: string;
  gstin: string;
  address: string;
  addressType: string;
  pincode: string;
  city: string;
  state: string;
}

const EMPTY_FORM: ProfileForm = {
  name: '',
  email: '',
  companyName: '',
  gstin: '',
  address: '',
  addressType: '',
  pincode: '',
  city: '',
  state: '',
};

function formFromUser(user: CustomerUser): ProfileForm {
  return {
    name: user.name ?? '',
    email: user.email ?? '',
    companyName: user.company?.name ?? '',
    gstin: user.company?.gstin ?? '',
    address: user.company?.address ?? '',
    addressType: user.company?.addressType ?? '',
    pincode: user.company?.pincode ?? '',
    city: user.company?.city ?? '',
    state: user.company?.state ?? '',
  };
}

function isSameForm(a: ProfileForm, b: ProfileForm): boolean {
  return (Object.keys(a) as Array<keyof ProfileForm>).every((k) => a[k] === b[k]);
}

// Fields that quotes, invoices and delivery depend on
const KEY_FIELDS: Array<{ key: keyof ProfileForm; label: string; id: string }> = [
  { key: 'name', label: 'your name', id: 'profile-name' },
  { key: 'companyName', label: 'company name', id: 'profile-company-name' },
  { key: 'email', label: 'work email', id: 'profile-email' },
  { key: 'address', label: 'delivery address', id: 'profile-address' },
];

function SaveActions({
  dirty,
  saving,
  onDiscard,
  saveCy,
  discardCy,
}: {
  dirty: boolean;
  saving: boolean;
  onDiscard: () => void;
  saveCy: string;
  discardCy: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {dirty && (
        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={onDiscard}
          disabled={saving}
          data-cy={discardCy}
          className="font-bold"
        >
          DISCARD
        </Button>
      )}
      <Button
        type="submit"
        variant="primary"
        size="md"
        className="font-bold px-6 flex-1 sm:flex-initial"
        data-cy={saveCy}
        disabled={saving || !dirty}
      >
        {saving ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> SAVING...
          </span>
        ) : (
          'SAVE CHANGES'
        )}
      </Button>
    </div>
  );
}

export default function CustomerProfilePage() {
  const { user, loading } = useCustomerUser();
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // `saved` is the last known server state; `form` is what the customer is editing
  const [saved, setSaved] = useState<ProfileForm>(EMPTY_FORM);
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
  const dirty = !isSameForm(form, saved);

  // Populate from the session — but never overwrite edits in progress when the
  // background /auth/me refresh lands
  useEffect(() => {
    if (!user) return;
    const fresh = formFromUser(user);
    setForm((current) => (isSameForm(current, saved) ? fresh : current));
    setSaved(fresh);
  }, [user]);

  // Track whether the in-page save footer is on screen (the floating bar shows only when it isn't)
  const footerRef = useRef<HTMLDivElement>(null);
  const [footerVisible, setFooterVisible] = useState(true);
  useEffect(() => {
    const el = footerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setFooterVisible(entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, [loading]);

  // Warn before leaving the page with unsaved changes
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  const setField = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setJustSaved(false);
  };

  const fieldErrors = useMemo(() => {
    const errors: Partial<Record<keyof ProfileForm, string>> = {};
    if (form.gstin && !GSTIN_PATTERN.test(form.gstin)) {
      errors.gstin = 'Enter a valid 15-character GSTIN, e.g. 22AAAAA0000A1Z5.';
    }
    if (form.pincode && !PINCODE_PATTERN.test(form.pincode)) {
      errors.pincode = 'Pincode must be 6 digits.';
    }
    return errors;
  }, [form.gstin, form.pincode]);

  // Show a field error once the customer has finished typing it or tried to save
  const showError = (key: keyof ProfileForm) =>
    fieldErrors[key] && (submitted || form[key].length >= (key === 'gstin' ? 15 : 6))
      ? fieldErrors[key]
      : undefined;

  const missingFields = KEY_FIELDS.filter((f) => !saved[f.key].trim());

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setError('');
    if (Object.keys(fieldErrors).length > 0) {
      setError('Please fix the highlighted fields before saving.');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('zobra_token');
      // The account is identified by the session token; the phone is the login identity and is not sent.
      const res = await fetch(`${API_URL}/auth/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
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
      const fresh = formFromUser(data.user);
      setSaved(fresh);
      setForm(fresh);
      setSubmitted(false);
      setJustSaved(true);
      notifyCustomerUserUpdated();
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setForm(saved);
    setError('');
    setSubmitted(false);
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

  const gstinError = showError('gstin');
  const pincodeError = showError('pincode');

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
          These details appear on your quotes and GST invoices, and are used to deliver your orders.
        </p>
      </div>

      {/* Profile completeness — new WhatsApp OTP accounts start with only a phone number */}
      {missingFields.length > 0 && (
        <div
          className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs"
          data-cy="profile-incomplete-banner"
        >
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-[#111111]">Complete your profile</p>
            <p className="text-[#6B7280]">
              Add{' '}
              {missingFields.map((f, i) => (
                <React.Fragment key={f.key}>
                  {i > 0 && (i === missingFields.length - 1 ? ' and ' : ', ')}
                  <a
                    href={`#${f.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById(f.id)?.focus();
                    }}
                    className="font-semibold text-[#3B6FEB] hover:underline"
                  >
                    {f.label}
                  </a>
                </React.Fragment>
              ))}{' '}
              so your quotes and invoices are addressed correctly.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Contact Person Details */}
        <Card className="bg-white border-[#E5E7EB] p-6 sm:p-8 space-y-4 shadow-sm">
          <h3 className="font-heading font-bold text-lg text-[#111111] flex items-center gap-2">
            <User className="w-5 h-5 text-[#3B6FEB]" /> Primary Contact Person
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <label htmlFor="profile-name" className={labelClass}>Full Name</label>
              <input
                id="profile-name"
                type="text"
                data-cy="profile-name"
                autoComplete="name"
                maxLength={120}
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                placeholder="e.g. Priya Sharma"
                className={fieldClass}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="profile-email" className={labelClass}>Work Email</label>
              <input
                id="profile-email"
                type="email"
                data-cy="profile-email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
                placeholder="you@company.com"
                className={fieldClass}
              />
              <p className={hintClass}>Quotes and invoices are emailed here.</p>
            </div>
            <div className="space-y-1">
              <label htmlFor="profile-phone" className={labelClass}>Phone Number</label>
              {/* Read-only: styled as plain text with a lock so it doesn't look editable */}
              <div className="relative">
                <input
                  id="profile-phone"
                  type="tel"
                  data-cy="profile-phone"
                  value={user?.phone ?? ''}
                  readOnly
                  aria-describedby="profile-phone-hint"
                  className="w-full pl-3.5 pr-9 py-2.5 bg-[#F3F4F6] border border-transparent rounded-lg text-[#4B5563] font-medium cursor-default focus:outline-none"
                />
                <Lock className="w-3.5 h-3.5 text-[#9CA3AF] absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
              <p id="profile-phone-hint" className={hintClass}>
                Your verified WhatsApp login. It can&apos;t be changed here.
              </p>
            </div>
          </div>
        </Card>

        {/* Company & GST Details */}
        <Card className="bg-white border-[#E5E7EB] p-6 sm:p-8 space-y-4 shadow-sm">
          <h3 className="font-heading font-bold text-lg text-[#111111] flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#3B6FEB]" /> Company &amp; GST Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label htmlFor="profile-company-name" className={labelClass}>Company Registered Name</label>
              <input
                id="profile-company-name"
                type="text"
                data-cy="profile-company-name"
                autoComplete="organization"
                maxLength={160}
                value={form.companyName}
                onChange={(e) => setField('companyName', e.target.value)}
                placeholder="As registered for GST"
                className={fieldClass}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="profile-gstin" className={labelClass}>
                GSTIN Number
                <span className="normal-case font-medium text-[#9CA3AF]">Optional</span>
              </label>
              <input
                id="profile-gstin"
                type="text"
                data-cy="profile-gstin"
                maxLength={15}
                autoCapitalize="characters"
                spellCheck={false}
                value={form.gstin}
                onChange={(e) => setField('gstin', e.target.value.toUpperCase().replace(/\s/g, ''))}
                placeholder="e.g. 22AAAAA0000A1Z5"
                aria-invalid={!!gstinError}
                aria-describedby="profile-gstin-hint"
                className={`${fieldClass} font-mono placeholder:font-sans ${gstinError ? invalidClass : ''}`}
              />
              <p id="profile-gstin-hint" className={gstinError ? errorTextClass : hintClass}>
                {gstinError || 'Add it to claim input tax credit on your GST invoices.'}
              </p>
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
              <label htmlFor="profile-address" className={labelClass}>Address</label>
              <textarea
                id="profile-address"
                rows={3}
                data-cy="profile-address"
                autoComplete="street-address"
                maxLength={500}
                value={form.address}
                onChange={(e) => setField('address', e.target.value)}
                placeholder="Building, street, area"
                className={fieldClass}
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label htmlFor="profile-pincode" className={labelClass}>Pincode</label>
                <input
                  id="profile-pincode"
                  type="text"
                  inputMode="numeric"
                  data-cy="profile-pincode"
                  autoComplete="postal-code"
                  maxLength={6}
                  value={form.pincode}
                  onChange={(e) => setField('pincode', e.target.value.replace(/\D/g, ''))}
                  placeholder="751001"
                  aria-invalid={!!pincodeError}
                  aria-describedby={pincodeError ? 'profile-pincode-error' : undefined}
                  className={`${fieldClass} ${pincodeError ? invalidClass : ''}`}
                />
                {pincodeError && (
                  <p id="profile-pincode-error" className={errorTextClass}>{pincodeError}</p>
                )}
              </div>
              <div className="space-y-1">
                <label htmlFor="profile-city" className={labelClass}>City</label>
                <input
                  id="profile-city"
                  type="text"
                  data-cy="profile-city"
                  autoComplete="address-level2"
                  maxLength={80}
                  value={form.city}
                  onChange={(e) => setField('city', e.target.value)}
                  placeholder="City"
                  className={fieldClass}
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="profile-state" className={labelClass}>State</label>
                <input
                  id="profile-state"
                  type="text"
                  data-cy="profile-state"
                  autoComplete="address-level1"
                  maxLength={80}
                  value={form.state}
                  onChange={(e) => setField('state', e.target.value)}
                  placeholder="State"
                  className={fieldClass}
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="profile-address-type" className={labelClass}>Address Type</label>
                <select
                  id="profile-address-type"
                  data-cy="profile-address-type"
                  value={form.addressType}
                  onChange={(e) => setField('addressType', e.target.value)}
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
            </div>
          </div>
        </Card>

        {/* Save footer — shows whether changes are pending */}
        <div
          ref={footerRef}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-8"
        >
          <div className="text-xs font-medium min-h-[1rem]" aria-live="polite" data-cy="profile-save-status">
            {error ? (
              <p role="alert" data-cy="profile-error" className="text-rose-700 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
              </p>
            ) : dirty ? (
              <span className="text-amber-700">You have unsaved changes</span>
            ) : justSaved ? (
              <span className="text-emerald-700 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" /> All changes saved
              </span>
            ) : null}
          </div>
          <SaveActions
            dirty={dirty}
            saving={saving}
            onDiscard={handleDiscard}
            saveCy="profile-save-btn"
            discardCy="profile-discard-btn"
          />
        </div>

        {/* Floating save bar — keeps Save reachable while editing higher up this long form */}
        {dirty && !footerVisible && (
          <div
            className="fixed bottom-4 left-4 right-4 sm:left-auto z-30 flex items-center justify-between sm:justify-end gap-3 px-4 py-3 bg-white border border-[#E5E7EB] rounded-2xl shadow-xl animate-in fade-in slide-in-from-bottom-2"
            data-cy="profile-floating-save-bar"
          >
            <span className="text-xs font-medium text-amber-700">Unsaved changes</span>
            <SaveActions
              dirty={dirty}
              saving={saving}
              onDiscard={handleDiscard}
              saveCy="profile-floating-save-btn"
              discardCy="profile-floating-discard-btn"
            />
          </div>
        )}
      </form>
    </div>
  );
}
