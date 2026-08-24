'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(true);
      } else {
        setError(data.message || 'Failed to request password reset.');
      }
    } catch (err: any) {
      console.error('Reset API error:', err);
      setError('Unable to connect to Zobra. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
          <Link href="/login" className="inline-flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#050505] font-bold transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </Link>
          <div className="lg:hidden flex items-center gap-2">
            <div className="w-6 h-6 bg-[#050505] text-white font-serif font-black text-sm flex items-center justify-center">
              Z
            </div>
            <span className="text-sm font-serif font-black tracking-tight text-[#050505]">ZOBBRA</span>
          </div>
        </div>

        <div className="max-w-[420px] w-full mx-auto space-y-8 py-12">
          {success ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-3xl font-black tracking-tight text-[#050505] font-heading">Check your email</h2>
              <p className="text-[#6B7280] font-medium">
                We've sent password reset instructions to <br/>
                <span className="text-[#050505] font-bold">{email}</span>
              </p>
              
              <Link href="/login" className="inline-flex items-center justify-center w-full py-3.5 mt-8 bg-[#3B6FEB] hover:bg-[#2563EB] text-white rounded-xl text-[15px] font-bold shadow-[0_4px_14px_rgba(59,111,235,0.3)] hover:shadow-[0_6px_20px_rgba(59,111,235,0.4)] transition-all active:scale-[0.98]">
                RETURN TO LOGIN
              </Link>
            </motion.div>
          ) : (
            <>
              <div className="space-y-2">
                <h2 className="text-3xl font-black tracking-tight text-[#050505] font-heading">Reset Password</h2>
                <p className="text-[#6B7280] font-medium">Enter your email and we'll send you instructions to reset your password.</p>
              </div>

              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm font-medium flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              <form className="space-y-5" onSubmit={handleReset}>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-[#050505]">Email Address</label>
                  <div className="relative group">
                    <Mail className="w-5 h-5 text-[#9CA3AF] absolute left-3.5 top-3.5 group-focus-within:text-[#3B6FEB] transition-colors" />
                    <input
                      type="email"
                      data-cy="forgot-email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full pl-11 pr-4 py-3 bg-white border border-[#E5E7EB] rounded-xl text-[15px] text-[#050505] focus:outline-none focus:border-[#3B6FEB] focus:ring-4 focus:ring-[#3B6FEB]/10 transition-all placeholder:text-[#9CA3AF]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  data-cy="forgot-submit-button"
                  disabled={loading}
                  className="w-full py-3.5 mt-4 bg-[#3B6FEB] hover:bg-[#2563EB] text-white rounded-xl text-[15px] font-bold shadow-[0_4px_14px_rgba(59,111,235,0.3)] hover:shadow-[0_6px_20px_rgba(59,111,235,0.4)] transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100"
                >
                  {loading ? 'SENDING LINK...' : 'SEND RESET LINK'}
                </button>
              </form>
            </>
          )}
        </div>

        <div className="text-center text-xs font-medium text-[#9CA3AF]">
          © {new Date().getFullYear()} Zobra Prints. All rights reserved.
        </div>
      </motion.div>
    </div>
  );
}
