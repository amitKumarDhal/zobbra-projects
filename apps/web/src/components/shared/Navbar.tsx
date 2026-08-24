'use client';

import React from 'react';
import Link from 'next/link';

export const Navbar: React.FC = () => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 h-16 px-6 flex items-center justify-between text-white">
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Backend API Connected
        </span>
      </div>

      <div className="flex items-center gap-4 text-xs">
        <Link href="/" className="text-slate-400 hover:text-white font-semibold">
          Landing Page
        </Link>
        <Link href="/dashboard" className="text-blue-400 font-bold hover:underline">
          Dashboard
        </Link>
      </div>
    </header>
  );
};
