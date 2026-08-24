'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Star, ShieldCheck, Truck, Clock, MessageSquare, Plus, Minus, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { apiClient } from '@/lib/api';

export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const [printType, setPrintType] = useState('Front Only');
  const [selectedColor, setSelectedColor] = useState('Black');
  const [selectedSize, setSelectedSize] = useState('M');
  const [quantity, setQuantity] = useState(50);
  const [isQuoteSuccessOpen, setIsQuoteSuccessOpen] = useState(false);
  const [createdQuote, setCreatedQuote] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Price calculations based on bulk matrix
  const getUnitPrice = () => {
    let base = 249;
    if (printType === 'Back Only') base = 279;
    if (printType === 'Both Sides') base = 349;

    if (quantity >= 200) return base - 30;
    if (quantity >= 100) return base - 20;
    if (quantity >= 50) return base - 10;
    return base;
  };

  const unitPrice = getUnitPrice();
  const estimatedSubtotal = unitPrice * quantity;
  const gstAmount = estimatedSubtotal * 0.05; // 5% GST for garments
  const totalAmount = estimatedSubtotal + gstAmount;

  const handleCreateQuote = async () => {
    setErrorNotice(null);
    const token = typeof window !== 'undefined' ? localStorage.getItem('zobra_token') : null;
    if (!token) {
      router.push('/login');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post('/quotes', {
        productId: params.slug,
        quantity,
        color: selectedColor,
        size: selectedSize,
        printType,
      });

      if (res.data.success && res.data.quote) {
        setCreatedQuote(res.data.quote);
        setIsQuoteSuccessOpen(true);
      } else {
        setErrorNotice(res.data.message || 'Failed to submit quote');
      }
    } catch (err: any) {
      console.error('Create quote error:', err);
      if (err.response?.status === 401) {
        router.push('/login');
      } else {
        setErrorNotice(err.response?.data?.message || 'Server error while creating quote request.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Breadcrumbs */}
      <nav className="text-xs font-semibold text-slate-500 flex items-center gap-2">
        <Link href="/" className="hover:underline">Home</Link>
        <span>/</span>
        <Link href="/products" className="hover:underline">Products</Link>
        <span>/</span>
        <span className="text-slate-900 font-bold">Polo T-Shirt</span>
      </nav>

      {/* Main Product Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Gallery */}
        <div className="space-y-4">
          <div className="bg-slate-100 rounded-3xl p-6 border border-slate-200 overflow-hidden flex items-center justify-center">
            <img
              src="https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=800&q=80"
              alt="Polo T-Shirt Mockup"
              className="max-h-[420px] object-contain rounded-xl"
            />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {['Black', 'White', 'Navy', 'Fabric Detail'].map((img, i) => (
              <div key={i} className="bg-slate-100 p-2 rounded-xl border border-slate-200 cursor-pointer hover:border-blue-600">
                <img
                  src="https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=200&q=80"
                  alt={`Thumbnail ${i}`}
                  className="rounded-lg h-16 w-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Product Details & Quote Configurator */}
        <div className="space-y-6">
          <div>
            <span className="bg-blue-600 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-md tracking-wider">
              BEST SELLER
            </span>
            <h1 className="text-3xl font-black text-slate-900 mt-2">Polo T-Shirt</h1>
            <p className="text-slate-500 text-sm font-medium">Premium Quality. Perfect Branding.</p>
            <div className="flex items-center gap-2 mt-2 text-xs font-bold text-amber-500">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-slate-700">4.8 (120 reviews)</span>
            </div>
          </div>

          <div className="border-y border-slate-200 py-4 space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-xs text-slate-500 font-medium">Starting from</span>
              <span className="text-3xl font-black text-slate-900">₹{unitPrice}.00</span>
              <span className="text-xs text-slate-400">/ piece</span>
            </div>
            <p className="text-xs text-slate-400">Prices are exclusive of 5% GST and delivery charges.</p>
          </div>

          {errorNotice && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs font-bold">
              {errorNotice}
            </div>
          )}

          {/* Step 1: Choose Print Type */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">1. Choose Print Type</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { name: 'Front Only', price: '₹249' },
                { name: 'Back Only', price: '₹279' },
                { name: 'Both Sides', price: '₹349' },
              ].map((type) => (
                <button
                  key={type.name}
                  onClick={() => setPrintType(type.name)}
                  className={`p-3 text-center rounded-xl border-2 transition-all ${
                    printType === type.name
                      ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <p className="text-xs font-bold">{type.name}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{type.price}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Choose Color */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">2. Choose Color</label>
            <div className="flex items-center gap-3">
              {[
                { name: 'Black', bg: 'bg-black' },
                { name: 'White', bg: 'bg-white border border-slate-300' },
                { name: 'Navy', bg: 'bg-slate-900' },
                { name: 'Grey', bg: 'bg-slate-400' },
                { name: 'Blue', bg: 'bg-blue-600' },
                { name: 'Red', bg: 'bg-red-600' },
              ].map((c) => (
                <button
                  key={c.name}
                  onClick={() => setSelectedColor(c.name)}
                  className={`w-7 h-7 rounded-full ${c.bg} flex items-center justify-center ring-2 transition-all ${
                    selectedColor === c.name ? 'ring-blue-600 ring-offset-2' : 'ring-transparent'
                  }`}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* Step 3: Choose Size */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">3. Choose Size</label>
            <div className="flex items-center gap-2">
              {['S', 'M', 'L', 'XL', 'XXL'].map((sz) => (
                <button
                  key={sz}
                  onClick={() => setSelectedSize(sz)}
                  className={`w-10 h-10 rounded-xl text-xs font-bold border transition-all ${
                    selectedSize === sz
                      ? 'border-blue-600 bg-blue-600 text-white shadow'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* Step 4: Choose Quantity */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">4. Choose Quantity</label>
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-white">
                <button
                  onClick={() => setQuantity(Math.max(20, quantity - 10))}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(20, parseInt(e.target.value) || 20))}
                  className="w-16 text-center font-bold text-sm outline-none"
                />
                <button
                  onClick={() => setQuantity(quantity + 10)}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <span className="text-xs text-slate-400 font-semibold">Min. Order: 20 Pcs</span>
            </div>
          </div>

          {/* Estimate Card */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2">
            <div className="flex justify-between text-xs text-slate-300">
              <span>Estimated Price ({quantity} pcs @ ₹{unitPrice}/pc):</span>
              <span className="font-bold text-white">₹{estimatedSubtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-300">
              <span>Estimated GST (5%):</span>
              <span className="font-bold text-white">₹{gstAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-sm font-black pt-2 border-t border-slate-800 text-blue-400">
              <span>Total Estimated Quote:</span>
              <span className="text-lg text-white">₹{totalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <Button
              variant="secondary"
              size="lg"
              disabled={loading}
              className="w-full py-4 text-sm font-bold gap-2"
              onClick={handleCreateQuote}
            >
              {loading ? 'SUBMITTING QUOTE...' : 'GET A FREE QUOTE'} <ArrowRight className="w-4 h-4" />
            </Button>
            <a
              href="https://wa.me/919124496665?text=Hi%20Zobra%20Prints,%20I%20want%20a%20quote%20for%20Polo%20T-Shirts"
              target="_blank"
              rel="noreferrer"
              className="block"
            >
              <Button variant="outline" size="lg" className="w-full py-3 text-sm font-bold gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600" /> CHAT ON WHATSAPP
              </Button>
            </a>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-4 gap-2 pt-4 border-t border-slate-200 text-center text-[10px] font-bold text-slate-500">
            <div className="space-y-1">
              <ShieldCheck className="w-5 h-5 text-blue-600 mx-auto" />
              <span>Secure Payments</span>
            </div>
            <div className="space-y-1">
              <Clock className="w-5 h-5 text-emerald-600 mx-auto" />
              <span>5-6 Working Days</span>
            </div>
            <div className="space-y-1">
              <Truck className="w-5 h-5 text-indigo-600 mx-auto" />
              <span>Low MOQ Orders</span>
            </div>
            <div className="space-y-1">
              <Truck className="w-5 h-5 text-purple-600 mx-auto" />
              <span>Pan India Delivery</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Order Pricing Matrix Table matching screenshot */}
      <section className="bg-white p-8 rounded-3xl border border-slate-200 custom-shadow space-y-6">
        <div>
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">BULK ORDER PRICING</span>
          <h2 className="text-2xl font-black text-slate-900 mt-1">The more you order, the more you save!</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-700 text-xs font-bold uppercase">
              <tr>
                <th className="p-4 rounded-l-xl">Quantity (Pcs)</th>
                <th className="p-4">Front Only</th>
                <th className="p-4">Back Only</th>
                <th className="p-4 rounded-r-xl">Both Sides</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              <tr>
                <td className="p-4 font-bold text-slate-900">20 - 49</td>
                <td className="p-4">₹249</td>
                <td className="p-4">₹279</td>
                <td className="p-4">₹349</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-slate-900">50 - 99</td>
                <td className="p-4">₹239</td>
                <td className="p-4">₹269</td>
                <td className="p-4">₹339</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-slate-900">100 - 199</td>
                <td className="p-4">₹229</td>
                <td className="p-4">₹259</td>
                <td className="p-4">₹329</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-slate-900">200+</td>
                <td className="p-4 font-bold text-blue-600">₹219</td>
                <td className="p-4 font-bold text-blue-600">₹249</td>
                <td className="p-4 font-bold text-blue-600">₹319</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-400 font-medium">* GST Extra | Delivery charges as per location</p>
      </section>

      {/* Quote Submission Confirmation Modal */}
      <Modal isOpen={isQuoteSuccessOpen} onClose={() => setIsQuoteSuccessOpen(false)} title="Quote Request Submitted">
        <div className="text-center py-6 space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
            ✓
          </div>
          <h3 className="text-2xl font-bold text-slate-900">Quote Logged in PostgreSQL!</h3>
          <p className="text-slate-600 text-sm max-w-md mx-auto">
            Your quotation request <strong>#{createdQuote?.quoteNumber || 'ZQB-QT-2026'}</strong> for <strong>{quantity} Pcs</strong> Polo T-Shirt ({printType}, {selectedColor}, Size {selectedSize}) has been saved.
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <Link href="/portal">
              <Button variant="secondary">VIEW MY QUOTES</Button>
            </Link>
            <Button variant="outline" onClick={() => setIsQuoteSuccessOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

