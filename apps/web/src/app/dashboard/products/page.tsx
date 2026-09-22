'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Plus, FileText, CheckCircle2, Tags, Package, UploadCloud, X, Edit2, Copy, Trash2, IndianRupee, Image as ImageIcon, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';

import { API_URL } from '@/lib/api';
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/upload';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ totalProducts: 0, activeProducts: 0, draftProducts: 0, categories: 0, variants: 0 });
  const [categories, setCategories] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('All Categories');
  const [filterStatus, setFilterStatus] = useState('Active');
  
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, pageSize: 10 });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'ADD' | 'EDIT'>('ADD');
  const [editProductId, setEditProductId] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchData();
    setSelectedIds([]);
  }, [search, filterCategory, filterStatus, page]);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/products/categories`).then(r => r.json());
      if(res.success) setCategories(res.categories || []);
    } catch (e) {
      console.error(e);
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const qs = new URLSearchParams({ search, category: filterCategory, status: filterStatus, page: String(page) });

      const [resList, resStats] = await Promise.all([
        fetch(`${API_URL}/products?${qs.toString()}`, { headers }).then(r => r.json()),
        fetch(`${API_URL}/products/stats`, { headers }).then(r => r.json())
      ]);

      if (resList.success) {
        setProducts(resList.data || []);
        if(resList.pagination) setPagination(resList.pagination);
      }
      if (resStats.success) {
        setStats(resStats.stats || {});
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`${API_URL}/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`Failed to delete product: ${data.message || 'Unknown error'}`);
        return;
      }
      setSelectedIds(prev => prev.filter(x => x !== id));
      fetchData();
    } catch (err) {
      alert('Network error. Please check your connection and try again.');
      console.error(err);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await fetch(`${API_URL}/products/${id}/duplicate`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const openAdd = () => {
    setDrawerMode('ADD');
    setEditProductId(null);
    setIsDrawerOpen(true);
  };

  const openEdit = (id: string) => {
    setDrawerMode('EDIT');
    setEditProductId(id);
    setIsDrawerOpen(true);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(products.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(x => x !== id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} selected products?`)) return;

    try {
      const res = await fetch(`${API_URL}/products/bulk`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        body: JSON.stringify({ ids: selectedIds })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`Failed to bulk delete: ${data.message || 'Unknown error'}`);
        return;
      }
      setSelectedIds([]);
      fetchData();
    } catch (err) {
      alert('Network error. Please check your connection and try again.');
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans bg-[#F8F9FC] min-h-screen relative flex flex-col">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-black text-[#111111]">Products</h1>
          <div className="text-sm text-[#6B7280] font-medium mt-1 flex items-center gap-2">
            Dashboard <span className="text-[#D1D5DB]">&gt;</span> Products
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/products/new"
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2.5 border border-[#E5E7EB] bg-white hover:bg-gray-50 text-[#374151] rounded-lg text-sm font-bold transition-colors"
          >
            Full Page Editor
          </Link>
          <button onClick={openAdd} className="bg-[#3B6FEB] text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm hover:bg-[#2563EB] transition-colors flex items-center gap-2 min-h-[44px]">
            <Plus className="w-4 h-4"/> Add New Product
          </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <StatCard icon={<FileText className="w-5 h-5 text-purple-600" />} iconBg="bg-purple-50" title="Total Products" value={stats.totalProducts} sub="All products" />
        <StatCard icon={<CheckCircle2 className="w-5 h-5 text-green-600" />} iconBg="bg-green-50" title="Active Products" value={stats.activeProducts} sub="Published" />
        <StatCard icon={<FileText className="w-5 h-5 text-amber-600" />} iconBg="bg-amber-50" title="Draft Products" value={stats.draftProducts} sub="Unpublished" />
        <StatCard icon={<Tags className="w-5 h-5 text-pink-600" />} iconBg="bg-pink-50" title="Categories" value={stats.categories} sub="Product categories" />
        <StatCard icon={<Package className="w-5 h-5 text-blue-600" />} iconBg="bg-blue-50" title="Total Variants" value={stats.variants} sub="Across all products" />
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex flex-1 gap-6 relative">
        {/* LIST TABLE */}
        <div className={`bg-white border border-[#E5E7EB] rounded-2xl shadow-sm transition-all duration-300 flex-1 ${isDrawerOpen ? 'w-2/3 hidden lg:block' : 'w-full'}`}>
          {/* Toolbar */}
          <div className="p-4 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:flex-wrap gap-3 justify-between items-stretch sm:items-center bg-[#FDFDFD] rounded-t-2xl">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
              <input 
                type="text" 
                placeholder="Search products..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#111111] focus:outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] shadow-sm transition-shadow"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#374151] outline-none hover:bg-[#F9FAFB]">
                <option>All Categories</option>
                {categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
              </select>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#374151] outline-none hover:bg-[#F9FAFB] hidden sm:block">
                <option>All Status</option>
                <option>Active</option>
                <option>Draft</option>
              </select>
              <select className="px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#374151] outline-none hover:bg-[#F9FAFB] hidden sm:block">
                <option>All Print Methods</option>
              </select>
              <button className="flex items-center gap-2 px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm font-semibold text-[#374151] hover:bg-[#F9FAFB] transition-colors bg-white">
                <Filter className="w-4 h-4" /> Filter
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm font-semibold text-[#374151] hover:bg-[#F9FAFB] transition-colors bg-white">
                <Download className="w-4 h-4" /> Export
              </button>
            </div>
          </div>

          {selectedIds.length > 0 && (
            <div className="bg-[#EEF2FF] border-b border-[#E5E7EB] px-4 py-3 flex items-center justify-between">
              <span className="text-sm font-bold text-[#3B6FEB]">
                {selectedIds.length} product{selectedIds.length > 1 ? 's' : ''} selected
              </span>
              <button 
                onClick={handleBulkDelete}
                className="flex items-center gap-2 px-4 py-1.5 bg-red-500 text-white rounded text-xs font-bold shadow-sm hover:bg-red-600 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Selected
              </button>
            </div>
          )}

          {/* Table */}
          <div className="table-scroll">
            <table className="w-full min-w-[850px] text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E7EB]">
                  <th className="px-4 py-3 w-10 text-center">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300" 
                      checked={products.length > 0 && selectedIds.length === products.length}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Product</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Price (₹)</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider text-center">MOQ</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Print Methods</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider text-center">Status</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Date Added</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {loading ? (
                  <tr><td colSpan={9} className="p-8 text-center text-gray-500 font-medium">Loading products...</td></tr>
                ) : products.length === 0 ? (
                  <tr><td colSpan={9} className="p-8 text-center text-gray-500 font-medium">No products found.</td></tr>
                ) : products.map((p) => {
                  const printMethods = Array.from(new Set(p.bulkPricing?.map((bp: any) => bp.printType))).filter(Boolean) as string[];
                  const moq = Math.min(...(p.bulkPricing?.length > 0 ? p.bulkPricing.map((bp:any) => bp.minQuantity) : [1]));

                  return (
                    <tr key={p.id} className="hover:bg-[#F9FAFB] transition-colors">
                      <td className="px-4 py-4 text-center">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300" 
                          checked={selectedIds.includes(p.id)}
                          onChange={(e) => handleSelectOne(p.id, e.target.checked)}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                            {p.images && p.images.length > 0 ? (
                              <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[#111111]">{p.name}</p>
                            <p className="text-[10px] text-[#6B7280] mt-0.5">{p.variants?.length > 0 ? p.variants[0].color : 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs font-semibold text-[#4B5563]">{p.category?.name || 'Uncategorized'}</td>
                      <td className="px-4 py-4 text-xs font-black text-[#111111]">₹{p.basePrice}</td>
                      <td className="px-4 py-4 text-center text-xs font-semibold text-[#4B5563]">{moq}</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1">
                          {printMethods.length > 0 ? printMethods.slice(0,3).map(pm => (
                             <span key={pm} className="text-[9px] font-bold uppercase px-1.5 py-0.5 border border-[#E5E7EB] rounded bg-white text-[#4B5563]">{pm}</span>
                          )) : <span className="text-[9px] text-[#9CA3AF]">-</span>}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <StatusBadge status={p.isActive ? 'ACTIVE' : 'DRAFT'} />
                      </td>
                      <td className="px-4 py-4 text-xs text-[#6B7280]">{new Date(p.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openEdit(p.id)} className="p-1.5 text-[#6B7280] hover:text-[#111111] hover:bg-[#F3F4F6] rounded" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDuplicate(p.id)} className="p-1.5 text-[#6B7280] hover:text-[#111111] hover:bg-[#F3F4F6] rounded" title="Duplicate"><Copy className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDelete(p.id)} className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="p-4 border-t border-[#E5E7EB] flex justify-between items-center text-xs text-[#6B7280]">
            <span>Showing {(page - 1) * pagination.pageSize + 1} to {Math.min(page * pagination.pageSize, pagination.total)} of {pagination.total} products</span>
            <div className="flex gap-1 items-center">
              <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-2 py-1 border border-[#E5E7EB] rounded hover:bg-[#F3F4F6] disabled:opacity-50">&lt;</button>
              <span className="px-3 font-semibold text-[#111111]">{page}</span>
              <button disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)} className="px-2 py-1 border border-[#E5E7EB] rounded hover:bg-[#F3F4F6] disabled:opacity-50">&gt;</button>
            </div>
          </div>
        </div>

        {/* RIGHT DRAWER */}
        {isDrawerOpen && (
          <ProductDrawer 
            mode={drawerMode}
            productId={editProductId}
            categories={categories}
            onClose={() => setIsDrawerOpen(false)} 
            onRefresh={fetchData}
          />
        )}
      </div>
    </div>
  );
}


const CAP_DESCRIPTION_TEMPLATE = `Premium 6-panel structured baseball cap crafted from 100% heavy brushed cotton twill.

### Key Features & Specifications:
- **Fabric**: 100% Heavy Brushed Compact Cotton Twill for enhanced durability and superior crown shape retention.
- **Structure**: 6-Panel structured design with fused hard buckram interior support preventing collapse.
- **Visor**: Pre-curved visor with 6 rows of contrast/tonal edge stitching.
- **Ventilation**: 6 sewn embroidered eyelets (one per panel) ensuring breathability in all seasons.
- **Sweatband**: Cotton twill interior moisture-wicking sweatband for all-day comfort.
- **Closure**: Adjustable brass metal slide buckle with hidden grommet tuck-in (Free Size / Fits 54cm–60cm circumference).
- **Branding Methods**: Engineered specifically for 3D Puff Embroidery, Flat Embroidery, Woven Badges, and HD DTF Transfer.
- **MOQ**: 20 Pieces. Ideal for corporate merchandise, trade shows, delivery teams, and promotional events.`;

const BAG_DESCRIPTION_TEMPLATE = `Executive 28L corporate laptop backpack engineered with high-density water-resistant ballistic polyester, dual reinforced compartments, and a dedicated 15.6" padded laptop sleeve.

### Key Features & Specifications:
- **Material**: 900D Heavy-Duty Water-Repellent Ballistic Polyester with scratch-resistant coating.
- **Laptop Protection**: Dedicated shock-absorbing padded sleeve accommodates up to 15.6-inch laptops and tablets.
- **Capacity & Compartments**: 28-Litre capacity featuring 2 large zippered main compartments, 1 quick-access front zippered organizer, and 1 side elastic mesh water bottle holder.
- **Ergonomics**: Contoured multi-panel airflow back padding with breathable mesh and adjustable padded shoulder straps for maximum lumbar support.
- **Hardware & Finish**: Heavy-duty dual metal zippers with corded pullers, reinforced top padded grab handle, and subtle cyan-blue contrast piping.
- **Branding Methods**: Tailored for High-Density Embroidery, Rubberized 3D Badges, Silk Screen Printing, and HD DTF Transfer on the front corporate branding zone (12cm × 8cm).
- **MOQ**: 20 Pieces. Ideal for new hire welcome kits, corporate gifting, tech conferences, and executive teams.`;

const MUG_DESCRIPTION_TEMPLATE = `Premium 330ml (11oz) matte-finish ceramic coffee mug engineered for corporate gifting, welcome kits, and daily office use.

### Key Features & Specifications:
- **Material**: Premium Grade-A Ceramic Stoneware with chip-resistant rim and durable glaze.
- **Capacity**: 330 ml / 11 oz. Ergonomic C-shaped comfort handle.
- **Finish**: Modern ultra-smooth matte exterior with food-grade non-porous interior.
- **Safety Standards**: 100% Lead-Free, Cadmium-Free, Microwave Safe & Dishwasher Safe.
- **Branding Methods**: High-precision Screen Printing, UV DTF Wrap, Sublimation Printing, and Metallic Gold/Silver Foil stamping on dual-sided branding areas (7cm × 7cm per side or full wrap 20cm × 8cm).
- **Packaging**: Individually packed in protective thermocol bubble-wrap and corrugated Kraft gift box.
- **MOQ**: 25 Pieces. Ideal for employee onboarding kits, client appreciation, executive desk accessories, and corporate events.`;

function ProductDrawer({ mode, productId, categories, onClose, onRefresh }: { mode: 'ADD'|'EDIT', productId: string|null, categories: any[], onClose: () => void, onRefresh: () => void }) {
  const [activeTab, setActiveTab] = useState<'Basic Info' | 'Variants' | 'Pricing' | 'Design Studio'>('Basic Info');
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Form State
  const [basic, setBasic] = useState({ name: '', sku: '', categoryId: '', description: '', basePrice: 0, isActive: true, images: [] as string[] });
  const [variants, setVariants] = useState<any[]>([]);
  const [pricing, setPricing] = useState<any[]>([]);

  const selectedCat = categories.find(c => c.id === basic.categoryId);
  const isCapCategory = selectedCat?.slug === 'caps' || selectedCat?.name?.toLowerCase().includes('cap');
  const isBagCategory = selectedCat?.slug === 'bags' || selectedCat?.name?.toLowerCase().includes('bag');
  const isMugCategory = selectedCat?.slug === 'drinkware' || selectedCat?.name?.toLowerCase().includes('mug') || selectedCat?.name?.toLowerCase().includes('cup') || selectedCat?.name?.toLowerCase().includes('bottle');

  const applyTemplate = (type: 'CAP' | 'POLO' | 'BAG' | 'MUG' | 'CLEAR') => {
    if (type === 'CLEAR') {
      setBasic({ name: '', sku: '', categoryId: '', description: '', basePrice: 0, isActive: true, images: [] });
      setVariants([]);
      setPricing([]);
      return;
    }

    if (type === 'MUG') {
      const mugCat = categories.find(c => c.slug === 'drinkware' || c.name?.toLowerCase().includes('mug') || c.name?.toLowerCase().includes('bottle') || c.name?.toLowerCase().includes('drink')) || categories[0];
      setBasic({
        name: 'Classic Corporate Ceramic Coffee Mug',
        sku: 'classic-corporate-ceramic-mug',
        categoryId: mugCat?.id || '',
        basePrice: 149,
        isActive: true,
        description: MUG_DESCRIPTION_TEMPLATE,
        images: [
          'https://res.cloudinary.com/e3sasmyr/image/upload/v1790086438/products/corporate-ceramic-coffee-mug-black.jpg',
          '/images/products/corporate-ceramic-mug.jpg'
        ]
      });
      setVariants([
        { color: 'Matte Black', size: '330ml (Standard)', sku: 'MUG-CER-BLK', stock: 1000 },
        { color: 'Classic White', size: '330ml (Standard)', sku: 'MUG-CER-WHT', stock: 800 },
        { color: 'Navy Blue', size: '330ml (Standard)', sku: 'MUG-CER-NVY', stock: 500 },
      ]);
      setPricing([
        { minQuantity: 25, maxQuantity: 49, pricePerUnit: 149, printType: 'Screen Print / UV DTF' },
        { minQuantity: 50, maxQuantity: 99, pricePerUnit: 129, printType: 'Screen Print / UV DTF' },
        { minQuantity: 100, maxQuantity: 249, pricePerUnit: 109, printType: 'Screen Print / UV DTF' },
        { minQuantity: 250, maxQuantity: 499, pricePerUnit: 95, printType: 'Screen Print / UV DTF' },
        { minQuantity: 500, maxQuantity: 9999, pricePerUnit: 79, printType: 'Screen Print / UV DTF' },
      ]);
    } else if (type === 'CAP') {
      const capCat = categories.find(c => c.slug === 'caps' || c.name?.toLowerCase().includes('cap')) || categories[0];
      setBasic({
        name: 'Classic Promotional Structured Cotton Cap',
        sku: 'classic-promotional-cotton-cap',
        categoryId: capCat?.id || '',
        basePrice: 149,
        isActive: true,
        description: CAP_DESCRIPTION_TEMPLATE,
        images: [
          'https://res.cloudinary.com/e3sasmyr/image/upload/v1790083669/products/classic-cotton-cap-black.jpg',
          '/images/products/classic-cotton-cap.jpg'
        ]
      });
      setVariants([
        { color: 'Charcoal Black', size: 'Free Size', sku: 'CAP-BLK-FS', stock: 500 },
        { color: 'Navy Blue', size: 'Free Size', sku: 'CAP-NVY-FS', stock: 350 },
        { color: 'Classic White', size: 'Free Size', sku: 'CAP-WHT-FS', stock: 250 },
        { color: 'Royal Blue', size: 'Free Size', sku: 'CAP-RBL-FS', stock: 200 },
        { color: 'Crimson Red', size: 'Free Size', sku: 'CAP-RED-FS', stock: 150 },
      ]);
      setPricing([
        { minQuantity: 20, maxQuantity: 49, pricePerUnit: 149, printType: 'Front 3D Embroidery' },
        { minQuantity: 50, maxQuantity: 99, pricePerUnit: 129, printType: 'Front 3D Embroidery' },
        { minQuantity: 100, maxQuantity: 249, pricePerUnit: 109, printType: 'Front 3D Embroidery' },
        { minQuantity: 250, maxQuantity: 499, pricePerUnit: 95, printType: 'Front 3D Embroidery' },
        { minQuantity: 500, maxQuantity: 9999, pricePerUnit: 85, printType: 'Front 3D Embroidery' },
      ]);
    } else if (type === 'POLO') {
      const poloCat = categories.find(c => c.slug === 't-shirts' || c.name?.toLowerCase().includes('t-shirt')) || categories[0];
      setBasic({
        name: 'Classic Corporate Pique Polo T-Shirt',
        sku: 'classic-corporate-polo-tshirt',
        categoryId: poloCat?.id || '',
        basePrice: 299,
        isActive: true,
        description: '220-240 GSM heavy-duty 100% Combed Compact Cotton Pique knit fabric with 3-button placket and ribbed cuffs.',
        images: [
          'https://res.cloudinary.com/e3sasmyr/image/upload/v1790080446/products/custom-corporate-polo-black.jpg',
          '/images/products/classic-black-polo.jpg'
        ]
      });
    } else if (type === 'BAG') {
      const bagCat = categories.find(c => c.slug === 'bags' || c.name?.toLowerCase().includes('bag')) || categories[0];
      setBasic({
        name: 'Executive Corporate Laptop Backpack',
        sku: 'executive-corporate-laptop-backpack',
        categoryId: bagCat?.id || '',
        basePrice: 699,
        isActive: true,
        description: BAG_DESCRIPTION_TEMPLATE,
        images: [
          'https://res.cloudinary.com/e3sasmyr/image/upload/v1790085384/products/executive-corporate-backpack-black.jpg',
          '/images/products/executive-laptop-backpack.jpg'
        ]
      });
      setVariants([
        { color: 'Charcoal Black', size: 'Free Size', sku: 'BAG-EXEC-BLK-FS', stock: 500 },
        { color: 'Navy Blue', size: 'Free Size', sku: 'BAG-EXEC-NVY-FS', stock: 350 },
        { color: 'Heather Grey', size: 'Free Size', sku: 'BAG-EXEC-GRY-FS', stock: 250 },
      ]);
      setPricing([
        { minQuantity: 20, maxQuantity: 49, pricePerUnit: 699, printType: 'Front Logo Print / Embroidery' },
        { minQuantity: 50, maxQuantity: 99, pricePerUnit: 649, printType: 'Front Logo Print / Embroidery' },
        { minQuantity: 100, maxQuantity: 249, pricePerUnit: 599, printType: 'Front Logo Print / Embroidery' },
        { minQuantity: 250, maxQuantity: 499, pricePerUnit: 549, printType: 'Front Logo Print / Embroidery' },
        { minQuantity: 500, maxQuantity: 9999, pricePerUnit: 499, printType: 'Front Logo Print / Embroidery' },
      ]);
    }
  };

  useEffect(() => {
    if (mode === 'EDIT' && productId) {
      fetch(`${API_URL}/products/${productId}`)
        .then(r => r.json())
        .then(res => {
          const p = res.data || res.product;
          if (p) {
            setBasic({
              name: p.name,
              sku: p.slug,
              categoryId: p.categoryId,
              description: p.description,
              basePrice: p.basePrice,
              isActive: p.isActive,
              images: p.images || [],
            });
            setVariants(p.variants || []);
            setPricing(p.bulkPricing || []);
          }
        })
        .catch(err => console.error('Failed to fetch product for edit:', err));
    } else if (mode === 'ADD') {
      setBasic({ name: '', sku: '', categoryId: '', description: '', basePrice: 0, isActive: true, images: [] });
      setVariants([]);
      setPricing([]);
    }
  }, [mode, productId]);

  const handleSave = async () => {
    try {
      setSaving(true);
      if(!basic.name || !basic.categoryId || basic.basePrice <= 0) return alert('Name, Category, and positive Base Price are required.');
      
      const payload = {
         ...basic,
         slug: basic.sku,
         variants: variants.length > 0 ? variants : undefined,
         bulkPricing: pricing.length > 0 ? pricing : undefined,
         requiresSize: !isCapCategory && !isBagCategory && !isMugCategory,
         requiresColor: true,
      };

      const url = mode === 'ADD' ? `${API_URL}/products` : `${API_URL}/products/${productId}`;
      const method = mode === 'ADD' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') },
        body: JSON.stringify(payload)
      }).then(r => r.json());

      if (res.success) {
         onRefresh();
         onClose();
      } else {
         alert('Failed: ' + res.message);
      }
    } catch(e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit.');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Only JPG, PNG and WEBP formats are supported.');
      return;
    }

    try {
      setUploadingImage(true);
      const secureUrl = await uploadToCloudinary(file);
      setBasic(prev => ({
        ...prev,
        images: [...prev.images, secureUrl]
      }));
    } catch (err: any) {
      alert(`Failed to upload image: ${err.message}`);
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleImageDelete = (index: number) => {
    setBasic(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex justify-end backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col justify-between border-l border-[#E5E7EB] animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-5 border-b border-[#E5E7EB] flex items-center justify-between">
           <div>
              <h2 className="text-base font-heading font-black text-[#111111]">{mode === 'ADD' ? 'Add New Product' : 'Edit Product'}</h2>
              <p className="text-xs text-[#6B7280]">Configure product catalog details and pricing</p>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-[#6B7280]"><X className="w-5 h-5"/></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#E5E7EB] px-5 gap-6 text-xs font-bold text-[#6B7280]">
           {(['Basic Info', 'Variants', 'Pricing'] as const).map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)}
                className={`py-3 border-b-2 -mb-px transition-colors ${activeTab === tab ? 'border-[#3B6FEB] text-[#3B6FEB]' : 'border-transparent hover:text-[#111111]'}`}
              >
                 {tab}
              </button>
           ))}
        </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 hide-scrollbar bg-white">
        
        {activeTab === 'Basic Info' && (
          <div className="space-y-4">
            {/* Quick Template Selector */}
            {mode === 'ADD' && (
              <div className="bg-[#F8F9FC] border border-[#E5E7EB] rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#374151] uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#3B6FEB]" /> Quick Product Templates
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium">1-Click Setup</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyTemplate('MUG')}
                    className={`px-2 py-2 rounded-lg text-left transition-all border flex flex-col items-center justify-center text-center gap-1 ${
                      isMugCategory
                        ? 'bg-blue-50/80 border-[#3B6FEB] text-[#3B6FEB] shadow-xs'
                        : 'bg-white hover:bg-blue-50/40 border-gray-200 text-[#111111]'
                    }`}
                  >
                    <span className="text-base">☕</span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold truncate">Cup / Mug</p>
                      <p className="text-[9px] text-gray-500 truncate">330ml Ceramic</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate('BAG')}
                    className={`px-2 py-2 rounded-lg text-left transition-all border flex flex-col items-center justify-center text-center gap-1 ${
                      isBagCategory
                        ? 'bg-blue-50/80 border-[#3B6FEB] text-[#3B6FEB] shadow-xs'
                        : 'bg-white hover:bg-blue-50/40 border-gray-200 text-[#111111]'
                    }`}
                  >
                    <span className="text-base">🎒</span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold truncate">Backpack</p>
                      <p className="text-[9px] text-gray-500 truncate">28L Laptop</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate('CAP')}
                    className={`px-2 py-2 rounded-lg text-left transition-all border flex flex-col items-center justify-center text-center gap-1 ${
                      isCapCategory
                        ? 'bg-blue-50/80 border-[#3B6FEB] text-[#3B6FEB] shadow-xs'
                        : 'bg-white hover:bg-blue-50/40 border-gray-200 text-[#111111]'
                    }`}
                  >
                    <span className="text-base">🧢</span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold truncate">Cap</p>
                      <p className="text-[9px] text-gray-500 truncate">6-Panel</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate('POLO')}
                    className="px-2 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-left transition-all flex flex-col items-center justify-center text-center gap-1"
                  >
                    <span className="text-base">👕</span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-[#111111] truncate">Polo</p>
                      <p className="text-[9px] text-gray-500 truncate">Pique Knit</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Category Banner if Mug, Bag, or Cap selected */}
            {isMugCategory && (
              <div className="p-2.5 bg-blue-50/80 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-center gap-2">
                <span className="text-base">☕</span>
                <div>
                  <span className="font-bold">Cup / Mug Mode:</span> 330ml (11oz) Standard Ceramic Stoneware. Food-grade, microwave-safe, with dual-side / wrap branding area.
                </div>
              </div>
            )}
            {isBagCategory && (
              <div className="p-2.5 bg-blue-50/80 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-center gap-2">
                <span className="text-base">🎒</span>
                <div>
                  <span className="font-bold">Bag / Backpack Mode:</span> 28L Standard Size with dedicated 15.6" padded laptop sleeve and front branding zone.
                </div>
              </div>
            )}
            {isCapCategory && (
              <div className="p-2.5 bg-blue-50/80 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-center gap-2">
                <span className="text-base">🧢</span>
                <div>
                  <span className="font-bold">Cap / Headwear Mode:</span> Free Size with adjustable strap. Engineered for 3D puff embroidery and front branding.
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#374151] mb-1">Product Name *</label>
              <input type="text" value={basic.name} onChange={e => setBasic({...basic, name: e.target.value})} placeholder="e.g. Classic Promotional Structured Cotton Cap" className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#3B6FEB]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#374151] mb-1">SKU / Slug *</label>
              <input type="text" value={basic.sku} onChange={e => setBasic({...basic, sku: e.target.value})} placeholder="e.g., classic-cotton-cap" className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#3B6FEB]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#374151] mb-1">Category *</label>
              <select value={basic.categoryId} onChange={e => setBasic({...basic, categoryId: e.target.value})} className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#3B6FEB] bg-white">
                <option value="">Select category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#374151] mb-1">Base Price (₹) *</label>
              <input type="number" value={basic.basePrice} onChange={e => setBasic({...basic, basePrice: parseFloat(e.target.value)})} className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#3B6FEB]" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-[#374151]">Description</label>
                <button
                  type="button"
                  onClick={() => setBasic(prev => ({ 
                    ...prev, 
                    description: isMugCategory ? MUG_DESCRIPTION_TEMPLATE : (isBagCategory ? BAG_DESCRIPTION_TEMPLATE : (isCapCategory ? CAP_DESCRIPTION_TEMPLATE : 'Premium quality corporate merchandise.')) 
                  }))}
                  className="text-[11px] font-bold text-[#3B6FEB] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" /> Insert {isMugCategory ? 'Mug' : (isBagCategory ? 'Bag' : (isCapCategory ? 'Cap' : 'Polo'))} Specs Template
                </button>
              </div>
              <textarea value={basic.description} onChange={e => setBasic({...basic, description: e.target.value})} placeholder="Enter full description or use template above..." className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-xs font-mono outline-none focus:border-[#3B6FEB] min-h-[120px] leading-relaxed" />
            </div>
            
            <div>
               <label className="block text-xs font-bold text-[#374151] mb-2">Product Images *</label>
               <div className="border-2 border-dashed border-[#E5E7EB] rounded-lg p-6 text-center bg-[#F9FAFB] relative hover:bg-gray-100 transition-colors cursor-pointer">
                 <input 
                   type="file" 
                   accept="image/png, image/jpeg, image/webp" 
                   onChange={handleImageUpload} 
                   disabled={uploadingImage || basic.images.length >= 5}
                   className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" 
                 />
                 <UploadCloud className={`w-8 h-8 mx-auto mb-2 ${uploadingImage ? 'text-blue-500 animate-bounce' : 'text-[#9CA3AF]'}`} />
                 <p className="text-xs font-bold text-[#374151]">{uploadingImage ? 'Uploading...' : 'Click or Drag Images to Upload'}</p>
                 <p className="text-[10px] text-[#6B7280]">PNG, JPG, WEBP up to 5MB (Max 5 images)</p>
               </div>
               {basic.images.length > 0 && (
                 <div className="flex flex-wrap gap-2 mt-3">
                   {basic.images.map((img, i) => (
                     <div key={i} className="w-12 h-12 bg-gray-100 rounded border border-[#E5E7EB] relative group">
                       <img src={img} className="w-full h-full object-cover rounded" />
                       <button type="button" onClick={() => handleImageDelete(i)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hidden group-hover:block"><X className="w-3 h-3"/></button>
                     </div>
                   ))}
                 </div>
               )}
            </div>

            <div>
               <label className="block text-xs font-bold text-[#374151] mb-2">Status</label>
               <div className="flex gap-2">
                 <button onClick={() => setBasic({...basic, isActive: true})} className={`flex-1 py-2 text-xs font-bold rounded-lg border ${basic.isActive ? 'bg-[#111111] text-white border-black' : 'bg-white text-[#6B7280] border-[#E5E7EB]'}`}>Active</button>
                 <button onClick={() => setBasic({...basic, isActive: false})} className={`flex-1 py-2 text-xs font-bold rounded-lg border ${!basic.isActive ? 'bg-[#111111] text-white border-black' : 'bg-white text-[#6B7280] border-[#E5E7EB]'}`}>Inactive</button>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'Variants' && (
           <div className="space-y-4">
              <p className="text-xs text-[#6B7280]">Define product variants like colors and sizes.</p>
              {variants.map((v, i) => (
                 <div key={i} className="p-3 border border-[#E5E7EB] rounded-lg bg-[#F9FAFB] relative space-y-2">
                   <button onClick={() => setVariants(variants.filter((_,idx)=>idx!==i))} className="absolute top-2 right-2 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                   <div className="grid grid-cols-2 gap-2">
                     <div>
                       <label className="text-[10px] font-bold text-[#6B7280]">Color</label>
                       <input type="text" value={v.color} onChange={e => { const nv = [...variants]; nv[i].color = e.target.value; setVariants(nv); }} className="w-full px-2 py-1 text-xs border border-[#E5E7EB] rounded outline-none" />
                     </div>
                     <div>
                       <label className="text-[10px] font-bold text-[#6B7280]">Size</label>
                       <input type="text" value={v.size} onChange={e => { const nv = [...variants]; nv[i].size = e.target.value; setVariants(nv); }} className="w-full px-2 py-1 text-xs border border-[#E5E7EB] rounded outline-none" />
                     </div>
                   </div>
                   <div>
                       <label className="text-[10px] font-bold text-[#6B7280]">SKU</label>
                       <input type="text" value={v.sku} onChange={e => { const nv = [...variants]; nv[i].sku = e.target.value; setVariants(nv); }} className="w-full px-2 py-1 text-xs border border-[#E5E7EB] rounded outline-none" />
                   </div>
                 </div>
              ))}
              <div className="flex gap-2">
                <button onClick={() => setVariants([...variants, { color: '', size: isMugCategory ? '330ml (Standard)' : (isCapCategory ? 'Free Size' : ''), sku: '', stock: 0 }])} className="flex-1 py-2 border-2 border-dashed border-[#E5E7EB] rounded-lg text-xs font-bold text-[#3B6FEB] hover:bg-blue-50 transition-colors">
                  + Add Variant
                </button>
                {isMugCategory && (
                  <button
                    type="button"
                    onClick={() => setVariants([
                      { color: 'Matte Black', size: '330ml (Standard)', sku: 'MUG-CER-BLK', stock: 1000 },
                      { color: 'Classic White', size: '330ml (Standard)', sku: 'MUG-CER-WHT', stock: 800 },
                      { color: 'Navy Blue', size: '330ml (Standard)', sku: 'MUG-CER-NVY', stock: 500 },
                    ])}
                    className="px-3 py-2 bg-blue-50 border border-blue-200 text-[#3B6FEB] rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                  >
                    + Mug Colors
                  </button>
                )}
                {isCapCategory && (
                  <button
                    type="button"
                    onClick={() => setVariants([
                      { color: 'Charcoal Black', size: 'Free Size', sku: 'CAP-BLK-FS', stock: 500 },
                      { color: 'Navy Blue', size: 'Free Size', sku: 'CAP-NVY-FS', stock: 350 },
                      { color: 'Classic White', size: 'Free Size', sku: 'CAP-WHT-FS', stock: 250 },
                      { color: 'Royal Blue', size: 'Free Size', sku: 'CAP-RBL-FS', stock: 200 },
                      { color: 'Crimson Red', size: 'Free Size', sku: 'CAP-RED-FS', stock: 150 },
                    ])}
                    className="px-3 py-2 bg-blue-50 border border-blue-200 text-[#3B6FEB] rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                  >
                    + Cap Colors
                  </button>
                )}
              </div>
           </div>
        )}

        {activeTab === 'Pricing' && (
           <div className="space-y-4">
              <p className="text-xs text-[#6B7280]">Configure bulk pricing tiers and print methods.</p>
              {pricing.map((p, i) => (
                 <div key={i} className="p-3 border border-[#E5E7EB] rounded-lg bg-[#F9FAFB] relative space-y-2">
                   <button onClick={() => setPricing(pricing.filter((_,idx)=>idx!==i))} className="absolute top-2 right-2 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                   <div className="grid grid-cols-2 gap-2">
                     <div>
                       <label className="text-[10px] font-bold text-[#6B7280]">Min Qty</label>
                       <input type="number" value={p.minQuantity} onChange={e => { const np = [...pricing]; np[i].minQuantity = parseInt(e.target.value); setPricing(np); }} className="w-full px-2 py-1 text-xs border border-[#E5E7EB] rounded outline-none" />
                     </div>
                     <div>
                       <label className="text-[10px] font-bold text-[#6B7280]">Max Qty</label>
                       <input type="number" value={p.maxQuantity} onChange={e => { const np = [...pricing]; np[i].maxQuantity = parseInt(e.target.value); setPricing(np); }} className="w-full px-2 py-1 text-xs border border-[#E5E7EB] rounded outline-none" />
                     </div>
                   </div>
                   <div className="grid grid-cols-2 gap-2">
                     <div>
                       <label className="text-[10px] font-bold text-[#6B7280]">Price/Unit</label>
                       <input type="number" value={p.pricePerUnit} onChange={e => { const np = [...pricing]; np[i].pricePerUnit = parseFloat(e.target.value); setPricing(np); }} className="w-full px-2 py-1 text-xs border border-[#E5E7EB] rounded outline-none" />
                     </div>
                     <div>
                       <label className="text-[10px] font-bold text-[#6B7280]">Print Type</label>
                       <select value={p.printType} onChange={e => { const np = [...pricing]; np[i].printType = e.target.value; setPricing(np); }} className="w-full px-2 py-1 text-xs border border-[#E5E7EB] rounded outline-none bg-white">
                         <option>Front Only</option>
                         <option>Front & Back</option>
                         <option>Embroidery</option>
                         <option>DTF</option>
                         <option>Sublimation</option>
                       </select>
                     </div>
                   </div>
                 </div>
              ))}
              <button onClick={() => setPricing([...pricing, { minQuantity: 10, maxQuantity: 49, pricePerUnit: 0, printType: 'Front Only' }])} className="w-full py-2 border-2 border-dashed border-[#E5E7EB] rounded-lg text-xs font-bold text-[#3B6FEB] hover:bg-blue-50 transition-colors">
                + Add Pricing Tier
              </button>
           </div>
        )}

        {activeTab === 'Design Studio' && (
           <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-60">
              <ImageIcon className="w-12 h-12 text-[#9CA3AF]" />
              <div>
                <h3 className="text-sm font-bold text-[#111111]">Design Studio Simulator</h3>
                <p className="text-xs text-[#6B7280] max-w-[250px] mx-auto mt-1">Full 3D visualization and placement tooling is scheduled for a future UI module.</p>
              </div>
              <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded text-[9px] font-bold border border-slate-200">UI ONLY / FUTURE</span>
           </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[#E5E7EB] bg-[#FDFDFD] flex gap-3">
        <button onClick={onClose} className="px-4 py-2 border border-[#E5E7EB] bg-white rounded-lg text-sm font-bold text-[#374151] hover:bg-[#F9FAFB] transition-colors flex-1">
          Cancel
        </button>
        <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-[#3B6FEB] text-white rounded-lg text-sm font-bold shadow-sm hover:bg-[#2563EB] transition-colors flex-1 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save & Next'}
        </button>
      </div>
    </div>
    </div>
  );
}
