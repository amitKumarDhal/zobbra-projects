'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Star,
  Truck,
  Sparkles,
  ArrowRight,
  Package,
  PackageX,
  Palette,
  Check,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { API_URL } from '@/lib/api';
import {
  canCustomize,
  getProductColors,
  getProductSizes,
  getMoq,
  getSocialProof,
  getHighlights,
} from '@/lib/productConfig';

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [qty, setQty] = useState<number>(50);

  useEffect(() => {
    let cancelled = false;
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/products/${params.id}`);
        const data = await res.json();
        if (!cancelled && data.success && (data.data || data.product)) {
          const prod = data.data || data.product;
          setProduct(prod);
          const colors = getProductColors(prod);
          if (colors.length > 0) setSelectedColor(colors[0].name);
          const sizes = getProductSizes(prod);
          if (sizes.length > 0) setSelectedSize(sizes[0]);
          const moq = getMoq(prod);
          if (moq > 50) setQty(moq);
        } else if (!cancelled) {
          setError('Product not found');
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Failed to load product');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchProduct();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex flex-col items-center justify-center p-6 text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin text-[#3B6FEB] mb-3" />
        <p className="text-sm font-semibold">Loading product details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-[#E5E7EB] text-center space-y-4 shadow-sm">
          <PackageX className="w-12 h-12 text-gray-400 mx-auto" />
          <h2 className="text-xl font-black text-[#111111] font-heading">Product Not Found</h2>
          <p className="text-xs text-gray-600">The product you are looking for may have been removed or is unavailable.</p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#111111] text-white text-xs font-bold rounded-xl uppercase tracking-wider hover:bg-black transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Catalog
          </Link>
        </div>
      </div>
    );
  }

  const customizable = canCustomize(product);
  const colors = getProductColors(product);
  const sizes = getProductSizes(product);
  const moq = getMoq(product);
  const proof = getSocialProof(product);
  const highlights = getHighlights(product);
  const images = Array.isArray(product.images) && product.images.length > 0 ? product.images : [];

  // Determine tier pricing
  let unitPrice = product.basePrice || 0;
  if (Array.isArray(product.bulkPricing) && product.bulkPricing.length > 0) {
    const eligibleTier = [...product.bulkPricing]
      .sort((a, b) => b.minQuantity - a.minQuantity)
      .find((t) => qty >= t.minQuantity);
    if (eligibleTier && eligibleTier.pricePerUnit > 0) {
      unitPrice = eligibleTier.pricePerUnit;
    }
  }

  return (
    <div className="bg-[#FBFBFA] min-h-screen text-[#111111]">
      {/* Top Breadcrumb Bar */}
      <div className="border-b border-[#EBEAE5] bg-white">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between text-xs text-[#6B7280]">
          <nav aria-label="Breadcrumb" className="min-h-0">
            <ol className="flex items-center gap-1.5 font-medium leading-none min-h-0">
              <li className="inline-flex items-center min-h-0">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-1 min-h-0 h-auto py-1 px-1.5 -mx-1.5 rounded text-gray-500 hover:text-[#111111] hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Catalog
                </Link>
              </li>
              <li className="inline-flex items-center min-h-0 text-gray-400 select-none" aria-hidden="true">
                <ChevronRight className="w-3 h-3" />
              </li>
              <li className="inline-flex items-center min-h-0">
                <span className="text-[#111111] font-bold truncate max-w-[200px] sm:max-w-md" aria-current="page">
                  {product.name}
                </span>
              </li>
            </ol>
          </nav>
          <span className="text-[11px] font-bold text-[#3B6FEB] uppercase tracking-wider">
            {product.category?.name || 'Apparel'}
          </span>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Product Gallery (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Featured Image */}
            <div className="relative bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden p-4 sm:p-6 shadow-xs aspect-[4/3] flex items-center justify-center">
              {images.length > 0 ? (
                <img
                  src={images[selectedImage] || images[0]}
                  alt={product.name}
                  data-cy="product-detail-image"
                  className="w-full h-full object-contain drop-shadow-sm select-none"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-300 space-y-2">
                  <Package className="w-16 h-16 stroke-[1.25]" />
                  <span className="text-xs font-bold text-[#9CA3AF]">No photo available</span>
                </div>
              )}
              <div className="absolute top-4 left-4 py-1 px-3 bg-white/95 backdrop-blur-sm border border-[#E5E7EB] rounded-full flex items-center shadow-2xs text-[11px] font-bold text-[#111111]">
                <Sparkles className="w-3.5 h-3.5 text-[#3B6FEB] mr-1" /> ZOBBRA Certified
              </div>
            </div>

            {/* Thumbnail Gallery (separate product gallery photos) */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none" data-cy="product-thumbnails">
                {images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImage(idx)}
                    className={`relative rounded-xl overflow-hidden border-2 transition-all w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 bg-white p-1.5 ${
                      selectedImage === idx ? 'border-[#3B6FEB] shadow-sm' : 'border-gray-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}

            {/* Bulk Pricing Tier Table */}
            {Array.isArray(product.bulkPricing) && product.bulkPricing.length > 0 && (
              <Card className="bg-white border-[#E5E7EB] p-6 space-y-3 rounded-2xl shadow-xs">
                <h3 className="text-sm font-heading font-black text-[#111111] uppercase tracking-wider">
                  Tiered B2B Volume Pricing
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {product.bulkPricing.map((tier: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-[#F8F9FC] border border-[#E5E7EB] text-center space-y-0.5">
                      <span className="text-[10px] font-bold text-[#6B7280] uppercase block">
                        {tier.minQuantity}{tier.maxQuantity && tier.maxQuantity < 9000 ? `–${tier.maxQuantity}` : '+'} Pcs
                      </span>
                      <span className="text-base font-heading font-black text-[#111111] block">
                        ₹{tier.pricePerUnit || product.basePrice}
                      </span>
                      <span className="text-[10px] font-bold text-[#3B6FEB] block">
                        {tier.printType || 'Per Unit'}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Right Column: Sticky Product Purchase / Customize Card (5 cols) */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-20">
            <Card className="bg-white border-[#E5E7EB] p-6 sm:p-7 space-y-5 rounded-2xl shadow-xs">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#3B6FEB] bg-[#EEF2FF] px-2.5 py-0.5 rounded-full border border-[#D9E2FF]/80">
                    {product.category?.name || 'Apparel'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-medium text-gray-500">
                      SKU: {product.slug}
                    </span>
                    <span className="px-2.5 py-0.5 bg-[#EEF2FF] text-[10px] font-bold text-[#3B6FEB] rounded-full border border-[#D9E2FF]">
                      MOQ: {moq} Pcs
                    </span>
                  </div>
                </div>
                <h1 className="text-xl sm:text-2xl font-heading font-black text-[#111111] leading-snug">
                  {product.name}
                </h1>
                {proof && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#111111]">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{proof.rating.toFixed(1)}</span>
                    {proof.reviewCount > 0 && <span className="font-medium text-gray-500">({proof.reviewCount} corporate reviews)</span>}
                  </div>
                )}
              </div>

              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                {product.description || 'Premium corporate merchandise engineered for enterprise gifting and uniforms.'}
              </p>

              {/* Highlights */}
              {highlights.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-[#F3F4F6]">
                  <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">Key Specifications</span>
                  <ul className="text-xs text-gray-700 space-y-1">
                    {highlights.slice(0, 4).map((h, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-[#3B6FEB] shrink-0" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Color Swatch Picker */}
              {colors.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[#F3F4F6]">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] block">
                    Color: <span className="text-[#111111] font-black">{selectedColor || colors[0].name}</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {colors.map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setSelectedColor(c.name)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          selectedColor === c.name
                            ? 'bg-[#111111] text-white border-[#111111] shadow-xs'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        <span className="w-3 h-3 rounded-full border border-gray-300" style={{ backgroundColor: c.hex }} />
                        <span>{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Sizes */}
              {sizes.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[#F3F4F6]">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] block">
                    Available Sizes
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSelectedSize(s)}
                        className={`w-10 h-10 rounded-xl text-xs font-bold border transition-all flex items-center justify-center ${
                          selectedSize === s
                            ? 'bg-[#111111] text-white border-[#111111]'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Pricing Estimate Box */}
              <div className="p-4 bg-[#F8F9FC] border border-[#E5E7EB] rounded-xl space-y-2">
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Estimated Price</span>
                    <span className="text-2xl font-heading font-black text-[#111111]">
                      ₹{(unitPrice * qty).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-gray-600">₹{unitPrice} / pc</span>
                    <span className="text-[10px] text-gray-400 block font-medium">({qty} pcs MOQ {moq})</span>
                  </div>
                </div>
                <p className="text-[11px] text-gray-500 flex items-center gap-1.5 pt-1 border-t border-gray-200/80">
                  <Truck className="w-3.5 h-3.5 text-[#3B6FEB]" /> GST & Pan-India Dispatch Available
                </p>
              </div>

              {/* Actions Area: Step 7 & 18 */}
              <div className="space-y-2.5 pt-2">
                {customizable ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <Link
                      href={`/get-quote?product=${encodeURIComponent(product.name)}&qty=${qty}&color=${encodeURIComponent(selectedColor || '')}&size=${encodeURIComponent(selectedSize || '')}&id=${product.id}`}
                      className="block"
                    >
                      <button className="w-full py-3 bg-white hover:bg-gray-50 text-[#111111] text-xs font-bold border border-[#111111] rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs">
                        GET QUICK QUOTE
                      </button>
                    </Link>
                    <Link
                      href={`/products/${product.id}/customize`}
                      className="block"
                      data-cy="product-detail-customize"
                    >
                      <button className="w-full py-3 bg-[#3B6FEB] hover:bg-[#2563EB] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md">
                        <Palette className="w-3.5 h-3.5" /> CUSTOMIZE <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </Link>
                  </div>
                ) : (
                  <Link
                    href={`/get-quote?product=${encodeURIComponent(product.name)}&qty=${qty}&color=${encodeURIComponent(selectedColor || '')}&size=${encodeURIComponent(selectedSize || '')}&id=${product.id}`}
                    className="block"
                  >
                    <button className="w-full py-3.5 bg-[#3B6FEB] hover:bg-[#2563EB] text-white text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md">
                      REQUEST A QUOTE <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
