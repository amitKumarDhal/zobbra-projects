'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Plus, FileText, CheckCircle2, Tags, Package, UploadCloud, X, Edit2, Copy, Trash2, IndianRupee, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';

import { API_URL } from '@/lib/api';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ totalProducts: 0, activeProducts: 0, draftProducts: 0, categories: 0, variants: 0 });
  const [categories, setCategories] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('All Categories');
  const [filterStatus, setFilterStatus] = useState('All Status');
  
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, pageSize: 10 });

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'ADD' | 'EDIT'>('ADD');
  const [editProductId, setEditProductId] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchData();
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

  const handleArchive = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this product?')) return;
    try {
      await fetch(`${API_URL}/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
      });
      fetchData();
    } catch (err) {
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
        <button onClick={openAdd} className="bg-[#3B6FEB] text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm hover:bg-[#2563EB] transition-colors flex items-center gap-2 min-h-[44px]">
          <Plus className="w-4 h-4"/> Add New Product
        </button>
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
          <div className="p-4 border-b border-[#E5E7EB] flex flex-wrap gap-3 justify-between items-center bg-[#FDFDFD] rounded-t-2xl">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
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

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E7EB]">
                  <th className="px-4 py-3 w-10 text-center"><input type="checkbox" className="rounded border-gray-300" /></th>
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
                      <td className="px-4 py-4 text-center"><input type="checkbox" className="rounded border-gray-300" /></td>
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
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${p.isActive ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-amber-700 bg-amber-50 border-amber-200'}`}>
                          {p.isActive ? 'Active' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs text-[#6B7280]">{new Date(p.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openEdit(p.id)} className="p-1.5 text-[#6B7280] hover:text-[#111111] hover:bg-[#F3F4F6] rounded" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDuplicate(p.id)} className="p-1.5 text-[#6B7280] hover:text-[#111111] hover:bg-[#F3F4F6] rounded" title="Duplicate"><Copy className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleArchive(p.id)} className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded" title="Archive"><Trash2 className="w-3.5 h-3.5" /></button>
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


function ProductDrawer({ mode, productId, categories, onClose, onRefresh }: { mode: 'ADD'|'EDIT', productId: string|null, categories: any[], onClose: () => void, onRefresh: () => void }) {
  const [activeTab, setActiveTab] = useState<'Basic Info' | 'Variants' | 'Pricing' | 'Design Studio'>('Basic Info');
  const [saving, setSaving] = useState(false);
  
  // Form State
  const [basic, setBasic] = useState({ name: '', sku: '', categoryId: '', description: '', basePrice: 0, isActive: true, images: [] as string[] });
  const [variants, setVariants] = useState<any[]>([]);
  const [pricing, setPricing] = useState<any[]>([]);

  useEffect(() => {
    if (mode === 'EDIT' && productId) {
       fetch(`${API_URL}/products?search=${productId}`) // Naive fetch via search, but ideally fetch by slug/id. Let's do a custom fetch.
         .then(async () => {
           // We only have getProductBySlug exposed without auth usually, but we need ID.
           // Actually, /api/v1/products has the whole list. Let's fetch all and find it since we lack getProductById explicitly.
           const token = localStorage.getItem('token');
           const res = await fetch(`${API_URL}/products`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r=>r.json());
           if (res.success) {
              const p = res.data?.find((x:any) => x.id === productId);
              if (p) {
                 setBasic({ name: p.name, sku: p.slug, categoryId: p.categoryId, description: p.description, basePrice: p.basePrice, isActive: p.isActive, images: p.images });
                 setVariants(p.variants || []);
                 setPricing(p.bulkPricing || []);
              }
           }
         });
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
         bulkPricing: pricing.length > 0 ? pricing : undefined
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

  return (
    <div className="w-full lg:w-1/3 min-w-0 lg:min-w-[380px] max-w-[420px] bg-white border border-[#E5E7EB] rounded-2xl shadow-xl flex flex-col h-[calc(100vh-140px)] sticky top-6 overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-0 border-b border-[#E5E7EB] bg-[#FDFDFD]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-heading font-black text-[#111111]">{mode === 'ADD' ? 'Add New Product' : 'Edit Product'}</h2>
          <button onClick={onClose} className="p-1.5 text-[#9CA3AF] hover:text-[#111111] hover:bg-[#F3F4F6] rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex gap-4 border-b border-[#E5E7EB]">
          {['Basic Info', 'Variants', 'Pricing', 'Design Studio'].map((tab) => (
             <button 
                key={tab} 
                onClick={() => setActiveTab(tab as any)}
                className={`text-[11px] font-bold uppercase tracking-wider pb-3 border-b-2 transition-colors whitespace-nowrap ${activeTab === tab ? 'border-[#3B6FEB] text-[#3B6FEB]' : 'border-transparent text-[#9CA3AF] hover:text-[#4B5563]'}`}
             >
               {tab}
             </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 hide-scrollbar bg-white">
        
        {activeTab === 'Basic Info' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#374151] mb-1">Product Name *</label>
              <input type="text" value={basic.name} onChange={e => setBasic({...basic, name: e.target.value})} placeholder="Enter product name" className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#3B6FEB]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#374151] mb-1">SKU / Slug *</label>
              <input type="text" value={basic.sku} onChange={e => setBasic({...basic, sku: e.target.value})} placeholder="e.g., PL-TSHIRT-BLK" className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#3B6FEB]" />
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
              <label className="block text-xs font-bold text-[#374151] mb-1">Description</label>
              <textarea value={basic.description} onChange={e => setBasic({...basic, description: e.target.value})} placeholder="Enter full description" className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#3B6FEB] min-h-[100px]" />
            </div>
            
            <div>
               <label className="block text-xs font-bold text-[#374151] mb-2">Product Images *</label>
               <div className="border-2 border-dashed border-[#E5E7EB] rounded-lg p-6 text-center bg-[#F9FAFB]">
                 <UploadCloud className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2" />
                 <p className="text-xs font-bold text-[#374151]">Upload Images</p>
                 <p className="text-[10px] text-[#6B7280]">PNG, JPG up to 5MB (Max 5 images)</p>
                 {/* Simulated UI upload for MVP */}
                 <div className="mt-4 pt-4 border-t border-[#E5E7EB]">
                   <input type="text" placeholder="Or paste image URL here..." className="w-full px-2 py-1 text-xs border border-[#E5E7EB] rounded outline-none" onKeyDown={(e) => {
                     if (e.key === 'Enter') {
                        setBasic({...basic, images: [...basic.images, e.currentTarget.value]});
                        e.currentTarget.value = '';
                     }
                   }} />
                 </div>
               </div>
               {basic.images.length > 0 && (
                 <div className="flex flex-wrap gap-2 mt-3">
                   {basic.images.map((img, i) => (
                     <div key={i} className="w-12 h-12 bg-gray-100 rounded border border-[#E5E7EB] relative group">
                       <img src={img} className="w-full h-full object-cover rounded" />
                       <button onClick={()=>setBasic({...basic, images: basic.images.filter((_, idx)=>idx!==i)})} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hidden group-hover:block"><X className="w-3 h-3"/></button>
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
              <button onClick={() => setVariants([...variants, { color: '', size: '', sku: '', stock: 0 }])} className="w-full py-2 border-2 border-dashed border-[#E5E7EB] rounded-lg text-xs font-bold text-[#3B6FEB] hover:bg-blue-50 transition-colors">
                + Add Variant
              </button>
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
  );
}
