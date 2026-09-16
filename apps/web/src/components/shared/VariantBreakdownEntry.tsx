'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';

export interface VariantData {
  color?: string;
  size?: string;
  quantity: number;
}

interface VariantBreakdownEntryProps {
  totalQuantity: number;
  requiresColor?: boolean;
  requiresSize?: boolean;
  supportsMatrix?: boolean;
  variants: VariantData[];
  onChange: (variants: VariantData[]) => void;
}

export default function VariantBreakdownEntry({
  totalQuantity,
  requiresColor = true,
  requiresSize = true,
  supportsMatrix = true,
  variants,
  onChange
}: VariantBreakdownEntryProps) {
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');

  const currentTotal = variants.reduce((sum, v) => sum + (v.quantity || 0), 0);
  const remaining = Math.max(0, totalQuantity - currentTotal);
  const isComplete = currentTotal === totalQuantity;
  const isOver = currentTotal > totalQuantity;

  useEffect(() => {
    if (quantity === '' && remaining > 0 && remaining <= totalQuantity) {
      setQuantity(remaining);
    }
  }, [remaining, quantity, totalQuantity]);

  const handleAdd = () => {
    if (!quantity || quantity <= 0) return;
    
    const c = color.trim();
    const s = size.trim();

    const existingIdx = variants.findIndex(v => v.color === c && v.size === s);
    if (existingIdx >= 0) {
      const newVariants = [...variants];
      newVariants[existingIdx].quantity += Number(quantity);
      onChange(newVariants);
    } else {
      onChange([...variants, { 
        color: requiresColor ? c : undefined, 
        size: requiresSize ? s : undefined, 
        quantity: Number(quantity) 
      }]);
    }
    
    setQuantity('');
    if (!requiresSize) setColor('');
    if (!requiresColor) setSize('');
  };

  const handleRemove = (idx: number) => {
    const newVariants = [...variants];
    newVariants.splice(idx, 1);
    onChange(newVariants);
  };

  if (!requiresColor && !requiresSize) {
    return null;
  }

  return (
    <div className="bg-[#F8F9FC] border border-[#E5E7EB] rounded-xl p-4 space-y-4">
      <div>
        <h4 className="text-sm font-bold text-[#374151] flex items-center justify-between">
          Quantity Breakdown
          <span className={`text-xs px-2 py-1 rounded-full font-semibold ${isComplete ? 'bg-emerald-100 text-emerald-700' : isOver ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
            {currentTotal} / {totalQuantity}
          </span>
        </h4>
        <p className="text-xs text-[#6B7280] mt-1">
          Specify the color and size distribution for your {totalQuantity} items.
        </p>
      </div>

      {variants.length > 0 && (
        <div className="space-y-2">
          {variants.map((v, i) => (
            <div key={i} className="flex items-center justify-between bg-white px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm shadow-sm">
              <div className="flex gap-3 text-[#374151] font-medium items-center">
                {requiresColor && (
                  <span className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full border border-gray-300" style={{ backgroundColor: v.color?.toLowerCase() || '#ccc' }}></div> 
                    {v.color || ''}
                  </span>
                )}
                {requiresSize && v.size && <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-700 font-bold">{v.size}</span>}
              </div>
              <div className="flex items-center gap-4">
                <span className="font-bold text-[#111111]">Qty: {v.quantity}</span>
                <button type="button" onClick={() => handleRemove(i)} className="text-red-500 hover:text-red-700 p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isComplete && (
        <div className="flex flex-wrap items-end gap-3 pt-2">
          {requiresColor && (
            <div className="flex-1 min-w-[120px]">
              <label className="block text-xs font-bold text-[#4B5563] mb-1">Color <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                value={color} 
                onChange={e => setColor(e.target.value)} 
                placeholder="e.g. Navy Blue" 
                className="w-full px-3 py-2 bg-white border border-[#D1D5DB] rounded-lg text-sm outline-none focus:border-[#3B6FEB] transition-all"
              />
            </div>
          )}
          
          {requiresSize && (
            <div className="w-[100px]">
              <label className="block text-xs font-bold text-[#4B5563] mb-1">Size <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                value={size} 
                onChange={e => setSize(e.target.value)} 
                placeholder="e.g. XL" 
                className="w-full px-3 py-2 bg-white border border-[#D1D5DB] rounded-lg text-sm outline-none focus:border-[#3B6FEB] transition-all uppercase"
              />
            </div>
          )}

          <div className="w-[100px]">
            <label className="block text-xs font-bold text-[#4B5563] mb-1">Qty <span className="text-red-500">*</span></label>
            <input 
              type="number" 
              min="1"
              max={remaining}
              value={quantity} 
              onChange={e => setQuantity(Number(e.target.value))} 
              className="w-full px-3 py-2 bg-white border border-[#D1D5DB] rounded-lg text-sm outline-none focus:border-[#3B6FEB] transition-all font-semibold"
            />
          </div>

          <button 
            type="button" 
            onClick={handleAdd}
            disabled={!quantity || (requiresColor && !color.trim()) || (requiresSize && !size.trim()) || isOver}
            className="h-[38px] px-4 bg-[#111111] hover:bg-[#000000] disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      )}
      
      {isOver && (
        <p className="text-red-500 text-xs font-bold mt-2">
          Breakdown total ({currentTotal}) exceeds item quantity ({totalQuantity}).
        </p>
      )}
    </div>
  );
}
