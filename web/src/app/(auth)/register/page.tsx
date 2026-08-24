'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState('');
  const [gstin, setGstin] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/register', {
        email,
        password,
        name,
        phone: phone || undefined,
        companyName: companyName || undefined,
        gstin: gstin || undefined,
      });

      if (res.data.success && res.data.token) {
        localStorage.setItem('zobra_token', res.data.token);
        localStorage.setItem('zobra_user', JSON.stringify(res.data.user));
        router.push('/portal');
      } else {
        setError(res.data.message || 'Registration failed');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'Failed to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 py-8">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-black text-white font-black text-2xl flex items-center justify-center rounded-xl mx-auto">
            Z
          </div>
          <h2 className="text-2xl font-black text-slate-900">Create B2B Account</h2>
          <p className="text-slate-500 text-xs">For corporate clients & merchandise buyers</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Company Name</label>
            <input
              type="text"
              required
              placeholder="Acme Technologies Pvt Ltd"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-600"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">GSTIN (Optional)</label>
            <input
              type="text"
              placeholder="21ABCDE1234F1Z5"
              value={gstin}
              onChange={(e) => setGstin(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-600"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Contact Name</label>
            <input
              type="text"
              required
              placeholder="Rahul Mishra"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-600"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Work Email</label>
            <input
              type="email"
              required
              placeholder="rahul@acme.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-600"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone Number</label>
            <input
              type="tel"
              placeholder="+91 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-600"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-600"
            />
          </div>

          <Button type="submit" variant="secondary" disabled={loading} className="w-full py-3 font-bold">
            {loading ? 'CREATING ACCOUNT...' : 'REGISTER COMPANY'}
          </Button>
        </form>

        <div className="text-center text-xs text-slate-500">
          Already registered?{' '}
          <Link href="/login" className="text-blue-600 font-bold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

