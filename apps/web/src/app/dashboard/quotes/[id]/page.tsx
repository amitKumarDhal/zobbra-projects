'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { API_URL } from '@/lib/api';
import { buildWhatsAppUrl, getQuoteWhatsAppMessage } from '@/lib/whatsapp';
import { triggerSidebarCountsRefresh } from '@/hooks/useAdminSidebarCounts';
import {
  MessageSquare,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  Edit3,
  User,
  Phone,
  Mail,
  FileText,
  Clock,
  ArrowLeft,
  Package,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import VariantBreakdownEntry, { VariantData } from '@/components/shared/VariantBreakdownEntry';

interface QuoteActivity {
  id: string;
  type: string;
  message: string;
  createdAt: string;
  user?: { name: string; role: string };
}

interface QuoteDetail {
  id: string;
  quoteNumber: string;
  status: 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  subtotal: number;
  gstTotal: number;
  isGstApplied: boolean;
  gstRate: number | null;
  discount: number;
  totalAmount: number;
  notes?: string;
  artworkUrl?: string;
  previewFrontUrl?: string;
  previewBackUrl?: string;
  canvasStateJson?: string;
  createdAt: string;
  customer?: { id: string; name: string; email: string; phone?: string };
  company?: { id: string; name: string; gstin?: string; address?: string; city?: string; state?: string; pincode?: string };
  items?: Array<{
    id: string;
    productId: string;
    product?: { name: string; hsnCode: string; gstRate: number };
    printType: string;
    color: string;
    size: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    variants?: Array<{ color: string | null; size: string | null; quantity: number }>;
  }>;
  activities?: QuoteActivity[];
}

export default function AdminQuoteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [quote, setQuote] = useState<QuoteDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [noteText, setNoteText] = useState<string>('');
  const [addingNote, setAddingNote] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editQty, setEditQty] = useState<number>(100);
  const [editPrintType, setEditPrintType] = useState<string>('Front Only');
  const [editColor, setEditColor] = useState<string>('Charcoal Black');
  const [editSize, setEditSize] = useState<string>('XL');
  const [editIsGstApplied, setEditIsGstApplied] = useState<boolean>(true);
  const [editGstRate, setEditGstRate] = useState<number>(5.0);
  const [editVariants, setEditVariants] = useState<VariantData[]>([]);
  const [updating, setUpdating] = useState<boolean>(false);

  const fetchQuoteDetail = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('zobra_token') : null;
      const res = await fetch(`${API_URL}/quotes/${id}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (res.ok && data.success && data.quote) {
        if (data.quote.inquiry?.id) {
          router.replace(`/dashboard/inquiries/${data.quote.inquiry.id}`);
          return;
        }
        setQuote(data.quote);
        if (data.quote.items && data.quote.items[0]) {
          setEditQty(data.quote.items[0].quantity);
          setEditPrintType(data.quote.items[0].printType);
          setEditColor(data.quote.items[0].color);
          setEditSize(data.quote.items[0].size);
          setEditVariants(data.quote.items[0].variants || []);
        }
        setEditIsGstApplied(data.quote.isGstApplied ?? true);
        setEditGstRate(data.quote.gstRate ?? (data.quote.items?.[0]?.product?.gstRate || 5.0));
      }
    } catch (error) {
      console.error('Failed to load quote detail:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchQuoteDetail();
  }, [id]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    setAddingNote(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('zobra_token') : null;
      const res = await fetch(`${API_URL}/quotes/${id}/activity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ type: 'NOTE', message: noteText }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNoteText('');
        fetchQuoteDetail();
      }
    } catch (err) {
      console.error('Failed to add note:', err);
    } finally {
      setAddingNote(false);
    }
  };

  const handleWhatsAppClick = async (templateKey: string = 'NEW_QUOTE') => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('zobra_token') : null;
      const res = await fetch(`${API_URL}/quotes/${id}/whatsapp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ template: templateKey }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.whatsappUrl) {
        window.open(data.whatsappUrl, '_blank', 'noopener,noreferrer');
        fetchQuoteDetail();
      } else {
        const phone = quote?.customer?.phone;
        if (!phone) return alert('Customer phone number is unavailable.');
        const text = getQuoteWhatsAppMessage({
          customerName: quote?.customer?.name,
          quoteNumber: quote?.quoteNumber || '',
          totalAmount: quote?.totalAmount,
        });
        const url = buildWhatsAppUrl(phone, text);
        if (url) {
          window.open(url, '_blank', 'noopener,noreferrer');
        } else {
          alert('Customer phone number is invalid.');
        }
      }
    } catch (err) {
      console.error('Failed to trigger WhatsApp click:', err);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    setUpdating(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('zobra_token') : null;
      const res = await fetch(`${API_URL}/quotes/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchQuoteDetail();
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveEdits = async (): Promise<boolean> => {
    setUpdating(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('zobra_token') : null;
      const res = await fetch(`${API_URL}/quotes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          quantity: editQty,
          printType: editPrintType,
          color: editColor,
          size: editSize,
          isGstApplied: editIsGstApplied,
          gstRate: editGstRate,
          variants: editVariants
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsEditing(false);
        await fetchQuoteDetail();
        return true;
      } else {
        alert(data.message || 'Failed to save quote');
        return false;
      }
    } catch (err) {
      console.error('Failed to save quote edits:', err);
      alert('An error occurred while saving the quote.');
      return false;
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveAndSend = async () => {
    if (!quote?.customer?.phone) {
      alert('Customer phone number is unavailable. Please update the customer profile first.');
      return;
    }
    const saved = await handleSaveEdits();
    if (saved) {
      handleWhatsAppClick('QUOTE_READY');
    }
  };


  const handleConvertToOrder = async () => {
    setUpdating(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`${API_URL}/orders/from-quote/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      triggerSidebarCountsRefresh();
      if (res.ok && data.success) {
        router.push('/dashboard/orders');
      } else {
        router.push('/dashboard/orders');
      }
    } catch (err) {
      triggerSidebarCountsRefresh();
      router.push('/dashboard/orders');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-4 bg-[#F8F9FC] min-h-screen">
        <div className="h-8 w-48 bg-[#E5E7EB] animate-pulse rounded-lg" />
        <div className="h-64 w-full bg-[#E5E7EB] animate-pulse rounded-2xl" />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="p-8 text-center bg-[#F8F9FC] min-h-screen">
        <h2 className="text-2xl font-bold text-[#111111]">Quote Not Found</h2>
        <Link href="/dashboard/inquiries">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Inquiries
          </Button>
        </Link>
      </div>
    );
  }


  return (
    <div className="space-y-8 bg-[#F8F9FC] min-h-screen pb-12 font-sans relative">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/dashboard/inquiries" className="text-xs text-[#6B7280] hover:text-[#111111] flex items-center gap-1 font-bold mb-2 transition-colors w-fit">
            <ArrowLeft className="w-3.5 h-3.5" /> BACK TO INQUIRIES
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-heading font-black text-[#111111]">{quote.quoteNumber}</h1>
            <StatusBadge status={quote.status} />
          </div>
          <p className="text-xs text-[#6B7280] font-medium mt-1">{quote.company?.name || quote.customer?.name} • Created on {new Date(quote.createdAt).toLocaleDateString('en-IN')}</p>
        </div>

        {/* Action Buttons Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="success"
            size="sm"
            data-cy="whatsapp-link"
            onClick={() => handleWhatsAppClick('NEW_QUOTE')}
            className="gap-2 font-bold"
          >
            <MessageSquare className="w-4 h-4" /> WHATSAPP CUSTOMER
          </Button>

          <Button
            variant="outline"
            size="sm"
            data-cy="admin-update-qty-btn"
            onClick={() => setIsEditing(!isEditing)}
            className="gap-2 font-bold bg-white border-[#E5E7EB] text-[#111111] hover:bg-[#F9FAFB]"
          >
            <Edit3 className="w-4 h-4 text-[#6B7280]" /> EDIT QUOTE
          </Button>

          {quote.status !== 'APPROVED' && quote.status !== 'REJECTED' && (
            <>
              <Button
                variant="success"
                size="sm"
                onClick={() => handleUpdateStatus('APPROVED')}
                disabled={updating}
                className="gap-1.5 font-bold"
              >
                <CheckCircle2 className="w-4 h-4" /> APPROVE
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleUpdateStatus('REJECTED')}
                disabled={updating}
                className="gap-1.5 font-bold"
              >
                <XCircle className="w-4 h-4" /> REJECT
              </Button>
            </>
          )}

          {quote.status === 'APPROVED' && (
            <Button
              variant="black"
              size="sm"
              onClick={handleConvertToOrder}
              disabled={updating}
              className="gap-2 font-bold"
            >
              <ShoppingBag className="w-4 h-4" /> CONVERT TO ORDER
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column: Customer Info & Quote Items */}
        <div className="flex-1 space-y-6 min-w-0">
          {/* Customer Profile Card */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm p-6 space-y-4">
            <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-[#3B6FEB]" /> Customer & Company Profile
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
              <div>
                <span className="text-[#6B7280] block text-[11px]">Customer Name</span>
                <span className="text-[#111111] font-bold text-sm" data-cy="quote-detail-customer-name">{quote.customer?.name || '—'}</span>
              </div>
              <div>
                <span className="text-[#6B7280] block text-[11px]">Company Name</span>
                <span className="text-[#374151] font-bold text-sm" data-cy="quote-detail-company-name">{quote.company?.name || 'Individual Customer'}</span>
              </div>
              <div>
                <span className="text-[#6B7280] block text-[11px]">Phone Number</span>
                <span className="text-[#374151] font-mono font-bold flex items-center gap-1.5" data-cy="quote-detail-phone">
                  <Phone className="w-3.5 h-3.5 text-green-600" /> {quote.customer?.phone || 'Not provided'}
                </span>
              </div>
              <div>
                <span className="text-[#6B7280] block text-[11px]">Email Address</span>
                <span className="text-[#3B6FEB] font-mono flex items-center gap-1.5 truncate max-w-full" data-cy="quote-detail-email">
                  <Mail className="w-3.5 h-3.5" /> {quote.customer?.email || '—'}
                </span>
              </div>
              <div>
                <span className="text-[#6B7280] block text-[11px]">GSTIN</span>
                <span className="text-[#374151] font-mono">{quote.company?.gstin || 'Not provided'}</span>
              </div>
              <div>
                <span className="text-[#6B7280] block text-[11px]">Location</span>
                <span className="text-[#374151]">{quote.company?.city || quote.company?.address || 'Not specified'}</span>
              </div>
            </div>
          </div>

          {/* Customizer Visual Design Previews & Original Artwork Card */}
          {(() => {
            const notes = quote.notes || '';
            let rawArtwork = quote.artworkUrl || '';
            let front = quote.previewFrontUrl || '';
            let back = quote.previewBackUrl || '';

            // Fallback parsing from notes if legacy quote
            if (!rawArtwork || !front) {
              const customMatch = notes.match(/Customization:\s*(\{.+?\})/);
              if (customMatch && customMatch[1]) {
                try {
                  const parsed = JSON.parse(customMatch[1]);
                  if (!rawArtwork && parsed.rawArtworkUrl) rawArtwork = parsed.rawArtworkUrl;
                  if (!front && parsed.frontPreviewUrl) front = parsed.frontPreviewUrl;
                  if (!back && parsed.backPreviewUrl) back = parsed.backPreviewUrl;
                } catch {
                  /* ignore parse error */
                }
              }
              if (!rawArtwork) {
                const artMatch = notes.match(/Artwork:\s*(https?:\/\/[^\s|]+|data:image\/[^\s|]+)/);
                if (artMatch && artMatch[1]) {
                  rawArtwork = artMatch[1];
                }
              }
            }

            if (!rawArtwork && !front && !back) return null;

            return (
              <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm p-6 space-y-5" data-cy="quote-design-assets-panel">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#3B6FEB]" /> Design Assets & Visual Proof
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Customer-uploaded raw artwork and rendered apparel mockups
                    </p>
                  </div>
                  {quote.canvasStateJson && (
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                      Canvas Data Saved
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {/* 1. Raw Customer Artwork / Logo Asset */}
                  {rawArtwork && (
                    <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-4 flex flex-col items-center text-center space-y-3">
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                          Raw Customer Asset
                        </span>
                      </div>
                      <div className="aspect-square w-full max-w-[200px] bg-white rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden p-3 shadow-inner">
                        <img src={rawArtwork} alt="Customer Artwork Asset" className="w-full h-full object-contain" />
                      </div>
                      <a
                        href={rawArtwork}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-[#3B6FEB] hover:underline font-bold mt-auto"
                      >
                        Download Original Asset ↗
                      </a>
                    </div>
                  )}

                  {/* 2. Rendered Garment Front Preview */}
                  {front && (
                    <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-4 flex flex-col items-center text-center space-y-3">
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                          Garment Front Mockup
                        </span>
                      </div>
                      <div className="aspect-[4/5] w-full max-w-[200px] bg-white rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden p-2 shadow-inner">
                        <img src={front} alt="Front Garment Preview" className="w-full h-full object-contain" />
                      </div>
                      <a
                        href={front}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-[#3B6FEB] hover:underline font-bold mt-auto"
                      >
                        View Full Front Preview ↗
                      </a>
                    </div>
                  )}

                  {/* 3. Rendered Garment Back Preview */}
                  {back && (
                    <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-4 flex flex-col items-center text-center space-y-3">
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                          Garment Back Mockup
                        </span>
                      </div>
                      <div className="aspect-[4/5] w-full max-w-[200px] bg-white rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden p-2 shadow-inner">
                        <img src={back} alt="Back Garment Preview" className="w-full h-full object-contain" />
                      </div>
                      <a
                        href={back}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-[#3B6FEB] hover:underline font-bold mt-auto"
                      >
                        View Full Back Preview ↗
                      </a>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Specifications & Customization Requirements Card */}
          {quote.notes && (
            <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm p-6 space-y-4" data-cy="quote-specifications-card">
              <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#3B6FEB]" /> Customization & Order Specifications
              </h3>
              <div className="bg-[#F9FAFB] border border-[#E5E7EB] p-4 rounded-xl space-y-2 text-xs font-medium">
                {quote.notes.includes('|') ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {quote.notes.split('|').map((part, idx) => {
                      const [label, ...val] = part.split(':');
                      return (
                        <div key={idx} className="bg-white p-3 rounded-lg border border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] block mb-1">{label?.trim()}</span>
                          <span className="text-[#111111] font-semibold">{val.join(':').trim()}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[#374151] leading-relaxed whitespace-pre-wrap font-semibold">{quote.notes}</p>
                )}
              </div>
            </div>
          )}

          {/* Edit Form Drawer if active */}
          {isEditing && (
            <div className="bg-[#EEF2FF] border border-[#BFDBFE] rounded-2xl p-6 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-[#1D4ED8] flex items-center gap-2">
                <Edit3 className="w-4 h-4" /> Edit Quote Specifications (Server Recalculates Price)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-bold text-[#374151]">
                <div className="space-y-1.5">
                  <label className="text-[#6B7280]">Quantity</label>
                  <input
                    type="number"
                    data-cy="admin-qty-input"
                    value={editQty || ''}
                    onChange={(e) => setEditQty(e.target.value === '' ? 0 : Number(e.target.value))}
                    className="w-full p-2.5 border border-[#BFDBFE] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#3B6FEB]/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[#6B7280]">Print Type</label>
                  <select
                    value={editPrintType}
                    onChange={(e) => setEditPrintType(e.target.value)}
                    className="w-full p-2.5 border border-[#BFDBFE] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#3B6FEB]/50"
                  >
                    <option value="Front Only">Front Only</option>
                    <option value="Back Only">Back Only</option>
                    <option value="Front & Back Print">Front & Back Print</option>
                    <option value="Embroidery Logo">Embroidery Logo</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[#6B7280]">Color</label>
                  <input
                    type="text"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    className="w-full p-2.5 border border-[#BFDBFE] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#3B6FEB]/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[#6B7280]">Size</label>
                  <input
                    type="text"
                    value={editSize}
                    onChange={(e) => setEditSize(e.target.value)}
                    className="w-full p-2.5 border border-[#BFDBFE] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#3B6FEB]/50"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-bold text-[#374151] pt-2 border-t border-[#BFDBFE]">
                <div className="space-y-1.5 flex items-center gap-2 mt-5">
                  <input
                    type="checkbox"
                    id="apply-gst"
                    checked={editIsGstApplied}
                    onChange={(e) => setEditIsGstApplied(e.target.checked)}
                    className="w-4 h-4 text-[#3B6FEB] bg-white border-[#BFDBFE] rounded focus:ring-[#3B6FEB]"
                  />
                  <label htmlFor="apply-gst" className="text-[#111111] cursor-pointer">Apply GST</label>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[#6B7280]">GST Rate</label>
                  <select
                    value={editGstRate}
                    onChange={(e) => setEditGstRate(Number(e.target.value))}
                    disabled={!editIsGstApplied}
                    className="w-full p-2.5 border border-[#BFDBFE] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#3B6FEB]/50 disabled:opacity-50"
                  >
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                    <option value="28">28%</option>
                  </select>
                </div>
              </div>
              <div className="pt-4 border-t border-[#BFDBFE]">
                <VariantBreakdownEntry
                  totalQuantity={editQty}
                  variants={editVariants}
                  onChange={setEditVariants}
                  requiresColor={true}
                  requiresSize={true}
                  supportsMatrix={true}
                />
              </div>
              <div className="flex flex-wrap gap-2 justify-end pt-4 border-t border-[#BFDBFE] mt-4">
                <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} className="bg-white border-[#BFDBFE] text-[#374151]">Cancel</Button>
                <Button variant="primary" size="sm" data-cy="admin-save-quote-btn" onClick={handleSaveEdits} disabled={updating}>
                  SAVE & RECALCULATE
                </Button>
                <Button variant="success" size="sm" onClick={handleSaveAndSend} disabled={updating} className="font-bold">
                  SAVE & SEND TO CUSTOMER →
                </Button>
              </div>
            </div>
          )}

          {/* Quote Item Details Breakdown */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-sm flex flex-col">
            <div className="p-4 border-b border-[#E5E7EB] bg-[#FDFDFD]">
              <h3 className="text-xs uppercase tracking-wider font-bold text-[#111111] flex items-center gap-2">
                <Package className="w-4 h-4 text-[#3B6FEB]" /> Line Item Specifications
              </h3>
            </div>

            <div className="table-scroll">
              <table className="w-full min-w-[650px] text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280] font-bold uppercase tracking-wider text-[10px]">
                    <th className="px-4 py-3">Product Description</th>
                    <th className="px-4 py-3">Print Customization</th>
                    <th className="px-4 py-3">Color / Size</th>
                    <th className="px-4 py-3">Qty</th>
                    <th className="px-4 py-3">Unit Rate</th>
                    <th className="px-4 py-3 text-right">Total Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB] font-semibold text-[#111111]">
                  {quote.items?.map((item) => (
                    <React.Fragment key={item.id}>
                      <tr className="hover:bg-[#F9FAFB] transition-colors">
                        <td className="px-4 py-4 font-bold text-[#111111]">{item.product?.name || 'Customized Polo T-Shirt (200 GSM)'}</td>
                        <td className="px-4 py-4 text-[#6B7280]">{item.printType}</td>
                        <td className="px-4 py-4 text-[#374151]">{item.color} / {item.size}</td>
                        <td className="px-4 py-4">{item.quantity} Pcs</td>
                        <td className="px-4 py-4 font-mono text-sm">₹{item.unitPrice}</td>
                        <td className="px-4 py-4 text-right font-black font-mono text-sm">₹{item.totalPrice.toLocaleString('en-IN')}</td>
                      </tr>
                      {item.variants && item.variants.length > 0 && (
                        <tr className="bg-[#F8F9FC]">
                          <td colSpan={6} className="px-4 py-3 border-t border-[#E5E7EB]/50">
                            <div className="flex flex-wrap gap-2 items-center">
                              <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider pr-2 border-r border-[#D1D5DB] mr-1">Breakdown</span>
                              {item.variants.map((v, idx) => (
                                <div key={idx} className="flex items-center gap-1.5 text-xs bg-white border border-[#E5E7EB] px-2 py-1 rounded shadow-sm">
                                  {v.color && (
                                    <span className="flex items-center gap-1">
                                      <div className="w-2 h-2 rounded-full border border-gray-300" style={{ backgroundColor: v.color.toLowerCase() }}></div>
                                      <span className="font-medium text-[#374151]">{v.color}</span>
                                    </span>
                                  )}
                                  {v.size && <span className="text-[#6B7280] font-bold bg-gray-100 px-1 rounded">{v.size}</span>}
                                  <span className="font-black text-[#111111] ml-1">× {v.quantity}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Totals */}
            <div className="p-5 bg-[#FDFDFD] border-t border-[#E5E7EB] flex justify-end">
              <div className="w-full sm:w-72 space-y-3 text-xs font-semibold">
                <div className="flex justify-between text-[#6B7280] items-center">
                  <span>Subtotal</span>
                  <span className="text-[#111111] font-mono text-sm">₹{quote.subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-[#6B7280] items-center">
                  <span>{quote.isGstApplied === false ? 'GST (Off)' : `GST (${quote.gstRate ?? 5}%)`}</span>
                  <span className="text-[#111111] font-mono text-sm">₹{quote.gstTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-[#111111] font-black text-sm pt-3 border-t border-[#E5E7EB] items-center">
                  <span>Grand Total</span>
                  <span className="text-[#3B6FEB] text-lg font-mono tracking-tight">₹{quote.totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Activity Timeline & Note Input */}
        <div className="w-full lg:w-[320px] xl:w-[380px] shrink-0 space-y-6">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm p-5 flex flex-col h-full lg:max-h-[calc(100vh-140px)]">
            <h3 className="text-xs uppercase tracking-wider font-bold text-[#111111] flex items-center gap-2 border-b border-[#E5E7EB] pb-3 mb-4 shrink-0">
              <Clock className="w-4 h-4 text-[#3B6FEB]" /> Sales Activity & Timeline
            </h3>

            {/* Timeline Events */}
            <div className="space-y-5 overflow-y-auto flex-1 pr-1 custom-scrollbar">
              {quote.activities && quote.activities.length > 0 ? (
                quote.activities.map((act) => (
                  <div key={act.id} className="relative pl-5">
                    <div className="absolute w-2.5 h-2.5 bg-[#3B6FEB] rounded-full left-[1px] top-1 border-2 border-white shadow-sm ring-1 ring-[#3B6FEB]/20"></div>
                    <div className="absolute w-px h-full bg-[#E5E7EB] left-1 top-3.5 -z-10"></div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#3B6FEB] uppercase text-[9px] tracking-wider bg-[#EEF2FF] px-1.5 py-0.5 rounded border border-[#BFDBFE]">
                          {act.type}
                        </span>
                        <span className="text-[10px] text-[#6B7280]">
                          {new Date(act.createdAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                      <p className="text-[#111111] font-medium text-xs leading-relaxed">{act.message}</p>
                      {act.user && <p className="text-[10px] text-[#9CA3AF] font-medium">by {act.user.name}</p>}
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-[#F9FAFB] rounded-xl p-4 text-center border border-[#E5E7EB] border-dashed">
                  <p className="text-xs text-[#6B7280] font-medium">No sales activity logged yet.</p>
                </div>
              )}
            </div>

            {/* Add Internal Sales Note Form */}
            <form onSubmit={handleAddNote} className="space-y-3 pt-5 border-t border-[#E5E7EB] mt-4 shrink-0">
              <label className="text-xs font-bold text-[#111111] block">Add Internal Sales Note</label>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="e.g. Customer requested custom printing..."
                className="w-full p-3 text-xs font-medium border border-[#E5E7EB] rounded-xl focus:ring-2 focus:ring-[#3B6FEB] focus:border-[#3B6FEB] focus:outline-none bg-[#F9FAFB] placeholder:text-[#9CA3AF] transition-shadow resize-none"
                rows={3}
              />
              <Button
                type="submit"
                variant="black"
                size="md"
                disabled={addingNote || !noteText.trim()}
                className="w-full"
              >
                {addingNote ? 'ADDING NOTE...' : 'ADD NOTE'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
