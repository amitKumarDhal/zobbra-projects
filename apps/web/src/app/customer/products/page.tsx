'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, CheckCircle2, Loader2, Sparkles, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { StatusBadge } from '@/components/ui/status-badge';
import { API_URL } from '@/lib/api';

interface ProductItem {
  id: string;
  name: string;
  category: string;
  priceNum: number;
  priceStr: string;
  moq: number;
  image: string;
  description: string;
}

export default function CustomerProductsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [productsList, setProductsList] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Customizer Modal State
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [color, setColor] = useState('Charcoal Black');
  const [size, setSize] = useState('XL');
  const [qty, setQty] = useState(100);
  const [printPosition, setPrintPosition] = useState('Front & Back Print');

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [createdQuote, setCreatedQuote] = useState<any | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/products`);
      const data = await res.json();
      if (data.data && Array.isArray(data.data)) {
        const mapped: ProductItem[] = data.data.map((p: any) => ({
          id: p.id || p.slug,
          name: p.name,
          category: p.category?.name || 'Apparel',
          priceNum: p.basePrice || 249,
          priceStr: `₹${p.basePrice || 249}`,
          moq: 20,
          image: p.images?.[0] || 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=600&q=80',
          description: p.description || 'Customized corporate merchandise.',
        }));
        setProductsList(mapped);
      }
    } catch (err) {
      console.error('Error loading products from API:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitQuote = async () => {
    if (!selectedProduct) return;
    setSubmitting(true);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('zobra_token') : null;

      const response = await fetch(`${API_URL}/quotes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          productId: selectedProduct.id,
          quantity: qty,
          color,
          size,
          printType: printPosition,
          gstin: '21AAACA1234A1Z5',
          address: 'Bhubaneswar, Odisha',
        }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.quote) {
        setCreatedQuote(data.quote);
      } else {
        console.error('Quote submission error:', data);
        alert(data.message || 'Failed to submit quote. Please log in first.');
      }
    } catch (err) {
      console.error('API submission error:', err);
      alert('Could not connect to backend server.');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = productsList.filter((p) => {
    const matchesCategory = category === 'ALL' || p.category.toLowerCase().includes(category.toLowerCase());
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const colorsList = ['Charcoal Black', 'Navy Blue', 'Pure White', 'Royal Maroon', 'Olive Green'];
  const sizesList = ['S', 'M', 'L', 'XL', 'XXL'];
  const positionsList = ['Front & Back Print', 'Front Chest Logo', 'Back Full Print', 'Left Sleeve Embroidery'];

  const calculatedEstimate = selectedProduct
    ? (selectedProduct.priceNum * qty + (printPosition === 'Front & Back Print' ? 40 * qty : 20 * qty)).toLocaleString('en-IN')
    : '0';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EEF2FF] text-[#3B6FEB] uppercase tracking-wider mb-2">
          CATALOG & CUSTOMIZER
        </div>
        <h1 className="text-3xl sm:text-4xl font-heading font-black text-[#111111] tracking-tight">
          Merchandise Catalog
        </h1>
        <p className="text-xs sm:text-sm text-[#6B7280] mt-1 font-medium">
          Select merchandise to configure live price estimates and request quotes.
        </p>
      </div>

      {/* Toolbar & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Search products..."
            data-cy="search-products-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-xs text-[#111111] focus:outline-none focus:border-[#3B6FEB] focus:bg-white transition-all font-medium"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['ALL', 'Apparel', 'Headwear', 'Bags'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                category === cat
                  ? 'bg-[#3B6FEB] text-white shadow-sm'
                  : 'bg-[#F9FAFB] text-[#6B7280] border border-[#E5E7EB] hover:text-[#111111] hover:border-gray-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-xl border border-[#E5E7EB]">
          <Loader2 className="w-8 h-8 text-[#3B6FEB] animate-spin mx-auto" />
          <p className="text-xs text-[#6B7280] mt-3 font-semibold">Loading merchandise catalog from backend database...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <Card key={item.id} className="bg-white border-[#E5E7EB] overflow-hidden hover:shadow-md transition-shadow" data-cy={`product-card-${item.id}`}>
              <img src={item.image} alt={item.name} className="w-full h-56 object-cover bg-gray-100" />
              <CardContent className="p-5 space-y-4">
                <div>
                  <span className="text-[10px] font-bold text-[#3B6FEB] uppercase tracking-wider block">{item.category}</span>
                  <h3 className="text-base font-heading font-bold text-[#111111] mt-1 line-clamp-1">{item.name}</h3>
                  <p className="text-xs text-[#6B7280] mt-1 line-clamp-2">{item.description}</p>
                </div>
                <div className="flex items-center justify-between text-xs pt-3 border-t border-[#E5E7EB]">
                  <span className="text-[#6B7280]">
                    Base Rate: <strong className="font-mono text-[#111111] text-sm font-bold">{item.priceStr}</strong>
                  </span>
                  <span className="px-2 py-0.5 bg-[#F9FAFB] border border-[#E5E7EB] text-[#6B7280] rounded text-[10px] font-bold">
                    MOQ: {item.moq} Pcs
                  </span>
                </div>
                <Button
                  variant="primary"
                  className="w-full font-bold"
                  data-cy={`customize-btn-${item.id}`}
                  onClick={() => {
                    setSelectedProduct(item);
                    setQty(100);
                  }}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5" /> CUSTOMIZE & ESTIMATE
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Interactive Customizer Modal */}
      <Modal
        isOpen={!!selectedProduct && !createdQuote}
        onClose={() => setSelectedProduct(null)}
        title="Live Product Customizer"
      >
        {selectedProduct && (
          <div className="space-y-5 text-xs">
            <div className="flex gap-4 items-center bg-[#F9FAFB] p-3.5 rounded-xl border border-[#E5E7EB]">
              <img src={selectedProduct.image} alt={selectedProduct.name} className="w-16 h-16 rounded-lg object-cover border border-[#E5E7EB]" />
              <div>
                <h4 className="font-heading font-bold text-[#111111] text-sm leading-snug">{selectedProduct.name}</h4>
                <p className="text-[#6B7280] text-[11px] mt-0.5">{selectedProduct.description}</p>
              </div>
            </div>

            {/* Color Swatches */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block">
                Fabric Color: <span className="text-[#111111]">{color}</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {colorsList.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                      color === c
                        ? 'bg-[#3B6FEB] text-white border-[#3B6FEB] shadow-sm'
                        : 'bg-[#F9FAFB] text-[#111111] border-[#E5E7EB] hover:border-gray-300'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Size Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block">
                Size: <span className="text-[#111111]">{size}</span>
              </label>
              <div className="flex gap-2">
                {sizesList.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSize(s)}
                    className={`w-9 h-9 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      size === s
                        ? 'bg-[#3B6FEB] text-white border-[#3B6FEB] shadow-sm'
                        : 'bg-[#F9FAFB] text-[#111111] border-[#E5E7EB] hover:border-gray-300'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Print Position Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block">
                Print Position
              </label>
              <div className="grid grid-cols-2 gap-2">
                {positionsList.map((pos) => (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => setPrintPosition(pos)}
                    className={`p-2.5 rounded-lg text-xs font-semibold border text-left transition-all cursor-pointer ${
                      printPosition === pos
                        ? 'bg-[#EEF2FF] text-[#3B6FEB] border-[#3B6FEB] font-bold'
                        : 'bg-[#F9FAFB] text-[#111111] border-[#E5E7EB] hover:border-gray-300'
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                  Quantity (Units)
                </label>
                <span className="font-mono font-bold text-[#3B6FEB]">{qty} Pcs</span>
              </div>
              <input
                type="number"
                min="20"
                max="5000"
                data-cy="quantity-input"
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-xs font-bold text-[#111111] focus:outline-none focus:border-[#3B6FEB] focus:bg-white"
              />
            </div>

            {/* Live Price Calculation Summary */}
            <div className="p-4 bg-[#0A0F1C] text-white rounded-xl flex items-center justify-between shadow-md">
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Estimated Cost</span>
                <span className="text-xl font-mono font-bold text-white">₹{calculatedEstimate}</span>
                <span className="text-[10px] text-gray-400 block">+ 5% GST (Server calculated)</span>
              </div>
              <Button
                variant="primary"
                size="sm"
                data-cy="submit-quote-btn"
                disabled={submitting}
                onClick={handleSubmitQuote}
                className="gap-2 font-bold"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'SUBMIT QUOTE'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Quote Confirmation Success Modal */}
      <Modal
        isOpen={!!createdQuote}
        onClose={() => {
          setCreatedQuote(null);
          setSelectedProduct(null);
        }}
        title="Quote Submitted Successfully"
      >
        {createdQuote && (
          <div className="text-center space-y-5 py-3">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EEF2FF] text-[#3B6FEB] uppercase tracking-wider mb-2">
                SAVED IN POSTGRESQL
              </div>
              <h3 className="text-xl font-heading font-black text-[#111111]" data-cy="created-quote-number">
                Quote #{createdQuote.quoteNumber}
              </h3>
              <p className="text-xs text-[#6B7280] mt-1">
                Total Amount: <strong className="font-mono text-[#111111]">₹{createdQuote.totalAmount?.toLocaleString('en-IN')}</strong> (incl 5% GST)
              </p>
            </div>

            <div className="bg-[#F9FAFB] p-4 rounded-xl border border-[#E5E7EB] text-xs text-left space-y-1 text-[#111111]">
              <p><strong>Item:</strong> {selectedProduct?.name}</p>
              <p><strong>Quantity:</strong> {qty} Pcs</p>
              <p><strong>Specifications:</strong> {color}, Size {size}, {printPosition}</p>
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                data-cy="view-my-quotes-btn"
                onClick={() => router.push('/customer/quotes')}
                className="font-bold w-full"
              >
                VIEW IN MY QUOTES
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
