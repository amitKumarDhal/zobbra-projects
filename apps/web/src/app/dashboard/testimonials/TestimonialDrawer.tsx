import React, { useState, useEffect } from 'react';
import { X, UploadCloud, Star } from 'lucide-react';
import RatingOverview from './RatingOverview';

interface TestimonialDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  testimonial: any | null; // pass testimonial to edit, or null to add
  stats: any;
}

export default function TestimonialDrawer({ isOpen, onClose, onSaved, testimonial, stats }: TestimonialDrawerProps) {
  const [formData, setFormData] = useState({
    customerName: '',
    companyName: '',
    productId: '',
    rating: 5,
    content: '',
    status: 'PUBLISHED',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Basic list of products for the MVP selection
  const [products, setProducts] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    // Fetch basic product list for selection
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/v1/products?limit=100', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success) {
          setProducts(json.data || json.products || []);
        }
      } catch (err) {
        console.error('Failed to fetch products for testimonial drawer:', err);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    if (testimonial) {
      setFormData({
        customerName: testimonial.customerName || '',
        companyName: testimonial.companyName || '',
        productId: testimonial.productId || '',
        rating: testimonial.rating || 5,
        content: testimonial.content || '',
        status: testimonial.status || 'PENDING',
      });
    } else {
      setFormData({
        customerName: '',
        companyName: '',
        productId: '',
        rating: 5,
        content: '',
        status: 'PUBLISHED',
      });
    }
    setError('');
  }, [testimonial, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRatingClick = (r: number) => {
    setFormData(prev => ({ ...prev, rating: r }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.customerName) return setError('Customer Name is required');
    if (!formData.content) return setError('Testimonial content is required');
    if (formData.content.length > 500) return setError('Content must be under 500 characters');

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const url = testimonial 
        ? `http://localhost:5000/api/v1/testimonials/${testimonial.id}`
        : `http://localhost:5000/api/v1/testimonials`;
      
      const res = await fetch(url, {
        method: testimonial ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to save testimonial');
      }
      
      onSaved();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-full sm:w-[480px] bg-[#F8F9FC] shadow-2xl z-50 flex flex-col transform transition-transform duration-300">
        <div className="flex items-center justify-between p-5 bg-white border-b border-[#E5E7EB]">
          <h2 className="text-lg font-bold text-[#111111]">{testimonial ? 'Edit Testimonial' : 'Add New Testimonial'}</h2>
          <button onClick={onClose} className="p-2 text-[#6B7280] hover:text-[#111111] hover:bg-[#F3F4F6] rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm font-medium rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <form id="testimonial-form" onSubmit={handleSubmit} className="space-y-4">
            
            <div>
              <label className="block text-xs font-bold text-[#374151] mb-1.5">Customer Name <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                placeholder="Enter customer name"
                className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#374151] mb-1.5">Company Name</label>
              <input 
                type="text" 
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="Enter company name"
                className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#374151] mb-1.5">Product/Service</label>
              <select 
                name="productId"
                value={formData.productId}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB]"
              >
                <option value="">Select product/service</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#374151] mb-1.5">Rating <span className="text-red-500">*</span></label>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button 
                    key={s} 
                    type="button" 
                    onClick={() => handleRatingClick(s)}
                    className="p-1 focus:outline-none hover:scale-110 transition-transform"
                  >
                    <Star className={`w-5 h-5 ${s <= formData.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#374151] mb-1.5">Testimonial <span className="text-red-500">*</span></label>
              <textarea 
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="Enter testimonial"
                rows={4}
                className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] resize-none"
              />
              <div className="text-right text-[10px] text-[#9CA3AF] mt-1">
                {formData.content.length}/500
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#374151] mb-1.5">Customer Image</label>
              <div className="border-2 border-dashed border-[#E5E7EB] rounded-lg p-6 bg-white text-center cursor-not-allowed opacity-70">
                <UploadCloud className="w-6 h-6 text-[#9CA3AF] mx-auto mb-2" />
                <p className="text-xs font-bold text-[#374151]">Upload Image</p>
                <p className="text-[10px] text-[#9CA3AF] mt-1">PNG, JPG up to 2MB (Integration Pending)</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#374151] mb-2">Status</label>
              <div className="flex items-center gap-6">
                {['PUBLISHED', 'PENDING', 'INACTIVE'].map(status => (
                  <label key={status} className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="status"
                      value={status}
                      checked={formData.status === status}
                      onChange={handleChange}
                      className="w-4 h-4 text-[#3B6FEB] border-[#D1D5DB] focus:ring-[#3B6FEB]" 
                    />
                    <span className="text-sm font-medium text-[#374151] capitalize">{status.toLowerCase()}</span>
                  </label>
                ))}
              </div>
            </div>

          </form>

          {/* Rating Overview Card from screenshot */}
          {stats && <RatingOverview stats={stats} />}

        </div>

        <div className="p-5 bg-white border-t border-[#E5E7EB] flex gap-3 justify-end">
          <button 
            type="button" 
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg text-sm font-bold text-[#374151] bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] transition-colors"
          >
            Cancel
          </button>
          <button 
            form="testimonial-form"
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-lg text-sm font-bold text-white bg-[#3B6FEB] hover:bg-[#2563EB] disabled:opacity-50 transition-colors"
          >
            {loading ? 'Saving...' : (testimonial ? 'Save Changes' : 'Save Testimonial')}
          </button>
        </div>
      </div>
    </>
  );
}
