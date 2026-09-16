'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { API_URL } from '@/lib/api';
import { buildWhatsAppUrl } from '@/lib/whatsapp';
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
  MapPin,
  Building,
  FileText,
  Clock,
  ArrowLeft,
  Package,
  Calendar,
  DollarSign,
  Send,
  X,
  Plus,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import VariantBreakdownEntry, { VariantData } from '@/components/shared/VariantBreakdownEntry';

interface InquiryActivity {
  id: string;
  type: string;
  message: string;
  createdAt: string;
  user?: { name: string; role?: string };
}

interface InquiryDetail {
  id: string;
  inquiryNumber: string;
  customerId?: string;
  customer?: { id: string; name: string; email?: string; phone?: string };
  companyId?: string;
  company?: { id: string; name: string; gstin?: string; address?: string };
  customerName?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  location?: string;
  customerType?: string;
  productId?: string;
  product?: {
    id: string;
    name: string;
    category?: { name: string };
    basePrice?: number;
    gstRate?: number;
    hsnCode?: string;
  };
  productInterest?: string;
  quantity?: number;
  printingType?: string;
  printPosition?: string;
  colors?: string;
  sizes?: string;
  artworkUrl?: string;
  deliveryDate?: string;
  budget?: string;
  customizationRequirements?: string;
  source: string;
  message?: string;
  status: string;
  assignedTo?: { id: string; name: string; email?: string; phone?: string };
  quoteId?: string;
  quote?: {
    id: string;
    quoteNumber: string;
    status: string;
    subtotal: number;
    gstTotal: number;
    isGstApplied: boolean;
    gstRate: number | null;
    totalAmount: number;
    createdAt: string;
    order?: { id: string; orderNumber: string; status: string };
    items?: Array<{
      id: string;
      productId: string;
      product?: { name: string; hsnCode?: string; gstRate?: number };
      printType: string;
      color: string;
      size: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      variants?: Array<{ color: string | null; size: string | null; quantity: number }>;
    }>;
  };
  variants?: Array<{ id?: string; color: string | null; size: string | null; quantity: number }>;
  activities?: InquiryActivity[];
  createdAt: string;
  updatedAt: string;
}

export default function AdminInquiryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [inquiry, setInquiry] = useState<InquiryDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [noteText, setNoteText] = useState<string>('');
  const [addingNote, setAddingNote] = useState<boolean>(false);
  const [updating, setUpdating] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Edit Drawer State
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editProductName, setEditProductName] = useState<string>('');
  const [editQty, setEditQty] = useState<number>(50);
  const [editPrintType, setEditPrintType] = useState<string>('');
  const [editPrintPosition, setEditPrintPosition] = useState<string>('');
  const [editUnitPrice, setEditUnitPrice] = useState<number>(249);
  const [editIsGstApplied, setEditIsGstApplied] = useState<boolean>(true);
  const [editGstRate, setEditGstRate] = useState<number>(5.0);
  const [editBudget, setEditBudget] = useState<string>('');
  const [editRequirements, setEditRequirements] = useState<string>('');
  const [editVariants, setEditVariants] = useState<VariantData[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch(`${API_URL}/products?status=ACTIVE`);
        if (res.ok) {
          const data = await res.json();
          const list = data.data || data;
          setAvailableProducts(Array.isArray(list) ? list : []);
        }
      } catch (e) {
        console.error('Failed to load products list', e);
      }
    }
    loadProducts();
  }, []);

  const fetchInquiryDetail = async () => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('zobra_token') : null;
      const res = await fetch(`${API_URL}/inquiries/${id}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (res.ok && data) {
        setInquiry(data);

        // Sync edit drawer initial state
        const initialQty = data.quantity || data.quote?.items?.[0]?.quantity || 50;
        setEditQty(initialQty);
        setEditProductName(data.product?.name || data.productInterest || '');
        setEditPrintType(data.printingType || '');

        // Normalize print position to Front, Back, or Both
        const rawPos = (data.printPosition || data.printingType || '').toLowerCase().trim();
        let normPos = '';
        if (rawPos.includes('both') || rawPos.includes('&')) normPos = 'Both';
        else if (rawPos.includes('back')) normPos = 'Back';
        else if (rawPos.includes('front')) normPos = 'Front';
        else if (data.printPosition && !['none', 'not provided', 'n/a', 'null', 'undefined'].includes(rawPos)) {
          normPos = data.printPosition;
        }
        setEditPrintPosition(normPos);
        setEditBudget(data.budget || '');
        setEditRequirements(data.customizationRequirements || data.message || '');
        
        const quoteItem = data.quote?.items?.[0];
        setEditUnitPrice(quoteItem?.unitPrice || data.product?.basePrice || 249);
        setEditIsGstApplied(data.quote?.isGstApplied ?? true);
        setEditGstRate(data.quote?.gstRate ?? data.product?.gstRate ?? 5.0);

        // Map variants from quote or inquiry
        const existingVariants = quoteItem?.variants || data.variants || [];
        if (existingVariants.length > 0) {
          setEditVariants(
            existingVariants.map((v: any) => ({
              color: v.color || '',
              size: v.size || '',
              quantity: v.quantity || 0,
            }))
          );
        } else {
          setEditVariants([]);
        }
      }
    } catch (error) {
      console.error('Failed to load inquiry detail:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchInquiryDetail();
  }, [id]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // WhatsApp Action
  const handleWhatsApp = async () => {
    const phone = inquiry?.customer?.phone || inquiry?.phone;
    if (!phone) {
      alert('Customer phone number is not available.');
      return;
    }

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('zobra_token') : null;
      const res = await fetch(`${API_URL}/inquiries/${id}/whatsapp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (data.link || data.whatsappUrl) {
        window.open(data.link || data.whatsappUrl, '_blank', 'noopener,noreferrer');
      } else {
        const cleanPhone = phone.replace(/\D/g, '');
        const name = inquiry?.customerName || inquiry?.customer?.name || 'there';
        let msg = `Hi ${name}, this is regarding your inquiry ${inquiry?.inquiryNumber} on ZOBBRA for ${inquiry?.product?.name || inquiry?.productInterest || 'custom merchandise'}.`;
        if (inquiry?.quote) {
          msg += ` Your quote ${inquiry.quote.quoteNumber} for ₹${inquiry.quote.totalAmount.toLocaleString('en-IN')} is ready.`;
        }
        window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
      }
      fetchInquiryDetail();
    } catch (err) {
      console.error('WhatsApp trigger error:', err);
    }
  };

  // One-Click Approve
  const handleApprove = async () => {
    if (!confirm('Are you sure you want to approve this inquiry and finalize its quote?')) return;
    setUpdating(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('zobra_token') : null;
      const res = await fetch(`${API_URL}/inquiries/${id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (res.ok) {
        triggerSidebarCountsRefresh();
        showToast('success', 'Inquiry and Quote have been approved!');
        await fetchInquiryDetail();
      } else {
        showToast('error', data.message || 'Failed to approve inquiry.');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Failed to approve inquiry.');
    } finally {
      setUpdating(false);
    }
  };

  // One-Click Reject
  const handleReject = async () => {
    const reason = prompt('Please enter a rejection reason (optional):');
    if (reason === null) return; // Cancelled
    setUpdating(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('zobra_token') : null;
      const res = await fetch(`${API_URL}/inquiries/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (res.ok) {
        triggerSidebarCountsRefresh();
        showToast('success', 'Inquiry has been rejected.');
        await fetchInquiryDetail();
      } else {
        showToast('error', data.message || 'Failed to reject inquiry.');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Failed to reject inquiry.');
    } finally {
      setUpdating(false);
    }
  };

  // Convert to Order (from linked quote)
  const handleConvertToOrder = async () => {
    if (!inquiry?.quoteId) {
      alert('Inquiry must be approved into a Quote before converting to an Order.');
      return;
    }
    setUpdating(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`${API_URL}/orders/from-quote/${inquiry.quoteId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      triggerSidebarCountsRefresh();
      router.push('/dashboard/orders');
    } catch (err) {
      triggerSidebarCountsRefresh();
      router.push('/dashboard/orders');
    } finally {
      setUpdating(false);
    }
  };

  // Save Edits
  const handleSaveEdits = async (andSendWhatsApp: boolean = false): Promise<boolean> => {
    setUpdating(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('zobra_token') : null;
      const res = await fetch(`${API_URL}/inquiries/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          productName: editProductName.trim(),
          quantity: editQty,
          printingType: editPrintPosition && editPrintPosition.toLowerCase() !== 'not provided' ? editPrintPosition : null,
          printPosition: editPrintPosition && editPrintPosition.toLowerCase() !== 'not provided' ? editPrintPosition : null,
          colors: editVariants.length > 0 ? Array.from(new Set(editVariants.map(v => v.color).filter(Boolean))).join(', ') : inquiry?.colors,
          sizes: editVariants.length > 0 ? Array.from(new Set(editVariants.map(v => v.size).filter(Boolean))).join(', ') : inquiry?.sizes,
          unitPrice: editUnitPrice,
          isGstApplied: editIsGstApplied,
          gstRate: editGstRate,
          budget: editBudget,
          customizationRequirements: editRequirements,
          variants: editVariants,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsEditing(false);
        showToast('success', 'Inquiry and quote specifications updated successfully!');
        await fetchInquiryDetail();
        if (andSendWhatsApp) {
          handleWhatsApp();
        }
        return true;
      } else {
        alert(data.message || 'Failed to save changes');
        return false;
      }
    } catch (err: any) {
      alert('Error updating inquiry: ' + err.message);
      return false;
    } finally {
      setUpdating(false);
    }
  };

  // Add Activity Note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    setAddingNote(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('zobra_token') : null;
      const res = await fetch(`${API_URL}/inquiries/${id}/activity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ type: 'NOTE', message: noteText }),
      });
      if (res.ok) {
        setNoteText('');
        fetchInquiryDetail();
      }
    } catch (err) {
      console.error('Failed to add note:', err);
    } finally {
      setAddingNote(false);
    }
  };

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt);
  };

  if (loading) {
    return (
      <div className="p-8 space-y-4 bg-[#F8F9FC] min-h-screen">
        <div className="h-8 w-48 bg-[#E5E7EB] animate-pulse rounded-lg" />
        <div className="h-64 w-full bg-[#E5E7EB] animate-pulse rounded-2xl" />
      </div>
    );
  }

  if (!inquiry) {
    return (
      <div className="p-8 text-center bg-[#F8F9FC] min-h-screen">
        <h2 className="text-2xl font-bold text-[#111111]">Inquiry Not Found</h2>
        <Link href="/dashboard/inquiries">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Inquiries
          </Button>
        </Link>
      </div>
    );
  }

  // Active variants for matrix display
  const activeVariants = inquiry.quote?.items?.[0]?.variants || inquiry.variants || [];
  const distinctColors = Array.from(new Set(activeVariants.map((v) => v.color?.trim()).filter(Boolean) as string[]));
  const distinctSizes = Array.from(new Set(activeVariants.map((v) => v.size?.trim()).filter(Boolean) as string[]));
  const hasColors = distinctColors.length > 0;
  const hasSizes = distinctSizes.length > 0;

  // Computed Pricing
  const quoteItem = inquiry.quote?.items?.[0];
  const unitPrice = quoteItem?.unitPrice || inquiry.product?.basePrice || 249;
  const totalQty = inquiry.quantity || quoteItem?.quantity || 50;
  const subtotal = inquiry.quote?.subtotal || (totalQty * unitPrice);
  const gstTotal = inquiry.quote?.gstTotal || (inquiry.quote?.isGstApplied !== false ? Math.round(subtotal * 0.05) : 0);
  const totalAmount = inquiry.quote?.totalAmount || (subtotal + gstTotal);

  return (
    <div className="space-y-8 bg-[#F8F9FC] min-h-screen pb-12 font-sans relative">
      {/* Toast Notification */}
      {feedback && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-bold shadow-lg flex items-center gap-2 border transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/dashboard/inquiries"
            className="text-xs text-[#6B7280] hover:text-[#111111] flex items-center gap-1 font-bold mb-2 transition-colors w-fit"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> BACK TO INQUIRIES
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-heading font-black text-[#111111] tracking-tight">{inquiry.inquiryNumber}</h1>
            <StatusBadge status={inquiry.status} />
            {inquiry.quote && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#EEF2FF] text-[#3B6FEB] border border-[#E0E7FF] flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" /> Quote: {inquiry.quote.status} ({inquiry.quote.quoteNumber})
              </span>
            )}
            {inquiry.quote?.order && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <ShoppingBag className="w-3.5 h-3.5" /> Order: {inquiry.quote.order.orderNumber}
              </span>
            )}
          </div>
          <p className="text-xs text-[#6B7280] font-medium mt-1">
            {inquiry.companyName || inquiry.company?.name || inquiry.customerName || inquiry.customer?.name} • Received on {new Date(inquiry.createdAt).toLocaleDateString('en-IN')}
          </p>
        </div>

        {/* Action Buttons Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* WhatsApp Button */}
          <Button
            onClick={handleWhatsApp}
            className="bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold flex items-center gap-2 shadow-sm min-h-[42px] px-4 rounded-xl"
            title="Open WhatsApp Chat"
          >
            <MessageSquare className="w-4 h-4" /> WhatsApp
          </Button>

          {/* Edit Specifications */}
          <Button
            onClick={() => setIsEditing(true)}
            variant="outline"
            className="bg-white border-[#E5E7EB] hover:bg-[#F9FAFB] text-[#111111] font-bold flex items-center gap-2 shadow-sm min-h-[42px] px-4 rounded-xl"
          >
            <Edit3 className="w-4 h-4 text-[#3B6FEB]" /> Edit Specs
          </Button>

          {/* Approve / Convert to Order / View Order Button */}
          {inquiry.quote?.order ? (
            <Link href="/dashboard/orders">
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-2 shadow-sm min-h-[42px] px-4 rounded-xl"
              >
                <ShoppingBag className="w-4 h-4" /> View Order ({inquiry.quote.order.orderNumber})
              </Button>
            </Link>
          ) : inquiry.status !== 'CONVERTED' || inquiry.quote?.status !== 'APPROVED' ? (
            <Button
              onClick={handleApprove}
              disabled={updating}
              className="bg-[#3B6FEB] hover:bg-[#2563EB] text-white font-bold flex items-center gap-2 shadow-sm min-h-[42px] px-4 rounded-xl"
            >
              <CheckCircle2 className="w-4 h-4" /> Approve
            </Button>
          ) : (
            <Button
              onClick={handleConvertToOrder}
              disabled={updating}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center gap-2 shadow-sm min-h-[42px] px-4 rounded-xl"
            >
              <ShoppingBag className="w-4 h-4" /> Convert to Order
            </Button>
          )}

          {/* Reject Button */}
          {inquiry.status !== 'LOST' && inquiry.status !== 'CLOSED' && !inquiry.quote?.order && (
            <Button
              onClick={handleReject}
              disabled={updating}
              variant="outline"
              className="bg-white border-rose-200 text-rose-600 hover:bg-rose-50 font-bold flex items-center gap-2 shadow-sm min-h-[42px] px-3.5 rounded-xl"
            >
              <XCircle className="w-4 h-4" /> Reject
            </Button>
          )}
        </div>
      </div>

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Inquiry Specifications + Variant Matrix + Pricing + Activity (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Inquiry Specifications & Requirements */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] flex items-center justify-center text-[#3B6FEB]">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#111111]">Inquiry Specifications</h2>
                  <p className="text-xs text-[#6B7280]">Customer request details and manufacturing parameters</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs font-bold text-[#3B6FEB] hover:underline flex items-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3.5 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]/70">
                <span className="text-[11px] font-bold uppercase text-[#6B7280] block mb-1">Product</span>
                <span className="text-sm font-bold text-[#111111] truncate block">
                  {inquiry.product?.name || inquiry.productInterest || 'Custom Merchandise'}
                </span>
                <span className="text-[10px] text-[#9CA3AF] block mt-0.5">{inquiry.product?.category?.name || 'Garments'}</span>
              </div>

              <div className="p-3.5 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]/70">
                <span className="text-[11px] font-bold uppercase text-[#6B7280] block mb-1">Quantity</span>
                <span className="text-sm font-black text-[#111111] block">
                  {(inquiry.quantity || quoteItem?.quantity || 50).toLocaleString()} Units
                </span>
                <span className="text-[10px] text-[#9CA3AF] block mt-0.5">Bulk batch</span>
              </div>

              <div className="p-3.5 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]/70">
                <span className="text-[11px] font-bold uppercase text-[#6B7280] block mb-1">Printing & Position</span>
                <span className="text-sm font-black text-[#111111] block">
                  {(() => {
                    const raw = (inquiry.printPosition || inquiry.printingType || quoteItem?.printType || '').trim().toLowerCase();
                    if (!raw || raw === 'null' || raw === 'undefined' || raw === 'not provided' || raw === 'none' || raw === 'n/a' || (raw === 'front only' && !inquiry.printPosition && !inquiry.printingType)) {
                      return <span className="text-[#9CA3AF] font-semibold text-xs italic">Not provided</span>;
                    }
                    if (raw.includes('both') || raw.includes('&')) return 'Both';
                    if (raw.includes('back')) return 'Back';
                    if (raw.includes('front')) return 'Front';
                    return inquiry.printPosition || inquiry.printingType || quoteItem?.printType;
                  })()}
                </span>
                <span className="text-[10px] text-[#9CA3AF] block mt-0.5">Print location</span>
              </div>
            </div>

            {/* Customization Requirements / Customer Message */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase text-[#6B7280] tracking-wider block">
                Requirements & Notes
              </span>
              <div className="p-4 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] text-sm text-[#374151] leading-relaxed">
                {inquiry.customizationRequirements || inquiry.message || 'No specific customization notes provided by customer.'}
              </div>
            </div>

            {/* Budget, Delivery & Artwork row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {inquiry.budget && (
                <div className="flex items-center gap-3 p-3 bg-white border border-[#E5E7EB] rounded-xl">
                  <DollarSign className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-[#9CA3AF] block">Target Budget</span>
                    <span className="text-xs font-bold text-[#111111] truncate block">{inquiry.budget}</span>
                  </div>
                </div>
              )}

              {inquiry.deliveryDate && (
                <div className="flex items-center gap-3 p-3 bg-white border border-[#E5E7EB] rounded-xl">
                  <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-[#9CA3AF] block">Target Delivery</span>
                    <span className="text-xs font-bold text-[#111111] truncate block">
                      {new Date(inquiry.deliveryDate).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                </div>
              )}

              {inquiry.artworkUrl && (
                <div className="flex items-center gap-3 p-3 bg-white border border-[#E5E7EB] rounded-xl">
                  <ExternalLink className="w-4 h-4 text-[#3B6FEB] shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-[#9CA3AF] block">Artwork Reference</span>
                    <a
                      href={inquiry.artworkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-[#3B6FEB] hover:underline truncate block"
                    >
                      View Artwork File ↗
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Quantity Variant Breakdown Matrix */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2.5">
                <Tag className="w-4 h-4 text-[#3B6FEB]" />
                <h2 className="text-base font-bold text-[#111111]">Variant Quantity Breakdown</h2>
              </div>
              <span className="text-xs text-[#6B7280] font-semibold">
                Total: {(inquiry.quantity || quoteItem?.quantity || 50).toLocaleString()} pcs
              </span>
            </div>

            {activeVariants && activeVariants.length > 0 ? (
              <div className="space-y-4">
                {/* Case 1: 2D Matrix if both color and size exist */}
                {hasColors && hasSizes ? (
                  <div className="overflow-x-auto border border-[#E5E7EB] rounded-xl">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#F9FAFB] text-[#6B7280] uppercase font-bold border-b border-[#E5E7EB]">
                        <tr>
                          <th className="px-4 py-3">Color</th>
                          {distinctSizes.map((sz) => (
                            <th key={sz} className="px-4 py-3 text-center">
                              {sz}
                            </th>
                          ))}
                          <th className="px-4 py-3 text-right bg-[#EEF2FF]/60 text-[#3B6FEB]">Row Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E7EB]">
                        {distinctColors.map((clr) => {
                          let rowSum = 0;
                          return (
                            <tr key={clr} className="hover:bg-gray-50/60">
                              <td className="px-4 py-3 font-bold text-[#111111] flex items-center gap-2">
                                <span
                                  className="w-3.5 h-3.5 rounded-full border border-gray-300 inline-block shrink-0 shadow-sm"
                                  style={{ backgroundColor: clr.toLowerCase() }}
                                />
                                <span>{clr}</span>
                              </td>
                              {distinctSizes.map((sz) => {
                                const match = activeVariants.find(
                                  (v) => v.color?.trim() === clr && v.size?.trim() === sz
                                );
                                const qty = match ? match.quantity : 0;
                                rowSum += qty;
                                return (
                                  <td key={sz} className="px-4 py-3 text-center text-[#374151] font-semibold">
                                    {qty > 0 ? qty : <span className="text-gray-300">-</span>}
                                  </td>
                                );
                              })}
                              <td className="px-4 py-3 text-right font-black text-[#3B6FEB] bg-[#EEF2FF]/30">
                                {rowSum}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-[#F9FAFB] font-black border-t border-[#E5E7EB]">
                        <tr>
                          <td className="px-4 py-3 text-[#111111]">Column Total</td>
                          {distinctSizes.map((sz) => {
                            const colSum = activeVariants
                              .filter((v) => v.size?.trim() === sz)
                              .reduce((sum, v) => sum + v.quantity, 0);
                            return (
                              <td key={sz} className="px-4 py-3 text-center text-[#111111]">
                                {colSum}
                              </td>
                            );
                          })}
                          <td className="px-4 py-3 text-right text-emerald-600 bg-[#EEF2FF]/60 text-sm font-black">
                            {activeVariants.reduce((sum, v) => sum + v.quantity, 0)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : hasColors ? (
                  /* Case 2: Only Colors breakdown */
                  <div className="overflow-x-auto border border-[#E5E7EB] rounded-xl">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#F9FAFB] text-[#6B7280] uppercase font-bold border-b border-[#E5E7EB]">
                        <tr>
                          <th className="px-4 py-3">Color</th>
                          <th className="px-4 py-3 text-right">Quantity</th>
                          <th className="px-4 py-3 text-right bg-[#EEF2FF]/60 text-[#3B6FEB]">Share</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E7EB]">
                        {distinctColors.map((clr) => {
                          const clrQty = activeVariants
                            .filter((v) => v.color?.trim() === clr)
                            .reduce((sum, v) => sum + v.quantity, 0);
                          const total = activeVariants.reduce((sum, v) => sum + v.quantity, 0);
                          const pct = total > 0 ? Math.round((clrQty / total) * 100) : 0;
                          return (
                            <tr key={clr} className="hover:bg-gray-50/60">
                              <td className="px-4 py-3 font-bold text-[#111111] flex items-center gap-2">
                                <span
                                  className="w-3.5 h-3.5 rounded-full border border-gray-300 inline-block shrink-0 shadow-sm"
                                  style={{ backgroundColor: clr.toLowerCase() }}
                                />
                                <span>{clr}</span>
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-[#111111]">{clrQty} pcs</td>
                              <td className="px-4 py-3 text-right font-semibold text-[#3B6FEB] bg-[#EEF2FF]/30">{pct}%</td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-[#F9FAFB] font-black border-t border-[#E5E7EB]">
                        <tr>
                          <td className="px-4 py-3 text-[#111111]">Total</td>
                          <td className="px-4 py-3 text-right text-emerald-600 text-sm font-black">
                            {activeVariants.reduce((sum, v) => sum + v.quantity, 0)} pcs
                          </td>
                          <td className="px-4 py-3 text-right text-emerald-600 bg-[#EEF2FF]/60 font-black">100%</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : hasSizes ? (
                  /* Case 3: Only Sizes breakdown */
                  <div className="overflow-x-auto border border-[#E5E7EB] rounded-xl">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#F9FAFB] text-[#6B7280] uppercase font-bold border-b border-[#E5E7EB]">
                        <tr>
                          <th className="px-4 py-3">Size</th>
                          <th className="px-4 py-3 text-right">Quantity</th>
                          <th className="px-4 py-3 text-right bg-[#EEF2FF]/60 text-[#3B6FEB]">Share</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E7EB]">
                        {distinctSizes.map((sz) => {
                          const szQty = activeVariants
                            .filter((v) => v.size?.trim() === sz)
                            .reduce((sum, v) => sum + v.quantity, 0);
                          const total = activeVariants.reduce((sum, v) => sum + v.quantity, 0);
                          const pct = total > 0 ? Math.round((szQty / total) * 100) : 0;
                          return (
                            <tr key={sz} className="hover:bg-gray-50/60">
                              <td className="px-4 py-3 font-bold text-[#111111]">
                                <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-800 font-bold">{sz}</span>
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-[#111111]">{szQty} pcs</td>
                              <td className="px-4 py-3 text-right font-semibold text-[#3B6FEB] bg-[#EEF2FF]/30">{pct}%</td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-[#F9FAFB] font-black border-t border-[#E5E7EB]">
                        <tr>
                          <td className="px-4 py-3 text-[#111111]">Total</td>
                          <td className="px-4 py-3 text-right text-emerald-600 text-sm font-black">
                            {activeVariants.reduce((sum, v) => sum + v.quantity, 0)} pcs
                          </td>
                          <td className="px-4 py-3 text-right text-emerald-600 bg-[#EEF2FF]/60 font-black">100%</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  /* Case 4: Itemized variants without explicit color/size */
                  <div className="flex flex-wrap gap-2">
                    {activeVariants.map((v, i) => (
                      <div key={i} className="px-3 py-1.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-xs font-semibold">
                        Qty: {v.quantity}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center bg-[#F9FAFB] border border-dashed border-[#E5E7EB] rounded-xl space-y-2">
                <p className="text-xs text-[#6B7280]">
                  No itemized variant breakdown recorded. The entire batch of {(inquiry.quantity || 50)} units is uniform.
                </p>
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  size="sm"
                  className="text-xs font-bold text-[#3B6FEB]"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Color / Size Matrix
                </Button>
              </div>
            )}
          </div>

          {/* Card 3: Commercial / Quote Pricing Breakdown */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#111111]">Commercial & Pricing Summary</h2>
                  <p className="text-xs text-[#6B7280]">
                    {inquiry.quote ? `Quote #${inquiry.quote.quoteNumber}` : 'Estimated pricing for this inquiry'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs font-bold text-[#3B6FEB] hover:underline flex items-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" /> Adjust Pricing
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm py-1.5 border-b border-gray-100">
                <span className="text-[#6B7280]">Unit Base Price</span>
                <span className="font-semibold text-[#111111]">{formatCurrency(unitPrice)} / piece</span>
              </div>
              <div className="flex justify-between items-center text-sm py-1.5 border-b border-gray-100">
                <span className="text-[#6B7280]">Quantity</span>
                <span className="font-semibold text-[#111111]">{totalQty.toLocaleString()} pieces</span>
              </div>
              <div className="flex justify-between items-center text-sm py-1.5 border-b border-gray-100">
                <span className="text-[#6B7280]">Subtotal</span>
                <span className="font-semibold text-[#111111]">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-sm py-1.5 border-b border-gray-100">
                <span className="text-[#6B7280]">
                  GST ({inquiry.quote?.isGstApplied !== false ? `${inquiry.quote?.gstRate || 5}%` : 'Exempt'})
                </span>
                <span className="font-semibold text-[#111111]">{formatCurrency(gstTotal)}</span>
              </div>
              <div className="flex justify-between items-center text-lg font-black pt-2 text-[#111111]">
                <span>Total Amount</span>
                <span className="text-emerald-600">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Card 4: Activity Log & Notes */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-[#3B6FEB]" />
                <h2 className="text-base font-bold text-[#111111]">Activity Log & History</h2>
              </div>
            </div>

            {/* Quick Add Note Form */}
            <form onSubmit={handleAddNote} className="flex gap-2">
              <input
                type="text"
                placeholder="Log a call, WhatsApp update, or internal note..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="flex-1 px-3.5 py-2 text-xs border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B6FEB]"
              />
              <Button
                type="submit"
                disabled={addingNote || !noteText.trim()}
                size="sm"
                className="bg-[#3B6FEB] hover:bg-[#2563EB] text-white font-bold px-4 rounded-xl text-xs"
              >
                {addingNote ? 'Saving...' : 'Add Note'}
              </Button>
            </form>

            {/* Activities List */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {inquiry.activities && inquiry.activities.length > 0 ? (
                inquiry.activities.map((act) => (
                  <div key={act.id} className="p-3 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] text-xs">
                    <p className="font-semibold text-[#111111]">{act.message}</p>
                    <p className="text-[10px] text-[#9CA3AF] mt-1">
                      {new Date(act.createdAt).toLocaleString('en-IN')} • {act.user?.name || 'System'}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#9CA3AF] text-center py-4">No activity logged yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Customer / Person Details + Metadata (1 col) */}
        <div className="space-y-6">
          {/* Card: Customer / Person Profile */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-[#E5E7EB]">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#111111]">Customer Profile</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#EEF2FF] text-[#3B6FEB]">
                  {inquiry.customerType || (inquiry.customerId ? 'REGISTERED' : 'GUEST')}
                </span>
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#9CA3AF] block">Person Name</span>
                <span className="font-bold text-[#111111] text-sm block">
                  {inquiry.customerName || inquiry.customer?.name || 'Customer'}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-[#9CA3AF] block">Company / Brand</span>
                <span className="font-semibold text-[#374151] block flex items-center gap-1 mt-0.5">
                  <Building className="w-3.5 h-3.5 text-[#6B7280]" />
                  {inquiry.companyName || inquiry.company?.name || 'Individual Customer'}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-[#9CA3AF] block">Phone Number</span>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="font-bold text-[#111111] text-sm">
                    {inquiry.phone || inquiry.customer?.phone || 'Not provided'}
                  </span>
                  {(inquiry.phone || inquiry.customer?.phone) && (
                    <button
                      onClick={handleWhatsApp}
                      className="text-[10px] font-bold text-[#25D366] hover:underline flex items-center gap-1"
                    >
                      <MessageSquare className="w-3 h-3" /> WhatsApp
                    </button>
                  )}
                </div>
              </div>

              {inquiry.email && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#9CA3AF] block">Email</span>
                  <a
                    href={`mailto:${inquiry.email}`}
                    className="font-medium text-[#3B6FEB] hover:underline block truncate mt-0.5"
                  >
                    {inquiry.email}
                  </a>
                </div>
              )}

              {inquiry.location && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#9CA3AF] block">Location</span>
                  <span className="font-medium text-[#374151] flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-[#6B7280]" />
                    {inquiry.location}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Card: Inquiry Meta & Lead Source */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-[#111111] pb-3 border-b border-[#E5E7EB]">
              Lead Information
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="text-[#6B7280]">Source</span>
                <span className="font-bold text-[#111111] capitalize">{inquiry.source.toLowerCase()}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-[#6B7280]">Assigned Rep</span>
                <span className="font-bold text-[#111111]">{inquiry.assignedTo?.name || 'Unassigned'}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-[#6B7280]">Inquiry Date</span>
                <span className="font-semibold text-[#111111]">{new Date(inquiry.createdAt).toLocaleDateString('en-IN')}</span>
              </div>
              {inquiry.quote && (
                <div className="flex justify-between items-center py-1">
                  <span className="text-[#6B7280]">Quote Ref</span>
                  <span className="font-bold text-[#3B6FEB]">{inquiry.quote.quoteNumber}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── SLIDE-OVER DRAWER: EDIT INQUIRY & QUOTE SPECIFICATIONS ── */}
      {isEditing && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#111111]">Edit Inquiry Specifications</h3>
                <p className="text-xs text-[#6B7280]">Update manufacturing specifications, quantities, and pricing</p>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="p-2 text-[#6B7280] hover:text-[#111111] rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Product Name */}
              <div>
                <label className="text-xs font-bold text-[#111111] block mb-1.5">
                  Product Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  list="product-name-suggestions"
                  value={editProductName}
                  onChange={(e) => setEditProductName(e.target.value)}
                  placeholder="e.g. Polo round neck, Premium Polo T-Shirt"
                  className="w-full px-3.5 py-2.5 border border-[#E5E7EB] rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#3B6FEB]"
                />
                <datalist id="product-name-suggestions">
                  {availableProducts.map((p) => (
                    <option key={p.id} value={p.name} />
                  ))}
                </datalist>
              </div>

              {/* Total Quantity */}
              <div>
                <label className="text-xs font-bold text-[#111111] block mb-1">
                  Total Order Quantity (Units) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={editQty}
                  onChange={(e) => setEditQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3.5 py-2.5 border border-[#E5E7EB] rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#3B6FEB]"
                />
              </div>

              {/* Printing & Position */}
              <div>
                <label className="text-xs font-bold text-[#111111] block mb-1.5">
                  Printing & Position <span className="text-[#9CA3AF] font-normal">(Optional)</span>
                </label>
                <div className="grid grid-cols-4 gap-2 p-1.5 bg-[#F3F4F6] rounded-xl border border-[#E5E7EB]">
                  {[
                    { label: 'Not Provided', val: '' },
                    { label: 'Front', val: 'Front' },
                    { label: 'Back', val: 'Back' },
                    { label: 'Both', val: 'Both' },
                  ].map(({ label, val }) => {
                    const isSelected = val === ''
                      ? (!editPrintPosition || editPrintPosition.toLowerCase() === 'not provided')
                      : (editPrintPosition.toLowerCase() === val.toLowerCase() ||
                         (val === 'Both' && (editPrintPosition.toLowerCase().includes('both') || editPrintPosition.toLowerCase().includes('&'))));
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => {
                          setEditPrintPosition(val);
                          setEditPrintType(val);
                        }}
                        className={`py-2.5 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center cursor-pointer ${
                          isSelected
                            ? 'bg-[#3B6FEB] text-white shadow-sm'
                            : 'text-[#6B7280] hover:text-[#111111] hover:bg-white/60'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>


              {/* Pricing Overrides */}
              <div className="p-4 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] space-y-3">
                <span className="text-xs font-bold text-[#111111] uppercase tracking-wider block">
                  Commercial Pricing
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-[#6B7280] block mb-1 font-semibold">Unit Price (₹)</label>
                    <input
                      type="number"
                      min="1"
                      value={editUnitPrice}
                      onChange={(e) => setEditUnitPrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm font-bold bg-white focus:outline-none focus:ring-2 focus:ring-[#3B6FEB]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-[#6B7280] block mb-1 font-semibold">GST Rate (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="28"
                      value={editGstRate}
                      onChange={(e) => setEditGstRate(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm font-bold bg-white focus:outline-none focus:ring-2 focus:ring-[#3B6FEB]"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="editGstCheck"
                    checked={editIsGstApplied}
                    onChange={(e) => setEditIsGstApplied(e.target.checked)}
                    className="rounded text-[#3B6FEB] focus:ring-[#3B6FEB] h-4 w-4"
                  />
                  <label htmlFor="editGstCheck" className="text-xs font-semibold text-[#374151]">
                    Apply GST to this Quote ({editGstRate}%)
                  </label>
                </div>
              </div>

              {/* Variant Matrix Entry */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#111111] uppercase tracking-wider block">
                  Color + Size Breakdown Matrix
                </span>
                <div className="border border-[#E5E7EB] rounded-xl p-3 bg-white">
                  <VariantBreakdownEntry
                    totalQuantity={editQty}
                    requiresColor={true}
                    requiresSize={true}
                    supportsMatrix={true}
                    variants={editVariants}
                    onChange={setEditVariants}
                  />
                </div>
              </div>

              {/* Notes & Customization Requirements */}
              <div>
                <label className="text-xs font-bold text-[#111111] block mb-1">Customization Requirements</label>
                <textarea
                  rows={3}
                  value={editRequirements}
                  onChange={(e) => setEditRequirements(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#E5E7EB] rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#3B6FEB]"
                />
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="px-6 py-4 border-t border-[#E5E7EB] bg-[#F9FAFB] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-[#6B7280]">
                Estimated Total:{' '}
                <strong className="text-emerald-600 font-black text-sm">
                  {formatCurrency(
                    editQty * editUnitPrice +
                      (editIsGstApplied ? Math.round(editQty * editUnitPrice * (editGstRate / 100)) : 0)
                  )}
                </strong>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  onClick={() => setIsEditing(false)}
                  variant="outline"
                  className="px-4 py-2 font-bold text-xs"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleSaveEdits(false)}
                  disabled={updating}
                  className="bg-[#3B6FEB] hover:bg-[#2563EB] text-white font-bold px-4 py-2 text-xs"
                >
                  {updating ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  onClick={() => handleSaveEdits(true)}
                  disabled={updating}
                  className="bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold px-4 py-2 text-xs flex items-center gap-1.5"
                >
                  <Send className="w-3 h-3" /> Save & Send
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
