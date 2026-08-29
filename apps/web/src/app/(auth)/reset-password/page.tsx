'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { API_URL } from '@/lib/api';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing password reset token.');
    }
  }, [token]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Invalid or missing password reset token.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      
      const data = await res.json();

      if (res.ok && data.success) {
        alert('Password reset successfully! Please login with your new password.');
        router.push('/login');
      } else {
        if (res.status === 404) {
          setError('Password reset endpoint is not configured in this development environment.');
        } else {
          setError(data.message || 'Failed to reset password.');
        }
      }
    } catch (err: any) {
      console.error('Reset API error:', err);
      setError('Password reset endpoint is not configured in this development environment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white text-[#050505] font-sans">
      {/* Left Zobra Brand Panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 bg-[#050505] overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-[#3B6FEB]/10 blur-[120px]"></div>
          <div className="absolute bottom-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-[#3B6FEB]/5 blur-[100px]"></div>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 bg-white text-[#050505] font-heading font-black text-2xl flex items-center justify-center shadow-[0_0_15px_rgba(59,111,235,0.3)]">
            Z
          </div>
          <div>
            <span className="text-xl font-heading font-black tracking-tight text-white block leading-none">
              ZOBBRA
            </span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6 max-w-lg relative z-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/10 text-white text-[11px] font-bold tracking-widest uppercase">
            <ShieldCheck className="w-3.5 h-3.5 text-[#3B6FEB]" />
            Secure Portal
          </div>
          <h1 className="text-4xl xl:text-5xl font-heading font-black tracking-tight text-white leading-tight">
            Create a New Secure Password
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            Ensure your account is protected with strong credentials. Once updated, you will be able to access your production pipelines and quotation workspaces immediately.
          </p>
        </motion.div>

        <div className="text-xs text-gray-500 font-medium relative z-10">
          &copy; {new Date().getFullYear()} Zobra International Pvt. Ltd. All rights reserved.
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex items-center justify-center p-4 sm:p-8 lg:p-16 overflow-y-auto">
        <div className="w-full max-w-md space-y-6 sm:space-y-8 py-6">
          <div>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-black transition-colors mb-6 group min-h-[44px]"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Login
            </Link>
            <h2 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-gray-900">
              Reset Password
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-gray-500">
              Please enter and confirm your new password below.
            </p>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700 block">
                New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-[#F9FAFB] border border-[#E5E7EB] text-sm text-gray-900 focus:outline-none focus:border-[#3B6FEB] focus:bg-white transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700 block">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-[#F9FAFB] border border-[#E5E7EB] text-sm text-gray-900 focus:outline-none focus:border-[#050505] focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              className="w-full py-3.5 bg-[#050505] hover:bg-[#222222] text-white text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg mt-6"
            >
              {loading ? 'Updating Password...' : 'Save New Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm font-bold text-gray-500">Loading reset password...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
