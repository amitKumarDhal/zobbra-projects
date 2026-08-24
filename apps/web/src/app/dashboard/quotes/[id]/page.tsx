'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  MessageSquare,
  Send,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  Edit3,
  User,
  Building,
  Phone,
  Mail,
  FileText,
  Clock,
  ArrowLeft,
  DollarSign,
  Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

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
  discount: number;
  totalAmount: number;
  notes?: string;
  createdAt: string;
  customer?: { id: string; name: string; email: string; phone?: string };
  company?: { id: string; name: string; gstin?: string; address?: string };
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
  const [updating, setUpdating] = useState<boolean>(false);

  const fetchQuoteDetail = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('zobra_token') : null;
      const res = await fetch(`http://localhost:5000/api/v1/quotes/${id}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (res.ok && data.success && data.quote) {
        setQuote(data.quote);
        if (data.quote.items && data.quote.items[0]) {
          setEditQty(data.quote.items[0].quantity);
          setEditPrintType(data.quote.items[0].printType);
          setEditColor(data.quote.items[0].color);
          setEditSize(data.quote.items[0].size);
        }
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
      const res = await fetch(`http://localhost:5000/api/v1/quotes/${id}/activity`, {
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
      const res = await fetch(`http://localhost:5000/api/v1/quotes/${id}/whatsapp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ template: templateKey }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.whatsappUrl) {
        window.open(data.whatsappUrl, '_blank');
        fetchQuoteDetail();
      } else {
        const cleanPhone = (quote?.customer?.phone || '919876543210').replace(/\D/g, '');
        const text = encodeURIComponent(`Hello ${quote?.customer?.name || 'Customer'}! Regarding Quote #${quote?.quoteNumber}: ${quote?.totalAmount}.`);
        window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
      }
    } catch (err) {
      console.error('Failed to trigger WhatsApp click:', err);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    setUpdating(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('zobra_token') : null;
      const res = await fetch(`http://localhost:5000/api/v1/quotes/${id}/status`, {
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

  const handleSaveEdits = async () => {
    setUpdating(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('zobra_token') : null;
      const res = await fetch(`http://localhost:5000/api/v1/quotes/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          quantity: editQty,
          printType: editPrintType,
          color: editColor,
          size: editSize,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsEditing(false);
        fetchQuoteDetail();
      }
    } catch (err) {
      console.error('Failed to save quote edits:', err);
    } finally {
      setUpdating(false);
    }
  };


  const handleConvertToOrder = async () => {
    setUpdating(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`http://localhost:5000/api/v1/orders/from-quote/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        router.push('/dashboard/orders');
      } else {
        router.push('/dashboard/orders');
      }
    } catch (err) {
      router.push('/dashboard/orders');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-4 bg-[#F7F5F2] min-h-screen">
        <div className="h-8 w-48 bg-gray-200 animate-pulse rounded-lg" />
        <div className="h-64 w-full bg-gray-200 animate-pulse rounded-xl" />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="p-8 text-center bg-[#F7F5F2] min-h-screen">
        <h2 className="text-2xl font-bold text-[#1C1C1C]">Quote Not Found</h2>
        <Link href="/dashboard/quotes">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Quotes
          </Button>
        </Link>
      </div>
    );
  }

  const firstItem = quote.items && quote.items[0];

  return (
    <div className="space-y-8 bg-[#F7F5F2] min-h-screen pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/dashboard/quotes" className="text-xs text-[#5F6368] hover:text-[#C75B39] flex items-center gap-1 font-bold mb-2">
            <ArrowLeft className="w-3.5 h-3.5" /> BACK TO QUOTES
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-serif font-black text-[#1C1C1C]">{quote.quoteNumber}</h1>
            <Badge
              variant={
                quote.status === 'APPROVED' ? 'success' : quote.status === 'REJECTED' ? 'secondary' : 'gold'
              }
            >
              {quote.status}
            </Badge>
          </div>
          <p className="text-xs text-[#5F6368] mt-1">{quote.company?.name || quote.customer?.name} • Created on {new Date(quote.createdAt).toLocaleDateString('en-IN')}</p>
        </div>

        {/* Action Buttons Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="terracotta"
            size="sm"
            data-cy="whatsapp-link"
            onClick={() => handleWhatsAppClick('NEW_QUOTE')}
            className="gap-2 font-bold bg-[#25D366] hover:bg-[#1EBE57] text-white border-none"
          >
            <MessageSquare className="w-4 h-4 fill-white" /> WHATSAPP CUSTOMER
          </Button>

          <Button
            variant="outline"
            size="sm"
            data-cy="admin-update-qty-btn"
            onClick={() => setIsEditing(!isEditing)}
            className="gap-1.5 font-bold border-[#E7E3DD] bg-white text-[#1C1C1C]"
          >
            <Edit3 className="w-4 h-4 text-[#C75B39]" /> EDIT QUOTE
          </Button>

          {quote.status !== 'APPROVED' && quote.status !== 'REJECTED' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUpdateStatus('APPROVED')}
                disabled={updating}
                className="gap-1.5 font-bold bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
              >
                <CheckCircle2 className="w-4 h-4" /> APPROVE
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUpdateStatus('REJECTED')}
                disabled={updating}
                className="gap-1.5 font-bold bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100"
              >
                <XCircle className="w-4 h-4" /> REJECT
              </Button>
            </>
          )}

          {quote.status === 'APPROVED' && (
            <Button
              variant="terracotta"
              size="sm"
              onClick={handleConvertToOrder}
              disabled={updating}
              className="gap-2 font-bold bg-[#1A5653] text-[#D4A953] hover:bg-[#123D3B]"
            >
              <ShoppingBag className="w-4 h-4" /> CONVERT TO ORDER
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Customer Info & Quote Items */}
        <div className="lg:col-span-2 space-y-8">
          {/* Customer Profile Card */}
          <Card className="bg-white border-[#E7E3DD] p-6 space-y-4 shadow-sm">
            <h3 className="text-sm uppercase tracking-wider font-bold text-[#5F6368] flex items-center gap-2">
              <User className="w-4 h-4 text-[#C75B39]" /> Customer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
              <div>
                <span className="text-[#5F6368] block text-[11px]">Customer Name</span>
                <span className="text-[#1C1C1C] font-bold text-sm">{quote.customer?.name || 'Rahul Mishra'}</span>
              </div>
              <div>
                <span className="text-[#5F6368] block text-[11px]">Company Name</span>
                <span className="text-[#1C1C1C] font-bold text-sm">{quote.company?.name || 'Acme Tech Pvt Ltd'}</span>
              </div>
              <div>
                <span className="text-[#5F6368] block text-[11px]">Phone Number</span>
                <span className="text-[#1A5653] font-mono font-bold flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" /> {quote.customer?.phone || '+91 98765 43210'}
                </span>
              </div>
              <div>
                <span className="text-[#5F6368] block text-[11px]">Email Address</span>
                <span className="text-[#1C1C1C] font-mono flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-[#5F6368]" /> {quote.customer?.email || 'rahul@acme.com'}
                </span>
              </div>
              <div>
                <span className="text-[#5F6368] block text-[11px]">GSTIN</span>
                <span className="text-[#1C1C1C] font-mono">{quote.company?.gstin || '21AAACA1234A1Z5'}</span>
              </div>
              <div>
                <span className="text-[#5F6368] block text-[11px]">Delivery Address</span>
                <span className="text-[#1C1C1C]">{quote.notes || 'Plot 402, Fortune Tower, Bhubaneswar'}</span>
              </div>
            </div>
          </Card>

          {/* Edit Form Drawer if active */}
          {isEditing && (
            <Card className="bg-amber-50 border-amber-200 p-6 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-amber-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-700" /> Edit Quote Specifications (Server Recalculates Price)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold">
                <div>
                  <label className="text-[#5F6368] block mb-1">Quantity</label>
                  <input
                    type="number"
                    data-cy="admin-qty-input"
                    value={editQty || ''}
                    onChange={(e) => setEditQty(e.target.value === '' ? 0 : Number(e.target.value))}
                    className="w-full p-2 border border-[#E7E3DD] rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="text-[#5F6368] block mb-1">Print Type</label>
                  <select
                    value={editPrintType}
                    onChange={(e) => setEditPrintType(e.target.value)}
                    className="w-full p-2 border border-[#E7E3DD] rounded-lg bg-white"
                  >
                    <option value="Front Only">Front Only</option>
                    <option value="Back Only">Back Only</option>
                    <option value="Front & Back Print">Front & Back Print</option>
                    <option value="Embroidery Logo">Embroidery Logo</option>
                  </select>
                </div>
                <div>
                  <label className="text-[#5F6368] block mb-1">Color</label>
                  <input
                    type="text"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    className="w-full p-2 border border-[#E7E3DD] rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="text-[#5F6368] block mb-1">Size</label>
                  <input
                    type="text"
                    value={editSize}
                    onChange={(e) => setEditSize(e.target.value)}
                    className="w-full p-2 border border-[#E7E3DD] rounded-lg bg-white"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button variant="terracotta" size="sm" data-cy="admin-save-quote-btn" onClick={handleSaveEdits} disabled={updating}>
                  SAVE & RECALCULATE PRICE
                </Button>
              </div>
            </Card>
          )}

          {/* Quote Item Details Breakdown */}
          <Card className="bg-white border-[#E7E3DD] p-0 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-[#E7E3DD] bg-[#F7F5F2]">
              <h3 className="text-xs uppercase tracking-wider font-bold text-[#5F6368] flex items-center gap-2">
                <Package className="w-4 h-4 text-[#C75B39]" /> Line Item Specifications
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E7E3DD] text-[#5F6368] font-bold">
                      <th className="pb-2">Product Description</th>
                      <th className="pb-2">Print Customization</th>
                      <th className="pb-2">Color / Size</th>
                      <th className="pb-2">Qty</th>
                      <th className="pb-2">Unit Rate</th>
                      <th className="pb-2 text-right">Total Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7E3DD] font-semibold text-[#1C1C1C]">
                    {quote.items?.map((item) => (
                      <tr key={item.id}>
                        <td className="py-3 font-bold text-[#1A5653]">{item.product?.name || 'Customized Polo T-Shirt (200 GSM)'}</td>
                        <td className="py-3 text-[#5F6368]">{item.printType}</td>
                        <td className="py-3">{item.color} / {item.size}</td>
                        <td className="py-3">{item.quantity} Pcs</td>
                        <td className="py-3">₹{item.unitPrice}</td>
                        <td className="py-3 text-right font-black">₹{item.totalPrice.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Totals */}
              <div className="border-t border-[#E7E3DD] pt-4 flex justify-end">
                <div className="w-full sm:w-64 space-y-2 text-xs font-semibold">
                  <div className="flex justify-between text-[#5F6368]">
                    <span>Subtotal</span>
                    <span className="text-[#1C1C1C]">₹{quote.subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-[#5F6368]">
                    <span>GST (5% HSN 6109)</span>
                    <span className="text-[#1C1C1C]">₹{quote.gstTotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-[#1C1C1C] font-black text-sm pt-2 border-t border-[#E7E3DD]">
                    <span>Grand Total</span>
                    <span className="text-[#C75B39]">₹{quote.totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Activity Timeline & Note Input */}
        <div className="space-y-8">
          <Card className="bg-white border-[#E7E3DD] p-6 space-y-6 shadow-sm">
            <h3 className="text-sm uppercase tracking-wider font-bold text-[#5F6368] flex items-center gap-2 border-b border-[#E7E3DD] pb-3">
              <Clock className="w-4 h-4 text-[#C75B39]" /> Sales Activity & Timeline
            </h3>

            {/* Timeline Events */}
            <div className="space-y-4">
              {quote.activities && quote.activities.length > 0 ? (
                quote.activities.map((act) => (
                  <div key={act.id} className="flex gap-3 text-xs border-l-2 border-[#1A5653] pl-3 py-1">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#1A5653] uppercase text-[10px] tracking-wider bg-[#F7F5F2] px-2 py-0.5 rounded">
                          {act.type}
                        </span>
                        <span className="text-[10px] text-[#5F6368]">
                          {new Date(act.createdAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                      <p className="text-[#1C1C1C] font-medium">{act.message}</p>
                      {act.user && <p className="text-[10px] text-[#5F6368]">by {act.user.name}</p>}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#5F6368] italic">No sales activity logged yet.</p>
              )}
            </div>

            {/* Add Internal Sales Note Form */}
            <form onSubmit={handleAddNote} className="space-y-3 pt-4 border-t border-[#E7E3DD]">
              <label className="text-xs font-bold text-[#1C1C1C] block">Add Internal Sales Note</label>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="e.g. Customer requested 150 units with custom embroidery on back..."
                className="w-full p-3 text-xs border border-[#E7E3DD] rounded-xl focus:ring-2 focus:ring-[#C75B39] focus:outline-none bg-[#F7F5F2]"
                rows={3}
              />
              <Button
                type="submit"
                variant="terracotta"
                size="sm"
                disabled={addingNote || !noteText.trim()}
                className="w-full font-bold"
              >
                {addingNote ? 'ADDING NOTE...' : 'ADD NOTE'}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
