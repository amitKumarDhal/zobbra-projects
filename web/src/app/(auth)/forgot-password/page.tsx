'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-slate-900">Forgot Password?</h2>
          <p className="text-slate-500 text-xs">Enter your email address to reset password</p>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <p className="text-emerald-600 font-bold text-sm">Reset link sent! Please check your email inbox.</p>
            <Link href="/login">
              <Button variant="primary" className="w-full">Return to Login</Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address</label>
              <input type="email" required placeholder="admin@zobbra.com" className="w-full px-3 py-2 border rounded-xl text-sm" />
            </div>
            <Button type="submit" variant="secondary" className="w-full py-3 font-bold">
              SEND RESET LINK
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
