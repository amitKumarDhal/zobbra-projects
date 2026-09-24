'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { UploadCloud, CheckCircle2, Loader2, X, Calculator, AlertTriangle, Info } from 'lucide-react';
import { API_URL } from '@/lib/api';
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/upload';
import VariantBreakdownEntry, { VariantData } from './VariantBreakdownEntry';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Product {
  id: string;
  name: string;
  slug?: string;
  basePrice?: number;
  gstRate?: number;
  requiresColor?: boolean;
  requiresSize?: boolean;
  supportsVariantMatrix?: boolean;
  category?: { id: string; name: string };
}

interface PricingData {
  productId: string;
  productName: string;
  unitPrice: number;
  subtotal: number;
  discount: number;
  gstRate: number;
  gstTotal: number;
  totalAmount: number;
}

type PricingState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: PricingData }
  | { status: 'error'; message: string };

interface SimplifiedQuoteFormProps {
  isCustomer?: boolean;
  initialData?: {
    name?: string;
    phone?: string;
    productId?: string;
  };
  onSuccess?: (resultNumber: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatINR(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN');
}

function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  }) as T;
}

// ─── Estimated Quote Card ─────────────────────────────────────────────────────

interface EstimatedQuoteCardProps {
  id?: string;
  pricingState: PricingState;
  productName?: string;
  quantity: number;
  printPosition: string;
  variants: VariantData[];
  totalQuantity: number;
}

function EstimatedQuoteCard({
  id = 'estimated-quote-card',
  pricingState,
  productName,
  quantity,
  printPosition,
  variants,
  totalQuantity,
}: EstimatedQuoteCardProps) {
  const variantSum = variants.reduce((s, v) => s + (v.quantity || 0), 0);
  const variantMismatch = variants.length > 0 && variantSum !== totalQuantity;

  return (
    <div
      id={id}
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        border: '1px solid #334155',
        borderRadius: '1rem',
        padding: '1.5rem',
        color: '#f8fafc',
        position: 'sticky',
        top: '2rem',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
          <Calculator style={{ width: 16, height: 16, color: '#60a5fa' }} />
          <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', color: '#60a5fa', textTransform: 'uppercase' }}>
            Estimated Quote
          </span>
        </div>
        {productName ? (
          <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f1f5f9', lineHeight: 1.3 }}>{productName}</p>
        ) : (
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Select a product to see estimated pricing.</p>
        )}
      </div>

      {/* Variant mismatch warning */}
      {variantMismatch && (
        <div style={{
          background: 'rgba(239,68,68,0.15)',
          border: '1px solid rgba(239,68,68,0.4)',
          borderRadius: '0.5rem',
          padding: '0.5rem 0.75rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <AlertTriangle style={{ width: 14, height: 14, color: '#f87171', flexShrink: 0 }} />
          <span style={{ fontSize: '0.75rem', color: '#fca5a5' }}>
            Variant total ({variantSum}) ≠ quantity ({totalQuantity}). Fix to enable submit.
          </span>
        </div>
      )}

      {/* Loading */}
      {pricingState.status === 'loading' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '1rem 0', color: '#94a3b8', fontSize: '0.85rem' }}>
          <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
          Calculating estimate…
        </div>
      )}

      {/* Error */}
      {pricingState.status === 'error' && (
        <div style={{
          background: 'rgba(239,68,68,0.12)',
          border: '1px solid rgba(239,68,68,0.35)',
          borderRadius: '0.5rem',
          padding: '0.625rem 0.875rem',
          fontSize: '0.8rem',
          color: '#fca5a5',
        }}>
          {pricingState.message}
        </div>
      )}

      {/* No product selected yet */}
      {pricingState.status === 'idle' && !productName && (
        <div style={{
          background: 'rgba(99,102,241,0.12)',
          border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: '0.5rem',
          padding: '0.625rem 0.875rem',
          fontSize: '0.8rem',
          color: '#a5b4fc',
        }}>
          Select a product to see estimated pricing.
        </div>
      )}

      {/* Pricing breakdown */}
      {pricingState.status === 'success' && (() => {
        const d = pricingState.data;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {/* Row helper */}
            {[
              { label: 'Quantity', value: `${quantity} pcs` },
              { label: 'Print Position', value: printPosition || 'Not selected' },
              { label: 'Unit Price', value: formatINR(d.unitPrice) },
              { label: 'Subtotal', value: formatINR(d.subtotal) },
              ...(d.discount > 0 ? [{ label: 'Discount', value: `−${formatINR(d.discount)}` }] : []),
              { label: `GST (${d.gstRate}%)`, value: formatINR(d.gstTotal) },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: '#94a3b8' }}>{label}</span>
                <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{value}</span>
              </div>
            ))}

            {/* Variants summary */}
            {variants.length > 0 && !variantMismatch && (
              <div style={{ marginTop: '0.25rem', borderTop: '1px solid #334155', paddingTop: '0.5rem' }}>
                <p style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.375rem' }}>
                  Variant Breakdown
                </p>
                {variants.slice(0, 5).map((v, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                    <span style={{ color: '#94a3b8' }}>
                      {[v.color, v.size].filter(Boolean).join(' / ') || 'Variant'}
                    </span>
                    <span style={{ color: '#cbd5e1' }}>{v.quantity} pcs</span>
                  </div>
                ))}
                {variants.length > 5 && (
                  <p style={{ fontSize: '0.7rem', color: '#64748b' }}>+{variants.length - 5} more</p>
                )}
              </div>
            )}

            {/* Divider */}
            <div style={{ borderTop: '1px solid #475569', margin: '0.375rem 0' }} />

            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Estimated Total
              </span>
              <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#60a5fa', letterSpacing: '-0.02em' }}>
                {formatINR(d.totalAmount)}
              </span>
            </div>

            {/* Disclaimer */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.375rem',
              marginTop: '0.25rem',
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.25)',
              borderRadius: '0.5rem',
              padding: '0.5rem 0.625rem',
            }}>
              <Info style={{ width: 12, height: 12, color: '#818cf8', marginTop: '0.1rem', flexShrink: 0 }} />
              <p style={{ fontSize: '0.7rem', color: '#a5b4fc', lineHeight: 1.45, margin: 0 }}>
                Estimated price. Final quotation may be adjusted after sales review.
              </p>
            </div>
          </div>
        );
      })()}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ─── Main Form ────────────────────────────────────────────────────────────────

export default function SimplifiedQuoteForm({
  isCustomer = false,
  initialData = {},
  onSuccess,
}: SimplifiedQuoteFormProps) {
  const searchParams = useSearchParams();

  // Product catalog
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Form fields
  const [name, setName] = useState(initialData.name || '');
  const [phone, setPhone] = useState(initialData.phone || '');
  const [productId, setProductId] = useState(initialData.productId || '');
  const [quantity, setQuantity] = useState<number>(100);
  const [printPosition, setPrintPosition] = useState<string>('');
  const [referenceFiles, setReferenceFiles] = useState<string[]>([]);
  const [variants, setVariants] = useState<VariantData[]>([]);

  // UI state
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resultId, setResultId] = useState('');
  const [pricingState, setPricingState] = useState<PricingState>({ status: 'idle' });

  // Sync initialData
  useEffect(() => {
    if (initialData.name) setName(initialData.name);
    if (initialData.phone) setPhone(initialData.phone);
  }, [initialData.name, initialData.phone]);

  // Fetch real active products from catalog
  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch(`${API_URL}/products?status=ACTIVE`);
        if (res.ok) {
          const data = await res.json();
          const activeProducts: Product[] = data.data || data.products || data || [];
          const list = Array.isArray(activeProducts) ? activeProducts : [];
          setProducts(list);

          // Pre-select from URL param
          const paramId = searchParams?.get('id') || searchParams?.get('productId');
          if (paramId) {
            const match = list.find(
              (p) => p.id === paramId || p.slug === paramId
            );
            if (match) setProductId(match.id);
            else setProductId(paramId);
          } else if (initialData.productId) {
            const match = list.find(
              (p) => p.id === initialData.productId || p.slug === initialData.productId
            );
            if (match) setProductId(match.id);
          }
        }
      } catch (err) {
        console.error('Failed to load products', err);
      } finally {
        setLoadingProducts(false);
      }
    }
    fetchProducts();
  }, []);

  // ─── Live Pricing via Server API ──────────────────────────────────────────

  const fetchPricing = useCallback(
    debounce(async (pid: string, qty: number, pt: string, vars: VariantData[]) => {
      if (!pid || qty <= 0) {
        setPricingState({ status: 'idle' });
        return;
      }

      // Validate variant sum before hitting the API
      if (vars.length > 0) {
        const sum = vars.reduce((s, v) => s + (v.quantity || 0), 0);
        if (sum !== qty) {
          // Don't request — show idle; the form will show the mismatch error
          setPricingState({ status: 'idle' });
          return;
        }
      }

      setPricingState({ status: 'loading' });

      try {
        const token =
          typeof window !== 'undefined'
            ? localStorage.getItem('token') || localStorage.getItem('zobra_token')
            : null;

        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const body: any = { productId: pid, quantity: qty, printType: pt || 'Front Only' };
        if (vars.length > 0) body.variants = vars;

        const res = await fetch(`${API_URL}/quotes/pricing-preview`, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          setPricingState({ status: 'success', data: data.data });
        } else {
          setPricingState({
            status: 'error',
            message: data.message || 'Unable to calculate estimate. Please try again.',
          });
        }
      } catch {
        setPricingState({
          status: 'error',
          message: 'Unable to calculate estimate. Please try again.',
        });
      }
    }, 600),
    []
  );

  // Trigger pricing on any relevant field change
  useEffect(() => {
    fetchPricing(productId, quantity, printPosition, variants);
  }, [productId, quantity, printPosition, variants, fetchPricing]);

  // ─── Selected product details ─────────────────────────────────────────────

  const selectedProduct = products.find((p) => p.id === productId);
  const pricingProductName =
    pricingState.status === 'success'
      ? pricingState.data.productName
      : selectedProduct?.name;

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

  // ─── Variant validation ───────────────────────────────────────────────────

  const hasVariants = variants.length > 0;
  const variantSum = variants.reduce((s, v) => s + (v.quantity || 0), 0);
  const variantMismatch = hasVariants && variantSum !== quantity;

  // ─── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !phone || !quantity) {
      alert('Please fill in all required fields marked with *');
      return;
    }

    if (!productId && referenceFiles.length === 0) {
      alert('Please select a product or upload a reference design.');
      return;
    }

    if (variantMismatch) {
      alert(
        `Your size/colour breakdown total (${variantSum}) must match the overall quantity (${quantity}).`
      );
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

      const endpoint = isCustomer ? '/quotes' : '/inquiries';

      const requestBody: any = {
        name,
        phone,
        // Only send real productId — never hardcoded categories
        productId: productId || undefined,
        quantity,
        printPosition,
        printType: printPosition || undefined,
        referenceFiles,
        source: 'WEBSITE',
        // NOTE: Never send client-computed pricing fields. The server recalculates.
      };

      if (hasVariants) {
        requestBody.variants = variants;
      }

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();
      if (res.ok) {
        const id = isCustomer
          ? data.quote?.quoteNumber || 'Quote Created'
          : data.inquiryNumber || data.inquiry?.inquiryNumber || 'Inquiry Created';
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

  if (submitted && !onSuccess) {
    return (
      <div className="text-center py-10 space-y-5">
        <div className="w-20 h-20 bg-[#EEF2FF] text-[#3B6FEB] rounded-full flex items-center justify-center mx-auto text-3xl font-bold border border-[#C7D2FE] shadow-sm">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            {isCustomer ? 'Quote created successfully' : 'Inquiry submitted successfully'}
          </span>
          <h2 className="text-3xl font-heading font-black text-[#111111] mt-3">
            {isCustomer ? 'Quote Draft Created!' : 'Inquiry Submitted!'}
          </h2>
        </div>

        <div className="bg-[#F8F9FC] border border-[#E5E7EB] py-4 px-8 rounded-xl inline-block mx-auto shadow-sm">
          <span className="text-[#6B7280] text-xs font-bold uppercase tracking-wider block mb-1">
            {isCustomer ? 'Your Quote ID' : 'Your Inquiry ID'}
          </span>
          <span className="text-2xl font-black text-[#3B6FEB] font-mono tracking-tight">
            {resultId}
          </span>
        </div>

        <p className="text-[#4B5563] text-sm max-w-md mx-auto leading-relaxed">
          {isCustomer
            ? 'Thank you. Your draft quote has been generated. Our team will review and price it shortly.'
            : 'Thank you. Our sales team will review your requirements and contact you shortly.'}
        </p>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              setSubmitted(false);
              setQuantity(100);
              setVariants([]);
              setReferenceFiles([]);
            }}
            className="px-8 py-3 bg-[#111111] hover:bg-[#000000] text-white text-sm font-bold rounded-xl transition-all shadow-sm"
          >
            Submit Another Request
          </button>
        </div>
      </div>
    );
  }

  // ─── Form Render ──────────────────────────────────────────────────────────

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1fr)',
        gap: '2rem',
      }}
      className="quote-form-grid"
    >
      {/* ── Left: Form ── */}
      <form
        id="customer-quote-form"
        className="space-y-6 text-sm"
        onSubmit={handleSubmit}
        style={{ minWidth: 0 }}
      >
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block font-bold text-[#374151] mb-1.5">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="quote-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className="w-full px-4 py-2.5 bg-white border border-[#D1D5DB] rounded-lg text-[#111111] outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] shadow-sm transition-all"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block font-bold text-[#374151] mb-1.5">
              Phone <span className="text-red-500">*</span>
            </label>
            <input
              id="quote-phone"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full px-4 py-2.5 bg-white border border-[#D1D5DB] rounded-lg text-[#111111] outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] shadow-sm transition-all"
            />
          </div>

          {/* Product selector — REAL products from database */}
          <div>
            <label className="block font-bold text-[#374151] mb-1.5">
              Product <span className="text-gray-400 font-normal text-xs">(optional)</span>
            </label>
            <p className="text-xs text-[#6B7280] mb-2 font-medium">
              Choose a product from our active catalog to see live pricing.
            </p>
            <select
              id="quote-product"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              disabled={loadingProducts}
              className="w-full px-4 py-2.5 bg-white border border-[#D1D5DB] rounded-lg text-[#111111] outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] shadow-sm transition-all font-medium disabled:opacity-50"
            >
              <option value="">[ Select Product ]</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.basePrice ? ` — from ₹${p.basePrice}` : ''}
                </option>
              ))}
            </select>
            {loadingProducts && (
              <p className="text-xs text-[#9CA3AF] mt-1 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Loading catalog…
              </p>
            )}
            {!loadingProducts && products.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                No active products found in catalog.
              </p>
            )}
          </div>

          {/* Quantity */}
          <div>
            <label className="block font-bold text-[#374151] mb-1.5">
              Quantity <span className="text-red-500">*</span>
            </label>
            <input
              id="quote-quantity"
              type="number"
              required
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              placeholder="100"
              className="w-full px-4 py-2.5 bg-white border border-[#D1D5DB] rounded-lg text-[#111111] outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] shadow-sm transition-all font-semibold"
            />
          </div>

          {/* Variant Breakdown — optional */}
          {(() => {
            const p = selectedProduct;
            const rColor = p ? p.requiresColor !== false : true;
            const rSize = p ? p.requiresSize !== false : true;
            const matrix = p ? p.supportsVariantMatrix !== false : true;

            return (rColor || rSize) ? (
              <div className="border border-[#E5E7EB] rounded-xl overflow-hidden">
                <button
                  type="button"
                  id="toggle-variant-breakdown"
                  onClick={() => setVariants(variants.length > 0 ? [] : [{ color: '', size: '', quantity: 0 }])}
                  className="w-full flex items-center justify-between px-4 py-3 bg-[#F9FAFB] hover:bg-[#F3F4F6] transition-colors text-left"
                >
                  <div>
                    <span className="text-sm font-bold text-[#374151]">Size / Colour Breakdown</span>
                    <span className="ml-2 text-xs text-[#9CA3AF] font-normal">(optional)</span>
                  </div>
                  <span className={`text-xs font-semibold ${variantMismatch ? 'text-red-500' : 'text-[#3B6FEB]'}`}>
                    {variants.length > 0
                      ? variantMismatch
                        ? `⚠ ${variantSum}/${quantity} ▲`
                        : 'Hide ▲'
                      : 'Add breakdown ▼'}
                  </span>
                </button>
                {variants.length > 0 && (
                  <div className="p-4 border-t border-[#E5E7EB] bg-white">
                    <VariantBreakdownEntry
                      totalQuantity={quantity}
                      requiresColor={rColor}
                      requiresSize={rSize}
                      supportsMatrix={matrix}
                      variants={variants}
                      onChange={setVariants}
                    />
                    {variantMismatch && (
                      <p className="text-red-500 text-xs font-bold mt-2">
                        Breakdown total ({variantSum}) must equal quantity ({quantity}) before submitting.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : null;
          })()}

          {/* Print Position */}
          <div>
            <label className="block font-bold text-[#374151] mb-1.5">
              Print Position <span className="text-gray-400 font-normal text-xs">(optional)</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['Front', 'Back', 'Both'].map((pos) => (
                <button
                  key={pos}
                  id={`print-pos-${pos.toLowerCase()}`}
                  type="button"
                  onClick={() => setPrintPosition(printPosition === pos ? '' : pos)}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer text-center ${
                    printPosition === pos
                      ? 'bg-[#EEF2FF] text-[#3B6FEB] border-[#3B6FEB] shadow-sm'
                      : 'bg-[#F9FAFB] text-[#374151] border-[#D1D5DB] hover:border-gray-400'
                  }`}
                >
                  {pos}
                </button>
              ))}
              {printPosition && (
                <button
                  type="button"
                  onClick={() => setPrintPosition('')}
                  className="py-2 px-3 rounded-lg text-xs font-bold border border-dashed border-[#D1D5DB] text-[#9CA3AF] hover:text-red-400 hover:border-red-300 transition-all cursor-pointer text-center"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Reference Files */}
          <div>
            <label className="block font-bold text-[#374151] mb-1.5">
              Reference Files / Mockup <span className="text-gray-400 font-normal text-xs">(optional)</span>
            </label>
            <p className="text-xs text-[#6B7280] mb-2 font-medium">
              Upload a product image, logo, artwork, or reference design.
            </p>
            <div className="relative border-2 border-dashed border-[#D1D5DB] hover:border-[#3B6FEB] rounded-xl p-6 text-center transition-all bg-[#F8F9FC]">
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                disabled={uploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                accept="image/*,.pdf"
              />
              <div className="flex flex-col items-center gap-2">
                {uploading ? (
                  <Loader2 className="w-6 h-6 text-[#3B6FEB] animate-spin" />
                ) : (
                  <UploadCloud className="w-6 h-6 text-[#9CA3AF]" />
                )}
                <span className="text-[#4B5563] font-medium">
                  {uploading ? 'Uploading...' : 'Click or drag files here to upload'}
                </span>
                <span className="text-xs text-[#9CA3AF]">JPG, PNG, WEBP, PDF allowed</span>
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
        </div>

        {/* Mobile: show pricing card inline before submit */}
        <div className="quote-pricing-mobile lg:hidden">
          <EstimatedQuoteCard
            id="estimated-quote-card-mobile"
            pricingState={pricingState}
            productName={pricingProductName}
            quantity={quantity}
            printPosition={printPosition}
            variants={variants}
            totalQuantity={quantity}
          />
        </div>

        <div className="pt-4 border-t border-[#E5E7EB]">
          <button
            id="submit-quote-btn"
            type="submit"
            disabled={submitting || uploading || variantMismatch}
            className="w-full py-4 bg-[#111111] hover:bg-[#000000] disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-base font-bold rounded-xl shadow-md hover:shadow-lg transition-all tracking-wide flex items-center justify-center gap-2"
          >
            {submitting ? 'SUBMITTING...' : 'SUBMIT QUOTE'}
          </button>
          {variantMismatch && (
            <p className="text-center text-xs text-red-500 mt-2 font-semibold">
              Fix variant breakdown total before submitting.
            </p>
          )}
        </div>
      </form>

      {/* ── Right: Sticky Estimated Quote card (desktop only) ── */}
      <div
        className="quote-pricing-desktop hidden lg:block"
        style={{ alignSelf: 'start' }}
      >
        <EstimatedQuoteCard
          pricingState={pricingState}
          productName={pricingProductName}
          quantity={quantity}
          printPosition={printPosition}
          variants={variants}
          totalQuantity={quantity}
        />
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .quote-form-grid {
            grid-template-columns: minmax(0, 1fr) 320px;
          }
        }
      `}</style>
    </div>
  );
}
