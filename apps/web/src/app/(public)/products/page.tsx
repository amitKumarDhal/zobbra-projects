'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, Loader2, PackageX } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { API_URL } from '@/lib/api';

const CATEGORIES = [
  { id: 'all', label: 'ALL' },
  { id: 'custom-t-shirts', label: 'Custom T-Shirts' },
  { id: 'hoodies', label: 'Hoodies' },
  { id: 'headwear', label: 'Caps & Headwear' },
  { id: 'bags', label: 'Bags & Backpacks' },
  { id: 'corporate', label: 'Corporate Merch' },
  { id: 'promotional', label: 'Promotional' },
];

function ProductsCatalog() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialCategory = searchParams.get('category') || 'all';
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(initialCategory);
  
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync category from URL if it changes
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) {
      setCategory(cat);
    } else {
      setCategory('all');
    }
  }, [searchParams]);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const query = new URLSearchParams();
        if (category !== 'all') {
          query.set('category', category);
        }
        if (search) {
          query.set('search', search);
        }
        
        const res = await fetch(`${API_URL}/products?${query.toString()}`);
        const data = await res.json();
        if (data.success) {
          setProducts(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch products', err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(timer);
  }, [category, search]);

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    router.push(`/products${cat !== 'all' ? `?category=${cat}` : ''}`);
  };

  return (
    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-10 bg-[#F7F6F2] min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-end">
        <div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-[#D9E2FF] rounded-full text-xs font-bold tracking-[0.12em] text-[#3B6FEB] mb-4">
          CURATED CATALOG
        </div>
        <h1 className="text-[2.7rem] sm:text-5xl lg:text-[58px] font-heading font-black text-[#111111] tracking-[-0.045em] leading-[1.02]">Merchandise made<br className="hidden sm:block" /> to carry your brand.</h1>
        <p className="text-[#555555] text-base sm:text-lg leading-relaxed mt-4 max-w-xl">Explore custom apparel, caps, bags, and promotional corporate gifts, curated for teams and growing businesses.</p>
        </div>
        <div className="hidden lg:block text-right text-sm text-[#77736B] leading-relaxed max-w-[180px]">Built for thoughtful brand moments, from first sample to final delivery.</div>
      </div>

      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white p-3 sm:p-4 rounded-2xl border border-[#DDDCD5] shadow-[0_10px_28px_rgba(17,17,17,0.05)]">
        <div className="relative w-full lg:w-96 flex-shrink-0">
          <Search className="w-4 h-4 absolute left-3 top-3.5 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Search merchandise..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-3 bg-[#F7F6F2] border border-[#DDDCD5] rounded-xl text-sm text-[#111111] focus:outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] transition-all"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto w-full pb-1 lg:pb-0 hide-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
                className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-colors whitespace-nowrap border ${
                category === cat.id ? 'bg-[#111111] border-[#111111] text-white shadow-sm' : 'bg-white border-[#DDDCD5] text-[#374151] hover:border-[#3B6FEB] hover:text-[#3B6FEB]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-[#6B7280]">
          <Loader2 className="w-8 h-8 animate-spin text-[#3B6FEB] mb-4" />
          <p className="text-sm font-medium">Loading catalog...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="py-24 flex flex-col items-center justify-center text-[#6B7280] bg-white border border-[#DDDCD5] rounded-2xl border-dashed">
          <PackageX className="w-12 h-12 text-[#D1D5DB] mb-4" />
          <h3 className="text-lg font-heading font-bold text-[#111111]">No products available yet.</h3>
          <p className="text-sm mt-1 text-center max-w-sm">We couldn't find any products matching your current category or search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {products.map((item) => (
            <Card key={item.id} className="bg-white border-[#DDDCD5] rounded-2xl overflow-hidden shadow-none hover:shadow-[0_20px_40px_-16px_rgba(17,17,17,0.25)] hover:-translate-y-1 transition-all duration-300 group">
              <div className="overflow-hidden bg-[#F2F1EC] h-64 sm:h-72 flex items-center justify-center relative">
                {item.images && item.images.length > 0 ? (
                  <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <PackageX className="w-16 h-16 text-[#D1D5DB]" />
                )}
              </div>
              <CardContent className="p-5 sm:p-6 space-y-4">
                <div>
                  <span className="text-[10px] font-bold text-[#3B6FEB] uppercase tracking-[0.14em]">{item.category?.name || 'Uncategorized'}</span>
                  <h3 className="text-lg font-heading font-bold text-[#111111] mt-1 leading-tight line-clamp-2">{item.name}</h3>
                </div>
                <div className="flex items-center justify-between text-xs pt-4 border-t border-[#E5E7EB]">
                  <span className="text-[#6B7280] font-medium">Starting From <strong className="text-[#111111] text-base font-black ml-1">₹{item.basePrice}</strong></span>
                  {item.bulkPricing && item.bulkPricing.length > 0 && (
                    <span className="px-2 py-1 bg-[#EEF2FF] text-[#3B6FEB] border border-[#D9E2FF] rounded-full text-[10px] font-bold">
                      MOQ: {item.bulkPricing[0].minQuantity}
                    </span>
                  )}
                </div>
                <Link href={`/products/${item.id}`} className="block pt-2">
                  <button className="w-full py-3 bg-[#111111] hover:bg-[#3B6FEB] text-white text-sm font-semibold rounded-full transition-colors shadow-sm">
                    VIEW & QUOTE
                  </button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8F9FC] flex flex-col items-center justify-center text-[#6B7280]">
        <Loader2 className="w-8 h-8 animate-spin text-[#3B6FEB] mb-4" />
        <p className="text-sm font-medium">Loading catalog...</p>
      </div>
    }>
      <ProductsCatalog />
    </Suspense>
  );
}
