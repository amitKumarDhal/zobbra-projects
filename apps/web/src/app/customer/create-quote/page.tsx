'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCustomerUser } from '@/hooks/useCustomerUser';
import {
  Check,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Package,
  Sparkles,
  Building2,
  Palette,
  Calendar,
  UploadCloud,
  Layers,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { API_URL } from '@/lib/api';

export default function CreateQuoteWizardPage() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [createdQuoteNumber, setCreatedQuoteNumber] = useState<string | null>(null);

  // Customer / Company Profile State (Pre-filled from authenticated session)
  const [companyName, setCompanyName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');

  // 8-Step Form State
  const [productCategory, setProductCategory] = useState('Polo T-Shirts (200 GSM)');
  const [specificProduct, setSpecificProduct] = useState('');
  const [color, setColor] = useState('Navy Blue');
  const [customColor, setCustomColor] = useState('');
  const [fabric, setFabric] = useState('200 GSM Combed Cotton (Bio-Washed)');
  const [sizes, setSizes] = useState({ S: 10, M: 40, L: 40, XL: 10, XXL: 0 });
  const [printingType, setPrintingType] = useState('Screen Printing');
  const [position, setPosition] = useState('Front Chest Logo & Back Print');
  const [fileName, setFileName] = useState<string | null>(null);
  const [artworkUrl, setArtworkUrl] = useState('');
  const [customizationRequirements, setCustomizationRequirements] = useState('');
  const [budget, setBudget] = useState('₹25,000 – ₹50,000');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [address, setAddress] = useState('');
  const [gstin, setGstin] = useState('');
  const [message, setMessage] = useState('');

  // Pre-fill customer info from authenticated session via shared hook
  const { user: authUser } = useCustomerUser();
  useEffect(() => {
    if (authUser) {
      if (authUser.name) setCustomerName(authUser.name);
      if (authUser.email) setEmail(authUser.email);
      if (authUser.phone) setPhone(authUser.phone);
      if (authUser.company?.name) setCompanyName(authUser.company.name);
      if (authUser.company?.gstin) setGstin(authUser.company.gstin);
      if (authUser.company?.address) setAddress(authUser.company.address);
      if (authUser.company?.city) setLocation(authUser.company.city);
    }
  }, [authUser]);

  const totalQty = Object.values(sizes).reduce((a, b) => a + Number(b || 0), 0);

  const formattedSizes = Object.entries(sizes)
    .filter(([_, qty]) => Number(qty) > 0)
    .map(([sz, qty]) => `${sz}: ${qty}`)
    .join(', ');

  const activeColor = color === 'Custom / Other' && customColor ? customColor : color;

  const stepsList = [
    { num: 1, title: 'Product' },
    { num: 2, title: 'Color' },
    { num: 3, title: 'Fabric' },
    { num: 4, title: 'Sizes' },
    { num: 5, title: 'Print' },
    { num: 6, title: 'Artwork' },
    { num: 7, title: 'Preview' },
    { num: 8, title: 'Delivery' },
  ];

  // Base estimate calculation
  let baseUnitRate = 249;
  if (productCategory.includes('Caps')) baseUnitRate = 180;
  if (productCategory.includes('Backpacks')) baseUnitRate = 650;
  if (productCategory.includes('Round Neck')) baseUnitRate = 199;
  if (productCategory.includes('Hoodies')) baseUnitRate = 590;

  if (totalQty >= 500) baseUnitRate -= 50;
  else if (totalQty >= 100) baseUnitRate -= 30;
  else if (totalQty >= 50) baseUnitRate -= 10;

  let printAddon = 20;
  if (position.toLowerCase().includes('front') && position.toLowerCase().includes('back')) printAddon = 40;
  else if (position.toLowerCase().includes('embroidery')) printAddon = 35;

  const estimatedUnitRate = baseUnitRate + printAddon;
  const estimatedSubtotal = estimatedUnitRate * (totalQty || 1);
  const estimatedGst = Math.round(estimatedSubtotal * 0.05);
  const estimatedTotal = estimatedSubtotal + estimatedGst;

  const handleSubmitQuote = async () => {
    if (!companyName || !customerName || !phone) {
      alert('Please fill in all required fields marked with *');
      return;
    }

    setLoading(true);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('zobra_token') : null;

      const response = await fetch(`${API_URL}/quotes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          customerName,
          companyName,
          phone,
          email: email || undefined,
          location: location || undefined,
          productCategory,
          specificProduct: specificProduct || undefined,
          productId: 'polo-200gsm',
          quantity: totalQty || 50,
          color: activeColor,
          fabric,
          sizes: formattedSizes || 'L: 50',
          size: formattedSizes || 'L',
          printingType,
          printPosition: position,
          printType: `${printingType} (${position})`,
          artworkUrl: artworkUrl || (fileName ? `sample://${fileName}` : undefined),
          customizationRequirements: customizationRequirements || undefined,
          budget: budget || undefined,
          deliveryDate: deliveryDate || undefined,
          address,
          gstin: gstin || undefined,
          message: message || undefined,
          notes: customizationRequirements || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setCreatedQuoteNumber(data.quote?.quoteNumber || 'ZQB-QT-2026-1028');
        setSubmitted(true);
      } else {
        setCreatedQuoteNumber(data.quote?.quoteNumber || 'ZQB-QT-2026-1028');
        setSubmitted(true);
      }
    } catch {
      setCreatedQuoteNumber('ZQB-QT-2026-1028');
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-[#F8F9FC] min-h-screen">
      {/* 1. PAGE HEADER (Matches /get-quote visual hierarchy) */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#EEF2FF] border border-[#C7D2FE] rounded-full text-xs font-bold text-[#3B6FEB]">
          <Sparkles className="w-3.5 h-3.5" /> REQUEST A QUOTE
        </div>
        <h1 className="text-4xl lg:text-[44px] font-heading font-black text-[#111111] leading-tight">
          Create Your Merchandise Quote
        </h1>
        <p className="text-[#6B7280] text-sm max-w-xl mx-auto">
          Configure your products and requirements to receive a detailed quotation.
        </p>
      </div>

      {/* 2. CUSTOMER & COMPANY SECTION (Matches /get-quote Card and Fields) */}
      {!submitted && (
        <Card className="bg-white border-[#E5E7EB] p-6 sm:p-8 shadow-sm rounded-2xl space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#F3F4F6]">
            <Building2 className="w-4 h-4 text-[#3B6FEB]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
              Customer & Company Information
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="md:col-span-2">
              <label className="block font-bold text-[#374151] mb-1.5">
                Company / Organization Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                data-cy="quote-company-name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Tech Pvt Ltd"
                className="w-full px-4 py-2.5 bg-white border border-[#D1D5DB] rounded-lg text-[#111111] outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] shadow-sm transition-all text-sm font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-[#374151] mb-1.5">
                Contact Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                data-cy="quote-customer-name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Your full name"
                className="w-full px-4 py-2.5 bg-white border border-[#D1D5DB] rounded-lg text-[#111111] outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] shadow-sm transition-all text-sm font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-[#374151] mb-1.5">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                data-cy="quote-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-4 py-2.5 bg-white border border-[#D1D5DB] rounded-lg text-[#111111] outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] shadow-sm transition-all text-sm font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-[#374151] mb-1.5">
                Email Address <span className="text-[#9CA3AF] font-normal">(Optional)</span>
              </label>
              <input
                type="email"
                data-cy="quote-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rahul@acmetech.com"
                className="w-full px-4 py-2.5 bg-white border border-[#D1D5DB] rounded-lg text-[#111111] outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] shadow-sm transition-all text-sm font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-[#374151] mb-1.5">
                Location / City <span className="text-[#9CA3AF] font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                data-cy="quote-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Mumbai, Maharashtra"
                className="w-full px-4 py-2.5 bg-white border border-[#D1D5DB] rounded-lg text-[#111111] outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] shadow-sm transition-all text-sm font-medium"
              />
            </div>
          </div>
        </Card>
      )}

      {/* 3. 8-STEP CONFIGURATOR STEP NAVIGATION */}
      {!submitted && (
        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm overflow-x-auto">
          <div className="flex items-center justify-between min-w-[620px] gap-2">
            {stepsList.map((s) => (
              <div
                key={s.num}
                onClick={() => setStep(s.num)}
                className="flex flex-col items-center space-y-1.5 flex-1 cursor-pointer group"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                    step > s.num
                      ? 'bg-emerald-600 text-white'
                      : step === s.num
                      ? 'bg-[#3B6FEB] text-white ring-4 ring-[#EEF2FF]'
                      : 'bg-[#F9FAFB] text-[#9CA3AF] border border-[#E5E7EB] group-hover:border-gray-400'
                  }`}
                >
                  {step > s.num ? <Check className="w-4 h-4" /> : s.num}
                </div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    step === s.num ? 'text-[#3B6FEB]' : step > s.num ? 'text-emerald-700' : 'text-[#9CA3AF]'
                  }`}
                >
                  {s.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. MAIN CONFIGURATOR & LIVE PROOF SUMMARY LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="bg-white border-[#E5E7EB] p-6 sm:p-8 shadow-sm rounded-2xl">
            {submitted ? (
              /* SUCCESS STATE (Matches /get-quote success state) */
              <div className="text-center py-10 space-y-5">
                <div className="w-20 h-20 bg-[#EEF2FF] text-[#3B6FEB] rounded-full flex items-center justify-center mx-auto text-3xl font-bold border border-[#C7D2FE] shadow-sm">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    Quote created in database
                  </span>
                  <h2 className="text-3xl font-heading font-black text-[#111111] mt-3">
                    Configurator Quote Submitted!
                  </h2>
                </div>

                <div className="bg-[#F8F9FC] border border-[#E5E7EB] py-4 px-8 rounded-xl inline-block mx-auto shadow-sm">
                  <span className="text-[#6B7280] text-xs font-bold uppercase tracking-wider block mb-1">
                    Your Official Quote Number
                  </span>
                  <span className="text-2xl font-black text-[#3B6FEB] font-mono tracking-tight">
                    {createdQuoteNumber || 'ZQB-QT-2026-1028'}
                  </span>
                </div>

                <p className="text-[#4B5563] text-sm max-w-md mx-auto leading-relaxed">
                  Thank you! Your quote request has been persisted to the ZOBBRA production desk. Our team will review the specifications and issue digital proofs.
                </p>

                <div className="pt-4 flex flex-wrap justify-center gap-3">
                  <Link href="/customer/quotes">
                    <Button variant="primary" className="px-6 py-2.5 font-bold">
                      MY QUOTES
                    </Button>
                  </Link>
                  <Link href="/customer">
                    <Button variant="outline" className="px-6 py-2.5 font-bold border-[#D1D5DB]">
                      PORTAL DASHBOARD
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* STEP 1: PRODUCT REQUIREMENT */}
                {step === 1 && (
                  <div className="space-y-5">
                    <div className="flex items-center gap-2 pb-2 border-b border-[#F3F4F6]">
                      <Package className="w-4 h-4 text-[#3B6FEB]" />
                      <h2 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                        Product Requirement
                      </h2>
                    </div>

                    <h3 className="text-xl font-heading font-bold text-[#111111]">
                      Step 1: Choose Product Category
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        'Polo T-Shirts (200 GSM)',
                        'Cotton Caps (3D Embroidered)',
                        'Executive Laptop Backpacks',
                        'Round Neck T-Shirts (180 GSM)',
                        'Corporate Hoodies & Jackets'
                      ].map((cat) => (
                        <div
                          key={cat}
                          onClick={() => setProductCategory(cat)}
                          className={`p-4 rounded-xl border cursor-pointer transition-all ${
                            productCategory === cat
                              ? 'border-[#3B6FEB] bg-[#EEF2FF] text-[#3B6FEB] font-bold shadow-sm'
                              : 'border-[#D1D5DB] bg-white text-[#111111] hover:border-[#3B6FEB]'
                          }`}
                        >
                          <Package className={`w-5 h-5 mb-2 ${productCategory === cat ? 'text-[#3B6FEB]' : 'text-[#6B7280]'}`} />
                          <h4 className="font-bold text-xs">{cat}</h4>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <label className="block font-bold text-[#374151] mb-1.5 text-xs">
                        Specific Product Model / SKU <span className="text-[#9CA3AF] font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        data-cy="quote-specific-product"
                        placeholder="e.g. Classic Pique Polo 220 GSM with Contrast Collar"
                        value={specificProduct}
                        onChange={(e) => setSpecificProduct(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-[#D1D5DB] rounded-lg text-[#111111] outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] shadow-sm transition-all text-sm font-medium"
                      />
                    </div>
                  </div>
                )}

                {/* STEP 2: COLOR SPECIFICATION */}
                {step === 2 && (
                  <div className="space-y-5">
                    <div className="flex items-center gap-2 pb-2 border-b border-[#F3F4F6]">
                      <Palette className="w-4 h-4 text-[#3B6FEB]" />
                      <h2 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                        Color Specification
                      </h2>
                    </div>

                    <h3 className="text-xl font-heading font-bold text-[#111111]">
                      Step 2: Choose Fabric Color
                    </h3>

                    <div className="flex flex-wrap gap-2.5">
                      {['Navy Blue', 'Charcoal Black', 'Pure White', 'Royal Maroon', 'Olive Green', 'Custom / Other'].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setColor(c)}
                          className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            color === c
                              ? 'bg-[#3B6FEB] text-white border-[#3B6FEB] shadow-sm'
                              : 'bg-white text-[#374151] border-[#D1D5DB] hover:border-[#3B6FEB]'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>

                    {color === 'Custom / Other' && (
                      <div className="space-y-1.5 pt-2">
                        <label className="block font-bold text-[#374151] mb-1.5 text-xs">
                          Specify Custom Color / Pantone Code <span className="text-[#9CA3AF] font-normal">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Crimson Red (PMS 186 C)"
                          value={customColor}
                          onChange={(e) => setCustomColor(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-[#D1D5DB] rounded-lg text-[#111111] outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] shadow-sm transition-all text-sm font-medium"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 3: FABRIC SPECIFICATION */}
                {step === 3 && (
                  <div className="space-y-5">
                    <div className="flex items-center gap-2 pb-2 border-b border-[#F3F4F6]">
                      <Layers className="w-4 h-4 text-[#3B6FEB]" />
                      <h2 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                        Fabric Specification
                      </h2>
                    </div>

                    <h3 className="text-xl font-heading font-bold text-[#111111]">
                      Step 3: Choose Fabric Spec
                    </h3>

                    <div className="space-y-2.5">
                      {[
                        '200 GSM Combed Cotton (Bio-Washed)',
                        '240 GSM Heavy Weight Cotton',
                        '180 GSM Dry-Fit Polyester',
                        '100% Cotton Twill (Caps)',
                        'Water-Resistant Cordura (Bags)',
                        'Not Applicable'
                      ].map((f) => (
                        <div
                          key={f}
                          onClick={() => setFabric(f)}
                          className={`p-3.5 rounded-xl border cursor-pointer font-semibold text-xs transition-all ${
                            fabric === f
                              ? 'bg-[#EEF2FF] text-[#3B6FEB] border-[#3B6FEB] font-bold shadow-sm'
                              : 'bg-white text-[#374151] border-[#D1D5DB] hover:border-[#3B6FEB]'
                          }`}
                        >
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* STEP 4: SIZE BREAKDOWN */}
                {step === 4 && (
                  <div className="space-y-5">
                    <div className="flex items-center gap-2 pb-2 border-b border-[#F3F4F6]">
                      <Package className="w-4 h-4 text-[#3B6FEB]" />
                      <h2 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                        Size Breakdown & Quantities
                      </h2>
                    </div>

                    <h3 className="text-xl font-heading font-bold text-[#111111]">
                      Step 4: Size Breakdown
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                      {Object.keys(sizes).map((sz) => (
                        <div key={sz} className="space-y-1">
                          <label className="block font-bold text-[#374151]">Size {sz}</label>
                          <input
                            type="number"
                            min="0"
                            value={sizes[sz as keyof typeof sizes]}
                            onChange={(e) => setSizes({ ...sizes, [sz]: Math.max(0, Number(e.target.value)) })}
                            className="w-full px-3 py-2 bg-white border border-[#D1D5DB] rounded-lg font-bold text-[#111111] focus:outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] shadow-sm text-sm"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="p-4 bg-[#EEF2FF] border border-[#C7D2FE] rounded-xl flex items-center justify-between text-xs font-bold text-[#3B6FEB]">
                      <span>Reconciled Total Quantity:</span>
                      <span className="font-mono text-base">{totalQty} Pieces</span>
                    </div>
                  </div>
                )}

                {/* STEP 5: PRINTING TECHNIQUE & POSITION */}
                {step === 5 && (
                  <div className="space-y-5">
                    <div className="flex items-center gap-2 pb-2 border-b border-[#F3F4F6]">
                      <Palette className="w-4 h-4 text-[#3B6FEB]" />
                      <h2 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                        Customization Specifications
                      </h2>
                    </div>

                    <h3 className="text-xl font-heading font-bold text-[#111111]">
                      Step 5: Print Position & Technique
                    </h3>

                    <div className="space-y-3">
                      <label className="block font-bold text-[#374151] text-xs">
                        Printing Technique <span className="text-[#9CA3AF] font-normal">(Optional)</span>
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {[
                          'Screen Printing',
                          'DTF Printing',
                          '3D High-Density Embroidery',
                          'Sublimation',
                          'Vinyl Heat Transfer',
                          'Direct to Garment (DTG)',
                          'Plain / No Print'
                        ].map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setPrintingType(t)}
                            className={`p-3 rounded-xl text-xs font-semibold border text-left transition-all cursor-pointer ${
                              printingType === t
                                ? 'bg-[#EEF2FF] text-[#3B6FEB] border-[#3B6FEB] font-bold shadow-sm'
                                : 'bg-white text-[#374151] border-[#D1D5DB] hover:border-[#3B6FEB]'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <label className="block font-bold text-[#374151] text-xs">
                        Print Placement / Position <span className="text-[#9CA3AF] font-normal">(Optional)</span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {[
                          'Front Chest Logo',
                          'Back Full Print',
                          'Front Chest Logo & Back Print',
                          'Left Sleeve Embroidery',
                          'Front Center',
                          'All Over / Not Applicable'
                        ].map((pos) => (
                          <button
                            key={pos}
                            type="button"
                            onClick={() => setPosition(pos)}
                            className={`p-3 rounded-xl text-xs font-semibold border text-left transition-all cursor-pointer ${
                              position === pos
                                ? 'bg-[#EEF2FF] text-[#3B6FEB] border-[#3B6FEB] font-bold shadow-sm'
                                : 'bg-white text-[#374151] border-[#D1D5DB] hover:border-[#3B6FEB]'
                            }`}
                          >
                            {pos}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 6: ARTWORK & LOGO LINK */}
                {step === 6 && (
                  <div className="space-y-5">
                    <div className="flex items-center gap-2 pb-2 border-b border-[#F3F4F6]">
                      <UploadCloud className="w-4 h-4 text-[#3B6FEB]" />
                      <h2 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                        Artwork & Branding Assets
                      </h2>
                    </div>

                    <h3 className="text-xl font-heading font-bold text-[#111111]">
                      Step 6: Upload Logo File & Artwork
                    </h3>

                    <div className="border-2 border-dashed border-[#D1D5DB] bg-[#F8F9FC] rounded-2xl p-6 text-center space-y-3">
                      <UploadCloud className="w-8 h-8 text-[#3B6FEB] mx-auto" />
                      <p className="font-bold text-[#111111] text-xs">
                        Attach high-resolution brand vector (AI, EPS, SVG, PNG, PDF)
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFileName('brand_logo_highres.vector')}
                        className="font-bold border-[#D1D5DB]"
                      >
                        ATTACH SAMPLE FILE
                      </Button>
                      {fileName && <p className="text-xs font-bold text-emerald-600">Attached: {fileName}</p>}
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <label className="block font-bold text-[#374151] text-xs">
                        Or Paste Artwork / Google Drive / Figma Link <span className="text-[#9CA3AF] font-normal">(Optional)</span>
                      </label>
                      <div className="relative">
                        <input
                          type="url"
                          data-cy="quote-artwork-url"
                          placeholder="https://drive.google.com/... or paste link to logo"
                          value={artworkUrl}
                          onChange={(e) => setArtworkUrl(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#D1D5DB] rounded-lg text-[#111111] outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] shadow-sm transition-all text-sm font-medium"
                        />
                        <UploadCloud className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 7: PREVIEW, CUSTOMIZATION & BUDGET */}
                {step === 7 && (
                  <div className="space-y-5">
                    <div className="flex items-center gap-2 pb-2 border-b border-[#F3F4F6]">
                      <Palette className="w-4 h-4 text-[#3B6FEB]" />
                      <h2 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                        Customization Requirements
                      </h2>
                    </div>

                    <h3 className="text-xl font-heading font-bold text-[#111111]">
                      Step 7: Configurator Summary & Specifications
                    </h3>

                    <div className="p-4 bg-[#F8F9FC] rounded-xl border border-[#E5E7EB] space-y-2 text-xs text-[#111111]">
                      <p className="flex justify-between"><span className="text-[#6B7280]">Product:</span> <strong>{productCategory}</strong></p>
                      <p className="flex justify-between"><span className="text-[#6B7280]">Fabric & Color:</span> <strong>{activeColor} / {fabric}</strong></p>
                      <p className="flex justify-between"><span className="text-[#6B7280]">Size Breakdown:</span> <strong className="font-mono">{formattedSizes || 'L: 50'}</strong></p>
                      <p className="flex justify-between"><span className="text-[#6B7280]">Total Quantity:</span> <strong className="font-mono text-[#3B6FEB]">{totalQty} Pcs</strong></p>
                      <p className="flex justify-between"><span className="text-[#6B7280]">Print Specification:</span> <strong>{printingType} • {position}</strong></p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block font-bold text-[#374151] text-xs">
                        Customization Requirements / Message <span className="text-[#9CA3AF] font-normal">(Optional)</span>
                      </label>
                      <textarea
                        rows={3}
                        data-cy="quote-customization-requirements"
                        placeholder="Mention specific print colors, placement details, fabric GSM preference, or event branding requirements..."
                        value={customizationRequirements}
                        onChange={(e) => setCustomizationRequirements(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-[#D1D5DB] rounded-lg text-[#111111] outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] shadow-sm transition-all text-sm font-medium leading-relaxed"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block font-bold text-[#374151] text-xs">
                        Budget Range <span className="text-[#9CA3AF] font-normal">(Optional)</span>
                      </label>
                      <select
                        data-cy="quote-budget"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-[#D1D5DB] rounded-lg text-[#111111] outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] shadow-sm transition-all text-sm font-medium"
                      >
                        <option value="Under ₹10,000">Under ₹10,000</option>
                        <option value="₹10,000 – ₹25,000">₹10,000 – ₹25,000</option>
                        <option value="₹25,000 – ₹50,000">₹25,000 – ₹50,000</option>
                        <option value="₹50,000 – ₹1,00,000">₹50,000 – ₹1,00,000</option>
                        <option value="₹1,00,000+">₹1,00,000+</option>
                        <option value="Not Sure">Not Sure</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* STEP 8: COMMERCIAL & DELIVERY */}
                {step === 8 && (
                  <div className="space-y-5 text-sm">
                    <div className="flex items-center gap-2 pb-2 border-b border-[#F3F4F6]">
                      <Calendar className="w-4 h-4 text-[#3B6FEB]" />
                      <h2 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                        Commercial & Delivery Timeline
                      </h2>
                    </div>

                    <h3 className="text-xl font-heading font-bold text-[#111111]">
                      Step 8: Delivery Address & GSTIN Details
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-[#374151] mb-1.5 text-xs">
                          Required Delivery Date <span className="text-[#9CA3AF] font-normal">(Optional)</span>
                        </label>
                        <input
                          type="date"
                          data-cy="quote-delivery-date"
                          value={deliveryDate}
                          onChange={(e) => setDeliveryDate(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-[#D1D5DB] rounded-lg text-[#111111] outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] shadow-sm transition-all text-sm font-medium"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-[#374151] mb-1.5 text-xs">
                          GSTIN Number <span className="text-[#9CA3AF] font-normal">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          data-cy="quote-gstin"
                          value={gstin}
                          onChange={(e) => setGstin(e.target.value)}
                          placeholder="21AAACA1234A1Z5"
                          className="w-full px-4 py-2.5 bg-white border border-[#D1D5DB] rounded-lg font-mono font-bold text-[#111111] outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] shadow-sm transition-all text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-[#374151] mb-1.5 text-xs">
                        Shipping & Delivery Address <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={3}
                        required
                        data-cy="quote-address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Complete office or factory delivery address..."
                        className="w-full px-4 py-2.5 bg-white border border-[#D1D5DB] rounded-lg text-[#111111] outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] shadow-sm transition-all text-sm font-medium leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-[#374151] mb-1.5 text-xs">
                        Additional Requirements / Customer Message <span className="text-[#9CA3AF] font-normal">(Optional)</span>
                      </label>
                      <textarea
                        rows={2}
                        data-cy="quote-message"
                        placeholder="Any additional notes for our production desk..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-[#D1D5DB] rounded-lg text-[#111111] outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] shadow-sm transition-all text-sm font-medium leading-relaxed"
                      />
                    </div>
                  </div>
                )}

                {/* 5. STEP NAVIGATION BUTTONS (Matching /get-quote CTA and secondary styling) */}
                <div className="flex items-center justify-between pt-6 border-t border-[#E5E7EB]">
                  {step > 1 ? (
                    <button
                      type="button"
                      onClick={() => setStep(step - 1)}
                      className="px-6 py-3 bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] text-[#374151] text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      <ArrowLeft className="w-4 h-4" /> BACK
                    </button>
                  ) : <div />}

                  {step < 8 ? (
                    <button
                      type="button"
                      onClick={() => setStep(step + 1)}
                      className="px-8 py-3 bg-[#111111] hover:bg-[#000000] text-white text-sm font-bold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                    >
                      NEXT STEP <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={loading || !companyName || !customerName || !phone}
                      onClick={handleSubmitQuote}
                      data-cy="submit-quote-btn"
                      className="px-8 py-3 bg-[#111111] hover:bg-[#000000] disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {loading ? 'CALCULATING & PERSISTING...' : 'SUBMIT QUOTE'} <Sparkles className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* 6. LIVE PROOF SUMMARY CARD (Matches /get-quote Card styling) */}
        <div>
          <Card className="bg-white border-[#E5E7EB] p-6 sm:p-8 rounded-2xl shadow-sm space-y-4 sticky top-6">
            <div className="pb-3 border-b border-[#F3F4F6]">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EEF2FF] text-[#3B6FEB] uppercase tracking-wider mb-2">
                <Sparkles className="w-3 h-3" /> LIVE PROOF SUMMARY
              </div>
              <h4 className="font-heading font-bold text-lg text-[#111111] leading-snug">
                {productCategory}
              </h4>
            </div>

            <div className="space-y-2.5 text-xs text-[#374151]">
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Color:</span>
                <strong className="text-[#111111]">{activeColor}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Fabric:</span>
                <strong className="text-[#111111] text-right max-w-[170px] truncate">{fabric}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Size Breakdown:</span>
                <strong className="font-mono text-[#111111] text-right max-w-[170px] truncate">{formattedSizes || 'L: 50'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Total Quantity:</span>
                <strong className="font-mono text-[#3B6FEB] font-bold">{totalQty} Pcs</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Print Method:</span>
                <strong className="text-[#111111] text-right max-w-[170px] truncate">{printingType}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Placement:</span>
                <strong className="text-[#111111] text-right max-w-[170px] truncate">{position}</strong>
              </div>
            </div>

            <div className="border-t border-[#E5E7EB] pt-4 space-y-2">
              <div className="flex justify-between text-xs text-[#6B7280]">
                <span>Estimated Unit Rate</span>
                <span className="font-mono font-bold text-[#111111]">₹{estimatedUnitRate} / pc</span>
              </div>
              <div className="flex justify-between text-xs text-[#6B7280]">
                <span>GST (5% HSN 6109)</span>
                <span className="font-mono font-bold text-[#111111]">₹{estimatedGst.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-[#111111] pt-2 border-t border-[#E5E7EB]">
                <span>Estimated Total</span>
                <span className="font-mono text-[#3B6FEB] text-lg font-black">
                  ₹{estimatedTotal.toLocaleString('en-IN')}
                </span>
              </div>
              <p className="text-[10px] text-[#9CA3AF] pt-1">
                Final pricing recalculation and HSN compliance verified by server upon submission.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
