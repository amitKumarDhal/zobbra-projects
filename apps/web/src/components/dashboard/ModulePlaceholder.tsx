'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Sparkles, Layers, LucideIcon, Filter, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

interface ModulePlaceholderProps {
  title: string;
  description: string;
  actionLabel?: string;
  icon?: LucideIcon;
}

export function ModulePlaceholder({
  title,
  description,
  actionLabel = 'CREATE ITEM',
  icon: Icon = Layers,
}: ModulePlaceholderProps) {
  const [loading, setLoading] = useState(false);

  const simulateLoading = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1200);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8 bg-[#F7F5F2]"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge variant="terracotta" className="mb-2">MODULE</Badge>
          <h1 className="text-2xl sm:text-4xl font-serif font-black text-[#1C1C1C] tracking-tight">{title}</h1>
          <p className="text-xs text-[#5F6368] mt-1">{description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={simulateLoading}
            className="p-3 rounded-xl bg-white border border-[#E7E3DD] text-[#5F6368] hover:text-[#1C1C1C] transition-colors shadow-sm min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Simulate Loading Skeleton"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#C75B39]' : ''}`} />
          </button>
          <Button variant="terracotta" className="font-bold gap-2 min-h-[44px]">
            <Plus className="w-4 h-4" /> {actionLabel}
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#E7E3DD] shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3.5 text-[#8B8B8B]" />
          <Input
            type="text"
            placeholder={`Search ${title.toLowerCase()}...`}
            className="pl-9 bg-[#F7F5F2] border-[#E7E3DD] text-xs text-[#1C1C1C]"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F7F5F2] border border-[#E7E3DD] text-xs font-semibold text-[#1C1C1C] hover:bg-[#E7E3DD]">
            <Filter className="w-3.5 h-3.5 text-[#C75B39]" /> Filter
          </button>
          <button className="px-4 py-2 rounded-xl bg-[#F7F5F2] border border-[#E7E3DD] text-xs font-semibold text-[#5F6368] hover:text-[#1C1C1C]">
            All Statuses
          </button>
        </div>
      </div>

      {/* Content: Skeleton Loader vs Empty State */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-14 w-full bg-white border border-[#E7E3DD]" />
          <Skeleton className="h-14 w-full bg-white border border-[#E7E3DD]" />
          <Skeleton className="h-14 w-full bg-white border border-[#E7E3DD]" />
        </div>
      ) : (
        <Card hoverEffect={false} className="bg-white border-[#E7E3DD] p-12 text-center space-y-4 max-w-xl mx-auto shadow-sm">
          <div className="w-16 h-16 bg-[#1A5653]/10 text-[#1A5653] rounded-2xl flex items-center justify-center mx-auto border border-[#1A5653]/20 shadow-md">
            <Icon className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-serif font-bold text-[#1C1C1C] tracking-tight">{title} Module</h3>
            <p className="text-xs text-[#5F6368] max-w-sm mx-auto leading-relaxed">
              {description}
            </p>
          </div>
          <Badge variant="gold" className="px-4 py-1.5 gap-2 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-[#1A5653]" /> Module Ready for API Integration
          </Badge>
        </Card>
      )}
    </motion.div>
  );
}
