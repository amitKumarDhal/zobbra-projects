'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@zobbra.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await apiClient.post('/auth/login', { email, password });
      if (res.data.success && res.data.token) {
        localStorage.setItem('zobra_token', res.data.token);
        localStorage.setItem('zobra_user', JSON.stringify(res.data.user));

        const role = res.data.user.role;
        if (role === 'ADMIN' || role === 'SALES' || role === 'PRODUCTION') {
          router.push('/admin');
        } else {
          router.push('/portal');
        }
      } else {
        setError(res.data.message || 'Login failed');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Invalid credentials or server connection error');
    } finally {
      setLoading(false);
    }
  };

  const autofillRole = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-black text-white font-black text-2xl flex items-center justify-center rounded-xl mx-auto">
            Z
          </div>
          <h2 className="text-2xl font-black text-slate-900">Sign in to Zobra</h2>
          <p className="text-slate-500 text-xs font-semibold">B2B Merchandise Management SaaS</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs font-bold">
            {error}
          </div>
        )}

        {/* Demo Role Switcher Bar */}
        <div className="bg-slate-100 p-2 rounded-xl text-center space-y-1">
          <p className="text-[10px] uppercase font-bold text-slate-500">Quick Test Autofill</p>
          <div className="flex flex-wrap gap-1 justify-center">
            <button
              type="button"
              onClick={() => autofillRole('admin@zobbra.com')}
              className="px-2.5 py-1 bg-white border border-slate-200 text-slate-800 rounded-md text-[11px] font-bold hover:bg-slate-200"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => autofillRole('sales@zobra.com')}
              className="px-2.5 py-1 bg-white border border-slate-200 text-slate-800 rounded-md text-[11px] font-bold hover:bg-slate-200"
            >
              Sales
            </button>
            <button
              type="button"
              onClick={() => autofillRole('production@zobra.com')}
              className="px-2.5 py-1 bg-white border border-slate-200 text-slate-800 rounded-md text-[11px] font-bold hover:bg-slate-200"
            >
              Production
            </button>
            <button
              type="button"
              onClick={() => autofillRole('client@acme.com')}
              className="px-2.5 py-1 bg-white border border-slate-200 text-slate-800 rounded-md text-[11px] font-bold hover:bg-slate-200"
            >
              Customer
            </button>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-600"
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold text-slate-700 uppercase">Password</label>
              <Link href="/forgot-password" className="text-xs text-blue-600 font-semibold hover:underline">
                Forgot?
              </Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-600"
            />
          </div>

          <Button type="submit" variant="secondary" disabled={loading} className="w-full py-3 font-bold">
            {loading ? 'SIGNING IN...' : 'SIGN IN'}
          </Button>
        </form>

        <div className="text-center text-xs text-slate-500">
          Need a B2B account?{' '}
          <Link href="/register" className="text-blue-600 font-bold hover:underline">
            Register Company
          </Link>
        </div>
      </div>
    </div>
  );
}

