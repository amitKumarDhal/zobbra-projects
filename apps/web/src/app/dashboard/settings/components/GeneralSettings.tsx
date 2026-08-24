import React, { useState } from 'react';

export default function GeneralSettings({ settings, onSave }: { settings: any, onSave: (key: string, value: string) => Promise<void> }) {
  const [formData, setFormData] = useState({
    siteName: settings.siteName || 'ZOBRA',
    siteEmail: settings.siteEmail || 'admin@zobbra.com',
    sitePhone: settings.sitePhone || '+91 98765 43210',
    timezone: settings.timezone || 'Asia/Kolkata',
    dateFormat: settings.dateFormat || 'DD MMM, YYYY',
    timeFormat: settings.timeFormat || '12h',
    language: settings.language || 'English',
    currency: settings.currency || 'INR',
    currencyPosition: settings.currencyPosition || 'before',
    itemsPerPage: settings.itemsPerPage || '10',
  });

  const [saving, setSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save all keys in parallel or sequentially. We will bundle them into one object.
      // But the backend expects key/value.
      // Wait, let's update them all at once? The backend updateSettings takes { key, value }
      for (const [key, value] of Object.entries(formData)) {
        if (settings[key] !== value) {
          await onSave(key, value);
        }
      }
      alert('Settings saved successfully');
    } catch (err) {
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB]">
      <div className="p-6 border-b border-[#E5E7EB]">
        <h2 className="text-lg font-bold text-[#111111]">General Settings</h2>
        <p className="text-sm text-[#6B7280]">Manage general settings for your system</p>
      </div>
      
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="col-span-1">
            <h3 className="text-sm font-bold text-[#374151]">Site Name</h3>
            <p className="text-xs text-[#6B7280]">This name will be shown in the system.</p>
          </div>
          <div className="col-span-1 md:col-span-2">
            <input type="text" name="siteName" value={formData.siteName} onChange={handleChange} className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:border-[#3B6FEB] focus:outline-none" />
          </div>
        </div>

        <div className="w-full h-px bg-[#F3F4F6]" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="col-span-1">
            <h3 className="text-sm font-bold text-[#374151]">Site Email</h3>
            <p className="text-xs text-[#6B7280]">This email will be used for system notifications.</p>
          </div>
          <div className="col-span-1 md:col-span-2">
            <input type="email" name="siteEmail" value={formData.siteEmail} onChange={handleChange} className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:border-[#3B6FEB] focus:outline-none" />
          </div>
        </div>

        <div className="w-full h-px bg-[#F3F4F6]" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="col-span-1">
            <h3 className="text-sm font-bold text-[#374151]">Site Phone</h3>
            <p className="text-xs text-[#6B7280]">This phone number will be used for system.</p>
          </div>
          <div className="col-span-1 md:col-span-2">
            <input type="text" name="sitePhone" value={formData.sitePhone} onChange={handleChange} className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:border-[#3B6FEB] focus:outline-none" />
          </div>
        </div>

        <div className="w-full h-px bg-[#F3F4F6]" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="col-span-1">
            <h3 className="text-sm font-bold text-[#374151]">Site Timezone</h3>
            <p className="text-xs text-[#6B7280]">Select timezone for your system.</p>
          </div>
          <div className="col-span-1 md:col-span-2">
            <select name="timezone" value={formData.timezone} onChange={handleChange} className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:border-[#3B6FEB] focus:outline-none">
              <option value="Asia/Kolkata">(GMT+05:30) Asia/Kolkata</option>
              <option value="UTC">UTC</option>
            </select>
          </div>
        </div>

        <div className="w-full h-px bg-[#F3F4F6]" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="col-span-1">
            <h3 className="text-sm font-bold text-[#374151]">Currency Position</h3>
            <p className="text-xs text-[#6B7280]">Choose currency symbol position.</p>
          </div>
          <div className="col-span-1 md:col-span-2 flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="currencyPosition" value="before" checked={formData.currencyPosition === 'before'} onChange={handleChange} className="w-4 h-4 text-[#3B6FEB]" />
              <span className="text-sm text-[#374151]">Before Amount (₹1,000)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="currencyPosition" value="after" checked={formData.currencyPosition === 'after'} onChange={handleChange} className="w-4 h-4 text-[#3B6FEB]" />
              <span className="text-sm text-[#374151]">After Amount (1,000₹)</span>
            </label>
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
