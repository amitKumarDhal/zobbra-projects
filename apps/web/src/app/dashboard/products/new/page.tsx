'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Sparkles, 
  UploadCloud, 
  X, 
  Trash2, 
  Check, 
  AlertCircle,
  HelpCircle,
  Package,
  Layers,
  IndianRupee,
  Sliders
} from 'lucide-react';
import { API_URL } from '@/lib/api';
import { uploadToCloudinary } from '@/lib/upload';

const CAP_DESCRIPTION_TEMPLATE = `Premium 6-panel structured baseball cap crafted from 100% heavy brushed cotton twill.

### Key Features & Specifications:
- **Fabric**: 100% Heavy Brushed Compact Cotton Twill for enhanced durability and superior crown shape retention.
- **Structure**: 6-Panel structured design with fused hard buckram interior support preventing collapse.
- **Visor**: Pre-curved visor with 6 rows of contrast/tonal edge stitching.
- **Ventilation**: 6 sewn embroidered eyelets (one per panel) ensuring breathability in all seasons.
- **Sweatband**: Cotton twill interior moisture-wicking sweatband for all-day comfort.
- **Closure**: Adjustable brass metal slide buckle with hidden grommet tuck-in (Free Size / Fits 54cm–60cm circumference).
- **Branding Methods**: Engineered specifically for 3D Puff Embroidery, Flat Embroidery, Woven Badges, and HD DTF Transfer.
- **MOQ**: 20 Pieces. Ideal for corporate merchandise, trade shows, delivery teams, and promotional events.`;

const POLO_DESCRIPTION_TEMPLATE = `Elevate your corporate identity with our Premium Custom Corporate Pique Polo T-Shirt. 

### Key Features & Specifications:
- **Fabric**: 220–240 GSM heavy-duty 100% Combed Compact Cotton Pique knit fabric. Bio-washed and silicon-softened for a smooth, lint-free surface.
- **Tailoring**: Structured 3-button placket with color-matched pearlized buttons. Reinforced collar with fused interlining and ribbed sleeve cuffs.
- **Custom Branding Ready**: Precision customization on Left Chest, Right Chest, Both Sleeves, and Full Back.
- **Print Methods**: High-Definition Embroidery, Screen Printing, and HD Digital DTF transfers.
- **MOQ**: 20 Pieces. Individually polybagged.`;

const BAG_DESCRIPTION_TEMPLATE = `Executive 28L corporate laptop backpack engineered with high-density water-resistant ballistic polyester, dual reinforced compartments, and a dedicated 15.6" padded laptop sleeve.

### Key Features & Specifications:
- **Material**: 900D Heavy-Duty Water-Repellent Ballistic Polyester with scratch-resistant coating.
- **Laptop Protection**: Dedicated shock-absorbing padded sleeve accommodates up to 15.6-inch laptops and tablets.
- **Capacity & Compartments**: 28-Litre capacity featuring 2 large zippered main compartments, 1 quick-access front zippered organizer, and 1 side elastic mesh water bottle holder.
- **Ergonomics**: Contoured multi-panel airflow back padding with breathable mesh and adjustable padded shoulder straps for maximum lumbar support.
- **Hardware & Finish**: Heavy-duty dual metal zippers with corded pullers, reinforced top padded grab handle, and subtle cyan-blue contrast piping.
- **Branding Methods**: Tailored for High-Density Embroidery, Rubberized 3D Badges, Silk Screen Printing, and HD DTF Transfer on the front corporate branding zone (12cm × 8cm).
- **MOQ**: 20 Pieces. Ideal for new hire welcome kits, corporate gifting, tech conferences, and executive teams.`;

const MUG_DESCRIPTION_TEMPLATE = `Premium 330ml (11oz) matte-finish ceramic coffee mug engineered for corporate gifting, welcome kits, and daily office use.

### Key Features & Specifications:
- **Material**: Premium Grade-A Ceramic Stoneware with chip-resistant rim and durable glaze.
- **Capacity**: 330 ml / 11 oz. Ergonomic C-shaped comfort handle.
- **Finish**: Modern ultra-smooth matte exterior with food-grade non-porous interior.
- **Safety Standards**: 100% Lead-Free, Cadmium-Free, Microwave Safe & Dishwasher Safe.
- **Branding Methods**: High-precision Screen Printing, UV DTF Wrap, Sublimation Printing, and Metallic Gold/Silver Foil stamping on dual-sided branding areas (7cm × 7cm per side or full wrap 20cm × 8cm).
- **Packaging**: Individually packed in protective thermocol bubble-wrap and corrugated Kraft gift box.
- **MOQ**: 25 Pieces. Ideal for employee onboarding kits, client appreciation, executive desk accessories, and corporate events.`;

export default function AddProductPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);

  // Form State
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [basePrice, setBasePrice] = useState<number>(149);
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);

  // Variants & Pricing
  const [variants, setVariants] = useState<any[]>([
    { color: 'Charcoal Black', size: 'Free Size', sku: 'CAP-BLK-FS', stock: 500 },
    { color: 'Navy Blue', size: 'Free Size', sku: 'CAP-NVY-FS', stock: 350 },
    { color: 'Classic White', size: 'Free Size', sku: 'CAP-WHT-FS', stock: 250 },
  ]);
  const [bulkPricing, setBulkPricing] = useState<any[]>([
    { minQuantity: 20, maxQuantity: 49, pricePerUnit: 149, printType: 'Front 3D Embroidery' },
    { minQuantity: 50, maxQuantity: 99, pricePerUnit: 129, printType: 'Front 3D Embroidery' },
    { minQuantity: 100, maxQuantity: 249, pricePerUnit: 109, printType: 'Front 3D Embroidery' },
    { minQuantity: 250, maxQuantity: 499, pricePerUnit: 95, printType: 'Front 3D Embroidery' },
  ]);

  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoadingCats(true);
      const res = await fetch(`${API_URL}/products/categories`);
      const data = await res.json();
      if (data.success && Array.isArray(data.categories)) {
        setCategories(data.categories);
        // Default to Cap if available
        const cap = data.categories.find((c: any) => c.slug === 'caps' || c.name.toLowerCase().includes('cap'));
        if (cap) {
          setCategoryId(cap.id);
        } else if (data.categories.length > 0) {
          setCategoryId(data.categories[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoadingCats(false);
    }
  };

  const selectedCat = categories.find(c => c.id === categoryId);
  const isCapCategory = selectedCat?.slug === 'caps' || selectedCat?.name?.toLowerCase().includes('cap');
  const isBagCategory = selectedCat?.slug === 'bags' || selectedCat?.name?.toLowerCase().includes('bag');
  const isMugCategory = selectedCat?.slug === 'drinkware' || selectedCat?.name?.toLowerCase().includes('mug') || selectedCat?.name?.toLowerCase().includes('cup') || selectedCat?.name?.toLowerCase().includes('bottle');

  // 1-Click Template Applicator
  const applyPreset = (type: 'CAP' | 'POLO' | 'BAG' | 'MUG') => {
    if (type === 'MUG') {
      const mugCat = categories.find(c => c.slug === 'drinkware' || c.name?.toLowerCase().includes('mug') || c.name?.toLowerCase().includes('bottle') || c.name?.toLowerCase().includes('drink')) || categories[0];
      setName('Classic Corporate Ceramic Coffee Mug');
      setSku('classic-corporate-ceramic-mug');
      if (mugCat) setCategoryId(mugCat.id);
      setBasePrice(149);
      setDescription(MUG_DESCRIPTION_TEMPLATE);
      setImages([
        'https://res.cloudinary.com/e3sasmyr/image/upload/v1790086438/products/corporate-ceramic-coffee-mug-black.jpg',
        '/images/products/corporate-ceramic-mug.jpg'
      ]);
      setVariants([
        { color: 'Matte Black', size: '330ml (Standard)', sku: 'MUG-CER-BLK', stock: 1000 },
        { color: 'Classic White', size: '330ml (Standard)', sku: 'MUG-CER-WHT', stock: 800 },
        { color: 'Navy Blue', size: '330ml (Standard)', sku: 'MUG-CER-NVY', stock: 500 },
      ]);
      setBulkPricing([
        { minQuantity: 25, maxQuantity: 49, pricePerUnit: 149, printType: 'Screen Print / UV DTF' },
        { minQuantity: 50, maxQuantity: 99, pricePerUnit: 129, printType: 'Screen Print / UV DTF' },
        { minQuantity: 100, maxQuantity: 249, pricePerUnit: 109, printType: 'Screen Print / UV DTF' },
        { minQuantity: 250, maxQuantity: 499, pricePerUnit: 95, printType: 'Screen Print / UV DTF' },
        { minQuantity: 500, maxQuantity: 9999, pricePerUnit: 79, printType: 'Screen Print / UV DTF' },
      ]);
    } else if (type === 'CAP') {
      const capCat = categories.find(c => c.slug === 'caps' || c.name?.toLowerCase().includes('cap')) || categories[0];
      setName('Classic Promotional Structured Cotton Cap');
      setSku('classic-promotional-cotton-cap');
      if (capCat) setCategoryId(capCat.id);
      setBasePrice(149);
      setDescription(CAP_DESCRIPTION_TEMPLATE);
      setImages([
        'https://res.cloudinary.com/e3sasmyr/image/upload/v1790083669/products/classic-cotton-cap-black.jpg',
        '/images/products/classic-cotton-cap.jpg'
      ]);
      setVariants([
        { color: 'Charcoal Black', size: 'Free Size', sku: 'CAP-BLK-FS', stock: 500 },
        { color: 'Navy Blue', size: 'Free Size', sku: 'CAP-NVY-FS', stock: 350 },
        { color: 'Classic White', size: 'Free Size', sku: 'CAP-WHT-FS', stock: 250 },
        { color: 'Royal Blue', size: 'Free Size', sku: 'CAP-RBL-FS', stock: 200 },
        { color: 'Crimson Red', size: 'Free Size', sku: 'CAP-RED-FS', stock: 150 },
      ]);
      setBulkPricing([
        { minQuantity: 20, maxQuantity: 49, pricePerUnit: 149, printType: 'Front 3D Embroidery' },
        { minQuantity: 50, maxQuantity: 99, pricePerUnit: 129, printType: 'Front 3D Embroidery' },
        { minQuantity: 100, maxQuantity: 249, pricePerUnit: 109, printType: 'Front 3D Embroidery' },
        { minQuantity: 250, maxQuantity: 499, pricePerUnit: 95, printType: 'Front 3D Embroidery' },
        { minQuantity: 500, maxQuantity: 9999, pricePerUnit: 85, printType: 'Front 3D Embroidery' },
      ]);
    } else if (type === 'POLO') {
      const poloCat = categories.find(c => c.slug === 't-shirts' || c.name?.toLowerCase().includes('t-shirt')) || categories[0];
      setName('Classic Corporate Pique Polo T-Shirt');
      setSku('classic-corporate-polo-tshirt');
      if (poloCat) setCategoryId(poloCat.id);
      setBasePrice(299);
      setDescription(POLO_DESCRIPTION_TEMPLATE);
      setImages([
        'https://res.cloudinary.com/e3sasmyr/image/upload/v1790080446/products/custom-corporate-polo-black.jpg',
        '/images/products/classic-black-polo.jpg'
      ]);
      setVariants([
        { color: 'Charcoal Black', size: 'M', sku: 'ZOB-POLO-BLK-M', stock: 500 },
        { color: 'Charcoal Black', size: 'L', sku: 'ZOB-POLO-BLK-L', stock: 600 },
        { color: 'Navy Blue', size: 'M', sku: 'ZOB-POLO-NVY-M', stock: 350 },
      ]);
      setBulkPricing([
        { minQuantity: 20, maxQuantity: 49, pricePerUnit: 299, printType: 'Front Only' },
        { minQuantity: 50, maxQuantity: 99, pricePerUnit: 279, printType: 'Front Only' },
        { minQuantity: 100, maxQuantity: 199, pricePerUnit: 259, printType: 'Front Only' },
      ]);
    } else if (type === 'BAG') {
      const bagCat = categories.find(c => c.slug === 'bags' || c.name?.toLowerCase().includes('bag')) || categories[0];
      setName('Executive Corporate Laptop Backpack');
      setSku('executive-corporate-laptop-backpack');
      if (bagCat) setCategoryId(bagCat.id);
      setBasePrice(699);
      setDescription(BAG_DESCRIPTION_TEMPLATE);
      setImages([
        'https://res.cloudinary.com/e3sasmyr/image/upload/v1790085384/products/executive-corporate-backpack-black.jpg',
        '/images/products/executive-laptop-backpack.jpg'
      ]);
      setVariants([
        { color: 'Charcoal Black', size: 'Free Size', sku: 'BAG-EXEC-BLK-FS', stock: 500 },
        { color: 'Navy Blue', size: 'Free Size', sku: 'BAG-EXEC-NVY-FS', stock: 350 },
        { color: 'Heather Grey', size: 'Free Size', sku: 'BAG-EXEC-GRY-FS', stock: 250 },
      ]);
      setBulkPricing([
        { minQuantity: 20, maxQuantity: 49, pricePerUnit: 699, printType: 'Front Logo Print / Embroidery' },
        { minQuantity: 50, maxQuantity: 99, pricePerUnit: 649, printType: 'Front Logo Print / Embroidery' },
        { minQuantity: 100, maxQuantity: 249, pricePerUnit: 599, printType: 'Front Logo Print / Embroidery' },
        { minQuantity: 250, maxQuantity: 499, pricePerUnit: 549, printType: 'Front Logo Print / Embroidery' },
        { minQuantity: 500, maxQuantity: 9999, pricePerUnit: 499, printType: 'Front Logo Print / Embroidery' },
      ]);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit.');
      return;
    }

    try {
      setUploadingImage(true);
      const secureUrl = await uploadToCloudinary(file);
      setImages(prev => [...prev, secureUrl]);
    } catch (err: any) {
      alert(`Failed to upload image: ${err.message}`);
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError('Product name is required.');
    if (!categoryId) return setError('Please select a category.');
    if (!basePrice || basePrice <= 0) return setError('Please enter a valid base price.');

    setSaving(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const payload = {
        name: name.trim(),
        slug: sku.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        categoryId,
        basePrice,
        description: description.trim(),
        images,
        isActive,
        requiresSize: !isCapCategory && !isBagCategory && !isMugCategory,
        requiresColor: true,
        variants: variants.length > 0 ? variants : undefined,
        bulkPricing: bulkPricing.length > 0 ? bulkPricing : undefined,
      };

      const res = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to create product');
      }

      router.push('/dashboard/products?created=success');
    } catch (err: any) {
      setError(err.message || 'Error saving product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/products"
            className="p-2 bg-white border border-[#E5E7EB] hover:bg-gray-50 text-gray-700 rounded-xl transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-heading font-black text-[#111111]">
              Add New Merchandise
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Create and publish corporate apparel, caps, mugs, and custom gear to customer catalog
            </p>
          </div>
        </div>

        {/* 1-Click Quick Presets */}
        <div className="flex flex-wrap items-center gap-2 bg-[#F8F9FC] border border-[#E5E7EB] p-1.5 rounded-xl">
          <span className="text-[11px] font-bold text-gray-600 px-2 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[#3B6FEB]" /> Presets:
          </span>
          <button
            type="button"
            onClick={() => applyPreset('MUG')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              isMugCategory 
                ? 'bg-[#3B6FEB] text-white shadow-xs' 
                : 'bg-white hover:bg-blue-50 text-[#3B6FEB] border border-blue-200'
            }`}
          >
            <span>☕</span>
            <span>Cup / Mug</span>
          </button>
          <button
            type="button"
            onClick={() => applyPreset('BAG')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              isBagCategory 
                ? 'bg-[#3B6FEB] text-white shadow-xs' 
                : 'bg-white hover:bg-blue-50 text-[#3B6FEB] border border-blue-200'
            }`}
          >
            <span>🎒</span>
            <span>Backpack / Bag</span>
          </button>
          <button
            type="button"
            onClick={() => applyPreset('CAP')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              isCapCategory 
                ? 'bg-[#3B6FEB] text-white shadow-xs' 
                : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
            }`}
          >
            <span>🧢</span>
            <span>Cap / Headwear</span>
          </button>
          <button
            type="button"
            onClick={() => applyPreset('POLO')}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 transition-all flex items-center gap-1.5"
          >
            <span>👕</span>
            <span>Polo T-Shirt</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Product Details (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Basic Specifications */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <h2 className="text-sm font-black text-[#111111] uppercase tracking-wider flex items-center gap-2">
                <Package className="w-4 h-4 text-[#3B6FEB]" /> Basic Information
              </h2>
              {isMugCategory && (
                <span className="px-2.5 py-0.5 bg-blue-50 text-[#3B6FEB] border border-blue-200 rounded-full text-[10px] font-bold">
                  ☕ Cup / Mug Mode Active
                </span>
              )}
              {isBagCategory && (
                <span className="px-2.5 py-0.5 bg-blue-50 text-[#3B6FEB] border border-blue-200 rounded-full text-[10px] font-bold">
                  🎒 Bag / Backpack Mode Active
                </span>
              )}
              {isCapCategory && (
                <span className="px-2.5 py-0.5 bg-blue-50 text-[#3B6FEB] border border-blue-200 rounded-full text-[10px] font-bold">
                  🧢 Headwear Mode Active
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#374151] mb-1.5">Product Title *</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Classic Promotional Structured Cotton Cap"
                className="w-full px-3.5 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-sm font-bold text-[#111111] outline-none focus:border-[#3B6FEB] focus:bg-white transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#374151] mb-1.5">SKU / URL Slug *</label>
                <input
                  type="text"
                  required
                  value={sku}
                  onChange={e => setSku(e.target.value)}
                  placeholder="e.g. classic-cotton-cap"
                  className="w-full px-3.5 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs font-mono text-[#111111] outline-none focus:border-[#3B6FEB] focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#374151] mb-1.5">Category *</label>
                <select
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs font-bold text-[#111111] outline-none focus:border-[#3B6FEB] focus:bg-white transition-all"
                >
                  {loadingCats ? (
                    <option>Loading categories...</option>
                  ) : (
                    categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#374151] mb-1.5">Starting Base Price (₹) *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs">₹</span>
                  <input
                    type="number"
                    min="1"
                    required
                    value={basePrice}
                    onChange={e => setBasePrice(parseFloat(e.target.value) || 0)}
                    placeholder="149"
                    className="w-full pl-8 pr-4 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-sm font-black text-[#111111] outline-none focus:border-[#3B6FEB] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#374151] mb-1.5">Product Status</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsActive(true)}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      isActive 
                        ? 'bg-[#111111] text-white border-black' 
                        : 'bg-[#F9FAFB] text-gray-500 border-[#E5E7EB]'
                    }`}
                  >
                    Active
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsActive(false)}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      !isActive 
                        ? 'bg-[#111111] text-white border-black' 
                        : 'bg-[#F9FAFB] text-gray-500 border-[#E5E7EB]'
                    }`}
                  >
                    Draft
                  </button>
                </div>
              </div>
            </div>

            {/* Description with 1-click helper */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[#374151]">Merchandise Description</label>
                <button
                  type="button"
                  onClick={() => setDescription(isMugCategory ? MUG_DESCRIPTION_TEMPLATE : (isBagCategory ? BAG_DESCRIPTION_TEMPLATE : (isCapCategory ? CAP_DESCRIPTION_TEMPLATE : POLO_DESCRIPTION_TEMPLATE)))}
                  className="text-[11px] font-bold text-[#3B6FEB] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Insert {isMugCategory ? 'Mug' : (isBagCategory ? 'Bag' : (isCapCategory ? 'Cap' : 'Polo'))} Specs Template</span>
                </button>
              </div>
              <textarea
                rows={6}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Enter comprehensive material, GSM, panel structure, closure, and custom branding specifications..."
                className="w-full px-3.5 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-xs font-mono text-[#111111] outline-none focus:border-[#3B6FEB] focus:bg-white transition-all leading-relaxed"
              />
            </div>
          </div>

          {/* Card 2: Color Variants */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <div>
                <h2 className="text-sm font-black text-[#111111] uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#3B6FEB]" /> Color Variants ({variants.length})
                </h2>
                <p className="text-[11px] text-gray-400">
                  {isMugCategory ? 'Mugs & Drinkware are standard 330ml (11oz) capacity.' : (isBagCategory ? 'Bags are standard Free Size (28L Capacity).' : (isCapCategory ? 'Caps are Free Size with adjustable buckle strap.' : 'Garment sizes and color options.'))}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isMugCategory && (
                  <button
                    type="button"
                    onClick={() => setVariants([
                      { color: 'Matte Black', size: '330ml (Standard)', sku: 'MUG-CER-BLK', stock: 1000 },
                      { color: 'Classic White', size: '330ml (Standard)', sku: 'MUG-CER-WHT', stock: 800 },
                      { color: 'Navy Blue', size: '330ml (Standard)', sku: 'MUG-CER-NVY', stock: 500 },
                    ])}
                    className="px-2.5 py-1 bg-blue-50 border border-blue-200 text-[#3B6FEB] rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                  >
                    + Standard Mug Colors
                  </button>
                )}
                {isCapCategory && (
                  <button
                    type="button"
                    onClick={() => setVariants([
                      { color: 'Charcoal Black', size: 'Free Size', sku: 'CAP-BLK-FS', stock: 500 },
                      { color: 'Navy Blue', size: 'Free Size', sku: 'CAP-NVY-FS', stock: 350 },
                      { color: 'Classic White', size: 'Free Size', sku: 'CAP-WHT-FS', stock: 250 },
                      { color: 'Royal Blue', size: 'Free Size', sku: 'CAP-RBL-FS', stock: 200 },
                      { color: 'Crimson Red', size: 'Free Size', sku: 'CAP-RED-FS', stock: 150 },
                    ])}
                    className="px-2.5 py-1 bg-blue-50 border border-blue-200 text-[#3B6FEB] rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                  >
                    + Standard Cap Colors
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2.5">
              {variants.map((v, i) => (
                <div key={i} className="flex items-center gap-2 bg-[#F9FAFB] p-2.5 rounded-xl border border-[#E5E7EB]">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Color Name"
                      value={v.color}
                      onChange={e => {
                        const n = [...variants];
                        n[i].color = e.target.value;
                        setVariants(n);
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#E5E7EB] rounded-lg text-xs font-bold outline-none"
                    />
                  </div>
                  <div className="w-36">
                    <input
                      type="text"
                      placeholder="Size / Capacity"
                      value={v.size}
                      onChange={e => {
                        const n = [...variants];
                        n[i].size = e.target.value;
                        setVariants(n);
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#E5E7EB] rounded-lg text-xs font-bold outline-none"
                    />
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      placeholder="Stock"
                      value={v.stock}
                      onChange={e => {
                        const n = [...variants];
                        n[i].stock = parseInt(e.target.value) || 0;
                        setVariants(n);
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#E5E7EB] rounded-lg text-xs font-mono outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setVariants(variants.filter((_, idx) => idx !== i))}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setVariants([...variants, { color: '', size: isMugCategory ? '330ml (Standard)' : (isCapCategory || isBagCategory ? 'Free Size' : 'L'), sku: '', stock: 100 }])}
              className="w-full py-2.5 border-2 border-dashed border-[#E5E7EB] hover:border-[#3B6FEB] text-xs font-bold text-[#3B6FEB] rounded-xl hover:bg-blue-50/40 transition-all"
            >
              + Add Custom Variant
            </button>
          </div>

          {/* Card 3: Bulk Pricing Tiers */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <h2 className="text-sm font-black text-[#111111] uppercase tracking-wider flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-[#3B6FEB]" /> Bulk Volume Pricing Tiers
              </h2>
            </div>

            <div className="space-y-2.5">
              {bulkPricing.map((p, i) => (
                <div key={i} className="flex items-center gap-2 bg-[#F9FAFB] p-2.5 rounded-xl border border-[#E5E7EB]">
                  <div className="w-20">
                    <label className="text-[10px] text-gray-400 font-bold block">Min Qty</label>
                    <input
                      type="number"
                      value={p.minQuantity}
                      onChange={e => {
                        const np = [...bulkPricing];
                        np[i].minQuantity = parseInt(e.target.value) || 0;
                        setBulkPricing(np);
                      }}
                      className="w-full px-2 py-1 bg-white border border-[#E5E7EB] rounded text-xs font-bold"
                    />
                  </div>
                  <div className="w-20">
                    <label className="text-[10px] text-gray-400 font-bold block">Max Qty</label>
                    <input
                      type="number"
                      value={p.maxQuantity}
                      onChange={e => {
                        const np = [...bulkPricing];
                        np[i].maxQuantity = parseInt(e.target.value) || 0;
                        setBulkPricing(np);
                      }}
                      className="w-full px-2 py-1 bg-white border border-[#E5E7EB] rounded text-xs font-bold"
                    />
                  </div>
                  <div className="w-24">
                    <label className="text-[10px] text-gray-400 font-bold block">Rate (₹)</label>
                    <input
                      type="number"
                      value={p.pricePerUnit}
                      onChange={e => {
                        const np = [...bulkPricing];
                        np[i].pricePerUnit = parseFloat(e.target.value) || 0;
                        setBulkPricing(np);
                      }}
                      className="w-full px-2 py-1 bg-white border border-[#E5E7EB] rounded text-xs font-black text-[#3B6FEB]"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-400 font-bold block">Customization Type</label>
                    <input
                      type="text"
                      value={p.printType}
                      onChange={e => {
                        const np = [...bulkPricing];
                        np[i].printType = e.target.value;
                        setBulkPricing(np);
                      }}
                      className="w-full px-2 py-1 bg-white border border-[#E5E7EB] rounded text-xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setBulkPricing(bulkPricing.filter((_, idx) => idx !== i))}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg mt-3"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setBulkPricing([...bulkPricing, { minQuantity: 500, maxQuantity: 9999, pricePerUnit: 85, printType: isMugCategory ? 'Screen Print / UV DTF' : (isCapCategory ? 'Front 3D Embroidery' : 'Front Only') }])}
              className="w-full py-2.5 border-2 border-dashed border-[#E5E7EB] hover:border-[#3B6FEB] text-xs font-bold text-[#3B6FEB] rounded-xl hover:bg-blue-50/40 transition-all"
            >
              + Add Pricing Tier
            </button>
          </div>
        </div>

        {/* Right Column: Images & Publish (1 col) */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-black text-[#111111] uppercase tracking-wider border-b border-[#E5E7EB] pb-3">
              Product Images ({images.length})
            </h2>

            {/* Upload Zone */}
            <div className="border-2 border-dashed border-[#E5E7EB] hover:border-[#3B6FEB] bg-[#F9FAFB] hover:bg-blue-50/40 rounded-2xl p-6 text-center flex flex-col items-center justify-center gap-2 cursor-pointer transition-all relative">
              <input
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleImageUpload}
                disabled={uploadingImage || images.length >= 5}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <div className="w-10 h-10 rounded-full bg-white shadow-xs border border-gray-200 flex items-center justify-center text-[#3B6FEB]">
                <UploadCloud className={`w-5 h-5 ${uploadingImage ? 'animate-bounce' : ''}`} />
              </div>
              <div>
                <p className="text-xs font-bold text-[#111111]">
                  {uploadingImage ? 'Uploading...' : 'Click to Upload Product Asset'}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">PNG, JPG, WEBP up to 5MB</p>
              </div>
            </div>

            {/* Image Previews */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                {images.map((img, i) => (
                  <div key={i} className="aspect-square bg-gray-50 rounded-xl border border-gray-200 overflow-hidden relative group">
                    <img src={img} alt="Product preview" className="w-full h-full object-contain p-2" />
                    <button
                      type="button"
                      onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                      className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action CTAs */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm space-y-3">
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-[#3B6FEB] hover:bg-[#2563EB] text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{saving ? 'Publishing Product...' : 'Publish Product to Catalog'}</span>
            </button>

            <Link href="/dashboard/products" className="block">
              <button
                type="button"
                className="w-full py-2.5 bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-xl border border-[#E5E7EB] transition-colors"
              >
                Cancel
              </button>
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
