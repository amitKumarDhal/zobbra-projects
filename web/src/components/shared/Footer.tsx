import React from 'react';
import Link from 'next/link';
import { Phone, Mail, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-black text-slate-300 pt-16 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-5 gap-10">
        {/* Brand info */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white text-black font-black text-lg flex items-center justify-center rounded-lg">
              Z
            </div>
            <span className="text-xl font-black text-white tracking-tight">
              ZOBRA <span className="text-blue-500">PRINTS</span>
            </span>
          </div>
          <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
            Premium custom merchandise printing company in Bhubaneswar, Odisha. We help businesses, schools, colleges, and events bring their brand to life.
          </p>
          <div className="pt-2 text-xs text-slate-500 space-y-1">
            <p className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-500" /> Bhubaneswar, Odisha - 751012
            </p>
            <p className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-blue-500" /> +91 91244 96665
            </p>
            <p className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-500" /> hello@zobbra.com
            </p>
          </div>
        </div>

        {/* Products Column */}
        <div>
          <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">Products</h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link href="/products" className="hover:text-white transition-colors">Polo T-Shirts</Link></li>
            <li><Link href="/products" className="hover:text-white transition-colors">Round Neck T-Shirts</Link></li>
            <li><Link href="/products" className="hover:text-white transition-colors">Hoodies & Jackets</Link></li>
            <li><Link href="/products" className="hover:text-white transition-colors">Caps & Snapbacks</Link></li>
            <li><Link href="/products" className="hover:text-white transition-colors">Executive Laptop Bags</Link></li>
            <li><Link href="/products" className="hover:text-white transition-colors">Mugs & Bottles</Link></li>
          </ul>
        </div>

        {/* Printing Services Column */}
        <div>
          <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">Printing Services</h4>
          <ul className="space-y-2.5 text-sm">
            <li className="hover:text-white">DTF Printing</li>
            <li className="hover:text-white">3D Embroidery</li>
            <li className="hover:text-white">Sublimation Printing</li>
            <li className="hover:text-white">Screen Printing</li>
            <li className="hover:text-white">Vinyl & Transfer</li>
          </ul>
        </div>

        {/* Company & Legal Column */}
        <div>
          <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">Company</h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link href="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link></li>
            <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
            <li><Link href="/login" className="hover:text-white transition-colors">Admin Login</Link></li>
            <li><Link href="/portal" className="hover:text-white transition-colors">Customer Portal</Link></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-slate-800 text-center text-xs text-slate-500">
        © 2026 ZOBBRA Prints & Merchandise Management SaaS. All Rights Reserved. Built for Indian Printing & Corporate Gifting Industry.
      </div>
    </footer>
  );
};
