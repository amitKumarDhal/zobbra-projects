'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, Mail, AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { API_URL } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!email || !password) {
      setError('Please enter your email and password.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (res.ok && data.success && data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('zobra_token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('zobra_user', JSON.stringify(data.user));

        if (data.user?.role === 'CUSTOMER') {
          router.push('/customer');
        } else {
          router.push('/dashboard');
        }
      } else {
        setError(data.message || 'Invalid email or password.');
      }
    } catch (err: any) {
      console.error('Login API error:', err);
      setError('Unable to connect to Zobra. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const setTestUser = (testEmail: string, testPass: string) => {
    setEmail(testEmail);
    setPassword(testPass);
  };

  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white text-[#050505] font-sans">
      {/* Left Zobra Brand Panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 bg-[#050505] overflow-hidden">
        {/* Subtle decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-[#3B6FEB]/10 blur-[120px]"></div>
          <div className="absolute bottom-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-[#3B6FEB]/5 blur-[100px]"></div>
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay"></div>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 bg-white text-[#050505] font-serif font-black text-2xl flex items-center justify-center shadow-[0_0_15px_rgba(59,111,235,0.3)]">
            Z
          </div>
          <div>
            <span className="text-xl font-serif font-black tracking-tight text-white block leading-none">
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
          <h1 className="text-5xl font-black text-white leading-[1.1] font-heading">
            WEAR YOUR BRAND.<br/>
            BUILD YOUR <span className="text-[#3B6FEB]">IDENTITY.</span>
          </h1>
          <p className="text-[#A1A1AA] text-lg font-medium leading-relaxed max-w-md">
            Premium custom merchandise for companies, schools, teams and growing brands.
          </p>
        </motion.div>

        <div className="flex items-center gap-6 relative z-10">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#3B6FEB]" />
            <span className="text-sm text-[#A1A1AA] font-semibold">500+ Businesses</span>
          </div>
          <div className="flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-[#3B6FEB]"></div>
             <span className="text-sm text-[#A1A1AA] font-semibold">PAN-India Delivery</span>
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col justify-between p-8 sm:p-12 lg:p-16 bg-white overflow-y-auto"
      >
        <div className="flex justify-between items-center">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#050505] font-bold transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <div className="lg:hidden flex items-center gap-2">
            <div className="w-6 h-6 bg-[#050505] text-white font-serif font-black text-sm flex items-center justify-center">
              Z
            </div>
            <span className="text-sm font-serif font-black tracking-tight text-[#050505]">ZOBBRA</span>
          </div>
        </div>

        <div className="max-w-[420px] w-full mx-auto space-y-8 py-12">
          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tight text-[#050505] font-heading">Welcome back</h2>
            <p className="text-[#6B7280] font-medium">Sign in to manage your Zobra account.</p>
          </div>

          {isDevelopment && (
            <div className="bg-[#F8F9FC] p-4 rounded-xl border border-[#E5E7EB] space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">Development Access</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  data-cy="login-autofill-admin"
                  onClick={() => setTestUser('admin@zobra.test', 'admin123')}
                  className="flex-1 py-1.5 bg-white border border-[#E5E7EB] text-[#050505] rounded-lg text-xs font-bold hover:border-[#3B6FEB] hover:text-[#3B6FEB] transition-all shadow-sm"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => setTestUser('sales@zobra.test', 'sales123')}
                  className="flex-1 py-1.5 bg-white border border-[#E5E7EB] text-[#050505] rounded-lg text-xs font-bold hover:border-[#3B6FEB] hover:text-[#3B6FEB] transition-all shadow-sm"
                >
                  Sales
                </button>
                <button
                  type="button"
                  data-cy="login-autofill-customer"
                  onClick={() => setTestUser('customer@zobra.test', 'customer123')}
                  className="flex-1 py-1.5 bg-white border border-[#E5E7EB] text-[#050505] rounded-lg text-xs font-bold hover:border-[#3B6FEB] hover:text-[#3B6FEB] transition-all shadow-sm"
                >
                  Customer
                </button>
              </div>
            </div>
          )}

          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm font-medium flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          <form className="space-y-5" onSubmit={handleLogin}>
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-[#050505]">Email Address</label>
              <div className="relative group">
                <Mail className="w-5 h-5 text-[#9CA3AF] absolute left-3.5 top-3.5 group-focus-within:text-[#050505] transition-colors" />
                <input
                  type="email"
                  data-cy="email-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-11 pr-4 py-3 bg-white border border-[#E5E7EB] rounded-xl text-[15px] text-[#050505] focus:outline-none focus:border-[#050505] focus:ring-4 focus:ring-[#050505]/10 transition-all placeholder:text-[#9CA3AF]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-[#050505]">Password</label>
              </div>
              <div className="relative group">
                <Lock className="w-5 h-5 text-[#9CA3AF] absolute left-3.5 top-3.5 group-focus-within:text-[#050505] transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  data-cy="password-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-12 py-3 bg-white border border-[#E5E7EB] rounded-xl text-[15px] text-[#050505] focus:outline-none focus:border-[#050505] focus:ring-4 focus:ring-[#050505]/10 transition-all placeholder:text-[#9CA3AF]"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-[#9CA3AF] hover:text-[#050505] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input type="checkbox" className="peer sr-only" />
                  <div className="w-4 h-4 border border-[#E5E7EB] rounded bg-white peer-checked:bg-[#050505] peer-checked:border-[#050505] transition-colors"></div>
                  <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 17 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 5.5L6 10.5L16 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <span className="text-sm font-medium text-[#6B7280] group-hover:text-[#050505] transition-colors">Remember me</span>
              </label>
              
              <Link href="/forgot-password" className="text-sm font-bold text-[#050505] hover:underline transition-colors">
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              data-cy="login-submit-button"
              disabled={loading}
              className="w-full py-3.5 mt-4 bg-[#050505] hover:bg-[#222222] text-white rounded-xl text-[15px] font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100 uppercase tracking-wider"
            >
              {loading ? 'SIGNING IN...' : 'SIGN IN'}
            </button>
            
            <Link 
              href="/register" 
              className="flex items-center justify-center w-full py-3.5 mt-3 bg-white border-2 border-[#050505] text-[#050505] hover:bg-[#050505] hover:text-white rounded-xl text-[15px] font-bold transition-all active:scale-[0.98] tracking-wide shadow-sm"
            >
              Create an account
            </Link>
          </form>
        </div>

        <div className="text-center text-xs font-medium text-[#9CA3AF]">
          © {new Date().getFullYear()} Zobra Prints. All rights reserved.
        </div>
      </motion.div>
    </div>
  );
}
