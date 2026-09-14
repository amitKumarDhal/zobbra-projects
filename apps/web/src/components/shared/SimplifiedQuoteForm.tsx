'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { UploadCloud, CheckCircle2, Loader2, X } from 'lucide-react';
import { API_URL } from '@/lib/api';
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/upload';

interface Product {
  id: string;
  name: string;
  slug?: string;
}

interface SimplifiedQuoteFormProps {
  isCustomer?: boolean;
  initialData?: {
    name?: string;
    phone?: string;
    productId?: string;
  };
  onSuccess?: (resultNumber: string) => void;
}

export default function SimplifiedQuoteForm({ isCustomer = false, initialData = {}, onSuccess }: SimplifiedQuoteFormProps) {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  
  const [name, setName] = useState(initialData.name || '');
  const [phone, setPhone] = useState(initialData.phone || '');
  const [productId, setProductId] = useState(initialData.productId || '');
  const [quantity, setQuantity] = useState<number>(100);
  const [referenceFiles, setReferenceFiles] = useState<string[]>([]);
  
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resultId, setResultId] = useState('');
  
  useEffect(() => {
    if (initialData.name) setName(initialData.name);
    if (initialData.phone) setPhone(initialData.phone);
  }, [initialData.name, initialData.phone]);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch(`${API_URL}/products?status=ACTIVE`);
        if (res.ok) {
          const data = await res.json();
          const activeProducts = data.data || data;
          setProducts(Array.isArray(activeProducts) ? activeProducts : []);
          
          const paramId = searchParams?.get('id');
          if (paramId) {
            setProductId(paramId);
          }
        }
      } catch (err) {
        console.error('Failed to load products', err);
      } finally {
        setLoadingProducts(false);
      }
    }
    fetchProducts();
  }, [searchParams, productId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    
    setUploading(true);
    try {
      const urls = await Promise.all(files.map(uploadToCloudinary));
      setReferenceFiles(prev => [...prev, ...urls]);
    } catch (err) {
      console.error('Upload error', err);
      alert('Failed to upload some files. Please try again.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeFile = async (urlToRemove: string) => {
    setReferenceFiles(prev => prev.filter(url => url !== urlToRemove));
    try {
      await deleteFromCloudinary(urlToRemove);
    } catch (e) {
      console.error('Failed to delete from Cloudinary', e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !productId || !quantity) {
      alert('Please fill in all required fields marked with *');
      return;
    }

    let resolvedProductId: string | undefined = undefined;
    const lowerCategory = productId.toLowerCase();

    if (lowerCategory === 'polo') {
      resolvedProductId = products.find(p => p.name.toLowerCase().includes('polo') && !p.name.toLowerCase().includes('round neck'))?.id;
    } else if (lowerCategory === 'round neck') {
      resolvedProductId = products.find(p => p.name.toLowerCase().includes('round neck'))?.id;
    } else if (lowerCategory === 'cap') {
      resolvedProductId = products.find(p => p.name.toLowerCase().includes('cap'))?.id;
    } else if (lowerCategory === 'bag') {
      resolvedProductId = products.find(p => p.name.toLowerCase().includes('bag') || p.name.toLowerCase().includes('backpack'))?.id;
    } else if (lowerCategory === 'welcome kit') {
      resolvedProductId = products.find(p => p.name.toLowerCase().includes('welcome') || p.name.toLowerCase().includes('kit'))?.id;
    }

    if (!resolvedProductId) {
      alert(`The selected product category (${productId}) is currently unavailable in the catalog. Please select another option.`);
      return;
    }

    setSubmitting(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('zobra_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const endpoint = isCustomer ? '/quotes' : '/inquiries';
      const payload = isCustomer ? {
        customerName: name,
        phone,
        productId: resolvedProductId,
        quantity,
        referenceFiles
      } : {
        customerName: name,
        phone,
        productId: resolvedProductId,
        quantity,
        referenceFiles
      };

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        const id = isCustomer ? (data.quote?.quoteNumber || 'Quote Created') : (data.inquiryNumber || data.inquiry?.inquiryNumber || 'Inquiry Created');
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

  return (
    <form className="space-y-6 text-sm" onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div>
          <label className="block font-bold text-[#374151] mb-1.5">
            Name <span className="text-red-500">*</span>
          </label>
          <input 
            type="text" 
            required 
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="Your full name" 
            className="w-full px-4 py-2.5 bg-white border border-[#D1D5DB] rounded-lg text-[#111111] outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] shadow-sm transition-all" 
          />
        </div>

        <div>
          <label className="block font-bold text-[#374151] mb-1.5">
            Phone <span className="text-red-500">*</span>
          </label>
          <input 
            type="tel" 
            required 
            value={phone} 
            onChange={e => setPhone(e.target.value)} 
            placeholder="+91 98765 43210" 
            className="w-full px-4 py-2.5 bg-white border border-[#D1D5DB] rounded-lg text-[#111111] outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] shadow-sm transition-all" 
          />
        </div>

        <div>
          <label className="block font-bold text-[#374151] mb-1.5">
            Product <span className="text-red-500">*</span>
          </label>
          <select 
            required
            value={productId} 
            onChange={e => setProductId(e.target.value)} 
            disabled={loadingProducts}
            className="w-full px-4 py-2.5 bg-white border border-[#D1D5DB] rounded-lg text-[#111111] outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] shadow-sm transition-all font-medium disabled:opacity-50"
          >
            <option value="">[ Select Product ]</option>
            <option value="Polo">Polo</option>
            <option value="Round Neck">Round Neck</option>
            <option value="Cap">Cap</option>
            <option value="Bag">Bag</option>
            <option value="Welcome Kit">Welcome Kit</option>
          </select>
        </div>

        <div>
          <label className="block font-bold text-[#374151] mb-1.5">
            Quantity <span className="text-red-500">*</span>
          </label>
          <input 
            type="number" 
            required 
            min="1" 
            value={quantity} 
            onChange={e => setQuantity(Number(e.target.value))} 
            placeholder="100" 
            className="w-full px-4 py-2.5 bg-white border border-[#D1D5DB] rounded-lg text-[#111111] outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] shadow-sm transition-all font-semibold" 
          />
        </div>

        <div>
          <label className="block font-bold text-[#374151] mb-1.5">
            Reference Files (Images/Logos)
          </label>
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
              <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">Uploaded Files:</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {referenceFiles.map((url, i) => (
                  <div key={i} className="relative group rounded-lg overflow-hidden border border-[#E5E7EB] aspect-video bg-gray-100 flex items-center justify-center">
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

      <div className="pt-4 border-t border-[#E5E7EB]">
        <button 
          type="submit" 
          disabled={submitting || uploading} 
          className="w-full py-4 bg-[#111111] hover:bg-[#000000] disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-base font-bold rounded-xl shadow-md hover:shadow-lg transition-all tracking-wide flex items-center justify-center gap-2"
        >
          {submitting ? 'SUBMITTING...' : 'SUBMIT REQUEST'}
        </button>
      </div>
    </form>
  );
}
