'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Plus, FileText, CheckCircle2, Tags, Package, Edit2, Copy, Trash2, Star, Image as ImageIcon } from 'lucide-react';
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
  const [filterStatus, setFilterStatus] = useState('Active');
  
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, pageSize: 10 });

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
            data-cy="add-product-btn"
            className="bg-[#3B6FEB] text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm hover:bg-[#2563EB] transition-colors flex items-center gap-2 min-h-[44px]"
          >
            <Plus className="w-4 h-4"/> Add New Product
          </Link>
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
        <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm flex-1 w-full">
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
                  const moq = p.moq ?? p.minOrderQty ?? Math.min(...(p.bulkPricing?.length > 0 ? p.bulkPricing.map((bp:any) => bp.minQuantity) : [1]));
                  const colorCount = p.availableColors?.length || 0;

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
                            <p className="text-[10px] text-[#6B7280] mt-0.5 flex items-center gap-1.5">
                              <span>{colorCount > 0 ? `${colorCount} color${colorCount > 1 ? 's' : ''}` : 'No colors'}</span>
                              <span>· Stock {p.stockCount ?? 0}</span>
                              {p.rating != null && (
                                <span className="inline-flex items-center gap-0.5">· <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />{p.rating}</span>
                              )}
                            </p>
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
                          <Link href={`/dashboard/products/${p.id}/edit`} data-cy={`edit-product-${p.slug}`} className="p-1.5 text-[#6B7280] hover:text-[#111111] hover:bg-[#F3F4F6] rounded" title="Edit"><Edit2 className="w-3.5 h-3.5" /></Link>
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
      </div>
    </div>
  );
}

