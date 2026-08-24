'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Phone, Mail, MapPin, ShoppingBag, Menu, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

export const Navbar: React.FC = () => {
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      {/* Top Info Bar */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 hidden md:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-blue-400" /> Bhubaneswar, Odisha
            </span>
            <span>Free Delivery Across Odisha</span>
            <span>PAN India Shipping</span>
          </div>
          <div className="flex items-center space-x-6">
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-blue-400" /> +91 91244 96665
            </span>
            <span className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-blue-400" /> hello@zobbra.com
            </span>
            <Link href="/login" className="text-white hover:underline font-medium">
              Client Portal Login
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black text-white font-black text-xl flex items-center justify-center rounded-lg shadow-md">
            Z
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-slate-900 block leading-tight">
              ZOBRA <span className="text-blue-600">PRINTS</span>
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">
              WEAR YOUR BRAND
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-slate-700">
          <Link href="/" className="hover:text-blue-600 transition-colors">
            Home
          </Link>
          <Link href="/products" className="hover:text-blue-600 transition-colors">
            Products
          </Link>
          <Link href="/#process" className="hover:text-blue-600 transition-colors">
            How It Works
          </Link>

          <Link href="/terms" className="hover:text-blue-600 transition-colors">
            Terms & Conditions
          </Link>
          <Link href="/contact" className="hover:text-blue-600 transition-colors">
            Contact
          </Link>
        </nav>

        {/* Action Button */}
        <div className="hidden md:flex items-center gap-4">
          <Button variant="secondary" size="md" onClick={() => setIsQuoteModalOpen(true)}>
            GET A FREE QUOTE
          </Button>
        </div>

        {/* Mobile Hamburger */}
        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-slate-700 hover:text-black"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-6 space-y-3">
          <Link href="/" className="block py-2 text-slate-700 font-semibold">Home</Link>
          <Link href="/products" className="block py-2 text-slate-700 font-semibold">Products</Link>
          <Link href="/terms" className="block py-2 text-slate-700 font-semibold">Terms & Conditions</Link>
          <Link href="/contact" className="block py-2 text-slate-700 font-semibold">Contact</Link>
          <Link href="/login" className="block py-2 text-blue-600 font-semibold">Client Login</Link>
          <Button variant="secondary" className="w-full mt-2" onClick={() => setIsQuoteModalOpen(true)}>
            GET A FREE QUOTE
          </Button>
        </div>
      )}

      {/* Instant Free Quote Modal */}
      <Modal
        isOpen={isQuoteModalOpen}
        onClose={() => {
          setIsQuoteModalOpen(false);
          setSubmitted(false);
        }}
        title={submitted ? 'Request Submitted' : 'Request Instant Quotation'}
      >
        {submitted ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
              ✓
            </div>
            <h4 className="text-2xl font-bold text-slate-900">Thank You! 🎉</h4>
            <p className="text-slate-600 text-sm max-w-md mx-auto">
              Your merchandise enquiry has been received. Our sales team will get back to you within 24 hours with a custom quote & digital mockup.
            </p>
            <Button
              variant="primary"
              onClick={() => {
                setIsQuoteModalOpen(false);
                setSubmitted(false);
              }}
            >
              Back to Browsing
            </Button>
          </div>
        ) : (
          <form onSubmit={handleQuoteSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Company / Org Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Acme Tech Pvt Ltd"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Contact Name</label>
                <input
                  type="text"
                  required
                  placeholder="Rahul Mishra"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Product Category</label>
                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm">
                  <option>Polo T-Shirts</option>
                  <option>Hoodies & Sweatshirts</option>
                  <option>Caps & Headwear</option>
                  <option>Executive Backpacks</option>
                  <option>Mugs & Thermal Bottles</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Estimated Quantity</label>
                <input
                  type="number"
                  min="20"
                  defaultValue="100"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Branding Details / Requirements</label>
              <textarea
                rows={3}
                placeholder="Mention print placement (Front/Back/Embroidery), deadline, or specific requirements..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              ></textarea>
            </div>
            <Button type="submit" variant="secondary" className="w-full py-3 font-bold">
              SUBMIT QUOTE REQUEST
            </Button>
          </form>
        )}
      </Modal>
    </header>
  );
};
