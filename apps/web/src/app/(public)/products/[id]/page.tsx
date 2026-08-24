'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Check,
  Star,
  Truck,
  Sparkles,
  Download,
  ArrowRight,
  Heart,
  Share2,
  Loader2,
  PackageX
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [qty, setQty] = useState(50);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/v1/products/${params.id}`);
        const data = await res.json();
        if (data.success && data.data) {
          const prod = data.data;
          setProduct(prod);
          
          // Set defaults from variants if available
          if (prod.variants && prod.variants.length > 0) {
            const firstColor = prod.variants.find((v: any) => v.color)?.color;
            if (firstColor) setSelectedColor(firstColor);
            
            const firstSize = prod.variants.find((v: any) => v.size)?.size;
            if (firstSize) setSelectedSize(firstSize);
          }
          
          // Default MOQ
          if (prod.bulkPricing && prod.bulkPricing.length > 0) {
             setQty(Math.max(prod.bulkPricing[0].minQuantity, 20));
          }
        }
      } catch (err) {
        console.error('Failed to fetch product', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FC] flex flex-col items-center justify-center text-[#6B7280]">
        <Loader2 className="w-8 h-8 animate-spin text-[#3B6FEB] mb-4" />
        <p className="text-sm font-medium">Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#F8F9FC] flex flex-col items-center justify-center px-4">
        <PackageX className="w-16 h-16 text-[#D1D5DB] mb-4" />
        <h1 className="text-2xl font-heading font-black text-[#111111] mb-2">Product Not Found</h1>
        <p className="text-[#6B7280] mb-6">The merchandise you are looking for does not exist or has been removed.</p>
        <Button onClick={() => router.push('/products')} className="bg-[#111111] text-white">
          Back to Catalog
        </Button>
      </div>
    );
  }

  // Derive unique colors and sizes
  const uniqueColors = Array.from(new Set(product.variants?.map((v: any) => v.color).filter(Boolean)));
  const uniqueSizes = Array.from(new Set(product.variants?.map((v: any) => v.size).filter(Boolean)));
  
  // Calculate pricing based on bulk discount
  let applicableDiscount = 0;
  if (product.bulkPricing) {
    // Sort descending by minQuantity to find the highest eligible tier
    const sortedTiers = [...product.bulkPricing].sort((a, b) => b.minQuantity - a.minQuantity);
    const eligibleTier = sortedTiers.find(t => qty >= t.minQuantity);
    if (eligibleTier) {
      applicableDiscount = eligibleTier.discountPercentage;
    }
  }

  const unitPrice = product.basePrice * (1 - applicableDiscount / 100);
  const estimatedTotal = (unitPrice * qty).toLocaleString('en-IN', { maximumFractionDigits: 0 });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 bg-[#F8F9FC]">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#6B7280] hover:text-[#111111] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Catalog
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className={`p-2.5 rounded-lg border transition-all ${
              isFavorite ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-white border-[#E5E7EB] text-[#6B7280]'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-600' : ''}`} />
          </button>
          <button className="p-2.5 rounded-lg bg-white border border-[#E5E7EB] text-[#6B7280] hover:text-[#111111]">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Column: Image Gallery & Fabric Specs (7 cols) */}
        <div className="lg:col-span-7 space-y-8">
          {/* Featured Large Image View */}
          <div className="relative bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden p-2 shadow-sm">
            <div className="bg-[#F8F9FC] rounded-xl flex items-center justify-center w-full h-[460px]">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[selectedImage]}
                    alt={product.name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <PackageX className="w-20 h-20 text-[#D1D5DB]" />
                )}
            </div>
            <div className="absolute top-6 left-6 gap-1.5 py-1.5 px-3 bg-white/90 backdrop-blur-sm border border-[#E5E7EB] rounded-full flex items-center shadow-sm text-xs font-bold text-[#111111]">
              <Sparkles className="w-3.5 h-3.5 text-[#3B6FEB] mr-1.5" /> Premium Zobra Quality
            </div>
          </div>

          {/* Thumbnail Gallery */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
              {product.images.map((img: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`relative rounded-xl overflow-hidden border-2 transition-all w-24 h-24 flex-shrink-0 ${
                    selectedImage === idx ? 'border-[#111111] shadow-sm' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Bulk Pricing Tier Table */}
          {product.bulkPricing && product.bulkPricing.length > 0 && (
            <Card className="bg-white border-[#E5E7EB] p-8 space-y-4 shadow-sm">
              <h3 className="text-xl font-heading font-bold text-[#111111]">Tiered B2B Volume Pricing</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {product.bulkPricing.map((tier: any, idx: number) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-[#F8F9FC] border border-[#E5E7EB] text-center space-y-1">
                    <span className="text-[10px] font-bold text-[#6B7280] uppercase">Min {tier.minQuantity} Pcs</span>
                    <span className="text-sm font-heading font-black text-[#3B6FEB] block">{tier.discountPercentage}% OFF</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Sticky Purchase & Customization Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          <Card className="bg-white border-[#E5E7EB] p-8 space-y-6 shadow-md rounded-2xl">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">{product.category?.name || 'Catalog'}</span>
              <h1 className="text-2xl sm:text-3xl font-heading font-black text-[#111111] mt-1 leading-tight">{product.name}</h1>
              <div className="flex items-center gap-2 mt-2 text-xs">
                <div className="flex items-center text-amber-500">
                  <Star className="w-4 h-4 fill-amber-500" />
                  <span className="font-extrabold text-[#111111] ml-1">4.9</span>
                </div>
                <span className="text-[#6B7280]">(Corporate Reviews)</span>
                <span className="text-[#D1D5DB]">•</span>
                <span className="text-[#6B7280] font-mono">SKU: {product.slug}</span>
              </div>
            </div>

            <p className="text-sm text-[#4B5563] leading-relaxed whitespace-pre-wrap">{product.description}</p>

            {/* Color Swatch Picker */}
            {uniqueColors.length > 0 && (
              <div className="space-y-2.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] block">Color: {selectedColor}</label>
                <div className="flex flex-wrap gap-2.5">
                  {uniqueColors.map((c: any) => (
                    <button
                      key={c}
                      onClick={() => setSelectedColor(c)}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
                        selectedColor === c ? 'bg-[#111111] text-white border-[#111111]' : 'bg-white text-[#374151] border-[#E5E7EB] hover:bg-[#F9FAFB]'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selector */}
            {uniqueSizes.length > 0 && (
              <div className="space-y-2.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] block">Available Sizes</label>
                <div className="flex flex-wrap gap-2">
                  {uniqueSizes.map((s: any) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className={`w-10 h-10 rounded-lg text-xs font-bold border transition-all ${
                        selectedSize === s ? 'bg-[#111111] text-white border-[#111111]' : 'bg-[#F8F9FC] text-[#374151] border-[#E5E7EB] hover:bg-[#F3F4F6]'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Stepper */}
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center text-xs">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                  Order Quantity (Min 20)
                </label>
                <span className="font-black text-[#3B6FEB] text-sm">{qty} Pcs</span>
              </div>
              <input
                type="range"
                min={20}
                max={1000}
                step={10}
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                className="w-full accent-[#111111] h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Live Price Calculation Summary */}
            <div className="p-5 bg-[#F8F9FC] border border-[#E5E7EB] rounded-xl space-y-3">
              <div className="flex justify-between items-end border-b border-[#E5E7EB] pb-4">
                <div>
                  <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest block mb-1">Live Estimate</span>
                  <span className="text-3xl font-heading font-black text-[#111111]">₹{estimatedTotal}</span>
                  {applicableDiscount > 0 && (
                    <span className="ml-2 text-xs text-[#16A34A] font-bold bg-[#DCFCE7] px-2 py-0.5 rounded">
                      -{applicableDiscount}% Bulk Discount Applied
                    </span>
                  )}
                </div>
              </div>
              <p className="text-[11px] font-semibold text-[#4B5563] flex items-center gap-1.5 pt-1">
                <Truck className="w-3.5 h-3.5 text-[#3B6FEB]" /> Pan-India Delivery Included
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-2">
              <Link href={`/customer/create-quote?product=${product.id}&qty=${qty}`} className="block">
                <button className="w-full py-3.5 bg-[#111111] hover:bg-[#000000] text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm">
                  START QUOTE CONFIGURATOR <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
