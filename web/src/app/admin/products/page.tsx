'use client';

import React, { useState } from 'react';
import { Plus, Package, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';

export default function AdminProductsPage() {
  const [isAddOpen, setIsAddOpen] = useState(false);

  const products = [
    {
      id: '1',
      name: 'Customized Polo T-Shirt (200 GSM)',
      category: 'T-Shirts & Apparel',
      hsnCode: '6105',
      gstRate: '5%',
      basePrice: '₹249.00',
      stock: 1850,
      status: 'Active',
    },
    {
      id: '2',
      name: 'Promotional Cotton Cap with Embroidery',
      category: 'Caps & Headwear',
      hsnCode: '6505',
      gstRate: '5%',
      basePrice: '₹99.00',
      stock: 1200,
      status: 'Active',
    },
    {
      id: '3',
      name: 'Executive Laptop Backpack (25L)',
      category: 'Bags & Backpacks',
      hsnCode: '4202',
      gstRate: '18%',
      basePrice: '₹599.00',
      stock: 450,
      status: 'Active',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Product Management</h1>
          <p className="text-xs text-slate-500 font-semibold">Manage catalog, GST HSN codes, colors, sizes & bulk pricing tiers.</p>
        </div>
        <Button variant="secondary" onClick={() => setIsAddOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> ADD NEW PRODUCT
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 custom-shadow overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
            <tr>
              <th className="p-4">Product Name</th>
              <th className="p-4">Category</th>
              <th className="p-4">HSN Code</th>
              <th className="p-4">GST Rate</th>
              <th className="p-4">Base Price</th>
              <th className="p-4">Stock</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="p-4 font-bold text-slate-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-600" /> {p.name}
                </td>
                <td className="p-4">{p.category}</td>
                <td className="p-4 font-mono">{p.hsnCode}</td>
                <td className="p-4">{p.gstRate}</td>
                <td className="p-4 font-bold text-slate-900">{p.basePrice}</td>
                <td className="p-4">{p.stock} Pcs</td>
                <td className="p-4">
                  <Badge variant="success">{p.status}</Badge>
                </td>
                <td className="p-4 text-right space-x-2">
                  <button className="p-1 hover:text-blue-600"><Edit className="w-4 h-4" /></button>
                  <button className="p-1 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Product to Catalog">
        <form onSubmit={(e) => { e.preventDefault(); setIsAddOpen(false); }} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Product Title</label>
            <input type="text" required placeholder="e.g. Bio-washed Hoodie" className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">HSN Code</label>
              <input type="text" defaultValue="6109" className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">GST Rate (%)</label>
              <select className="w-full px-3 py-2 border rounded-lg text-sm">
                <option>5% (Apparel)</option>
                <option>18% (Accessories/Bags)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Base Price (₹)</label>
            <input type="number" required defaultValue="249" className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <Button type="submit" variant="secondary" className="w-full">SAVE PRODUCT</Button>
        </form>
      </Modal>
    </div>
  );
}
