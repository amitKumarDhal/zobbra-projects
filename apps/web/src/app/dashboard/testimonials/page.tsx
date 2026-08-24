'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, Star, Edit2, Trash2, CheckCircle, XCircle, MessageSquare, ThumbsUp, Clock, AlertCircle } from 'lucide-react';
import TestimonialDrawer from './TestimonialDrawer';

import { API_URL } from '@/lib/api';

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ total: 0, published: 0, pending: 0, inactive: 0, averageRating: 0, ratingDistribution: {} });
  const [loading, setLoading] = useState(true);
  
  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTestimonial, setSelectedTestimonial] = useState<any | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      // Fetch stats
      const statsRes = await fetch(`${API_URL}/testimonials/stats`, { headers });
      const statsJson = await statsRes.json();
      if (statsJson.success) setStats(statsJson.stats);
      
      // Fetch list
      const query = new URLSearchParams({
        page: page.toString(),
        pageSize: '10',
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(ratingFilter && { rating: ratingFilter })
      });
      
      const listRes = await fetch(`${API_URL}/testimonials?${query.toString()}`, { headers });
      const listJson = await listRes.json();
      
      if (listJson.success) {
        setTestimonials(listJson.data);
        setTotalPages(listJson.pagination.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch testimonials', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, search, statusFilter, ratingFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this testimonial?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/testimonials/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchData();
    } catch (err) {
      alert('Delete failed');
    }
  };

  const handleEdit = (t: any) => {
    setSelectedTestimonial(t);
    setDrawerOpen(true);
  };

  const handleAdd = () => {
    setSelectedTestimonial(null);
    setDrawerOpen(true);
  };

  const onSaved = () => {
    setDrawerOpen(false);
    fetchData();
  };

  return (
    <div className="space-y-6 pb-12 font-sans bg-[#F8F9FC] min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-black text-[#111111]">Testimonials</h1>
          <p className="text-sm text-[#6B7280] font-medium mt-1">Manage customer reviews and social proof for your brand</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-[#E5E7EB] text-[#374151] px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm hover:bg-[#F9FAFB] transition-colors flex items-center gap-2">
            Export
          </button>
          <button onClick={handleAdd} className="bg-[#3B6FEB] text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm hover:bg-[#2563EB] transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add New Testimonial
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#6B7280]">Total Testimonials</p>
            <h3 className="text-2xl font-black text-[#111111]">{stats.total}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
            <ThumbsUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#6B7280]">Published</p>
            <h3 className="text-2xl font-black text-[#111111]">{stats.published}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#6B7280]">Pending</p>
            <h3 className="text-2xl font-black text-[#111111]">{stats.pending}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#6B7280]">Inactive</p>
            <h3 className="text-2xl font-black text-[#111111]">{stats.inactive}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <Star className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#6B7280]">Average Rating</p>
            <h3 className="text-2xl font-black text-[#111111]">{Number(stats.averageRating).toFixed(1)}</h3>
            <p className="text-[10px] text-[#6B7280]">Out of 5</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm">
        {/* Toolbar */}
        <div className="p-5 border-b border-[#E5E7EB] flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
            <input 
              type="text" 
              placeholder="Search by name, company, rating..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-sm text-[#111111] focus:outline-none focus:border-[#3B6FEB]"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select 
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#374151] focus:outline-none"
            >
              <option value="">All Status</option>
              <option value="PUBLISHED">Published</option>
              <option value="PENDING">Pending</option>
              <option value="INACTIVE">Inactive</option>
            </select>
            
            <select 
              value={ratingFilter} 
              onChange={e => setRatingFilter(e.target.value)}
              className="px-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#374151] focus:outline-none"
            >
              <option value="">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
            
            <button onClick={() => { setSearch(''); setStatusFilter(''); setRatingFilter(''); }} className="flex items-center gap-2 px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm font-semibold text-[#374151] hover:bg-[#F9FAFB] transition-colors">
              Reset
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                <th className="w-12 px-5 py-3"><input type="checkbox" className="rounded border-gray-300" /></th>
                <th className="px-5 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Customer</th>
                <th className="px-5 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Rating</th>
                <th className="px-5 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Product/Service</th>
                <th className="px-5 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider w-[35%]">Testimonial</th>
                <th className="px-5 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Date</th>
                <th className="px-5 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-sm text-[#6B7280]">Loading testimonials...</td>
                </tr>
              ) : testimonials.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-sm text-[#6B7280]">No testimonials found. Add your first testimonial!</td>
                </tr>
              ) : (
                testimonials.map((t) => (
                  <tr key={t.id} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="px-5 py-4"><input type="checkbox" className="rounded border-gray-300" /></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {t.avatarUrl ? (
                          <img src={t.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover bg-gray-100" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#EBF1FF] text-[#3B6FEB] flex items-center justify-center text-xs font-bold">
                            {t.customerName.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold text-[#111111]">{t.customerName}</p>
                          {t.companyName && <p className="text-[10px] text-[#6B7280]">{t.companyName}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className={`w-3.5 h-3.5 ${star <= t.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                        ))}
                        <span className="text-xs font-bold text-[#374151] ml-1">{t.rating}.0</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-[#4B5563] font-medium">
                      {t.product ? t.product.name : '-'}
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-xs text-[#4B5563] line-clamp-2" title={t.content}>"{t.content}"</p>
                    </td>
                    <td className="px-5 py-4">
                      {t.status === 'PUBLISHED' && <span className="text-[10px] font-bold px-2 py-0.5 rounded text-green-700 bg-green-100">Published</span>}
                      {t.status === 'PENDING' && <span className="text-[10px] font-bold px-2 py-0.5 rounded text-orange-700 bg-orange-100">Pending</span>}
                      {t.status === 'INACTIVE' && <span className="text-[10px] font-bold px-2 py-0.5 rounded text-red-700 bg-red-100">Inactive</span>}
                    </td>
                    <td className="px-5 py-4 text-xs text-[#6B7280]">
                      {new Date(t.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleEdit(t)} className="p-1.5 text-[#6B7280] hover:text-[#3B6FEB] hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(t.id)} className="p-1.5 text-[#6B7280] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-[#E5E7EB] flex items-center justify-between">
          <p className="text-xs text-[#6B7280]">
            Showing <span className="font-bold text-[#111111]">{testimonials.length > 0 ? (page - 1) * 10 + 1 : 0}</span> to <span className="font-bold text-[#111111]">{Math.min(page * 10, stats.total)}</span> of <span className="font-bold text-[#111111]">{stats.total}</span> testimonials
          </p>
          <div className="flex gap-1">
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 text-sm border border-[#E5E7EB] rounded-lg disabled:opacity-50 hover:bg-gray-50"
            >
              Previous
            </button>
            <button 
              disabled={page === totalPages || totalPages === 0}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 text-sm border border-[#E5E7EB] rounded-lg disabled:opacity-50 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <TestimonialDrawer 
        isOpen={drawerOpen} 
        onClose={() => setDrawerOpen(false)} 
        onSaved={onSaved}
        testimonial={selectedTestimonial}
        stats={stats}
      />
    </div>
  );
}
