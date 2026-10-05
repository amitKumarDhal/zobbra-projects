'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Paperclip, CheckCircle2, Loader2, X, Send } from 'lucide-react';
import { API_URL } from '@/lib/api';
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/upload';
import {
  COUNTRY_DIAL_CODES,
  cleanNationalNumber,
  isValidNationalNumber,
  toE164,
} from '@/lib/otpAuth';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Product {
  id: string;
  name: string;
  slug?: string;
}

interface SimplifiedQuoteFormProps {
  isCustomer?: boolean;
  initialData?: {
    name?: string;
    email?: string;
    phone?: string;
    productId?: string;
  };
  onSuccess?: (resultNumber: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// `min` is what gets stored as the inquiry quantity; the label travels with the requirements.
const QUANTITY_RANGES = [
  { label: 'Below 50', min: 1 },
  { label: '50 – 100', min: 50 },
  { label: '100 – 250', min: 100 },
  { label: '250 – 500', min: 250 },
  { label: '500 – 1,000', min: 500 },
  { label: '1,000+', min: 1000 },
];

function rangeForQuantity(qty: number): string {
  const match = [...QUANTITY_RANGES].reverse().find((r) => qty >= r.min);
  return match ? match.label : '';
}

/** "+919876543210" → { dial: '91', national: '9876543210' }; bare numbers default to India. */
function splitPhone(phone: string): { dial: string; national: string } {
  const digits = phone.replace(/\D/g, '');
  if (phone.trim().startsWith('+')) {
    const country = [...COUNTRY_DIAL_CODES]
      .sort((a, b) => b.dial.length - a.dial.length)
      .find((c) => digits.startsWith(c.dial));
    if (country) return { dial: country.dial, national: digits.slice(country.dial.length) };
  }
  if (digits.length === 12 && digits.startsWith('91')) return { dial: '91', national: digits.slice(2) };
  return { dial: '91', national: cleanNationalNumber(digits) };
}

const labelClass = 'block font-bold text-[#374151] mb-1.5';
const inputClass =
  'w-full px-4 py-2.5 bg-white border border-[#D1D5DB] rounded-lg text-[#111111] outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] shadow-sm transition-all';

// ─── Main Form ────────────────────────────────────────────────────────────────

export default function SimplifiedQuoteForm({
  isCustomer = false,
  initialData = {},
  onSuccess,
}: SimplifiedQuoteFormProps) {
  const searchParams = useSearchParams();
  const initialPhone = splitPhone(initialData.phone || '');

  // Form fields
  const [name, setName] = useState(initialData.name || '');
  const [email, setEmail] = useState(initialData.email || '');
  const [dial, setDial] = useState(initialPhone.dial);
  const [phone, setPhone] = useState(initialPhone.national);
  const [productInterest, setProductInterest] = useState(searchParams?.get('product') || '');
  const [quantityRange, setQuantityRange] = useState(() => {
    const qty = Number(searchParams?.get('qty'));
    return qty > 0 ? rangeForQuantity(qty) : '';
  });
  const [message, setMessage] = useState('');
  const [referenceFiles, setReferenceFiles] = useState<string[]>([]);

  // Catalog product the request was started from (product pages link here with its id)
  const [linkedProduct, setLinkedProduct] = useState<Product | null>(null);

  // UI state
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resultId, setResultId] = useState('');

  // Sync initialData
  useEffect(() => {
    if (initialData.name) setName(initialData.name);
    if (initialData.email) setEmail(initialData.email);
    if (initialData.phone) {
      const parts = splitPhone(initialData.phone);
      setDial(parts.dial);
      setPhone(parts.national);
    }
  }, [initialData.name, initialData.email, initialData.phone]);

  // Resolve the product passed in the URL so the request stays linked to the catalog item
  useEffect(() => {
    const paramId = searchParams?.get('id') || searchParams?.get('productId') || initialData.productId;
    if (!paramId) return;

    async function resolveProduct() {
      try {
        // The API pages at 10 by default; look through every active product.
        const res = await fetch(`${API_URL}/products?pageSize=100`);
        if (!res.ok) return;
        const data = await res.json();
        const list: Product[] = data.data || data.products || data || [];
        const match = Array.isArray(list)
          ? list.find((p) => p.id === paramId || p.slug === paramId)
          : undefined;
        if (match) {
          setLinkedProduct(match);
          setProductInterest((current) => current || match.name);
        }
      } catch (err) {
        console.error('Failed to load product', err);
      }
    }
    resolveProduct();
  }, []);

  // ─── File handling ────────────────────────────────────────────────────────

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all(files.map(uploadToCloudinary));
      setReferenceFiles((prev) => [...prev, ...urls]);
    } catch (err) {
      console.error('Upload error', err);
      alert('Failed to upload some files. Please try again.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeFile = async (urlToRemove: string) => {
    setReferenceFiles((prev) => prev.filter((u) => u !== urlToRemove));
    try {
      await deleteFromCloudinary(urlToRemove);
    } catch (e) {
      console.error('Failed to delete from Cloudinary', e);
    }
  };

  // ─── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const range = QUANTITY_RANGES.find((r) => r.label === quantityRange);
    const product = productInterest.trim();

    if (!name.trim() || !phone || !product || !range) {
      alert('Please fill in all required fields marked with *');
      return;
    }

    if (!isValidNationalNumber(dial, phone)) {
      alert('Please enter a valid phone number.');
      return;
    }

    setSubmitting(true);
    try {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('token') || localStorage.getItem('zobra_token')
          : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const note = message.trim();
      const requestBody = {
        name: name.trim(),
        email: email.trim() || undefined,
        phone: toE164(dial, phone),
        productInterest: product,
        // Keep the catalog link only while the text still names that product
        productId: linkedProduct && linkedProduct.name === product ? linkedProduct.id : undefined,
        quantity: range.min,
        message: note || undefined,
        customizationRequirements: [`Quantity range: ${range.label} pcs`, note].filter(Boolean).join('\n'),
        referenceFiles,
        source: 'WEBSITE',
      };

      // Free-text requests have no priced catalog item yet, so they are raised as
      // inquiries; signed-in customers see them under My Quotes.
      const res = await fetch(`${API_URL}/inquiries`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();
      if (res.ok) {
        const id = data.inquiryNumber || data.inquiry?.inquiryNumber || 'Request Created';
        setResultId(id);
        setSubmitted(true);
        if (onSuccess) onSuccess(id);
      } else {
        alert(data.message || 'Failed to submit request.');
      }
    } catch (err) {
      console.error('Submit error:', err);
      alert('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Success Screen ───────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="text-center py-10 space-y-5">
        <div className="w-20 h-20 bg-[#EEF2FF] text-[#3B6FEB] rounded-full flex items-center justify-center mx-auto text-3xl font-bold border border-[#C7D2FE] shadow-sm">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            {isCustomer ? 'Quote request submitted successfully' : 'Inquiry submitted successfully'}
          </span>
          <h2 className="text-3xl font-heading font-black text-[#111111] mt-3">
            {isCustomer ? 'Quote Request Submitted!' : 'Inquiry Submitted!'}
          </h2>
        </div>

        <div className="bg-[#F8F9FC] border border-[#E5E7EB] py-4 px-8 rounded-xl inline-block mx-auto shadow-sm">
          <span className="text-[#6B7280] text-xs font-bold uppercase tracking-wider block mb-1">
            {isCustomer ? 'Your Request ID' : 'Your Inquiry ID'}
          </span>
          <span className="text-2xl font-black text-[#3B6FEB] font-mono tracking-tight">
            {resultId}
          </span>
        </div>

        <p className="text-[#4B5563] text-sm max-w-md mx-auto leading-relaxed">
          {isCustomer
            ? 'Thank you. Our team will review your requirements and share your quote shortly.'
            : 'Thank you. Our sales team will review your requirements and contact you shortly.'}
        </p>

        {!onSuccess && (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setProductInterest('');
                setQuantityRange('');
                setMessage('');
                setReferenceFiles([]);
                setLinkedProduct(null);
              }}
              className="px-8 py-3 bg-[#111111] hover:bg-[#000000] text-white text-sm font-bold rounded-xl transition-all shadow-sm"
            >
              Submit Another Request
            </button>
          </div>
        )}
      </div>
    );
  }

  // ─── Form Render ──────────────────────────────────────────────────────────

  const country = COUNTRY_DIAL_CODES.find((c) => c.dial === dial);

  return (
    <form id="customer-quote-form" className="space-y-4 text-sm" onSubmit={handleSubmit}>
      {/* Name + Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="quote-name" className={labelClass}>
            Your Name <span className="text-red-500">*</span>
          </label>
          <input
            id="quote-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Rahul Kumar"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="quote-email" className={labelClass}>
            Email
          </label>
          <input
            id="quote-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="rahul@company.com"
            className={inputClass}
          />
        </div>
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="quote-phone" className={labelClass}>
          Phone <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          <select
            id="quote-country"
            aria-label="Country code"
            value={dial}
            onChange={(e) => setDial(e.target.value)}
            className="shrink-0 w-[104px] px-3 py-2.5 bg-white border border-[#D1D5DB] rounded-lg text-[#111111] outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] shadow-sm transition-all font-medium"
          >
            {COUNTRY_DIAL_CODES.map((c) => (
              <option key={c.dial} value={c.dial}>
                {c.label}
              </option>
            ))}
          </select>
          <input
            id="quote-phone"
            type="tel"
            inputMode="numeric"
            required
            maxLength={country?.max}
            value={phone}
            onChange={(e) => setPhone(cleanNationalNumber(e.target.value))}
            placeholder="9876543210"
            className={inputClass}
          />
        </div>
      </div>

      {/* Product + Quantity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="quote-product" className={labelClass}>
            Product Looking For <span className="text-red-500">*</span>
          </label>
          <input
            id="quote-product"
            type="text"
            required
            value={productInterest}
            onChange={(e) => setProductInterest(e.target.value)}
            placeholder="e.g. Custom T-shirts, Jerseys"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="quote-quantity" className={labelClass}>
            Quantity Required <span className="text-red-500">*</span>
          </label>
          <select
            id="quote-quantity"
            required
            value={quantityRange}
            onChange={(e) => setQuantityRange(e.target.value)}
            className={`${inputClass} font-medium`}
          >
            <option value="">Select quantity range</option>
            {QUANTITY_RANGES.map((r) => (
              <option key={r.label} value={r.label}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Message */}
      <div>
        <label htmlFor="quote-message" className={labelClass}>
          Message
        </label>
        <textarea
          id="quote-message"
          rows={4}
          maxLength={2000}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us about your requirements — customization needed, timeline, branding details..."
          className={`${inputClass} resize-y`}
        />
      </div>

      {/* Design Reference */}
      <div>
        <label className={labelClass}>
          Design Reference <span className="text-gray-400 font-normal text-xs">(optional)</span>
        </label>
        <div className="relative border-2 border-dashed border-[#D1D5DB] hover:border-[#3B6FEB] rounded-xl px-4 py-3 text-center transition-all bg-[#F8F9FC]">
          <input
            id="quote-reference"
            type="file"
            multiple
            onChange={handleFileUpload}
            disabled={uploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            accept="image/*,.pdf"
          />
          <div className="flex items-center justify-center gap-2 text-[#4B5563] font-medium">
            {uploading ? (
              <Loader2 className="w-4 h-4 text-[#3B6FEB] animate-spin" />
            ) : (
              <Paperclip className="w-4 h-4 text-[#9CA3AF]" />
            )}
            {uploading ? 'Uploading...' : 'Upload Design Reference'}
          </div>
        </div>

        {referenceFiles.length > 0 && (
          <div className="mt-4 space-y-2">
            <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
              Uploaded Files:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {referenceFiles.map((url, i) => (
                <div
                  key={i}
                  className="relative group rounded-lg overflow-hidden border border-[#E5E7EB] aspect-video bg-gray-100 flex items-center justify-center"
                >
                  {url.endsWith('.pdf') ? (
                    <div className="text-xs font-medium text-gray-500">PDF Document</div>
                  ) : (
                    <img src={url} alt={`Upload ${i}`} className="w-full h-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => removeFile(url)}
                    className="absolute top-1 right-1 p-1 bg-white/90 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="pt-2">
        <button
          id="submit-quote-btn"
          type="submit"
          disabled={submitting || uploading}
          className="w-full py-4 bg-[#111111] hover:bg-[#000000] disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-base font-bold rounded-xl shadow-md hover:shadow-lg transition-all tracking-wide flex items-center justify-center gap-2"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          {submitting ? 'Submitting...' : 'Get a Quote'}
        </button>
      </div>
    </form>
  );
}
