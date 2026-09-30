'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search,
  Loader2,
  PackageX,
  ArrowRight,
  Sparkles,
  Truck,
  ShieldCheck,
  Package,
  X,
  Tag
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { API_URL } from '@/lib/api';

const CATEGORIES = [
  { id: 'all', label: 'All Merchandise' },
  { id: 't-shirts', label: 'T-Shirts & Apparel' },
  { id: 'hoodies', label: 'Hoodies & Sweatshirts' },
  { id: 'caps', label: 'Caps & Headwear' },
  { id: 'bags', label: 'Bags & Backpacks' },
  { id: 'drinkware', label: 'Mugs & Bottles' },
];

const COLOR_MAP: Record<string, string> = {
  'charcoal black': '#171717',
  'black': '#171717',
  'matte black': '#1C1C1E',
  'navy blue': '#1E293B',
  'navy': '#1E293B',
  'classic white': '#F9FAFB',
  'white': '#F9FAFB',
  'royal blue': '#1D4ED8',
  'blue': '#2563EB',
  'red': '#DC2626',
  'crimson red': '#DC2626',
  'bottle green': '#064E3B',
  'green': '#16A34A',
  'grey': '#6B7280',
  'gray': '#6B7280',
  'heather grey': '#9CA3AF',
};

function normalizeCat(c: string | null): string {
  if (!c || c === 'all') return 'all';
  if (c === 'custom-t-shirts') return 't-shirts';
  if (c === 'headwear') return 'caps';
  return c;
}

function ProductsCatalog() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialCategory = normalizeCat(searchParams.get('category'));
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'name'>('featured');
  
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync category from URL if it changes
  useEffect(() => {
    const cat = searchParams.get('category');
    setCategory(normalizeCat(cat));
  }, [searchParams]);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const query = new URLSearchParams();
        // The API pages at 10 by default; the catalog shows every active product.
        query.set('pageSize', '100');
        if (category !== 'all') {
          query.set('category', category);
        }
        if (search.trim()) {
          query.set('search', search.trim());
        }
        
        const res = await fetch(`${API_URL}/products?${query.toString()}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setProducts(data.data);
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error('Failed to fetch products', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchProducts();
    }, 250);
    return () => clearTimeout(timer);
  }, [category, search]);

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    router.push(`/products${cat !== 'all' ? `?category=${cat}` : ''}`);
  };

  // Sorted list
  const sortedProducts = useMemo(() => {
    const list = [...products];
    if (sortBy === 'price-asc') {
      list.sort((a, b) => (a.basePrice || 0) - (b.basePrice || 0));
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => (b.basePrice || 0) - (a.basePrice || 0));
    } else if (sortBy === 'name') {
      list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }
    return list;
  }, [products, sortBy]);

  return (
    <div className="bg-[#FBFBFA] min-h-screen text-[#111111]">
      {/* Top Banner / Breadcrumb Area */}
      <div className="border-b border-[#EBEAE5] bg-white/60 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between text-[11px] sm:text-xs font-medium text-[#6B7280]">
          <div className="flex items-center gap-1.5">
            <Link href="/" className="hover:text-[#111111] transition-colors">Home</Link>
            <span>/</span>
            <span className="text-[#111111] font-bold">Catalog</span>
            {category !== 'all' && (
              <>
                <span>/</span>
                <span className="text-[#3B6FEB] font-bold capitalize">
                  {CATEGORIES.find(c => c.id === category)?.label || category}
                </span>
              </>
            )}
          </div>
          <div className="hidden sm:flex items-center gap-3 text-[10.5px] text-[#4B5563]">
            <span className="flex items-center gap-1">
              <Truck className="w-3 h-3 text-[#3B6FEB]" /> Pan-India Express Delivery
            </span>
            <span className="text-gray-300">•</span>
            <span className="flex items-center gap-1">
              <Package className="w-3 h-3 text-[#3B6FEB]" /> Bulk Orders from 20 Units
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* HERO SECTION - COMPACT */}
        <div className="space-y-4">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#E2E8F0] rounded-full text-[10.5px] font-bold tracking-wide text-[#3B6FEB] shadow-2xs">
              <Sparkles className="w-3 h-3 text-[#3B6FEB]" />
              <span>OFFICIAL B2B MERCHANDISE CATALOG</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-heading font-black text-[#111111] tracking-tight leading-tight">
              Merchandise crafted to <span className="text-[#3B6FEB]">elevate your brand.</span>
            </h1>
            <p className="text-[#555555] text-xs sm:text-sm leading-relaxed max-w-xl">
              Enterprise uniforms, team apparel, welcome kits, and corporate gifting. Custom-branded with premium embroidery, screen printing, and DTF.
            </p>
          </div>

          {/* VALUE PROPS STRIP - COMPACT ROW */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 pt-0.5">
            <div className="flex items-center gap-2.5 p-2 sm:p-2.5 rounded-lg bg-white border border-[#EAE9E4] shadow-2xs">
              <div className="w-7 h-7 rounded-md bg-blue-50 text-[#3B6FEB] flex items-center justify-center flex-shrink-0">
                <Package className="w-3.5 h-3.5" />
              </div>
              <div className="leading-tight">
                <p className="text-[11.5px] font-bold text-[#111111]">Low MOQ: 20 Pcs</p>
                <p className="text-[10px] text-[#6B7280]">Low barrier for teams</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2 sm:p-2.5 rounded-lg bg-white border border-[#EAE9E4] shadow-2xs">
              <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <Truck className="w-3.5 h-3.5" />
              </div>
              <div className="leading-tight">
                <p className="text-[11.5px] font-bold text-[#111111]">Fast Turnaround</p>
                <p className="text-[10px] text-[#6B7280]">Dispatch in 3–5 days</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2 sm:p-2.5 rounded-lg bg-white border border-[#EAE9E4] shadow-2xs">
              <div className="w-7 h-7 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="leading-tight">
                <p className="text-[11.5px] font-bold text-[#111111]">Free 3D Mockups</p>
                <p className="text-[10px] text-[#6B7280]">Live interactive customizer</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2 sm:p-2.5 rounded-lg bg-white border border-[#EAE9E4] shadow-2xs">
              <div className="w-7 h-7 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <div className="leading-tight">
                <p className="text-[11.5px] font-bold text-[#111111]">Quality Assured</p>
                <p className="text-[10px] text-[#6B7280]">Bio-washed compact cotton</p>
              </div>
            </div>
          </div>
        </div>

        {/* SEARCH, FILTERS & CONTROLS CONTAINER - COMPACT */}
        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-[#E5E4DE] shadow-2xs space-y-2.5">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 max-w-lg">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Search products by title, material, or keyword..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 sm:py-2 bg-[#F8F8F6] border border-[#DDDCD5] rounded-lg text-xs sm:text-[13px] text-[#111111] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB]/20 transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort Dropdown & Product Count */}
            <div className="flex items-center justify-between md:justify-end gap-2.5">
              <span className="text-xs font-semibold text-[#6B7280]">
                {sortedProducts.length} product{sortedProducts.length === 1 ? '' : 's'}
              </span>
              <div className="flex items-center gap-1.5">
                <label className="text-xs font-semibold text-[#6B7280] hidden sm:block">Sort:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-2.5 py-1.5 bg-[#F8F8F6] border border-[#DDDCD5] rounded-lg text-xs font-semibold text-[#374151] outline-none focus:border-[#3B6FEB] cursor-pointer"
                >
                  <option value="featured">Featured</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="name">Name (A–Z)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Category Tabs Strip with Clean Scrolling */}
          <div className="pt-2 border-t border-[#F0EFEB]">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
              {CATEGORIES.map((cat) => {
                const isActive = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryChange(cat.id)}
                    className={`px-3 py-1 rounded-full text-[11.5px] font-bold transition-all whitespace-nowrap border flex items-center gap-1 ${
                      isActive
                        ? 'bg-[#111111] border-[#111111] text-white shadow-2xs'
                        : 'bg-[#F9FAFB] border-[#E5E7EB] text-[#4B5563] hover:border-[#3B6FEB] hover:text-[#3B6FEB] hover:bg-white'
                    }`}
                  >
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* PRODUCT GRID SECTION - 4 COLUMNS ON DESKTOP FOR HIGH DENSITY */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-[#6B7280]">
            <Loader2 className="w-8 h-8 animate-spin text-[#3B6FEB] mb-3" />
            <p className="text-xs sm:text-sm font-semibold text-[#374151]">Loading catalog...</p>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5">Retrieving latest specifications and bulk pricing</p>
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="py-14 px-4 flex flex-col items-center justify-center text-center bg-white border border-[#E5E4DE] rounded-xl shadow-2xs">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3 text-gray-400">
              <PackageX className="w-6 h-6" />
            </div>
            <h3 className="text-base font-heading font-black text-[#111111]">No products found</h3>
            <p className="text-xs text-[#6B7280] max-w-sm mt-1 mb-4">
              We couldn't find any products matching your current category or search criteria.
            </p>
            <button
              onClick={() => {
                setSearch('');
                setCategory('all');
                router.push('/products');
              }}
              className="px-4 py-2 bg-[#111111] text-white text-xs font-bold rounded-lg hover:bg-black transition-colors"
            >
              Reset Filters & View All
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-4.5">
            {sortedProducts.map((item) => {
              const primaryImage: string | undefined = item.images?.[0];
              const uniqueColors = Array.from(new Set((item.variants || []).map((v: any) => v.color).filter(Boolean)));
              const moq = item.bulkPricing?.[0]?.minQuantity || 20;

              return (
                <Card
                  key={item.id}
                  data-cy={`product-card-${item.slug}`}
                  className="group bg-white border-[#E6E5E0] rounded-xl overflow-hidden shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
                >
                  {/* FULL GARMENT IMAGE CONTAINER - Fixed compact 4/3 aspect ratio & object-contain */}
                  <div className="relative aspect-[4/3] bg-gradient-to-b from-[#F9F9F8] via-[#F5F5F3] to-[#ECECE8] flex items-center justify-center p-3 sm:p-4 overflow-hidden border-b border-[#EBEAE4]">
                    {/* Badges Overlay */}
                    <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 items-start">
                      <span className="px-2 py-0.5 bg-white/95 backdrop-blur-md text-[9px] font-extrabold uppercase tracking-wider text-[#111111] rounded-full border border-black/5 shadow-2xs flex items-center gap-1">
                        <Tag className="w-2.5 h-2.5 text-[#3B6FEB]" />
                        {item.category?.name || 'Apparel'}
                      </span>
                    </div>

                    <div className="absolute top-2 right-2 z-10">
                      <span className="px-2 py-0.5 bg-[#EEF2FF]/95 backdrop-blur-md text-[9px] font-bold text-[#3B6FEB] rounded-full border border-[#D9E2FF] shadow-2xs">
                        MOQ: {moq} Pcs
                      </span>
                    </div>

                    {/* Image with object-contain to ensure whole garment is visible */}
                    {primaryImage ? (
                      <img
                        src={primaryImage}
                        alt={item.name}
                        data-cy="product-card-image"
                        className="w-full h-full object-contain drop-shadow-[0_6px_14px_rgba(0,0,0,0.1)] group-hover:scale-105 group-hover:drop-shadow-[0_12px_22px_rgba(0,0,0,0.15)] transition-all duration-300 ease-out select-none"
                      />
                    ) : (
                      // No admin image yet: neutral placeholder rather than another product's photo.
                      <Package className="w-12 h-12 text-[#C9C8C1]" aria-label="No product image" />
                    )}

                    {/* Subtle Hover Pill */}
                    <div className="absolute bottom-2 inset-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none flex justify-center">
                      <span className="px-2.5 py-0.5 bg-black/80 backdrop-blur-md text-white text-[10px] font-semibold rounded-full shadow-sm">
                        Custom branding ready
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <CardContent className="p-3 sm:p-3.5 space-y-2.5 flex-1 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-[9.5px] font-bold text-[#3B6FEB] uppercase tracking-wider">
                          {item.slug ? `SKU: ${item.slug}` : 'In Stock'}
                        </span>
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                          Dispatch in 3-5 days
                        </span>
                      </div>

                      <h3 className="text-[13.5px] sm:text-[14px] font-heading font-black text-[#111111] leading-snug group-hover:text-[#3B6FEB] transition-colors line-clamp-1 sm:line-clamp-2">
                        {item.name}
                      </h3>

                      <p className="text-[11px] text-[#555555] line-clamp-1 leading-relaxed">
                        {item.description ? item.description.replace(/[#*`]/g, '').slice(0, 90) + '...' : 'Premium quality merchandise.'}
                      </p>
                    </div>

                    {/* Color Swatches */}
                    {uniqueColors.length > 0 && (
                      <div className="pt-1.5 border-t border-[#F0EFEB] flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#6B7280]">Colors ({uniqueColors.length}):</span>
                        <div className="flex items-center gap-1">
                          {uniqueColors.slice(0, 5).map((col: any) => {
                            const clean = String(col).toLowerCase();
                            const bg = COLOR_MAP[clean] || clean;
                            return (
                              <span
                                key={col}
                                className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border border-gray-300 shadow-2xs inline-block transition-transform hover:scale-110"
                                style={{ backgroundColor: bg }}
                                title={col}
                              />
                            );
                          })}
                          {uniqueColors.length > 5 && (
                            <span className="text-[9.5px] text-gray-500 font-bold">
                              +{uniqueColors.length - 5}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Pricing Row */}
                    <div className="pt-2 border-t border-[#EAE9E3] flex items-baseline justify-between">
                      <div>
                        <span className="text-[9.5px] text-[#6B7280] font-medium block">Starting from</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-base sm:text-lg font-heading font-black text-[#111111]">₹{item.basePrice}</span>
                          <span className="text-[10px] text-[#6B7280]">/ pc</span>
                        </div>
                      </div>

                      {item.bulkPricing && item.bulkPricing.length > 1 && (
                        <div className="text-right">
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 rounded block">
                            Bulk discounts
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Dual Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <Link href={`/products/${item.id}`} className="block">
                        <button className="w-full py-1.5 sm:py-2 px-2.5 bg-white hover:bg-gray-50 text-[#111111] text-[11px] font-bold rounded-lg border border-[#DDDCD5] transition-all hover:border-[#111111] shadow-2xs min-h-[32px] sm:min-h-[34px] flex items-center justify-center">
                          DETAILS
                        </button>
                      </Link>

                      <Link href={`/products/${item.id}/customize`} className="block">
                        <button className="w-full py-1.5 sm:py-2 px-2.5 bg-[#3B6FEB] hover:bg-[#2563EB] text-white text-[11px] font-bold rounded-lg transition-all shadow-2xs flex items-center justify-center gap-1 hover:gap-1.5 min-h-[32px] sm:min-h-[34px]">
                          CUSTOMIZE <ArrowRight className="w-3 h-3" />
                        </button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] bg-[#FBFBFA] flex flex-col items-center justify-center text-[#6B7280]">
          <Loader2 className="w-8 h-8 animate-spin text-[#3B6FEB] mb-3" />
          <p className="text-xs sm:text-sm font-semibold">Loading catalog...</p>
        </div>
      }
    >
      <ProductsCatalog />
    </Suspense>
  );
}
