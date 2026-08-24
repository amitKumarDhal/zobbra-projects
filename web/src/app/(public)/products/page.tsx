'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const products = [
    {
      id: '1',
      name: 'Customized Polo T-Shirt (200 GSM)',
      category: 'T-Shirts',
      price: '₹249.00',
      moq: '20 Pcs',
      image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=600&q=80',
      slug: 'polo-t-shirt',
    },
    {
      id: '2',
      name: 'Promotional Cotton Cap with Embroidery',
      category: 'Caps',
      price: '₹99.00',
      moq: '50 Pcs',
      image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=600&q=80',
      slug: 'promotional-cotton-cap',
    },
    {
      id: '3',
      name: 'Executive Laptop Backpack (25L)',
      category: 'Bags',
      price: '₹599.00',
      moq: '20 Pcs',
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80',
      slug: 'executive-laptop-backpack',
    },
  ];

  const filtered = products.filter((p) => {
    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-slate-900">Custom Merchandise Catalog</h1>
        <p className="text-slate-600 text-sm">Select a product to customize print options, view bulk pricing tables, or generate instant quotation.</p>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 custom-shadow">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          <Filter className="w-4 h-4 text-slate-400 hidden md:block" />
          {['ALL', 'T-Shirts', 'Caps', 'Bags'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-black text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {filtered.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden custom-shadow card-hover flex flex-col justify-between">
            <div>
              <img src={item.image} alt={item.name} className="w-full h-64 object-cover" />
              <div className="p-6 space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase">{item.category}</span>
                <h3 className="text-xl font-bold text-slate-900">{item.name}</h3>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-500 text-sm">Starting From <strong className="text-slate-900 text-lg font-black">{item.price}</strong></span>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">MOQ: {item.moq}</span>
                </div>
              </div>
            </div>
            <div className="p-6 pt-0">
              <Link href={`/products/${item.slug}`}>
                <Button variant="secondary" className="w-full font-bold">
                  CUSTOMIZE & GET QUOTE
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
