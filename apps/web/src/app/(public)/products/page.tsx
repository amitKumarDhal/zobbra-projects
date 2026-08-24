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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 bg-[#F8F9FC] min-h-screen">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#EEF2FF] border border-[#C7D2FE] rounded-full text-xs font-semibold text-[#3B6FEB] mb-3">
          CURATED CATALOG
        </div>
        <h1 className="text-4xl lg:text-[42px] font-heading font-black text-[#111111] leading-tight">Custom Merchandise Catalog</h1>
        <p className="text-[#6B7280] text-sm mt-2">Explore custom apparel, caps, bags, and promotional corporate gifts.</p>
      </div>

      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-sm">
        <div className="relative w-full lg:w-80 flex-shrink-0">
          <Search className="w-4 h-4 absolute left-3 top-3.5 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Search merchandise..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#D1D5DB] rounded-lg text-sm text-[#111111] focus:outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] shadow-sm transition-all"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto w-full pb-2 lg:pb-0 hide-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap border ${
                category === cat.id ? 'bg-[#111111] border-[#111111] text-white shadow-sm' : 'bg-white border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB]'
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
        <div className="py-20 flex flex-col items-center justify-center text-[#6B7280] bg-white border border-[#E5E7EB] rounded-xl border-dashed">
          <PackageX className="w-12 h-12 text-[#D1D5DB] mb-4" />
          <h3 className="text-lg font-heading font-bold text-[#111111]">No products available yet.</h3>
          <p className="text-sm mt-1 text-center max-w-sm">We couldn't find any products matching your current category or search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {products.map((item) => (
            <Card key={item.id} className="bg-white border-[#E5E7EB] overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
              <div className="overflow-hidden bg-[#F8F9FC] h-64 flex items-center justify-center relative">
                {item.images && item.images.length > 0 ? (
                  <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <PackageX className="w-16 h-16 text-[#D1D5DB]" />
                )}
              </div>
              <CardContent className="p-6 space-y-4">
                <div>
                  <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">{item.category?.name || 'Uncategorized'}</span>
                  <h3 className="text-lg font-heading font-bold text-[#111111] mt-1 leading-tight line-clamp-2">{item.name}</h3>
                </div>
                <div className="flex items-center justify-between text-xs pt-4 border-t border-[#E5E7EB]">
                  <span className="text-[#6B7280] font-medium">Starting From <strong className="text-[#3B6FEB] text-base font-black ml-1">₹{item.basePrice}</strong></span>
                  {item.bulkPricing && item.bulkPricing.length > 0 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 border border-gray-200 rounded text-[10px] font-bold">
                      MOQ: {item.bulkPricing[0].minQuantity}
                    </span>
                  )}
                </div>
                <Link href={`/products/${item.id}`} className="block pt-2">
                  <button className="w-full py-3 bg-[#111111] hover:bg-[#000000] text-white text-sm font-semibold rounded-lg transition-colors shadow-sm">
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
