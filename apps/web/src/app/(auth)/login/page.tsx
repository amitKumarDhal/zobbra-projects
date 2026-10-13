'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, Mail, AlertCircle, Eye, EyeOff, ShieldCheck, Sparkles, Briefcase } from 'lucide-react';
import { API_URL } from '@/lib/api';
import { ZobbraLogo } from '@/components/shared/ZobbraLogo';
import { sanitizeReturnUrl } from '@/lib/customizerDraft';
import { WhatsAppOtpLogin, OtpLoginSuccess } from '@/components/auth/WhatsAppOtpLogin';
import {
  customerLoginHref,
  postLoginDestination,
  adminLoginHref,
  storeSession,
} from '@/lib/otpAuth';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = sanitizeReturnUrl(searchParams.get('returnUrl'));
  const isFromCustomizer = returnUrl && returnUrl.includes('/customize');
  // Customers sign in with WhatsApp OTP; ADMIN keeps email + password.
  // (?mode=staff is the pre-OTP link and is kept as an alias.)
  const mode = searchParams.get('mode');
  const isAdminMode = mode === 'admin' || mode === 'staff';

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
        signal: AbortSignal.timeout(15000), // 15 second timeout
      });
      const data = await res.json();

      if (res.ok && data.success && data.token) {
        storeSession(data.token, data.user);
        router.push(postLoginDestination(data.user?.role, returnUrl));
      } else {
        // Use the API error message if available, otherwise provide status-based message
        if (res.status === 401) {
          setError('Invalid email or password.');
        } else if (res.status === 429) {
          setError('Too many login attempts. Please wait a moment and try again.');
        } else if (res.status >= 500) {
          setError('ZOBBRA is temporarily unavailable. Please try again in a moment.');
        } else {
          setError(data.message || 'Unable to complete sign in. Please try again.');
        }
      }
    } catch (err: any) {
      console.error('Login API error:', err);

      // Classify the error and provide appropriate user message
      if (err.name === 'AbortError' || err.message.includes('timeout')) {
        setError('Connection is taking too long. Please check your internet connection and try again.');
      } else if (err instanceof TypeError) {
        if (!navigator.onLine) {
          setError('Unable to reach ZOBBRA. Please check your internet connection.');
        } else {
          setError('Connection error. Please try again.');
        }
      } else {
        setError('Unable to complete sign in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const setTestUser = (testEmail: string, testPass: string) => {
    setEmail(testEmail);
    setPassword(testPass);
  };

  const handleOtpSuccess = ({ token, user }: OtpLoginSuccess) => {
    storeSession(token, user);
    router.push(postLoginDestination(user.role, returnUrl));
  };

  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between relative overflow-hidden">
      {/* Ambient background glow & subtle grid */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[680px] h-[340px] rounded-full bg-gradient-to-r from-blue-500/10 via-teal-500/10 to-indigo-500/10 blur-[90px]" />
        <div className="absolute -bottom-40 right-1/4 w-[500px] h-[300px] rounded-full bg-teal-500/5 blur-[100px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_45%,#000_60%,transparent_100%)] opacity-35" />
      </div>

      {/* Top Header */}
      <header className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 bg-white/80 hover:bg-white px-3.5 py-1.5 rounded-full border border-slate-200 shadow-sm transition-all active:scale-[0.98]"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </Link>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-white/70 px-3 py-1 rounded-full border border-slate-200/80 shadow-sm">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Verified Secure B2B</span>
        </div>
      </header>

      {/* Main Centered Authentication Stage */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-6 sm:py-10">
        <div className="w-full max-w-[460px] mx-auto">
          
          {/* Centered Auth Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="w-full"
          >
            {/* Card Container */}
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-200/90 shadow-[0_24px_60px_-15px_rgba(15,23,42,0.08),0_0_1px_1px_rgba(15,23,42,0.02)] p-6 sm:p-9 space-y-6">
            
            {/* Header: Brand Logo & Title */}
            <div className="text-center space-y-3">
              <div className="inline-flex justify-center">
                <ZobbraLogo variant="dark-badge" href="/" width={140} height={46} priority={true} />
              </div>
              
              {/* Brand Tagline Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200/80 text-[10px] sm:text-[11px] font-bold tracking-wider text-slate-700 uppercase">
                <span>WEAR YOUR BRAND</span>
                <span className="w-1 h-1 rounded-full bg-slate-400" />
                <span>BUILD YOUR IDENTITY</span>
              </div>

              <div className="space-y-1 pt-1">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-heading">
                  {isAdminMode ? 'Admin sign in' : 'Welcome to ZOBBRA'}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  {isAdminMode
                    ? 'Sign in to access your administrative dashboard.'
                    : 'Sign in with your WhatsApp number.'}
                </p>
              </div>
            </div>

            {/* Customizer Resume Notification */}
            {isFromCustomizer && (
              <div className="bg-teal-50 border border-teal-200 text-teal-900 p-3.5 rounded-xl text-xs font-medium flex items-center gap-2.5 shadow-sm">
                <Sparkles className="w-4 h-4 shrink-0 text-teal-600" />
                <span>You have a customized design waiting! Sign in to continue and request your quote.</span>
              </div>
            )}

            {/* Development Mode Quick Fill */}
            {isAdminMode && isDevelopment && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <span>Development Access</span>
                  <span className="text-[10px] font-mono text-slate-400">LOCAL</span>
                </div>
                <button
                  type="button"
                  data-cy="login-autofill-admin"
                  onClick={() => setTestUser('admin@zobra.test', 'admin123')}
                  className="w-full py-1.5 bg-white border border-slate-200 text-slate-900 rounded-lg text-xs font-bold hover:border-slate-400 hover:bg-slate-50 transition-all shadow-sm"
                >
                  Autofill Admin Credentials (admin@zobra.test)
                </button>
              </div>
            )}

            {/* Admin Error Alert */}
            {isAdminMode && error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2.5"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Customer WhatsApp OTP Mode */}
            {!isAdminMode && (
              <div className="space-y-5">
                <WhatsAppOtpLogin onSuccess={handleOtpSuccess} />
                <div className="pt-2 text-center border-t border-slate-100 space-y-2.5">
                  <p className="text-[11px] text-slate-400 font-medium">
                    New customers get an account automatically after verification.
                  </p>
                  <div>
                    <Link
                      href={adminLoginHref(returnUrl)}
                      data-cy="admin-login-link"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors py-1.5 px-3 rounded-lg hover:bg-slate-100 min-h-[44px]"
                    >
                      <Briefcase className="w-3.5 h-3.5 text-slate-400" /> Admin Login
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Admin Email & Password Mode */}
            {isAdminMode && (
              <form className="space-y-4" onSubmit={handleLogin}>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">Email Address</label>
                  <div className="relative group">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 group-focus-within:text-slate-900 transition-colors" />
                    <input
                      type="email"
                      data-cy="email-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@zobra.test"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10 transition-all placeholder:text-slate-400 font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-800">Password</label>
                    <Link
                      href="/forgot-password"
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 hover:underline transition-colors"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                  <div className="relative group">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 group-focus-within:text-slate-900 transition-colors" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      data-cy="password-input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10 transition-all placeholder:text-slate-400 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-800 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    />
                    <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900 transition-colors">
                      Remember me
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  data-cy="login-submit-button"
                  disabled={loading}
                  className="w-full py-3.5 mt-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>

                <div className="pt-3 border-t border-slate-100 text-center">
                  <Link
                    href={customerLoginHref(returnUrl)}
                    data-cy="customer-login-link"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors py-1.5 px-3 rounded-lg hover:bg-slate-100"
                  >
                    Not an admin? Sign in with WhatsApp
                  </Link>
                </div>
              </form>
            )}
          </div>

          {/* Trust Badges below Card */}
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-3 text-xs font-semibold text-slate-500 bg-white/80 backdrop-blur px-4 py-2 rounded-full border border-slate-200/80 shadow-sm">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 500+ Businesses
              </span>
              <span className="text-slate-300">•</span>
              <span>PAN-India Delivery</span>
              <span className="text-slate-300">•</span>
              <span>Instant WhatsApp OTP</span>
            </div>
          </div>
        </motion.div>
      </div>
    </main>

      {/* Footer */}
      <footer className="relative z-10 w-full text-center py-4 text-xs text-slate-400">
        © {new Date().getFullYear()} Zobra Prints. All rights reserved.
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center text-sm font-bold text-gray-500">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
