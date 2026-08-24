import React, { useState } from 'react';
import { Shield } from 'lucide-react';

export default function SecuritySettings() {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/auth/change-password', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          currentPassword: formData.currentPassword, 
          newPassword: formData.newPassword 
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setError(data.message || 'Failed to change password');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB]">
      <div className="p-6 border-b border-[#E5E7EB] flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#111111]">Security Settings</h2>
          <p className="text-sm text-[#6B7280]">Manage your account password and security</p>
        </div>
      </div>
      
      <form onSubmit={handleSave} className="p-6 space-y-6">
        {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">{error}</div>}
        {success && <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200">Password changed successfully</div>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="col-span-1">
            <h3 className="text-sm font-bold text-[#374151]">Current Password</h3>
            <p className="text-xs text-[#6B7280]">Enter your existing password</p>
          </div>
          <div className="col-span-1 md:col-span-2">
            <input type="password" name="currentPassword" value={formData.currentPassword} onChange={handleChange} required className="w-full max-w-md px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:border-[#3B6FEB] focus:outline-none" />
          </div>
        </div>

        <div className="w-full h-px bg-[#F3F4F6]" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="col-span-1">
            <h3 className="text-sm font-bold text-[#374151]">New Password</h3>
            <p className="text-xs text-[#6B7280]">Minimum 6 characters</p>
          </div>
          <div className="col-span-1 md:col-span-2">
            <input type="password" name="newPassword" value={formData.newPassword} onChange={handleChange} required minLength={6} className="w-full max-w-md px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:border-[#3B6FEB] focus:outline-none" />
          </div>
        </div>

        <div className="w-full h-px bg-[#F3F4F6]" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="col-span-1">
            <h3 className="text-sm font-bold text-[#374151]">Confirm New Password</h3>
          </div>
          <div className="col-span-1 md:col-span-2">
            <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required minLength={6} className="w-full max-w-md px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:border-[#3B6FEB] focus:outline-none" />
          </div>
        </div>
        
        <div className="pt-4 border-t border-[#E5E7EB]">
          <button 
            type="submit"
            disabled={saving}
            className="bg-[#111111] hover:bg-[#3B6FEB] text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-colors"
          >
            {saving ? 'Updating Password...' : 'Update Password'}
          </button>
        </div>
      </form>
    </div>
  );
}
