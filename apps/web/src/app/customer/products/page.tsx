'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  SlidersHorizontal,
  X,
  Loader2,
  Package,
  PackageX,
  Tag,
  ArrowRight,
  PlusCircle,
  Eye,
  Check,
  Palette,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { API_URL } from '@/lib/api';
import { useCustomerUser } from '@/hooks/useCustomerUser';

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface BulkPricingTier {
  id: string;
  minQuantity: number;
  maxQuantity: number;
  pricePerUnit: number;
  printType?: string;
}

interface ProductVariant {
  id: string;
  color?: string;
  size?: string;
  sku?: string;
  stock?: number;
}

interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  _count?: {
    products: number;
  };
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  basePrice: number;
  images: string[];
  category?: ProductCategory;
  categoryId?: string;
  variants?: ProductVariant[];
  bulkPricing?: BulkPricingTier[];
  gstRate?: number;
  isActive?: boolean;
  requiresColor?: boolean;
  requiresSize?: boolean;
  supportsVariantMatrix?: boolean;
  createdAt?: string;
}

// ─── Color Palette Helper ────────────────────────────────────────────────────

const COLOR_MAP: Record<string, string> = {
  'charcoal black': '#171717',
  'black': '#171717',
  'matte black': '#1C1C1E',
  'navy blue': '#1E293B',
  'navy': '#1E293B',
  'classic white': '#F9FAFB',
  'pure white': '#FFFFFF',
  'white': '#F9FAFB',
  'royal blue': '#1D4ED8',
  'blue': '#2563EB',
  'red': '#DC2626',
  'crimson red': '#DC2626',
  'bottle green': '#064E3B',
  'olive green': '#4D5D3A',
  'green': '#16A34A',
  'grey': '#6B7280',
  'gray': '#6B7280',
  'heather grey': '#9CA3AF',
  'royal maroon': '#800000',
  'maroon': '#800000',
  'yellow': '#EAB308',
  'orange': '#F97316',
};

function getColorHex(colorName: string): string {
  const clean = colorName.trim().toLowerCase();
  return COLOR_MAP[clean] || '#94A3B8';
}

// ─── Price & MOQ Computation ─────────────────────────────────────────────────

function getStartingPrice(product: Product): number {
  const tiers = (product.bulkPricing || [])
    .map((b) => b.pricePerUnit)
    .filter((p) => typeof p === 'number' && p > 0);
  if (tiers.length > 0) {
    return Math.min(...tiers, product.basePrice || 249);
  }
  return product.basePrice || 249;
}

function getMOQ(product: Product): number {
  if (product.bulkPricing && product.bulkPricing.length > 0) {
    const minQ = product.bulkPricing[0].minQuantity;
    if (typeof minQ === 'number' && minQ > 0) return minQ;
  }
  return 20;
}

function formatINR(val: number): string {
  return '₹' + Number(val || 0).toLocaleString('en-IN');
}

// ─── Main Catalog Content ─────────────────────────────────────────────────────

function CustomerProductsCatalog() {
  const router = useRouter();
  const searchParams = useSearchParams();
  useCustomerUser();

  // URL state initialization
  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || 'ALL';
  const initialSort = searchParams.get('sort') || 'recommended';
  const initialColor = searchParams.get('color') || '';
  const initialSize = searchParams.get('size') || '';
  const initialMoq = searchParams.get('moq') || '';
  const initialMinPrice = searchParams.get('minPrice') || '';
  const initialMaxPrice = searchParams.get('maxPrice') || '';

  // Core Filter States
  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState(initialSort);
  const [selectedColor, setSelectedColor] = useState(initialColor);
  const [selectedSize, setSelectedSize] = useState(initialSize);
  const [selectedMoq, setSelectedMoq] = useState(initialMoq);
  const [minPrice, setMinPrice] = useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);

  // Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI States
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [showFiltersBar, setShowFiltersBar] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Sync state back to URL query parameters
  const updateURLParams = useCallback(() => {
    const params = new URLSearchParams();
    if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
    if (selectedCategory && selectedCategory !== 'ALL') params.set('category', selectedCategory);
    if (sortBy && sortBy !== 'recommended') params.set('sort', sortBy);
    if (selectedColor) params.set('color', selectedColor);
    if (selectedSize) params.set('size', selectedSize);
    if (selectedMoq) params.set('moq', selectedMoq);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);

    const queryString = params.toString();
    const targetUrl = queryString ? `/customer/products?${queryString}` : '/customer/products';
    router.replace(targetUrl, { scroll: false });
  }, [debouncedSearch, selectedCategory, sortBy, selectedColor, selectedSize, selectedMoq, minPrice, maxPrice, router]);

  useEffect(() => {
    updateURLParams();
  }, [updateURLParams]);

  // Fetch Categories from Real Database
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch(`${API_URL}/products/categories`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.categories)) {
            setCategories(data.categories);
          }
        }
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    }
    loadCategories();
  }, []);

  // Fetch Products from Real API
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Build query string
      const params = new URLSearchParams();
      params.set('status', 'Active');
      params.set('pageSize', '100');

      if (selectedCategory !== 'ALL') {
        params.set('category', selectedCategory);
      }
      if (debouncedSearch.trim()) {
        params.set('search', debouncedSearch.trim());
      }

      const res = await fetch(`${API_URL}/products?${params.toString()}`);
      if (!res.ok) {
        throw new Error('API server returned error code ' + res.status);
      }
      const data = await res.json();
      if (data.data && Array.isArray(data.data)) {
        const activeOnly = data.data.filter(
          (p: Product) => p.isActive !== false && !p.slug?.includes('-deleted-')
        );
        setProducts(activeOnly);
      } else {
        setProducts([]);
      }
    } catch (err: any) {
      console.error('Error loading products from catalog API:', err);
      setError('Unable to load products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, debouncedSearch]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Extract Real Available Filter Options from DB products
  const availableColors = useMemo(() => {
    const colorSet = new Set<string>();
    products.forEach((p) => {
      (p.variants || []).forEach((v) => {
        if (v.color?.trim()) colorSet.add(v.color.trim());
      });
    });
    return Array.from(colorSet).sort();
  }, [products]);

  const availableSizes = useMemo(() => {
    const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free Size'];
    const sizeSet = new Set<string>();
    products.forEach((p) => {
      (p.variants || []).forEach((v) => {
        if (v.size?.trim()) sizeSet.add(v.size.trim());
      });
    });
    return Array.from(sizeSet).sort((a, b) => {
      const idxA = sizeOrder.indexOf(a);
      const idxB = sizeOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [products]);

  // Filter and Sort Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // 1. Color filter
      if (selectedColor) {
        const hasColor = (p.variants || []).some(
          (v) => v.color?.toLowerCase() === selectedColor.toLowerCase()
        );
        if (!hasColor) return false;
      }

      // 2. Size filter
      if (selectedSize) {
        const hasSize = (p.variants || []).some(
          (v) => v.size?.toLowerCase() === selectedSize.toLowerCase()
        );
        if (!hasSize) return false;
      }

      // 3. MOQ filter
      if (selectedMoq) {
        const pMoq = getMOQ(p);
        const maxAllowed = parseInt(selectedMoq, 10);
        if (pMoq > maxAllowed) return false;
      }

      // 4. Price range filter
      const pPrice = getStartingPrice(p);
      if (minPrice && pPrice < Number(minPrice)) return false;
      if (maxPrice && pPrice > Number(maxPrice)) return false;

      return true;
    });
  }, [products, selectedColor, selectedSize, selectedMoq, minPrice, maxPrice]);

  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    if (sortBy === 'price-asc') {
      list.sort((a, b) => getStartingPrice(a) - getStartingPrice(b));
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => getStartingPrice(b) - getStartingPrice(a));
    } else if (sortBy === 'moq-asc') {
      list.sort((a, b) => getMOQ(a) - getMOQ(b));
    } else if (sortBy === 'newest') {
      list.sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
    }
    return list;
  }, [filteredProducts, sortBy]);

  // Reset all filters
  const handleClearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setSelectedCategory('ALL');
    setSortBy('recommended');
    setSelectedColor('');
    setSelectedSize('');
    setSelectedMoq('');
    setMinPrice('');
    setMaxPrice('');
    router.replace('/customer/products', { scroll: false });
  };

  const hasActiveFilters =
    debouncedSearch ||
    selectedCategory !== 'ALL' ||
    sortBy !== 'recommended' ||
    selectedColor ||
    selectedSize ||
    selectedMoq ||
    minPrice ||
    maxPrice;

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-12">
      {/* ─── 1. PAGE HEADER ───────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-[#E5E7EB]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EEF2FF] text-[#3B6FEB] uppercase tracking-wider mb-2">
            <Sparkles className="w-3 h-3 text-[#3B6FEB]" />
            B2B PRODUCT DISCOVERY
          </div>
          <h1
            className="text-2xl sm:text-3xl lg:text-4xl font-heading font-black text-[#111111] tracking-tight"
            data-cy="page-header-title"
          >
            BROWSE PRODUCTS
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-1 font-medium max-w-xl">
            Choose products for your next corporate order.
          </p>
        </div>

        {/* Primary & Secondary CTAs */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          <Link href="/customer/create-quote" className="inline-block">
            <Button
              variant="primary"
              size="md"
              data-cy="create-quote-header-btn"
              className="font-bold gap-1.5 shadow-sm"
            >
              <PlusCircle className="w-4 h-4" /> CREATE QUOTE
            </Button>
          </Link>

          <Link href="/design-order" className="inline-block">
            <Button
              variant="black"
              size="md"
              data-cy="design-order-header-btn"
              className="font-bold gap-1.5 shadow-sm"
            >
              <Palette className="w-4 h-4" /> DESIGN &amp; ORDER ONLINE
            </Button>
          </Link>
        </div>
      </div>

      {/* ─── 2. SEARCH & CONTROLS TOOLBAR ─────────────────────────────────── */}
      <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[240px] max-w-full lg:max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Search products..."
              data-cy="search-products-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs sm:text-sm text-[#111111] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#3B6FEB] focus:bg-white transition-all font-medium"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                data-cy="clear-search-btn"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#111111] p-1"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Desktop Category Selector & Sort */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap justify-between lg:justify-end">
            {/* Category Dropdown */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="category-select" className="text-xs font-semibold text-[#6B7280] hidden sm:block">
                Category:
              </label>
              <select
                id="category-select"
                data-cy="category-filter-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#111111] focus:outline-none focus:border-[#3B6FEB] cursor-pointer"
              >
                <option value="ALL">All Categories ▼</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="sort-select" className="text-xs font-semibold text-[#6B7280] hidden sm:block">
                Sort:
              </label>
              <select
                id="sort-select"
                data-cy="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#111111] focus:outline-none focus:border-[#3B6FEB] cursor-pointer"
              >
                <option value="recommended">Recommended</option>
                <option value="price-asc">Price Low → High</option>
                <option value="price-desc">Price High → Low</option>
                <option value="moq-asc">MOQ Low → High</option>
                <option value="newest">Newest</option>
              </select>
            </div>

            {/* Filter Toggle (Desktop) */}
            <button
              type="button"
              onClick={() => setShowFiltersBar(!showFiltersBar)}
              data-cy="desktop-filters-toggle"
              className={`hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                showFiltersBar || selectedColor || selectedSize || selectedMoq || minPrice || maxPrice
                  ? 'bg-[#EEF2FF] text-[#3B6FEB] border-[#3B6FEB]/30'
                  : 'bg-[#F9FAFB] text-[#4B5563] border-[#E5E7EB] hover:text-[#111111]'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
              {(selectedColor || selectedSize || selectedMoq || minPrice || maxPrice) && (
                <span className="w-2 h-2 rounded-full bg-[#3B6FEB]" />
              )}
            </button>

            {/* Filter Button (Mobile Trigger) */}
            <button
              type="button"
              onClick={() => setMobileFilterOpen(true)}
              data-cy="mobile-filters-trigger"
              className="md:hidden inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#F9FAFB] text-[#111111] border border-[#E5E7EB]"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Category Pills Strip (Quick Access for real DB categories) */}
        {categories.length > 0 && (
          <div className="pt-2 border-t border-[#F3F4F6] flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              data-cy="category-pill-all"
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === 'ALL'
                  ? 'bg-[#111111] text-white shadow-xs'
                  : 'bg-[#F9FAFB] text-[#6B7280] border border-[#E5E7EB] hover:text-[#111111] hover:bg-gray-100'
              }`}
            >
              All Categories
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCategory(c.slug)}
                data-cy={`category-pill-${c.slug}`}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === c.slug
                    ? 'bg-[#111111] text-white shadow-xs'
                    : 'bg-[#F9FAFB] text-[#6B7280] border border-[#E5E7EB] hover:text-[#111111] hover:bg-gray-100'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}

        {/* Desktop Advanced Filter Bar (Collapsible) */}
        {showFiltersBar && (
          <div className="pt-3 border-t border-[#E5E7EB] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-200">
            {/* MOQ Filter */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block">
                Minimum Order Quantity
              </label>
              <select
                value={selectedMoq}
                onChange={(e) => setSelectedMoq(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-xs font-medium text-[#111111] focus:outline-none focus:border-[#3B6FEB]"
              >
                <option value="">Any MOQ</option>
                <option value="20">Up to 20 pcs</option>
                <option value="50">Up to 50 pcs</option>
                <option value="100">Up to 100 pcs</option>
              </select>
            </div>

            {/* Price Range Filter */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block">
                Price Range (₹)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-1/2 px-2.5 py-1.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-xs font-medium text-[#111111] focus:outline-none focus:border-[#3B6FEB]"
                />
                <span className="text-gray-400 text-xs">–</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-1/2 px-2.5 py-1.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-xs font-medium text-[#111111] focus:outline-none focus:border-[#3B6FEB]"
                />
              </div>
            </div>

            {/* Color Filter */}
            {availableColors.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block">
                  Color {selectedColor && `(${selectedColor})`}
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {availableColors.map((col) => {
                    const isSelected = selectedColor === col;
                    return (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setSelectedColor(isSelected ? '' : col)}
                        title={col}
                        className={`w-5 h-5 rounded-full border transition-all cursor-pointer flex items-center justify-center ${
                          isSelected
                            ? 'ring-2 ring-[#3B6FEB] ring-offset-1 border-gray-400'
                            : 'border-gray-300 hover:scale-110'
                        }`}
                        style={{ backgroundColor: getColorHex(col) }}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 text-white drop-shadow-md" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size Filter */}
            {availableSizes.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block">
                  Size {selectedSize && `(${selectedSize})`}
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {availableSizes.map((sz) => {
                    const isSelected = selectedSize === sz;
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setSelectedSize(isSelected ? '' : sz)}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#3B6FEB] text-white border-[#3B6FEB]'
                            : 'bg-[#F9FAFB] text-[#4B5563] border-[#E5E7EB] hover:text-[#111111]'
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Active Filter Badges Bar */}
        {hasActiveFilters && (
          <div className="pt-2 border-t border-[#F3F4F6] flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[#6B7280] font-medium">Active filters:</span>
              {debouncedSearch && (
                <span className="px-2 py-0.5 bg-[#EEF2FF] text-[#3B6FEB] rounded-md font-bold flex items-center gap-1">
                  "{debouncedSearch}"
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSearch('')} />
                </span>
              )}
              {selectedCategory !== 'ALL' && (
                <span className="px-2 py-0.5 bg-[#F3F4F6] text-[#111111] rounded-md font-bold flex items-center gap-1 capitalize">
                  {categories.find((c) => c.slug === selectedCategory)?.name || selectedCategory}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedCategory('ALL')} />
                </span>
              )}
              {selectedColor && (
                <span className="px-2 py-0.5 bg-[#F3F4F6] text-[#111111] rounded-md font-bold flex items-center gap-1">
                  Color: {selectedColor}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedColor('')} />
                </span>
              )}
              {selectedSize && (
                <span className="px-2 py-0.5 bg-[#F3F4F6] text-[#111111] rounded-md font-bold flex items-center gap-1">
                  Size: {selectedSize}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedSize('')} />
                </span>
              )}
              {selectedMoq && (
                <span className="px-2 py-0.5 bg-[#F3F4F6] text-[#111111] rounded-md font-bold flex items-center gap-1">
                  MOQ ≤ {selectedMoq}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedMoq('')} />
                </span>
              )}
              {(minPrice || maxPrice) && (
                <span className="px-2 py-0.5 bg-[#F3F4F6] text-[#111111] rounded-md font-bold flex items-center gap-1">
                  ₹{minPrice || 0} - ₹{maxPrice || '∞'}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => {
                      setMinPrice('');
                      setMaxPrice('');
                    }}
                  />
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleClearFilters}
              data-cy="clear-filters-btn"
              className="text-[#3B6FEB] hover:underline font-bold text-xs cursor-pointer ml-auto"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* ─── 3. PRODUCT GRID / LOADING / ERROR / EMPTY STATES ──────────────── */}
      {loading ? (
        /* Loading State: Skeleton Cards */
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6"
          data-cy="loading-skeleton"
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-xs animate-pulse flex flex-col"
            >
              <div className="aspect-[4/3] bg-gray-200" />
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="w-16 h-3 bg-gray-200 rounded" />
                  <div className="w-3/4 h-4 bg-gray-200 rounded" />
                  <div className="w-full h-3 bg-gray-200 rounded" />
                </div>
                <div className="pt-3 border-t border-[#F3F4F6] space-y-3">
                  <div className="flex justify-between">
                    <div className="w-20 h-4 bg-gray-200 rounded" />
                    <div className="w-14 h-4 bg-gray-200 rounded" />
                  </div>
                  <div className="w-full h-8 bg-gray-200 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        /* Error State */
        <div
          className="text-center py-16 px-6 bg-white rounded-2xl border border-[#E5E7EB] shadow-xs space-y-4 max-w-lg mx-auto"
          data-cy="error-state"
        >
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto border border-rose-100">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#111111]">Unable to load products</h3>
            <p className="text-xs text-[#6B7280] mt-1">
              We encountered an issue fetching the product catalog. Please try again.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={fetchProducts}
            data-cy="try-again-btn"
            className="font-bold gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> TRY AGAIN
          </Button>
        </div>
      ) : sortedProducts.length === 0 ? (
        /* Empty State */
        <div
          className="text-center py-20 px-6 bg-white rounded-2xl border border-[#E5E7EB] shadow-xs space-y-4 max-w-md mx-auto"
          data-cy="empty-state"
        >
          <div className="w-14 h-14 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
            <PackageX className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-heading font-black text-[#111111]">No products found</h3>
            <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
              Try removing a filter or searching for another product.
            </p>
          </div>
          <Button
            variant="black"
            size="sm"
            onClick={handleClearFilters}
            data-cy="clear-filters-btn"
            className="font-bold"
          >
            CLEAR FILTERS
          </Button>
        </div>
      ) : (
        /* Real Product Grid */
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6"
          data-cy="product-grid"
        >
          {sortedProducts.map((item) => {
            const thumbnail = item.images && item.images.length > 0 ? item.images[0] : null;
            const startPrice = getStartingPrice(item);
            const moq = getMOQ(item);
            const itemColors = Array.from(
              new Set((item.variants || []).map((v) => v.color).filter(Boolean))
            ) as string[];
            const itemSizes = Array.from(
              new Set((item.variants || []).map((v) => v.size).filter(Boolean))
            ) as string[];
            const hasBulkPricing = Array.isArray(item.bulkPricing) && item.bulkPricing.length > 0;

            return (
              <Card
                key={item.id}
                data-cy={`product-card-${item.id}`}
                className="group bg-white border-[#E5E7EB] rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
              >
                {/* Product Thumbnail Container */}
                <div className="relative aspect-[4/3] bg-gradient-to-b from-[#F9FAFB] to-[#F3F4F6] flex items-center justify-center p-4 overflow-hidden border-b border-[#E5E7EB]">
                  {/* Category Badge (Real data) */}
                  <div className="absolute top-3 left-3 z-10">
                    <span className="px-2 py-0.5 bg-white/95 backdrop-blur-md text-[10px] font-bold text-[#111111] uppercase tracking-wider rounded-md border border-[#E5E7EB] shadow-xs flex items-center gap-1">
                      <Tag className="w-2.5 h-2.5 text-[#3B6FEB]" />
                      {item.category?.name || 'Apparel'}
                    </span>
                  </div>

                  {/* Quick View Button */}
                  <button
                    type="button"
                    onClick={() => setQuickViewProduct(item)}
                    data-cy={`quick-view-btn-${item.id}`}
                    aria-label={`Quick view ${item.name}`}
                    className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-white/90 text-[#4B5563] hover:text-[#111111] hover:bg-white shadow-xs border border-[#E5E7EB] flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>

                  {/* Image Display */}
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt={item.name}
                      loading="lazy"
                      className="w-full h-full object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    /* Neutral Graceful Placeholder (No fake stock images) */
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 space-y-1 select-none">
                      <Package className="w-12 h-12 stroke-[1.25]" />
                      <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                        {item.category?.name || 'Official Merchandise'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Product Details Content */}
                <CardContent className="p-4 sm:p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    {/* Category Label */}
                    <span className="text-[10px] font-bold text-[#3B6FEB] uppercase tracking-wider block">
                      {item.category?.name || 'Apparel'}
                    </span>

                    {/* Product Title */}
                    <h3
                      className="text-sm font-heading font-bold text-[#111111] leading-snug line-clamp-1 group-hover:text-[#3B6FEB] transition-colors"
                      data-cy={`product-name-${item.id}`}
                      title={item.name}
                    >
                      {item.name}
                    </h3>

                    {/* Colors & Sizes if present in real DB variants */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      {/* Real Color Dots */}
                      {itemColors.length > 0 ? (
                        <div className="flex items-center gap-1" title={itemColors.join(', ')}>
                          {itemColors.slice(0, 4).map((c) => (
                            <span
                              key={c}
                              className="w-3.5 h-3.5 rounded-full border border-gray-300 inline-block"
                              style={{ backgroundColor: getColorHex(c) }}
                            />
                          ))}
                          {itemColors.length > 4 && (
                            <span className="text-[9px] text-[#6B7280] font-bold">
                              +{itemColors.length - 4}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div />
                      )}

                      {/* Real Sizes */}
                      {itemSizes.length > 0 && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-[#6B7280]">
                          {itemSizes.slice(0, 4).map((s) => (
                            <span key={s} className="px-1 py-0.2 bg-gray-50 border border-gray-200 rounded">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* B2B Price & MOQ Section */}
                  <div className="pt-2.5 border-t border-[#F3F4F6] space-y-1">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-[#6B7280] font-medium">Starting price:</span>
                      <span
                        className="text-sm font-heading font-black text-[#111111]"
                        data-cy={`product-price-${item.id}`}
                      >
                        From {formatINR(startPrice)} / pc
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#6B7280] font-semibold" data-cy={`product-moq-${item.id}`}>
                        MOQ {moq} pcs
                      </span>
                      {hasBulkPricing && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                          Bulk pricing available
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Area */}
                  <div className="pt-3 border-t border-[#F3F4F6] space-y-2">
                    {/* Primary CTA: DESIGN YOUR OWN */}
                    <Link
                      href={`/products/${item.id}/customize`}
                      className="block w-full"
                      data-cy={`design-btn-${item.id}`}
                    >
                      <Button variant="primary" size="sm" className="w-full font-bold text-xs gap-1.5">
                        <Palette className="w-3.5 h-3.5" /> DESIGN YOUR OWN
                      </Button>
                    </Link>

                    {/* Secondary CTA: VIEW DETAILS */}
                    <Link
                      href={`/products/${item.id}`}
                      className="block w-full"
                      data-cy={`details-btn-${item.id}`}
                    >
                      <Button variant="secondary" size="sm" className="w-full font-bold text-xs">
                        VIEW DETAILS
                      </Button>
                    </Link>

                    {/* Small Link: GET QUICK QUOTE */}
                    <div className="text-center pt-0.5">
                      <Link
                        href={`/customer/create-quote?productId=${item.id}`}
                        data-cy={`quick-quote-link-${item.id}`}
                        className="text-[11px] font-bold text-[#3B6FEB] hover:underline transition-colors uppercase tracking-wider inline-flex items-center gap-1"
                      >
                        GET QUICK QUOTE <ArrowRight className="w-2.5 h-2.5" />
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ─── 4. QUICK VIEW MODAL (Section 13) ──────────────────────────────── */}
      <Modal
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        title="Product Quick View"
        size="lg"
      >
        {quickViewProduct && (
          <div className="space-y-6 text-xs sm:text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
              {/* Image Preview */}
              <div className="aspect-[4/3] bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] flex items-center justify-center p-4 overflow-hidden">
                {quickViewProduct.images && quickViewProduct.images.length > 0 ? (
                  <img
                    src={quickViewProduct.images[0]}
                    alt={quickViewProduct.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-300 space-y-2">
                    <Package className="w-14 h-14" />
                    <span className="text-xs font-bold text-[#9CA3AF]">No photo available</span>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="space-y-3">
                <div>
                  <span className="text-[10px] font-bold text-[#3B6FEB] uppercase tracking-wider">
                    {quickViewProduct.category?.name || 'Apparel'}
                  </span>
                  <h3 className="text-base sm:text-lg font-heading font-black text-[#111111] mt-0.5">
                    {quickViewProduct.name}
                  </h3>
                  <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
                    {quickViewProduct.description || 'Premium corporate merchandise engineered for enterprise gifting and uniforms.'}
                  </p>
                </div>

                <div className="bg-[#F9FAFB] p-3 rounded-xl border border-[#E5E7EB] space-y-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-[#6B7280]">Starting Price:</span>
                    <strong className="text-base font-heading font-black text-[#111111]">
                      From {formatINR(getStartingPrice(quickViewProduct))} / pc
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#6B7280]">Minimum Order Quantity:</span>
                    <strong className="text-[#111111] font-bold">
                      {getMOQ(quickViewProduct)} Pcs
                    </strong>
                  </div>
                </div>

                {/* Available Colors */}
                {(() => {
                  const colors = Array.from(
                    new Set((quickViewProduct.variants || []).map((v) => v.color).filter(Boolean))
                  ) as string[];
                  if (colors.length === 0) return null;
                  return (
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block">
                        Available Colors:
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {colors.map((c) => (
                          <div
                            key={c}
                            className="flex items-center gap-1 px-2 py-0.5 bg-white border border-[#E5E7EB] rounded-md text-[11px] font-semibold text-[#111111]"
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-gray-300"
                              style={{ backgroundColor: getColorHex(c) }}
                            />
                            <span>{c}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Available Sizes */}
                {(() => {
                  const sizes = Array.from(
                    new Set((quickViewProduct.variants || []).map((v) => v.size).filter(Boolean))
                  ) as string[];
                  if (sizes.length === 0) return null;
                  return (
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block">
                        Available Sizes:
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {sizes.map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 bg-white border border-[#E5E7EB] rounded text-xs font-bold text-[#111111]"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Bulk Pricing Tiers Table */}
            {quickViewProduct.bulkPricing && quickViewProduct.bulkPricing.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-[#E5E7EB]">
                <h4 className="text-xs font-bold text-[#111111] uppercase tracking-wider">
                  Bulk Pricing Tiers
                </h4>
                <div className="overflow-x-auto rounded-xl border border-[#E5E7EB]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F9FAFB] text-[#6B7280] font-semibold border-b border-[#E5E7EB]">
                      <tr>
                        <th className="py-2 px-3">Quantity Range</th>
                        <th className="py-2 px-3">Price / Piece</th>
                        <th className="py-2 px-3">Print Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB] text-[#111111]">
                      {quickViewProduct.bulkPricing.map((tier) => (
                        <tr key={tier.id}>
                          <td className="py-2 px-3 font-semibold">
                            {tier.minQuantity} – {tier.maxQuantity >= 9999 ? 'Above' : `${tier.maxQuantity} pcs`}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-[#3B6FEB]">
                            {formatINR(tier.pricePerUnit)}
                          </td>
                          <td className="py-2 px-3 text-[#6B7280]">
                            {tier.printType || 'Standard'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-3 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between gap-3">
              <Link
                href={`/customer/create-quote?productId=${quickViewProduct.id}`}
                className="text-xs font-bold text-[#3B6FEB] hover:underline"
                onClick={() => setQuickViewProduct(null)}
              >
                Get Quick Quote for this item →
              </Link>
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <Link
                  href={`/products/${quickViewProduct.id}`}
                  className="flex-1 sm:flex-initial"
                  onClick={() => setQuickViewProduct(null)}
                >
                  <Button variant="secondary" size="sm" className="w-full font-bold">
                    VIEW DETAILS
                  </Button>
                </Link>
                <Link
                  href={`/products/${quickViewProduct.id}/customize`}
                  className="flex-1 sm:flex-initial"
                  onClick={() => setQuickViewProduct(null)}
                >
                  <Button variant="primary" size="sm" className="w-full font-bold gap-1.5">
                    <Palette className="w-3.5 h-3.5" /> DESIGN YOUR OWN
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── 5. MOBILE FILTERS SHEET MODAL ─────────────────────────────────── */}
      <Modal
        isOpen={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        title="Filter Products"
        size="sm"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                handleClearFilters();
                setMobileFilterOpen(false);
              }}
              className="text-xs"
            >
              Clear All
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setMobileFilterOpen(false)}
              className="text-xs font-bold"
            >
              Apply Filters
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          {/* Category */}
          <div className="space-y-1">
            <label className="font-bold text-[#6B7280] uppercase tracking-wider block">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg font-medium text-[#111111]"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="space-y-1">
            <label className="font-bold text-[#6B7280] uppercase tracking-wider block">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg font-medium text-[#111111]"
            >
              <option value="recommended">Recommended</option>
              <option value="price-asc">Price Low → High</option>
              <option value="price-desc">Price High → Low</option>
              <option value="moq-asc">MOQ Low → High</option>
              <option value="newest">Newest</option>
            </select>
          </div>

          {/* MOQ */}
          <div className="space-y-1">
            <label className="font-bold text-[#6B7280] uppercase tracking-wider block">
              Minimum Order Quantity
            </label>
            <select
              value={selectedMoq}
              onChange={(e) => setSelectedMoq(e.target.value)}
              className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg font-medium text-[#111111]"
            >
              <option value="">Any MOQ</option>
              <option value="20">Up to 20 pcs</option>
              <option value="50">Up to 50 pcs</option>
              <option value="100">Up to 100 pcs</option>
            </select>
          </div>

          {/* Price Range */}
          <div className="space-y-1">
            <label className="font-bold text-[#6B7280] uppercase tracking-wider block">
              Price Range (₹)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-1/2 px-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg font-medium text-[#111111]"
              />
              <span className="text-gray-400">–</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-1/2 px-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg font-medium text-[#111111]"
              />
            </div>
          </div>

          {/* Color */}
          {availableColors.length > 0 && (
            <div className="space-y-1">
              <label className="font-bold text-[#6B7280] uppercase tracking-wider block">
                Color
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {availableColors.map((col) => {
                  const isSelected = selectedColor === col;
                  return (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setSelectedColor(isSelected ? '' : col)}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold border flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-[#EEF2FF] text-[#3B6FEB] border-[#3B6FEB]'
                          : 'bg-[#F9FAFB] text-[#111111] border-[#E5E7EB]'
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full border border-gray-300"
                        style={{ backgroundColor: getColorHex(col) }}
                      />
                      <span>{col}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Size */}
          {availableSizes.length > 0 && (
            <div className="space-y-1">
              <label className="font-bold text-[#6B7280] uppercase tracking-wider block">
                Size
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {availableSizes.map((sz) => {
                  const isSelected = selectedSize === sz;
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setSelectedSize(isSelected ? '' : sz)}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold border ${
                        isSelected
                          ? 'bg-[#3B6FEB] text-white border-[#3B6FEB]'
                          : 'bg-[#F9FAFB] text-[#111111] border-[#E5E7EB]'
                      }`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

// ─── Exported Page Component with Suspense Boundary ───────────────────────────

export default function CustomerProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 flex flex-col items-center justify-center text-[#6B7280]">
          <Loader2 className="w-8 h-8 animate-spin text-[#3B6FEB] mb-3" />
          <p className="text-xs font-semibold">Loading merchandise catalog...</p>
        </div>
      }
    >
      <CustomerProductsCatalog />
    </Suspense>
  );
}
