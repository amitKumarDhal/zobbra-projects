'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Download, Send, CheckCircle2, FileText, MessageSquare, Edit3, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { apiClient, formatINR } from '@/lib/api';

export default function AdminQuotesPage() {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<any>(null);
  const [emailNotice, setEmailNotice] = useState<string | null>(null);

  // Edit form state
  const [editQty, setEditQty] = useState(50);
  const [editColor, setEditColor] = useState('Navy Blue');
  const [editSize, setEditSize] = useState('L');
  const [editPrintType, setEditPrintType] = useState('Front Only');
  const [editNotes, setEditNotes] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/quotes');
      if (res.data.success) {
        setQuotes(res.data.quotes || []);
      }
    } catch (err) {
      console.error('Failed to fetch admin quotes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, []);

  const handleSendQuote = async (quoteId: string, quoteNumber: string, email: string) => {
    try {
      const res = await apiClient.patch(`/quotes/${quoteId}/status`, { status: 'SENT' });
      if (res.data.success) {
        setEmailNotice(`Quotation #${quoteNumber} status set to SENT & notified client (${email || 'client@acme.com'})`);
        fetchQuotes();
        setTimeout(() => setEmailNotice(null), 4000);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update quote status');
    }
  };

  const handleOpenEditModal = (q: any) => {
    setEditingQuote(q);
    const item = q.items && q.items[0];
    setEditQty(item?.quantity || 50);
    setEditColor(item?.color || 'Navy Blue');
    setEditSize(item?.size || 'L');
    setEditPrintType(item?.printType || 'Front Only');
    setEditNotes(q.notes || '');
  };

  const handleSaveReprice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuote) return;
    setSavingEdit(true);

    try {
      const res = await apiClient.patch(`/quotes/${editingQuote.id}/edit`, {
        quantity: editQty,
        color: editColor,
        size: editSize,
        printType: editPrintType,
        notes: editNotes,
      });

      if (res.data.success) {
        setEmailNotice(`Quotation #${editingQuote.quoteNumber} repriced & updated successfully in PostgreSQL!`);
        setEditingQuote(null);
        fetchQuotes();
        setTimeout(() => setEmailNotice(null), 4000);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to edit quote');
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Quote Management (PostgreSQL DB)</h1>
          <p className="text-xs text-slate-500 font-semibold">Reprice quotes, calculate Indian GST tax, contact via WhatsApp click-to-chat.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchQuotes} className="gap-1">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button variant="secondary" onClick={() => setIsBuilderOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> CREATE NEW QUOTE
          </Button>
        </div>
      </div>

      {emailNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {emailNotice}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 custom-shadow overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-bold">Loading quotes from PostgreSQL...</div>
        ) : quotes.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-bold">No quotes found in database.</div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
              <tr>
                <th className="p-4">Quote Number</th>
                <th className="p-4">Customer & Company</th>
                <th className="p-4">Item & Specs</th>
                <th className="p-4">Subtotal</th>
                <th className="p-4">GST (5%)</th>
                <th className="p-4">Grand Total</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {quotes.map((q) => {
                const item = q.items && q.items[0];
                const custName = q.customer?.name || 'Customer';
                const custPhone = q.customer?.phone || '919124496665';
                const cleanPhone = custPhone.replace(/[^0-9]/g, '') || '919124496665';
                const waText = encodeURIComponent(
                  `Hi ${custName}, regarding your Zobra Quote #${q.quoteNumber} (${item?.quantity || 50} Pcs ${item?.product?.name || 'Polo T-Shirt'}, Total: ${formatINR(q.totalAmount)}). Let's finalize your order!`
                );
                const whatsappUrl = `https://wa.me/${cleanPhone}?text=${waText}`;

                return (
                  <tr key={q.id} className="hover:bg-slate-50">
                    <td className="p-4 font-bold text-slate-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" /> {q.quoteNumber}
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-900">{q.company?.name || 'Direct Customer'}</p>
                      <p className="text-[11px] text-slate-400">{custName} ({q.customer?.email || 'N/A'})</p>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-800">{item?.quantity || 50} Pcs {item?.product?.name || 'Polo T-Shirt'}</p>
                      <p className="text-[11px] text-slate-400">{item?.printType || 'Front Only'} • {item?.color || 'N/A'}</p>
                    </td>
                    <td className="p-4">{formatINR(q.subtotal)}</td>
                    <td className="p-4 text-slate-500">{formatINR(q.gstTotal)}</td>
                    <td className="p-4 font-black text-slate-900 text-sm">{formatINR(q.totalAmount)}</td>
                    <td className="p-4">
                      <Badge variant={q.status === 'APPROVED' ? 'success' : q.status === 'REJECTED' ? 'danger' : 'info'}>
                        {q.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-right space-x-1.5 flex items-center justify-end">
                      <a href={whatsappUrl} target="_blank" rel="noreferrer">
                        <Button variant="outline" size="sm" className="gap-1 text-emerald-700 border-emerald-200 hover:bg-emerald-50">
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-600" /> WA
                        </Button>
                      </a>
                      <Button variant="outline" size="sm" className="gap-1" onClick={() => handleOpenEditModal(q)}>
                        <Edit3 className="w-3.5 h-3.5 text-blue-600" /> Reprice
                      </Button>
                      <a href={`${apiClient.defaults.baseURL}/quotes/${q.id}/pdf`} target="_blank" rel="noreferrer">
                        <Button variant="outline" size="sm" className="gap-1">
                          <Download className="w-3 h-3" /> PDF
                        </Button>
                      </a>
                      {q.status !== 'APPROVED' && (
                        <Button
                          variant="primary"
                          size="sm"
                          className="gap-1"
                          onClick={() => handleSendQuote(q.id, q.quoteNumber, q.customer?.email)}
                        >
                          <Send className="w-3 h-3" /> Send
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Admin Quote Edit & Reprice Modal */}
      {editingQuote && (
        <Modal isOpen={!!editingQuote} onClose={() => setEditingQuote(null)} title={`Reprice & Edit Quote #${editingQuote.quoteNumber}`}>
          <form onSubmit={handleSaveReprice} className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-xs text-blue-800 font-semibold">
              Client: <strong>{editingQuote.customer?.name}</strong> ({editingQuote.company?.name || 'Individual'})
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Quantity (Pcs)</label>
                <input
                  type="number"
                  required
                  value={editQty}
                  onChange={(e) => setEditQty(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:border-blue-600 font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Print Technique</label>
                <select
                  value={editPrintType}
                  onChange={(e) => setEditPrintType(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:border-blue-600 font-bold"
                >
                  <option value="Front Only">Front Only</option>
                  <option value="Back Only">Back Only</option>
                  <option value="Both Sides">Both Sides</option>
                  <option value="Embroidery Logo">Embroidery Logo</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Garment Color</label>
                <input
                  type="text"
                  value={editColor}
                  onChange={(e) => setEditColor(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Garment Size</label>
                <input
                  type="text"
                  value={editSize}
                  onChange={(e) => setEditSize(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Internal Sales / Custom Notes</label>
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Special discount applied, fast-track delivery requested."
                rows={2}
                className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:border-blue-600"
              />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => setEditingQuote(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="secondary" disabled={savingEdit} className="font-bold">
                {savingEdit ? 'RECALCULATING...' : 'SAVE & REPRICE QUOTE'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Manual Quote Builder Modal */}
      <Modal isOpen={isBuilderOpen} onClose={() => setIsBuilderOpen(false)} title="Interactive Quote Builder">
        <form onSubmit={(e) => { e.preventDefault(); setIsBuilderOpen(false); }} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Customer / Company</label>
            <select className="w-full px-3 py-2 border rounded-lg text-sm">
              <option>Acme Technologies Pvt Ltd (GSTIN: 21ABCDE1234F1Z5)</option>
              <option>Zepto Logistics India Pvt Ltd (GSTIN: 27AAACZ9999C1Z9)</option>
            </select>
          </div>
          <div className="border p-4 rounded-xl space-y-3 bg-slate-50">
            <h4 className="text-xs font-bold text-slate-700 uppercase">Quote Item #1</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500">Product</label>
                <select className="w-full px-2 py-1.5 border rounded text-xs">
                  <option>Customized Polo T-Shirt (200 GSM)</option>
                  <option>Promotional Cotton Cap</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500">Print Type</label>
                <select className="w-full px-2 py-1.5 border rounded text-xs">
                  <option>Both Sides (₹349)</option>
                  <option>Front Only (₹249)</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500">Quantity</label>
                <input type="number" defaultValue="100" className="w-full px-2 py-1.5 border rounded text-xs" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500">Unit Price (₹)</label>
                <input type="number" defaultValue="249" className="w-full px-2 py-1.5 border rounded text-xs" />
              </div>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 rounded-xl text-xs space-y-1">
            <div className="flex justify-between"><span>Subtotal:</span><span>₹24,900.00</span></div>
            <div className="flex justify-between"><span>GST (5% HSN 6105):</span><span>₹1,245.00</span></div>
            <div className="flex justify-between font-bold text-sm text-blue-400 pt-1 border-t border-slate-800">
              <span>Grand Total:</span><span>₹26,145.00</span>
            </div>
          </div>

          <Button type="submit" variant="secondary" className="w-full py-3 font-bold">
            GENERATE & SAVE QUOTATION
          </Button>
        </form>
      </Modal>
    </div>
  );
}

