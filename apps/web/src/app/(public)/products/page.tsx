'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search,
  Loader2,
  PackageX,
  ArrowRight,
  Truck,
  Package,
  X,
  Tag,
  Star,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { API_URL } from '@/lib/api';
import { canCustomize, getHighlights, getMoq, getProductColors, getSocialProof, getStartingPrice } from '@/lib/productConfig';

const CATEGORIES = [
  { id: 'all', label: 'All Merchandise' },
  { id: 't-shirts', label: 'T-Shirts & Apparel' },
  { id: 'caps', label: 'Caps & Headwear' },
];

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
      list.sort((a, b) => getStartingPrice(a) - getStartingPrice(b));
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => getStartingPrice(b) - getStartingPrice(a));
    } else if (sortBy === 'name') {
      list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }
    return list;
  }, [products, sortBy]);

  return (
    <div className="bg-[#FBFBFA] min-h-screen text-[#111111]">
      {/* Top Banner / Breadcrumb Area */}
      <div className="border-b border-[#EBEAE5] bg-white">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between text-xs text-[#6B7280]">
          <nav aria-label="Breadcrumb" className="min-h-0">
            <ol className="flex items-center gap-1.5 font-medium leading-none min-h-0">
              <li className="inline-flex items-center min-h-0">
                <Link
                  href="/"
                  className="inline-flex items-center min-h-0 h-auto py-1 px-1.5 -mx-1.5 rounded text-gray-500 hover:text-[#111111] hover:bg-gray-100 transition-colors"
                >
                  Home
                </Link>
              </li>
              <li className="inline-flex items-center min-h-0 text-gray-400 select-none" aria-hidden="true">
                <ChevronRight className="w-3 h-3" />
              </li>
              {category === 'all' ? (
                <li className="inline-flex items-center min-h-0">
                  <span className="text-[#111111] font-bold" aria-current="page">Catalog</span>
                </li>
              ) : (
                <>
                  <li className="inline-flex items-center min-h-0">
                    <Link
                      href="/products"
                      className="inline-flex items-center min-h-0 h-auto py-1 px-1.5 -mx-1.5 rounded text-gray-500 hover:text-[#111111] hover:bg-gray-100 transition-colors"
                    >
                      Catalog
                    </Link>
                  </li>
                  <li className="inline-flex items-center min-h-0 text-gray-400 select-none" aria-hidden="true">
                    <ChevronRight className="w-3 h-3" />
                  </li>
                  <li className="inline-flex items-center min-h-0">
                    <span className="text-[#3B6FEB] font-bold capitalize" aria-current="page">
                      {CATEGORIES.find(c => c.id === category)?.label || category}
                    </span>
                  </li>
                </>
              )}
            </ol>
          </nav>
          <div className="hidden sm:flex items-center gap-3 text-[11px] font-medium text-[#4B5563] min-h-0">
            <span className="inline-flex items-center gap-1.5 min-h-0">
              <Truck className="w-3.5 h-3.5 text-[#3B6FEB] shrink-0" /> Pan-India Express Delivery
            </span>
            <span className="text-gray-300" aria-hidden="true">•</span>
            <span className="inline-flex items-center gap-1.5 min-h-0">
              <Package className="w-3.5 h-3.5 text-[#3B6FEB] shrink-0" /> Bulk Orders from 20 Units
            </span>
            <span className="text-gray-300 hidden md:inline" aria-hidden="true">•</span>
            <span className="hidden md:inline-flex items-center gap-1.5 min-h-0 text-emerald-700">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Quality Verified
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4.5 space-y-3.5">
        <h1 className="sr-only">Corporate Merchandise Catalog</h1>

        {/* Filter Strip & Search - Tight & Compact */}
        <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-gray-200/90 shadow-2xs space-y-2">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search catalog by title, category, or keyword..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 bg-[#F8F9FA] border border-gray-200 rounded-lg text-xs text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB]/20 transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-200/60"
                  aria-label="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Sort & Count */}
            <div className="flex items-center justify-between md:justify-end gap-2.5">
              <span className="text-[11px] font-semibold text-gray-500">
                {sortedProducts.length} product{sortedProducts.length === 1 ? '' : 's'}
              </span>
              <div className="flex items-center gap-1.5">
                <SlidersHorizontal className="w-3 h-3 text-gray-400" />
                <label className="text-[11px] font-semibold text-gray-500 hidden sm:block">Sort:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-2.5 py-1 bg-[#F8F9FA] border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 outline-none focus:border-[#3B6FEB] focus:bg-white cursor-pointer transition-colors"
                >
                  <option value="featured">Featured</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="name">Name (A–Z)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Category Tabs Strip */}
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 hide-scrollbar">
              {CATEGORIES.map((cat) => {
                const isActive = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryChange(cat.id)}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all whitespace-nowrap border flex items-center gap-1 ${
                      isActive
                        ? 'bg-[#111111] border-[#111111] text-white shadow-2xs'
                        : 'bg-[#F9FAFB] border-gray-200/80 text-gray-600 hover:border-[#3B6FEB] hover:text-[#3B6FEB] hover:bg-white'
                    }`}
                  >
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Filter Tags */}
          {(category !== 'all' || search.trim()) && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1.5 border-t border-gray-100 text-[11px]">
              <span className="text-gray-400 font-medium">Filters:</span>
              {category !== 'all' && (
                <button
                  onClick={() => handleCategoryChange('all')}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[11px] font-semibold hover:bg-blue-100 transition-colors"
                >
                  <span>Category: {CATEGORIES.find(c => c.id === category)?.label || category}</span>
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
              {search.trim() && (
                <button
                  onClick={() => setSearch('')}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-[11px] font-semibold hover:bg-gray-200 transition-colors"
                >
                  <span>"{search.trim()}"</span>
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
              <button
                onClick={() => { setSearch(''); handleCategoryChange('all'); }}
                className="text-[11px] font-semibold text-gray-500 hover:text-black underline ml-0.5"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Loading Skeleton */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-3.5">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white border border-gray-200/80 rounded-xl overflow-hidden shadow-2xs animate-pulse flex flex-col">
                <div className="aspect-[4/3] bg-gray-100" />
                <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <div className="h-2.5 w-16 bg-gray-200 rounded" />
                      <div className="h-3.5 w-16 bg-gray-200 rounded-full" />
                    </div>
                    <div className="h-3.5 w-3/4 bg-gray-200 rounded" />
                    <div className="h-3 w-1/2 bg-gray-200 rounded" />
                  </div>
                  <div className="space-y-2 pt-1.5">
                    <div className="h-4 w-20 bg-gray-200 rounded" />
                    <div className="h-8 w-full bg-gray-200 rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="py-12 px-4 flex flex-col items-center justify-center text-center bg-white border border-gray-200 rounded-xl shadow-2xs">
            <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-3 text-gray-400">
              <PackageX className="w-6 h-6" />
            </div>
            <h3 className="text-base font-heading font-bold text-gray-900">No products found</h3>
            <p className="text-xs text-gray-500 max-w-sm mt-1 mb-4 leading-relaxed">
              {search.trim()
                ? `We couldn't find any products matching "${search.trim()}". Try searching for t-shirts or caps.`
                : 'No products are currently available in this category.'}
            </p>
            <button
              onClick={() => {
                setSearch('');
                setCategory('all');
                router.push('/products');
              }}
              className="px-3.5 py-1.5 bg-[#111111] hover:bg-black text-white text-xs font-semibold rounded-lg transition-colors shadow-2xs"
            >
              Reset Filters & View All
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-3.5">
            {sortedProducts.map((item) => {
              const primaryImage: string | undefined = item.images?.[0];
              const productColors = getProductColors(item);
              const moq = getMoq(item);
              const proof = getSocialProof(item);
              const customizable = canCustomize(item);
              const keyHighlight = getHighlights(item)[0];

              return (
                <Card
                  key={item.id}
                  data-cy={`product-card-${item.slug}`}
                  className="group bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-2xs hover:shadow-lg hover:shadow-blue-950/[0.05] hover:border-[#D1D5DB] hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
                >
                  {/* FULL GARMENT IMAGE CONTAINER */}
                  <Link
                    href={`/products/${item.id}`}
                    className="relative aspect-[4/3] bg-gradient-to-b from-[#FBFBFA] via-[#F6F6F4] to-[#EFEFEA] flex items-center justify-center p-3 sm:p-3.5 overflow-hidden border-b border-[#EBEAE4] block cursor-pointer"
                  >
                    {/* Category Badge Overlay */}
                    <div className="absolute top-2 left-2 z-10">
                      <span className="px-2 py-0.5 bg-white/95 backdrop-blur-md text-[9px] font-extrabold uppercase tracking-wider text-gray-700 rounded-full border border-black/5 shadow-2xs flex items-center gap-1">
                        <Tag className="w-2.5 h-2.5 text-[#3B6FEB]" />
                        {item.category?.name || 'Apparel'}
                      </span>
                    </div>

                    {/* Image with object-contain & smooth drop-shadow */}
                    {primaryImage ? (
                      <img
                        src={primaryImage}
                        alt={item.name}
                        data-cy="product-card-image"
                        className="w-full h-full object-contain drop-shadow-[0_6px_14px_rgba(0,0,0,0.08)] group-hover:scale-105 group-hover:drop-shadow-[0_10px_18px_rgba(0,0,0,0.12)] transition-all duration-300 ease-out select-none"
                      />
                    ) : (
                      <Package className="w-10 h-10 text-[#C9C8C1]" aria-label="No product image" />
                    )}

                    {/* Subtle Hover Pill */}
                    <div className="absolute bottom-2 inset-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none flex justify-center">
                      <span className="px-2.5 py-0.5 bg-black/80 backdrop-blur-md text-white text-[10px] font-medium rounded-full shadow-sm">
                        {customizable ? 'Interactive 3D Customizer' : 'Instant Quote Available'}
                      </span>
                    </div>
                  </Link>

                  {/* Card Content */}
                  <CardContent className="p-3 sm:p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                    <div className="space-y-1">
                      {/* SKU & MOQ Header */}
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-[9.5px] font-mono font-semibold text-gray-400 uppercase tracking-wider truncate">
                          {item.slug ? `SKU: ${item.slug}` : 'In Stock'}
                        </span>
                        <span className="shrink-0 px-2 py-0.5 bg-[#EEF2FF] text-[9.5px] font-bold text-[#3B6FEB] rounded-full border border-[#D9E2FF] shadow-2xs">
                          MOQ: {moq} Pcs
                        </span>
                      </div>

                      {/* Product Title */}
                      <Link href={`/products/${item.id}`} className="block">
                        <h3 className="text-[13.5px] sm:text-[14px] font-heading font-bold text-[#111111] leading-snug group-hover:text-[#3B6FEB] transition-colors line-clamp-1 sm:line-clamp-2">
                          {item.name}
                        </h3>
                      </Link>

                      {/* Rating */}
                      {proof && (
                        <div className="flex items-center gap-1 text-[11px] font-bold text-[#111111]" data-cy="product-card-rating">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>{proof.rating.toFixed(1)}</span>
                          {proof.reviewCount > 0 && <span className="font-normal text-gray-500">({proof.reviewCount})</span>}
                        </div>
                      )}

                      {/* Short Highlight / Description */}
                      <p className="text-[11px] text-gray-500 line-clamp-1 leading-relaxed">
                        {keyHighlight || (item.description ? item.description.replace(/[#*`]/g, '').slice(0, 90) + '...' : '')}
                      </p>
                    </div>

                    {/* Color Swatches */}
                    {productColors.length > 0 && (
                      <div className="pt-1.5 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-[10px] font-medium text-gray-500">Colors ({productColors.length}):</span>
                        <div className="flex items-center gap-1">
                          {productColors.slice(0, 5).map((col) => (
                            <span
                              key={col.name}
                              className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border border-black/10 shadow-2xs inline-block transition-transform hover:scale-110 cursor-pointer"
                              style={{ backgroundColor: col.hex }}
                              title={col.name}
                            />
                          ))}
                          {productColors.length > 5 && (
                            <span className="text-[9.5px] text-gray-500 font-semibold pl-0.5">
                              +{productColors.length - 5}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Pricing Row */}
                    <div className="pt-1.5 border-t border-gray-100 flex items-end justify-between">
                      <div>
                        <span className="text-[9.5px] uppercase tracking-wider text-gray-400 font-semibold block">Starting from</span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-base sm:text-[17px] font-heading font-black text-[#111111] tracking-tight">₹{getStartingPrice(item)}</span>
                          <span className="text-[10px] text-gray-500">/ pc</span>
                        </div>
                      </div>

                      {item.bulkPricing && item.bulkPricing.length > 1 && (
                        <div className="text-right">
                          <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 rounded-md block">
                            Bulk discounts
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Single action button: Customizer or Quote */}
                    <div className="pt-0.5">
                      <Link
                        href={
                          customizable
                            ? `/products/${item.id}/customize`
                            : `/get-quote?product=${encodeURIComponent(item.name)}&qty=${moq}&id=${item.id}`
                        }
                        className="block"
                        data-cy={customizable ? 'product-card-customize' : 'product-card-quote'}
                      >
                        <button className="w-full py-1.5 sm:py-2 px-3 bg-[#3B6FEB] hover:bg-[#2563EB] text-white text-[11px] font-bold rounded-lg transition-all shadow-2xs hover:shadow-sm flex items-center justify-center gap-1 active:scale-[0.99] min-h-[32px] sm:min-h-[34px]">
                          {customizable ? 'CUSTOMIZE' : 'REQUEST QUOTE'} <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
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
