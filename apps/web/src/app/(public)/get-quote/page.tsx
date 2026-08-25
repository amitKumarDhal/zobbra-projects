'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Building2, Package, Palette, Calendar, UploadCloud, Sparkles } from 'lucide-react';
import { API_URL } from '@/lib/api';

export default function GetQuotePage() {
  const [submitted, setSubmitted] = useState(false);
  const [inquiryNumber, setInquiryNumber] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    // 1. Customer & Company Information
    companyName: '',
    customerName: '',
    phone: '',
    email: '',
    location: '',

    // 2. Product Requirement
    productInterest: 'Polo T-Shirts',
    specificProduct: '',
    quantity: 100,

    // 3. Customization
    colors: '',
    sizes: '',
    printingType: 'DTF',
    printPosition: 'Front',
    artworkUrl: '',
    customizationRequirements: '',

    // 4. Commercial & Delivery
    budget: '₹25,000 – ₹50,000',
    deliveryDate: '',
  });

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Validate required fields
    if (!formData.companyName || !formData.customerName || !formData.phone || !formData.productInterest || !formData.quantity) {
      alert('Please fill in all required fields marked with *');
      return;
    }

    setLoading(true);
    
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_URL}/inquiries`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          companyName: formData.companyName,
          customerName: formData.customerName,
          phone: formData.phone,
          email: formData.email || undefined,
          location: formData.location || undefined,
          productInterest: formData.specificProduct 
            ? `${formData.productInterest} - ${formData.specificProduct}`
            : formData.productInterest,
          quantity: Number(formData.quantity),
          colors: formData.colors || undefined,
          sizes: formData.sizes || undefined,
          printingType: formData.printingType || undefined,
          printPosition: formData.printPosition || undefined,
          budget: formData.budget || undefined,
          deliveryDate: formData.deliveryDate || undefined,
          customizationRequirements: formData.customizationRequirements || undefined,
          message: formData.customizationRequirements || undefined,
          artworkUrl: formData.artworkUrl || undefined,
          source: 'WEBSITE'
        })
      });

      const data = await res.json();
      if (res.ok) {
        setInquiryNumber(data.inquiryNumber || data.inquiry?.inquiryNumber || 'INQ-2026-0001');
        setSubmitted(true);
      } else {
        alert(data.message || 'Failed to submit inquiry.');
      }
    } catch (error) {
      console.error('Inquiry submission error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 bg-[#F8F9FC]">
      {/* HEADER */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#EEF2FF] border border-[#C7D2FE] rounded-full text-xs font-bold text-[#3B6FEB]">
          <Sparkles className="w-3.5 h-3.5" /> B2B CUSTOM MERCHANDISE QUOTE
        </div>
        <h1 className="text-4xl lg:text-[44px] font-heading font-black text-[#111111] leading-tight">
          Request Merchandise Quote
        </h1>
        <p className="text-[#6B7280] text-sm max-w-xl mx-auto">
          Fill out your organization requirements below to receive a custom bulk pricing quotation & 3D digital proof from our sales team.
        </p>
      </div>

      <Card className="bg-white border-[#E5E7EB] p-6 sm:p-10 shadow-sm rounded-2xl">
        {submitted ? (
          /* SUCCESS STATE */
          <div className="text-center py-10 space-y-5">
            <div className="w-20 h-20 bg-[#EEF2FF] text-[#3B6FEB] rounded-full flex items-center justify-center mx-auto text-3xl font-bold border border-[#C7D2FE] shadow-sm">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Inquiry submitted successfully
              </span>
              <h2 className="text-3xl font-heading font-black text-[#111111] mt-3">
                Inquiry Submitted!
              </h2>
            </div>
            
            <div className="bg-[#F8F9FC] border border-[#E5E7EB] py-4 px-8 rounded-xl inline-block mx-auto shadow-sm">
              <span className="text-[#6B7280] text-xs font-bold uppercase tracking-wider block mb-1">
                Your Inquiry ID
              </span>
              <span className="text-2xl font-black text-[#3B6FEB] font-mono tracking-tight" data-cy="inquiry-id-display">
                {inquiryNumber}
              </span>
            </div>

            <p className="text-[#4B5563] text-sm max-w-md mx-auto leading-relaxed">
              Thank you. Our sales team will review your requirements and contact you shortly with custom bulk pricing and specifications.
            </p>

            <div className="pt-2">
              <button 
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setFormData({
                    companyName: '',
                    customerName: '',
                    phone: '',
                    email: '',
                    location: '',
                    productInterest: 'Polo T-Shirts',
                    specificProduct: '',
                    quantity: 100,
                    colors: '',
                    sizes: '',
                    printingType: 'DTF',
                    printPosition: 'Front',
                    artworkUrl: '',
                    customizationRequirements: '',
                    budget: '₹25,000 – ₹50,000',
                    deliveryDate: '',
                  });
                }} 
                className="px-8 py-3 bg-[#111111] hover:bg-[#000000] text-white text-sm font-bold rounded-xl transition-all shadow-sm"
              >
                Submit Another Request
              </button>
            </div>
          </div>
        ) : (
          /* MULTI-SECTION FORM */
          <form className="space-y-8 text-sm" onSubmit={handleSubmit}>
            
            {/* SECTION 1: CUSTOMER & COMPANY INFORMATION */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-[#F3F4F6]">
                <Building2 className="w-4 h-4 text-[#3B6FEB]" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                  Customer & Company Information
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block font-bold text-[#374151] mb-1.5">
                    Company / Organization Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    required 
                    data-cy="company-name-input"
                    value={formData.companyName} 
                    onChange={e => setFormData({ ...formData, companyName: e.target.value })} 
                    placeholder="Acme Tech Pvt Ltd" 
                    className="w-full px-4 py-2.5 bg-white border border-[#D1D5DB] rounded-lg text-[#111111] outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] shadow-sm transition-all" 
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#374151] mb-1.5">
                    Contact Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    required 
                    data-cy="contact-name-input"
                    value={formData.customerName} 
                    onChange={e => setFormData({ ...formData, customerName: e.target.value })} 
                    placeholder="Rahul Mishra" 
                    className="w-full px-4 py-2.5 bg-white border border-[#D1D5DB] rounded-lg text-[#111111] outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] shadow-sm transition-all" 
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#374151] mb-1.5">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="tel" 
                    required 
                    data-cy="phone-input"
                    value={formData.phone} 
                    onChange={e => setFormData({ ...formData, phone: e.target.value })} 
                    placeholder="+91 98765 43210" 
                    className="w-full px-4 py-2.5 bg-white border border-[#D1D5DB] rounded-lg text-[#111111] outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] shadow-sm transition-all" 
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#374151] mb-1.5">
                    Email Address <span className="text-[#9CA3AF] font-normal">(Optional)</span>
                  </label>
                  <input 
                    type="email" 
                    data-cy="email-input"
                    value={formData.email} 
                    onChange={e => setFormData({ ...formData, email: e.target.value })} 
                    placeholder="rahul@acmetech.com" 
                    className="w-full px-4 py-2.5 bg-white border border-[#D1D5DB] rounded-lg text-[#111111] outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] shadow-sm transition-all" 
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#374151] mb-1.5">
                    Location / City <span className="text-[#9CA3AF] font-normal">(Optional)</span>
                  </label>
                  <input 
                    type="text" 
                    data-cy="location-input"
                    value={formData.location} 
                    onChange={e => setFormData({ ...formData, location: e.target.value })} 
                    placeholder="Mumbai, Maharashtra" 
                    className="w-full px-4 py-2.5 bg-white border border-[#D1D5DB] rounded-lg text-[#111111] outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] shadow-sm transition-all" 
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: PRODUCT REQUIREMENT */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-[#F3F4F6]">
                <Package className="w-4 h-4 text-[#3B6FEB]" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                  Product Requirement
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-[#374151] mb-1.5">
                    Category / Product Interest <span className="text-red-500">*</span>
                  </label>
                  <select 
                    data-cy="category-select"
                    value={formData.productInterest} 
                    onChange={e => setFormData({ ...formData, productInterest: e.target.value })} 
                    className="w-full px-4 py-2.5 bg-white border border-[#D1D5DB] rounded-lg text-[#111111] outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] shadow-sm transition-all font-medium"
                  >
                    <option value="Polo T-Shirts">Polo T-Shirts</option>
                    <option value="Round Neck T-Shirts">Round Neck T-Shirts</option>
                    <option value="Hoodies & Sweatshirts">Hoodies & Sweatshirts</option>
                    <option value="Cotton Caps">Cotton Caps</option>
                    <option value="Executive Backpacks">Executive Backpacks</option>
                    <option value="Stainless Steel Bottles">Stainless Steel Bottles</option>
                    <option value="Corporate Gifts / Other">Corporate Gifts / Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#374151] mb-1.5">
                    Specific Product <span className="text-[#9CA3AF] font-normal">(Optional)</span>
                  </label>
                  <input 
                    type="text" 
                    data-cy="specific-product-input"
                    value={formData.specificProduct} 
                    onChange={e => setFormData({ ...formData, specificProduct: e.target.value })} 
                    placeholder="e.g. 240 GSM Bio-Washed" 
                    className="w-full px-4 py-2.5 bg-white border border-[#D1D5DB] rounded-lg text-[#111111] outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] shadow-sm transition-all" 
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#374151] mb-1.5">
                    Estimated Quantity <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="number" 
                    required 
                    min="1" 
                    data-cy="quantity-input"
                    value={formData.quantity} 
                    onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })} 
                    placeholder="100" 
                    className="w-full px-4 py-2.5 bg-white border border-[#D1D5DB] rounded-lg text-[#111111] outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] shadow-sm transition-all font-semibold" 
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: CUSTOMIZATION */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-[#F3F4F6]">
                <Palette className="w-4 h-4 text-[#3B6FEB]" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                  Customization Specifications
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#374151] mb-1.5">
                    Color Preference <span className="text-[#9CA3AF] font-normal">(Optional)</span>
                  </label>
                  <input 
                    type="text" 
                    data-cy="colors-input"
                    value={formData.colors} 
                    onChange={e => setFormData({ ...formData, colors: e.target.value })} 
                    placeholder="e.g. Navy Blue, Charcoal Melange" 
                    className="w-full px-4 py-2.5 bg-white border border-[#D1D5DB] rounded-lg text-[#111111] outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] shadow-sm transition-all" 
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#374151] mb-1.5">
                    Size Preference / Breakdown <span className="text-[#9CA3AF] font-normal">(Optional)</span>
                  </label>
                  <input 
                    type="text" 
                    data-cy="sizes-input"
                    value={formData.sizes} 
                    onChange={e => setFormData({ ...formData, sizes: e.target.value })} 
                    placeholder="e.g. S: 20, M: 40, L: 30, XL: 10" 
                    className="w-full px-4 py-2.5 bg-white border border-[#D1D5DB] rounded-lg text-[#111111] outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] shadow-sm transition-all" 
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#374151] mb-1.5">
                    Printing Type <span className="text-[#9CA3AF] font-normal">(Optional)</span>
                  </label>
                  <select 
                    data-cy="printing-type-select"
                    value={formData.printingType} 
                    onChange={e => setFormData({ ...formData, printingType: e.target.value })} 
                    className="w-full px-4 py-2.5 bg-white border border-[#D1D5DB] rounded-lg text-[#111111] outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] shadow-sm transition-all"
                  >
                    <option value="DTF">DTF (Direct to Film)</option>
                    <option value="Screen Printing">Screen Printing</option>
                    <option value="Embroidery">Embroidery</option>
                    <option value="Sublimation">Sublimation</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#374151] mb-1.5">
                    Print Position <span className="text-[#9CA3AF] font-normal">(Optional)</span>
                  </label>
                  <select 
                    data-cy="print-position-select"
                    value={formData.printPosition} 
                    onChange={e => setFormData({ ...formData, printPosition: e.target.value })} 
                    className="w-full px-4 py-2.5 bg-white border border-[#D1D5DB] rounded-lg text-[#111111] outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] shadow-sm transition-all"
                  >
                    <option value="Front">Front</option>
                    <option value="Back">Back</option>
                    <option value="Front + Back">Front + Back</option>
                    <option value="Left Chest">Left Chest</option>
                    <option value="Sleeve">Sleeve</option>
                    <option value="Embroidery">Embroidery</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block font-bold text-[#374151] mb-1.5">
                    Artwork / Logo Link or Drive URL <span className="text-[#9CA3AF] font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      data-cy="artwork-url-input"
                      value={formData.artworkUrl} 
                      onChange={e => setFormData({ ...formData, artworkUrl: e.target.value })} 
                      placeholder="https://drive.google.com/... or paste link to logo" 
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#D1D5DB] rounded-lg text-[#111111] outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] shadow-sm transition-all" 
                    />
                    <UploadCloud className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block font-bold text-[#374151] mb-1.5">
                    Customization Requirements / Message <span className="text-[#9CA3AF] font-normal">(Optional)</span>
                  </label>
                  <textarea 
                    rows={3} 
                    data-cy="customization-textarea"
                    value={formData.customizationRequirements} 
                    onChange={e => setFormData({ ...formData, customizationRequirements: e.target.value })} 
                    placeholder="Mention specific print colors, placement details, fabric GSM preference, or event branding requirements..." 
                    className="w-full px-4 py-2.5 bg-white border border-[#D1D5DB] rounded-lg text-[#111111] outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] shadow-sm transition-all leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 4: COMMERCIAL & DELIVERY */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-[#F3F4F6]">
                <Calendar className="w-4 h-4 text-[#3B6FEB]" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                  Commercial & Delivery Timeline
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#374151] mb-1.5">
                    Budget Range <span className="text-[#9CA3AF] font-normal">(Optional)</span>
                  </label>
                  <select 
                    data-cy="budget-select"
                    value={formData.budget} 
                    onChange={e => setFormData({ ...formData, budget: e.target.value })} 
                    className="w-full px-4 py-2.5 bg-white border border-[#D1D5DB] rounded-lg text-[#111111] outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] shadow-sm transition-all font-medium"
                  >
                    <option value="Under ₹10,000">Under ₹10,000</option>
                    <option value="₹10,000 – ₹25,000">₹10,000 – ₹25,000</option>
                    <option value="₹25,000 – ₹50,000">₹25,000 – ₹50,000</option>
                    <option value="₹50,000 – ₹1,00,000">₹50,000 – ₹1,00,000</option>
                    <option value="₹1,00,000+">₹1,00,000+</option>
                    <option value="Not Sure">Not Sure</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#374151] mb-1.5">
                    Required Delivery Date <span className="text-[#9CA3AF] font-normal">(Optional)</span>
                  </label>
                  <input 
                    type="date" 
                    data-cy="delivery-date-input"
                    value={formData.deliveryDate} 
                    onChange={e => setFormData({ ...formData, deliveryDate: e.target.value })} 
                    className="w-full px-4 py-2.5 bg-white border border-[#D1D5DB] rounded-lg text-[#111111] outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] shadow-sm transition-all font-medium" 
                  />
                </div>
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <div className="pt-4 border-t border-[#E5E7EB]">
              <button 
                type="button" 
                onClick={() => handleSubmit()}
                disabled={loading} 
                data-cy="submit-inquiry-btn"
                className="w-full py-4 bg-[#111111] hover:bg-[#000000] disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-base font-bold rounded-xl shadow-md hover:shadow-lg transition-all tracking-wide flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? 'SUBMITTING INQUIRY...' : 'SUBMIT QUOTE INQUIRY'}
              </button>
              <p className="text-center text-xs text-[#9CA3AF] mt-2">
                Submitting creates an official Inquiry. You will be contacted with a formal quotation and digital proof.
              </p>
            </div>

          </form>
        )}
      </Card>
    </div>
  );
}
