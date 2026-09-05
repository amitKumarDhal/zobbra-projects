'use client';

import React, { useState } from 'react';
import { UploadCloud, Search, Filter, Image as ImageIcon, FileText as FileIcon, MoreVertical, Folder, Link as LinkIcon, Trash2 } from 'lucide-react';

export default function MediaPage() {
  const [search, setSearch] = useState('');

  const [mediaFiles, setMediaFiles] = useState<any[]>([]); // To be wired to a real API

  return (
    <div className="space-y-6 pb-12 font-sans bg-[#F8F9FC] min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-black text-[#111111]">Media Library</h1>
          <p className="text-sm text-[#6B7280] font-medium mt-1">Manage images, documents, and assets.</p>
        </div>
        <button className="bg-[#3B6FEB] text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm hover:bg-[#2563EB] transition-colors flex items-center gap-2">
          <UploadCloud className="w-4 h-4" /> Upload Media
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Categories Sidebar */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm p-4 h-max">
          <h3 className="font-bold text-[#111111] mb-4 text-sm px-2">Categories</h3>
          <ul className="space-y-1">
            {['All Media', 'Product Images', 'Logos', 'Marketing', 'Documents'].map((cat, i) => (
              <li key={i}>
                <button className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${i === 0 ? 'bg-[#EEF2FF] text-[#3B6FEB] font-bold' : 'text-[#6B7280] font-medium hover:bg-[#F9FAFB] hover:text-[#111111]'}`}>
                  <span className="flex items-center gap-2">
                    <Folder className={`w-4 h-4 ${i === 0 ? 'text-[#3B6FEB]' : 'text-[#9CA3AF]'}`} /> {cat}
                  </span>
                  <span className="text-[10px] bg-white border border-[#E5E7EB] px-1.5 py-0.5 rounded text-[#9CA3AF]">{i === 0 ? 124 : 12}</span>
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-8 px-2">
            <h3 className="font-bold text-[#111111] mb-3 text-sm">Storage Used</h3>
            <div className="w-full bg-[#F3F4F6] rounded-full h-2 mb-2">
              <div className="bg-[#3B6FEB] h-2 rounded-full" style={{ width: '45%' }}></div>
            </div>
            <p className="text-xs text-[#6B7280]">4.5 GB of 10 GB used</p>
          </div>
        </div>

        {/* Media Grid */}
        <div className="lg:col-span-3 bg-white border border-[#E5E7EB] rounded-2xl shadow-sm">
          {/* Toolbar */}
          <div className="p-4 border-b border-[#E5E7EB] flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
              <input 
                type="text" 
                placeholder="Search media..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-sm text-[#111111] focus:outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] transition-shadow"
              />
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm font-semibold text-[#374151] hover:bg-[#F9FAFB] transition-colors">
                <Filter className="w-4 h-4" /> Filter
              </button>
            </div>
          </div>

          <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {mediaFiles.map((file) => (
              <div key={file.id} className="group relative border border-[#E5E7EB] rounded-xl overflow-hidden hover:shadow-md transition-shadow bg-[#F9FAFB]">
                <div className="aspect-square bg-[#E5E7EB] flex items-center justify-center relative overflow-hidden">
                  {file.type.startsWith('image') ? (
                    <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                  ) : (
                    <FileIcon className="w-12 h-12 text-[#9CA3AF]" />
                  )}
                  {/* Hover Actions */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#111111] hover:text-[#3B6FEB] transition-colors shadow-sm" title="Copy URL">
                      <LinkIcon className="w-4 h-4" />
                    </button>
                    <button className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#111111] hover:text-red-600 transition-colors shadow-sm" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="p-3 bg-white">
                  <p className="text-xs font-bold text-[#111111] truncate" title={file.name}>{file.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[10px] text-[#6B7280]">{file.size}</p>
                    <button className="text-[#9CA3AF] hover:text-[#111111]"><MoreVertical className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
