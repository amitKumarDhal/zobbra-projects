import React, { useState } from 'react';

export default function CompanySettings({ settings, onSave }: { settings: any, onSave: (key: string, value: string) => Promise<void> }) {
  const [formData, setFormData] = useState({
    companyName: settings.companyName || 'ZOBRA',
    legalName: settings.legalName || 'Zobra Apparel Pvt Ltd',
    gstin: settings.gstin || '21ABCDE1234F1Z5',
    pan: settings.pan || 'ABCDE1234F',
    email: settings.email || settings.companyEmail || 'contact@zobra.com',
    phone: settings.phone || settings.companyPhone || '+91 98765 43210',
    whatsapp: settings.whatsapp || '+91 98765 43210',
    website: settings.website || 'https://zobra.com',
    address: settings.address || 'Main Office',
    city: settings.city || 'Bhubaneswar',
    state: settings.state || 'Odisha',
    pincode: settings.pincode || '751012',
    businessHours: settings.businessHours || 'Monday-Saturday (10:00 AM - 7:00 PM)',
  });

  const [saving, setSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const [key, value] of Object.entries(formData)) {
        if (settings[key] !== value) {
          await onSave(key, value);
        }
      }
      alert('Company Profile saved successfully');
    } catch (err) {
      alert('Failed to save Company Profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB]">
      <div className="p-6 border-b border-[#E5E7EB]">
        <h2 className="text-lg font-bold text-[#111111]">Company Profile</h2>
        <p className="text-sm text-[#6B7280]">Your business information for quotes and invoices</p>
      </div>
      
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-[#374151] mb-2">Company Name</label>
            <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:border-[#3B6FEB] focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#374151] mb-2">Legal Name</label>
            <input type="text" name="legalName" value={formData.legalName} onChange={handleChange} className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:border-[#3B6FEB] focus:outline-none" />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-[#374151] mb-2">GSTIN</label>
            <input type="text" name="gstin" value={formData.gstin} onChange={handleChange} className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:border-[#3B6FEB] focus:outline-none uppercase" />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#374151] mb-2">PAN</label>
            <input type="text" name="pan" value={formData.pan} onChange={handleChange} className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:border-[#3B6FEB] focus:outline-none uppercase" />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#374151] mb-2">Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:border-[#3B6FEB] focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#374151] mb-2">Phone</label>
            <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:border-[#3B6FEB] focus:outline-none" />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#374151] mb-2">WhatsApp</label>
            <input type="text" name="whatsapp" value={formData.whatsapp} onChange={handleChange} className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:border-[#3B6FEB] focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#374151] mb-2">Website</label>
            <input type="text" name="website" value={formData.website} onChange={handleChange} className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:border-[#3B6FEB] focus:outline-none" />
          </div>
        </div>

        <div className="w-full h-px bg-[#F3F4F6]" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-1 md:col-span-3">
             <label className="block text-xs font-bold text-[#374151] mb-2">Address</label>
             <textarea name="address" value={formData.address} onChange={handleChange} rows={2} className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:border-[#3B6FEB] focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#374151] mb-2">City</label>
            <input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:border-[#3B6FEB] focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#374151] mb-2">State</label>
            <input type="text" name="state" value={formData.state} onChange={handleChange} className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:border-[#3B6FEB] focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#374151] mb-2">Pincode</label>
            <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:border-[#3B6FEB] focus:outline-none" />
          </div>
        </div>
      </div>
      
      <div className="p-6 border-t border-[#E5E7EB]">
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-[#111111] hover:bg-[#3B6FEB] text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-colors"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
