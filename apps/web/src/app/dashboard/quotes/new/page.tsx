'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '@/lib/api';
import { 
  ArrowLeft, Search, Plus, Trash2, Save, Send, AlertCircle, 
  CheckCircle2, Loader2, IndianRupee, Users, Package, FileText 
} from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface Product {
  id: string;
  name: string;
  basePrice: number;
  variants: any[];
}

interface QuoteItem {
  id: string; // local temp id
  productId: string;
  productName: string;
  quantity: number;
  color: string;
  size: string;
  printType: string;
  unitPrice: number;
  totalPrice: number;
}

export default function CreateQuotePage() {
  const router = useRouter();
  
  // Data
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  // Selection State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [notes, setNotes] = useState('');
  
  // Pricing State
  const [subtotal, setSubtotal] = useState(0);
  const [gstTotal, setGstTotal] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers();
    fetchProducts();
  }, []);

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/customers?pageSize=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setCustomers(json.data);
    } catch (e) {
      console.error('Failed to fetch customers', e);
    }
  };

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/products?pageSize=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setProducts(json.data);
    } catch (e) {
      console.error('Failed to fetch products', e);
    }
  };

  const calculatePricing = async (currentItems: QuoteItem[]) => {
    if (currentItems.length === 0) {
      setSubtotal(0);
      setGstTotal(0);
      setTotalAmount(0);
      return;
    }
    
    setIsCalculating(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/quotes/calculate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ items: currentItems })
      });
      
      const json = await res.json();
      if (json.success) {
        setSubtotal(json.data.subtotal);
        setGstTotal(json.data.gstTotal);
        setTotalAmount(json.data.totalAmount);
        
        // Update item unit prices from server
        const newItems = [...currentItems];
        json.data.items.forEach((serverItem: any, index: number) => {
          if (newItems[index]) {
            newItems[index].unitPrice = serverItem.unitPrice;
            newItems[index].totalPrice = serverItem.totalPrice;
          }
        });
        setItems(newItems);
      }
    } catch (e) {
      console.error('Pricing calculation failed', e);
    } finally {
      setIsCalculating(false);
    }
  };

  const addItem = () => {
    const defaultProduct = products.length > 0 ? products[0] : null;
    const newItem: QuoteItem = {
      id: Math.random().toString(36).substr(2, 9),
      productId: defaultProduct?.id || '',
      productName: defaultProduct?.name || 'Select Product',
      quantity: 50,
      color: 'Navy Blue',
      size: 'L',
      printType: 'Front Only',
      unitPrice: 0,
      totalPrice: 0
    };
    const newItems = [...items, newItem];
    setItems(newItems);
    calculatePricing(newItems);
  };

  const updateItem = (index: number, field: keyof QuoteItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'productId') {
      const prod = products.find(p => p.id === value);
      if (prod) newItems[index].productName = prod.name;
    }
    
    setItems(newItems);
    
    if (['productId', 'quantity', 'printType'].includes(field)) {
      calculatePricing(newItems);
    }
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    calculatePricing(newItems);
  };

  const submitQuote = async (status: 'DRAFT' | 'SENT') => {
    if (!selectedCustomerId) {
      setError('Please select a customer.');
      return;
    }
    if (items.length === 0) {
      setError('Please add at least one product.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const payload = {
        customerId: selectedCustomerId,
        items,
        notes,
        status,
        validDays: 15
      };

      const res = await fetch(`${API_URL}/quotes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (json.success) {
        router.push(`/dashboard/quotes/${json.quote.id}`);
      } else {
        setError(json.message || 'Failed to create quote');
      }
    } catch (e) {
      setError('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center text-sm text-[#6B7280] font-medium mb-1">
            <Link href="/dashboard" className="hover:text-[#3B6FEB] transition-colors">Dashboard</Link>
            <span className="mx-2">/</span>
            <Link href="/dashboard/quotes" className="hover:text-[#3B6FEB] transition-colors">Quotes</Link>
            <span className="mx-2">/</span>
            <span className="text-[#111111] font-semibold">Create New Quote</span>
          </div>
          <h1 className="text-3xl font-heading font-bold text-[#111111] tracking-tight">Create New Quote</h1>
          <p className="text-[#6B7280] mt-1 text-[15px] font-medium">Create and manage a quotation for your customer.</p>
        </div>
        <Link 
          href="/dashboard/quotes"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E7EB] text-[#111111] font-semibold text-sm rounded-xl hover:bg-[#F9FAFB] transition-colors self-start md:self-auto shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Quotes
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-bold">{error}</p>
        </div>
      )}

      {/* Main Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Column (Forms) */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Customer Section */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5 border-b border-[#F3F4F6] pb-4">
              <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] text-[#3B6FEB] flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-heading font-bold text-[#111111]">Customer Information</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#374151] mb-1.5">Customer Name <span className="text-red-500">*</span></label>
                <select 
                  className="w-full bg-[#F9FAFB] border border-[#D1D5DB] text-[#111111] rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#3B6FEB]/50 focus:border-[#3B6FEB] transition-all font-medium appearance-none"
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                >
                  <option value="">-- Choose a customer --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Products Section */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5 border-b border-[#F3F4F6] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] text-[#3B6FEB] flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-heading font-bold text-[#111111]">Products & Items</h2>
              </div>
              <button 
                onClick={addItem}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EEF2FF] text-[#3B6FEB] font-semibold text-sm rounded-lg hover:bg-[#E0E7FF] transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </div>

            <div className="space-y-6">
              {items.length === 0 ? (
                <div className="text-center py-8 bg-[#F9FAFB] rounded-xl border border-dashed border-[#D1D5DB]">
                  <Package className="w-8 h-8 mx-auto text-[#9CA3AF] mb-3" />
                  <p className="text-sm font-medium text-[#6B7280]">No items added yet.</p>
                  <button onClick={addItem} className="mt-3 text-sm font-semibold text-[#3B6FEB] hover:underline">Add your first product</button>
                </div>
              ) : (
                items.map((item, index) => (
                  <div key={item.id} className="p-5 border border-[#E5E7EB] rounded-xl bg-[#F9FAFB] relative group">
                    <button 
                      onClick={() => removeItem(index)}
                      className="absolute top-4 right-4 text-[#9CA3AF] hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">Product Name</label>
                        <select 
                          className="w-full bg-white border border-[#D1D5DB] text-[#111111] rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#3B6FEB]/50"
                          value={item.productId}
                          onChange={(e) => updateItem(index, 'productId', e.target.value)}
                        >
                          <option value="">Select Product</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">Print Type</label>
                        <select 
                          className="w-full bg-white border border-[#D1D5DB] text-[#111111] rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#3B6FEB]/50"
                          value={item.printType}
                          onChange={(e) => updateItem(index, 'printType', e.target.value)}
                        >
                          <option value="Front Only">Front Only</option>
                          <option value="Front & Back">Front & Back</option>
                          <option value="Embroidery (Left Chest)">Embroidery (Left Chest)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">Quantity</label>
                        <input 
                          type="number" 
                          min="1"
                          className="w-full bg-white border border-[#D1D5DB] text-[#111111] rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#3B6FEB]/50"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">Color</label>
                        <input 
                          type="text" 
                          className="w-full bg-white border border-[#D1D5DB] text-[#111111] rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#3B6FEB]/50"
                          value={item.color}
                          onChange={(e) => updateItem(index, 'color', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">Size</label>
                        <input 
                          type="text" 
                          className="w-full bg-white border border-[#D1D5DB] text-[#111111] rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#3B6FEB]/50"
                          value={item.size}
                          onChange={(e) => updateItem(index, 'size', e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-[#E5E7EB] flex justify-end">
                      <p className="text-sm font-medium text-[#374151]">
                        Unit Price: <span className="font-heading font-semibold text-[#111111]">₹{item.unitPrice.toLocaleString('en-IN')}</span> 
                        <span className="mx-3 text-[#D1D5DB]">|</span> 
                        Total: <span className="font-heading font-bold text-[#3B6FEB]">₹{item.totalPrice.toLocaleString('en-IN')}</span>
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Notes Section */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5 border-b border-[#F3F4F6] pb-4">
              <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] text-[#3B6FEB] flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-heading font-bold text-[#111111]">Notes & Delivery</h2>
            </div>
            
            <textarea 
              rows={4}
              placeholder="Add internal notes or delivery instructions here..."
              className="w-full bg-[#F9FAFB] border border-[#D1D5DB] text-[#111111] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#3B6FEB]/50 focus:border-[#3B6FEB] transition-all text-sm font-medium"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

        </div>

        {/* Right Column (Summary Sticky) */}
        <div className="xl:col-span-1">
          <div className="bg-[#111111] rounded-2xl p-6 text-white sticky top-8 shadow-xl">
            <h3 className="text-[18px] font-heading font-bold mb-6 flex items-center justify-between border-b border-gray-800 pb-4">
              Quote Summary
              {isCalculating && <Loader2 className="w-5 h-5 animate-spin text-[#3B6FEB]" />}
            </h3>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400 font-medium">Items</span>
                <span className="font-heading font-semibold text-[15px]">{items.length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400 font-medium">Subtotal</span>
                <span className="font-heading font-semibold text-[15px]">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400 font-medium">GST (Estimated)</span>
                <span className="font-heading font-semibold text-[15px]">₹{gstTotal.toLocaleString('en-IN')}</span>
              </div>
              
              <div className="pt-5 border-t border-gray-800 flex justify-between items-center mt-2">
                <span className="text-[15px] font-semibold text-gray-300">Grand Total</span>
                <span className="text-[22px] font-heading font-bold text-[#3B6FEB] flex items-center tracking-tight">
                  <IndianRupee className="w-[18px] h-[18px] mr-1" />
                  {totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <button 
                onClick={() => submitQuote('SENT')}
                disabled={isSubmitting || isCalculating}
                className="w-full flex items-center justify-center gap-2 bg-[#3B6FEB] hover:bg-[#2563EB] text-white py-3 rounded-xl text-[14px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Create & Send Quote
              </button>
              
              <button 
                onClick={() => submitQuote('DRAFT')}
                disabled={isSubmitting || isCalculating}
                className="w-full flex items-center justify-center gap-2 bg-transparent border border-gray-700 hover:bg-gray-800 text-white py-3 rounded-xl text-[14px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                Save as Draft
              </button>
            </div>
            
            <p className="text-xs text-center text-gray-500 font-medium mt-4">
              Pricing is calculated securely on the server.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
