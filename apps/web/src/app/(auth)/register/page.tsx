'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, Mail, AlertCircle, Eye, EyeOff, ShieldCheck, User, Building, Phone, MapPin, Map } from 'lucide-react';
import { API_URL } from '@/lib/api';
import { ZobbraLogo } from '@/components/shared/ZobbraLogo';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    gstin: '',
    city: '',
    state: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validatePassword = () => {
    if (formData.password.length < 6) return 'Password must be at least 6 characters long.';
    if (formData.password !== formData.confirmPassword) return 'Passwords do not match.';
    return null;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!agreed) {
      setError('You must agree to the Terms & Conditions and Privacy Policy.');
      return;
    }

    const passError = validatePassword();
    if (passError) {
      setError(passError);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          companyName: formData.companyName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          gstin: formData.gstin,
          city: formData.city,
          state: formData.state
        }),
      });
      
      const data = await res.json();

      if (res.ok && data.success && data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('zobra_token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('zobra_user', JSON.stringify(data.user));

        router.push('/customer');
      } else {
        setError(data.message || 'Registration failed. Please check your inputs.');
      }
    } catch (err: any) {
      console.error('Registration API error:', err);
      setError('Unable to connect to Zobra. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white text-[#050505] font-sans">
      {/* Left Zobra Brand Panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 bg-[#050505] overflow-hidden sticky top-0 h-screen">
        {/* Subtle decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-[#3B6FEB]/10 blur-[120px]"></div>
          <div className="absolute bottom-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-[#3B6FEB]/5 blur-[100px]"></div>
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay"></div>
        </div>

        <div className="relative z-10">
          <ZobbraLogo variant="white" href="/" width={160} height={53} priority={true} />
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
        className="flex flex-col p-4 sm:p-8 lg:p-16 bg-white overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6 sm:mb-12">
          <Link href="/login" className="inline-flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#050505] font-bold transition-colors min-h-[44px]">
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </Link>
          <div className="lg:hidden">
            <ZobbraLogo variant="dark-text" href="/" />
          </div>
        </div>

        <div className="max-w-[500px] w-full mx-auto space-y-6 sm:space-y-8 pb-12">
          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tight text-[#050505] font-heading">Create your Zobra account</h2>
            <p className="text-[#6B7280] font-medium">Set up your company profile and start requesting quotes.</p>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm font-medium flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          <form className="space-y-6" onSubmit={handleRegister}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-[#050505]">Full Name *</label>
                <div className="relative group">
                  <User className="w-5 h-5 text-[#9CA3AF] absolute left-3.5 top-3.5 group-focus-within:text-[#3B6FEB] transition-colors" />
                  <input
                    type="text"
                    name="name"
                    required
                    data-cy="register-name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="w-full pl-11 pr-4 py-3 bg-white border border-[#E5E7EB] rounded-xl text-[15px] text-[#050505] focus:outline-none focus:border-[#3B6FEB] focus:ring-4 focus:ring-[#3B6FEB]/10 transition-all placeholder:text-[#9CA3AF]"
                  />
                </div>
              </div>

              {/* Company Name */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-[#050505]">Business / Company Name *</label>
                <div className="relative group">
                  <Building className="w-5 h-5 text-[#9CA3AF] absolute left-3.5 top-3.5 group-focus-within:text-[#3B6FEB] transition-colors" />
                  <input
                    type="text"
                    name="companyName"
                    required
                    data-cy="register-company"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="Acme Corp"
                    className="w-full pl-11 pr-4 py-3 bg-white border border-[#E5E7EB] rounded-xl text-[15px] text-[#050505] focus:outline-none focus:border-[#3B6FEB] focus:ring-4 focus:ring-[#3B6FEB]/10 transition-all placeholder:text-[#9CA3AF]"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Work Email */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-[#050505]">Work Email *</label>
                <div className="relative group">
                  <Mail className="w-5 h-5 text-[#9CA3AF] absolute left-3.5 top-3.5 group-focus-within:text-[#3B6FEB] transition-colors" />
                  <input
                    type="email"
                    name="email"
                    required
                    data-cy="register-email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@company.com"
                    className="w-full pl-11 pr-4 py-3 bg-white border border-[#E5E7EB] rounded-xl text-[15px] text-[#050505] focus:outline-none focus:border-[#3B6FEB] focus:ring-4 focus:ring-[#3B6FEB]/10 transition-all placeholder:text-[#9CA3AF]"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-[#050505]">Phone / WhatsApp *</label>
                <div className="relative group">
                  <Phone className="w-5 h-5 text-[#9CA3AF] absolute left-3.5 top-3.5 group-focus-within:text-[#3B6FEB] transition-colors" />
                  <input
                    type="tel"
                    name="phone"
                    required
                    data-cy="register-phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className="w-full pl-11 pr-4 py-3 bg-white border border-[#E5E7EB] rounded-xl text-[15px] text-[#050505] focus:outline-none focus:border-[#3B6FEB] focus:ring-4 focus:ring-[#3B6FEB]/10 transition-all placeholder:text-[#9CA3AF]"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-[#050505]">Password *</label>
                <div className="relative group">
                  <Lock className="w-5 h-5 text-[#9CA3AF] absolute left-3.5 top-3.5 group-focus-within:text-[#3B6FEB] transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    data-cy="register-password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-12 py-3 bg-white border border-[#E5E7EB] rounded-xl text-[15px] text-[#050505] focus:outline-none focus:border-[#3B6FEB] focus:ring-4 focus:ring-[#3B6FEB]/10 transition-all placeholder:text-[#9CA3AF]"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-[#9CA3AF] hover:text-[#050505] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {formData.password && (
                  <p className={`text-xs font-medium mt-1 ${formData.password.length >= 6 ? 'text-green-600' : 'text-red-500'}`}>
                    {formData.password.length >= 6 ? '✓ 6+ characters' : '✕ Minimum 6 characters'}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-[#050505]">Confirm Password *</label>
                <div className="relative group">
                  <Lock className="w-5 h-5 text-[#9CA3AF] absolute left-3.5 top-3.5 group-focus-within:text-[#3B6FEB] transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="confirmPassword"
                    required
                    data-cy="register-confirm-password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-12 py-3 bg-white border border-[#E5E7EB] rounded-xl text-[15px] text-[#050505] focus:outline-none focus:border-[#3B6FEB] focus:ring-4 focus:ring-[#3B6FEB]/10 transition-all placeholder:text-[#9CA3AF]"
                  />
                </div>
              </div>
            </div>

            <div className="h-px w-full bg-[#E5E7EB] my-2"></div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-[#050505]">GSTIN (Optional)</label>
                <div className="relative group">
                  <Building className="w-5 h-5 text-[#9CA3AF] absolute left-3.5 top-3.5 group-focus-within:text-[#3B6FEB] transition-colors" />
                  <input
                    type="text"
                    name="gstin"
                    data-cy="register-gstin"
                    value={formData.gstin}
                    onChange={handleChange}
                    placeholder="22AAAAA0000A1Z5"
                    className="w-full pl-11 pr-4 py-3 bg-white border border-[#E5E7EB] rounded-xl text-[15px] text-[#050505] uppercase focus:outline-none focus:border-[#3B6FEB] focus:ring-4 focus:ring-[#3B6FEB]/10 transition-all placeholder:text-[#9CA3AF] placeholder:normal-case"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-[#050505]">City *</label>
                  <div className="relative group">
                    <MapPin className="w-5 h-5 text-[#9CA3AF] absolute left-3.5 top-3.5 group-focus-within:text-[#3B6FEB] transition-colors" />
                    <input
                      type="text"
                      name="city"
                      required
                      data-cy="register-city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="Mumbai"
                      className="w-full pl-11 pr-4 py-3 bg-white border border-[#E5E7EB] rounded-xl text-[15px] text-[#050505] focus:outline-none focus:border-[#3B6FEB] focus:ring-4 focus:ring-[#3B6FEB]/10 transition-all placeholder:text-[#9CA3AF]"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-[#050505]">State *</label>
                  <div className="relative group">
                    <Map className="w-5 h-5 text-[#9CA3AF] absolute left-3.5 top-3.5 group-focus-within:text-[#3B6FEB] transition-colors" />
                    <input
                      type="text"
                      name="state"
                      required
                      data-cy="register-state"
                      value={formData.state}
                      onChange={handleChange}
                      placeholder="Maharashtra"
                      className="w-full pl-11 pr-4 py-3 bg-white border border-[#E5E7EB] rounded-xl text-[15px] text-[#050505] focus:outline-none focus:border-[#3B6FEB] focus:ring-4 focus:ring-[#3B6FEB]/10 transition-all placeholder:text-[#9CA3AF]"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center mt-0.5">
                  <input 
                    type="checkbox" 
                    data-cy="register-terms-checkbox"
                    className="peer sr-only" 
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                  />
                  <div className="w-5 h-5 border border-[#E5E7EB] rounded bg-white peer-checked:bg-[#050505] peer-checked:border-[#050505] transition-colors"></div>
                  <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 17 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 5.5L6 10.5L16 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <span className="text-sm font-medium text-[#6B7280] group-hover:text-[#050505] transition-colors">
                  I agree to the <a href="/terms" className="text-[#050505] hover:underline font-bold">Terms &amp; Conditions</a> and <a href="/privacy" className="text-[#050505] hover:underline font-bold">Privacy Policy</a>
                </span>
              </label>
            </div>

            <button
              type="button"
              data-cy="register-submit-button"
              disabled={loading}
              onClick={handleRegister}
              className="w-full py-3.5 mt-4 bg-[#050505] hover:bg-[#222222] text-white rounded-xl text-[15px] font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100 uppercase tracking-wider"
            >
              {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
            </button>
            
          </form>
        </div>

        <div className="text-center text-xs font-medium text-[#9CA3AF] mt-auto">
          © {new Date().getFullYear()} Zobra Prints. All rights reserved.
        </div>
      </motion.div>
    </div>
  );
}
