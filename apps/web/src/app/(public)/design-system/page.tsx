'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  AlertTriangle,
  CheckCircle2,
  Copy,
  ArrowRight,
  RefreshCw,
  Users,
  Send,
  Clock,
  CheckSquare,
  Package,
  Layers,
  ChevronRight,
  TrendingUp,
  FileText,
  CreditCard,
  Tag,
  ShoppingBag,
  Truck,
  MapPin,
  SlidersHorizontal,
  Bell,
  User,
  PlusCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Modal } from '@/components/ui/modal';
import { Drawer } from '@/components/ui/drawer';

export default function DesignSystemPage() {
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [shimmerLoading, setShimmerLoading] = useState(false);

  const copyToClipboard = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedToken(hex);
    setTimeout(() => setCopiedToken(null), 1500);
  };

  const canonicalColors = [
    { name: 'Brand Primary', hex: '#3B6FEB', bg: 'bg-[#3B6FEB]', text: 'text-white', category: 'Brand' },
    { name: 'Brand Hover', hex: '#2563EB', bg: 'bg-[#2563EB]', text: 'text-white', category: 'Brand' },
    { name: 'Brand Active', hex: '#1D4ED8', bg: 'bg-[#1D4ED8]', text: 'text-white', category: 'Brand' },
    { name: 'Brand Soft', hex: '#EEF2FF', bg: 'bg-[#EEF2FF]', text: 'text-[#3B6FEB]', border: true, category: 'Brand' },
    { name: 'Dark Neutral', hex: '#111111', bg: 'bg-[#111111]', text: 'text-white', category: 'Surfaces' },
    { name: 'Sidebar Dark', hex: '#0A0F1C', bg: 'bg-[#0A0F1C]', text: 'text-white', category: 'Surfaces' },
    { name: 'Black Surface', hex: '#050505', bg: 'bg-[#050505]', text: 'text-white', category: 'Surfaces' },
    { name: 'App Background', hex: '#F8F9FC', bg: 'bg-[#F8F9FC]', text: 'text-[#111111]', border: true, category: 'Surfaces' },
    { name: 'Card Surface', hex: '#FFFFFF', bg: 'bg-white', text: 'text-[#111111]', border: true, category: 'Surfaces' },
    { name: 'Border Default', hex: '#E5E7EB', bg: 'bg-[#E5E7EB]', text: 'text-[#111111]', category: 'Borders' },
    { name: 'Border Strong', hex: '#D1D5DB', bg: 'bg-[#D1D5DB]', text: 'text-[#111111]', category: 'Borders' },
    { name: 'Text Primary', hex: '#111111', bg: 'bg-[#111111]', text: 'text-white', category: 'Typography' },
    { name: 'Text Secondary', hex: '#374151', bg: 'bg-[#374151]', text: 'text-white', category: 'Typography' },
    { name: 'Text Muted', hex: '#6B7280', bg: 'bg-[#6B7280]', text: 'text-white', category: 'Typography' },
    { name: 'Success Emerald', hex: '#047857', bg: 'bg-emerald-600', text: 'text-white', category: 'Semantic' },
    { name: 'Warning Amber', hex: '#B45309', bg: 'bg-amber-600', text: 'text-white', category: 'Semantic' },
    { name: 'Danger Rose', hex: '#BE123C', bg: 'bg-rose-600', text: 'text-white', category: 'Semantic' },
    { name: 'Info Blue', hex: '#1D4ED8', bg: 'bg-blue-600', text: 'text-white', category: 'Semantic' },
  ];

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'customer', label: 'Customer Portal' },
    { id: 'typography', label: 'Typography' },
    { id: 'colors', label: 'Colors' },
    { id: 'buttons', label: 'Buttons' },
    { id: 'forms', label: 'Forms & Inputs' },
    { id: 'badges', label: 'Status & Badges' },
    { id: 'cards', label: 'Cards & KPIs' },
    { id: 'overlays', label: 'Drawers & Modals' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 bg-[#F8F9FC] font-sans">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#EEF2FF] text-[#3B6FEB] border border-[#BFDBFE]">
            <Sparkles className="w-3.5 h-3.5" /> Canonical Design System
          </span>
          <span className="text-xs text-[#6B7280] font-medium">Production Release 2.0</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-heading font-black text-[#111111] tracking-tight">
          Zobra Design Tokens & Primitives
        </h1>
        <p className="text-[#6B7280] text-sm md:text-base max-w-3xl font-medium">
          Unified UI architecture powered by Plus Jakarta Sans, Inter, JetBrains Mono, and the canonical Zobra Electric Blue & Slate SaaS palette.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-[#E5E7EB] pb-3 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            data-cy={`tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[#3B6FEB] text-white shadow-sm'
                : 'bg-white text-[#6B7280] hover:text-[#111111] hover:bg-gray-50 border border-[#E5E7EB]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 0. CUSTOMER PORTAL COMPONENTS */}
      {activeTab === 'customer' && (
        <section className="space-y-8 animate-in fade-in duration-300">
          <div>
            <span className="text-xs font-bold text-[#3B6FEB] uppercase tracking-wider font-mono">0. CUSTOMER PORTAL</span>
            <h2 className="text-2xl font-heading font-black text-[#111111] tracking-tight mt-1">Customer Experience Components</h2>
            <p className="text-sm text-[#6B7280] mt-1">
              Customer Portal components share the exact same canonical tokens as the Admin Dashboard while maintaining a clean, action-oriented, and conversion-focused customer experience.
            </p>
          </div>

          {/* 1. Customer KPIs */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[#111111] uppercase tracking-wider">1. Customer KPI Cards</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <StatCard
                title="Active Quotes"
                value="3 Quotes"
                sub="2 approved by you"
                icon={<FileText className="w-4 h-4 text-[#3B6FEB]" />}
                iconBg="bg-blue-50"
              />
              <StatCard
                title="Approved Orders"
                value="12 Orders"
                sub="Production in progress"
                icon={<ShoppingBag className="w-4 h-4 text-emerald-600" />}
                iconBg="bg-emerald-50"
              />
              <StatCard
                title="Total Spend"
                value="₹1,42,800"
                sub="Official GST invoices"
                icon={<CreditCard className="w-4 h-4 text-indigo-600" />}
                iconBg="bg-indigo-50"
              />
            </div>
          </div>

          {/* 2. Customer Product & Quote Cards */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[#111111] uppercase tracking-wider">2. Product & Quote Cards</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product Card */}
              <Card className="bg-white border-[#E5E7EB] overflow-hidden shadow-sm">
                <div className="h-44 bg-slate-100 flex items-center justify-center text-slate-400">
                  <Package className="w-12 h-12 text-slate-300" />
                </div>
                <CardContent className="p-5 space-y-3">
                  <div>
                    <span className="text-[10px] font-bold text-[#3B6FEB] uppercase tracking-wider block">Apparel</span>
                    <h4 className="text-base font-heading font-bold text-[#111111] mt-0.5">200 GSM Combed Cotton Polo</h4>
                    <p className="text-xs text-[#6B7280]">Customized corporate merchandise with embroidery and direct screen printing.</p>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-3 border-t border-[#E5E7EB]">
                    <span className="text-[#6B7280]">Base Rate: <strong className="font-mono text-[#111111] font-bold">₹249/pc</strong></span>
                    <span className="px-2 py-0.5 bg-[#F9FAFB] border border-[#E5E7EB] text-[#6B7280] rounded text-[10px] font-bold">MOQ: 20 Pcs</span>
                  </div>
                  <Button variant="primary" className="w-full font-bold">
                    <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5" /> CUSTOMIZE & ESTIMATE
                  </Button>
                </CardContent>
              </Card>

              {/* Order Card */}
              <Card className="bg-white border-[#E5E7EB] p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                  <div>
                    <span className="font-mono font-bold text-sm text-[#111111]">ZOB-ORD-1001</span>
                    <p className="text-[11px] text-[#6B7280]">Placed on 05 Aug 2026</p>
                  </div>
                  <StatusBadge status="PAID" />
                </div>
                <div className="space-y-2 text-xs">
                  <p className="text-[#111111] font-bold">100x Polo T-Shirts (Navy Blue, Size L)</p>
                  <p className="text-[#6B7280]">Print: Front Chest Logo & Back Full Print</p>
                  <div className="flex justify-between items-center pt-2 border-t border-[#E5E7EB]">
                    <span className="text-[#6B7280]">Total Amount:</span>
                    <span className="font-mono font-bold text-base text-[#111111]">₹28,900</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="primary" size="sm" className="flex-1 font-bold">
                    Track Shipment
                  </Button>
                  <Button variant="outline" size="sm" className="font-bold">
                    Invoice PDF
                  </Button>
                </div>
              </Card>
            </div>
          </div>

          {/* 3. Customer Shipment Timeline & Empty State */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[#111111] uppercase tracking-wider">3. Timeline & Empty States</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Timeline */}
              <Card className="bg-white border-[#E5E7EB] p-6 shadow-sm space-y-4">
                <h4 className="font-heading font-bold text-sm text-[#111111] flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#3B6FEB]" /> Express Shipment Milestones
                </h4>
                <div className="space-y-4 pt-1">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#3B6FEB] text-white flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="text-xs space-y-0.5">
                      <p className="font-bold text-[#111111]">Package Dispatched from Hub</p>
                      <p className="text-[#6B7280]">BlueDart Express • Bhubaneswar Local Center</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#F9FAFB] border border-[#E5E7EB] text-[#9CA3AF] flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="text-xs space-y-0.5">
                      <p className="font-bold text-[#111111]">Out for Delivery</p>
                      <p className="text-[#6B7280]">Expected Delivery by 06 Aug 2026</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Empty State */}
              <Card className="bg-white border-[#E5E7EB] p-8 shadow-sm flex flex-col items-center justify-center text-center space-y-3">
                <FileText className="w-10 h-10 text-gray-300 mx-auto" />
                <h4 className="text-sm font-bold text-[#111111]">No Active Quotes Found</h4>
                <p className="text-xs text-[#6B7280] max-w-xs">
                  Configure merchandise in the product catalog to generate your first real-time estimate and quote.
                </p>
                <Button variant="primary" size="sm" className="font-bold mt-1">
                  <PlusCircle className="w-3.5 h-3.5 mr-1" /> Create First Quote
                </Button>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* 1. OVERVIEW */}
      {activeTab === 'overview' && (
        <section className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 space-y-2 border-l-4 border-l-[#3B6FEB]">
              <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider font-mono">CANONICAL BLUE</span>
              <h3 className="text-2xl font-bold text-[#111111] font-mono">#3B6FEB</h3>
              <p className="text-xs text-[#4B5563]">Primary brand accent for CTAs, active highlights, and focus borders.</p>
            </Card>
            <Card className="p-6 space-y-2 border-l-4 border-l-[#111111]">
              <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider font-mono">DARK NEUTRAL</span>
              <h3 className="text-2xl font-bold text-[#111111] font-mono">#111111</h3>
              <p className="text-xs text-[#4B5563]">High-contrast headings, primary text, and dark button fills.</p>
            </Card>
            <Card className="p-6 space-y-2 border-l-4 border-l-[#E5E7EB]">
              <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider font-mono">APP CANVAS</span>
              <h3 className="text-2xl font-bold text-[#111111] font-mono">#F8F9FC</h3>
              <p className="text-xs text-[#4B5563]">Clean cool-neutral SaaS backdrop with crisp #E5E7EB borders.</p>
            </Card>
          </div>
        </section>
      )}

      {/* 2. TYPOGRAPHY */}
      {activeTab === 'typography' && (
        <section className="space-y-6">
          <Card className="p-8 space-y-6">
            <div className="border-b border-[#E5E7EB] pb-4">
              <span className="text-xs font-bold text-[#3B6FEB] uppercase tracking-wider font-mono">Plus Jakarta Sans (Headings & Display)</span>
              <h1 className="text-3xl sm:text-4xl font-heading font-black text-[#111111] mt-2">
                Display & H1 Headline 32px/40px Bold
              </h1>
            </div>

            <div className="border-b border-[#E5E7EB] pb-4">
              <span className="text-xs font-bold text-[#3B6FEB] uppercase tracking-wider font-mono">Inter (Body & Form Labels)</span>
              <p className="text-sm text-[#374151] mt-2 leading-relaxed">
                Standard UI body text at 14px with 1.5 line height. Clean, legible, and optimized for high-density enterprise dashboard tables, forms, and workflows.
              </p>
            </div>

            <div>
              <span className="text-xs font-bold text-[#3B6FEB] uppercase tracking-wider font-mono">JetBrains Mono (Identifiers & Numbers)</span>
              <p className="text-lg font-mono font-bold text-[#111111] mt-2">
                ₹1,42,850.00 • GSTIN: 21AAACA1234A1Z5 • SKU: ZOB-TS-200GSM
              </p>
            </div>
          </Card>
        </section>
      )}

      {/* 3. COLORS */}
      {activeTab === 'colors' && (
        <section className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {canonicalColors.map((c) => (
              <div
                key={c.name}
                onClick={() => copyToClipboard(c.hex)}
                className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden cursor-pointer hover:shadow-md transition-all group"
              >
                <div className={`h-24 ${c.bg} flex items-center justify-center p-4`}>
                  <span className={`text-xs font-mono font-bold ${c.text}`}>{c.hex}</span>
                </div>
                <div className="p-3.5 flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold text-[#111111] block">{c.name}</span>
                    <span className="text-[10px] text-[#6B7280] font-mono">{c.category}</span>
                  </div>
                  <Copy className="w-3.5 h-3.5 text-[#9CA3AF] group-hover:text-[#3B6FEB] transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. BUTTONS */}
      {activeTab === 'buttons' && (
        <section className="space-y-6">
          <Card className="p-8 space-y-6">
            <div>
              <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider font-mono">Canonical Variants</span>
              <div className="flex flex-wrap gap-4 mt-3">
                <Button variant="primary">Primary Button (#3B6FEB)</Button>
                <Button variant="black">Black Button (#111111)</Button>
                <Button variant="secondary">Secondary Button</Button>
                <Button variant="outline">Outline Button</Button>
                <Button variant="ghost">Ghost Button</Button>
                <Button variant="danger">Danger Button</Button>
                <Button variant="success">Success Button</Button>
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* 5. FORMS & INPUTS */}
      {activeTab === 'forms' && (
        <section className="space-y-6">
          <Card className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#374151] uppercase tracking-wider">Company Name</label>
                <Input placeholder="Acme Technologies Pvt Ltd" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#374151] uppercase tracking-wider">GSTIN Number</label>
                <Input placeholder="21AAACA1234A1Z5" className="font-mono" />
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* 6. STATUS & BADGES */}
      {activeTab === 'badges' && (
        <section className="space-y-6">
          <Card className="p-8 space-y-6">
            <div>
              <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider font-mono">Universal StatusBadge Component</span>
              <div className="flex flex-wrap gap-3 mt-3">
                <StatusBadge status="APPROVED" />
                <StatusBadge status="PENDING" />
                <StatusBadge status="REJECTED" />
                <StatusBadge status="SENT" />
                <StatusBadge status="DRAFT" />
                <StatusBadge status="PAID" />
                <StatusBadge status="FAILED" />
                <StatusBadge status="COMPLETED" />
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* 7. CARDS & KPIS */}
      {activeTab === 'cards' && (
        <section className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              title="Total Inquiries"
              value="142"
              trend={12.4}
              trendPeriod="vs last month"
              icon={<Users className="w-4 h-4 text-[#3B6FEB]" />}
              iconBg="bg-blue-50"
            />
            <StatCard
              title="Pending Quotes"
              value="28"
              trend={-4.2}
              trendPeriod="urgent quotes"
              icon={<Send className="w-4 h-4 text-amber-600" />}
              iconBg="bg-amber-50"
            />
            <StatCard
              title="Active Production"
              value="16 Orders"
              trend={5.0}
              trendPeriod="completed today"
              icon={<Package className="w-4 h-4 text-purple-600" />}
              iconBg="bg-purple-50"
            />
            <StatCard
              title="Total Revenue"
              value="₹8.42L"
              trend={18.2}
              trendPeriod="vs last month"
              icon={<TrendingUp className="w-4 h-4 text-emerald-600" />}
              iconBg="bg-emerald-50"
            />
          </div>
        </section>
      )}

      {/* 8. OVERLAYS (DRAWERS & MODALS) */}
      {activeTab === 'overlays' && (
        <section className="space-y-6">
          <Card className="p-6 space-y-4">
            <div className="flex gap-4">
              <Button variant="primary" onClick={() => setIsDrawerOpen(true)}>
                Open Canonical Drawer
              </Button>
              <Button variant="secondary" onClick={() => setIsModalOpen(true)}>
                Open Canonical Modal
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShimmerLoading(true);
                  setTimeout(() => setShimmerLoading(false), 2000);
                }}
              >
                <RefreshCw className={`w-4 h-4 ${shimmerLoading ? 'animate-spin' : ''}`} /> Test Shimmer Skeleton
              </Button>
            </div>

            {shimmerLoading && (
              <div className="space-y-3 pt-4 border-t border-[#F3F4F6]">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-10 w-1/2" />
              </div>
            )}
          </Card>

          {/* Test Drawer */}
          <Drawer
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            title="Quote #ZQB-QT-2026-0042"
            subtitle="Acme Technologies Pvt Ltd • Created Today"
            footer={
              <>
                <Button variant="secondary" size="sm" onClick={() => setIsDrawerOpen(false)}>
                  Close
                </Button>
                <Button variant="primary" size="sm">
                  Send to Customer
                </Button>
              </>
            }
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]">
                <span className="text-xs font-semibold text-[#6B7280]">Current Status</span>
                <StatusBadge status="APPROVED" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider font-mono">Product Details</label>
                <div className="p-4 rounded-xl border border-[#E5E7EB] bg-white space-y-2">
                  <p className="text-sm font-bold text-[#111111]">200 GSM Combed Cotton Polo</p>
                  <p className="text-xs text-[#6B7280]">Qty: 100 • Navy Blue • Size: L • Front & Back Screen Print</p>
                  <p className="text-sm font-bold text-[#3B6FEB] pt-2 border-t border-[#F3F4F6]">Total: ₹42,000</p>
                </div>
              </div>
            </div>
          </Drawer>

          {/* Test Modal */}
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Confirm Quote Approval"
            footer={
              <>
                <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={() => setIsModalOpen(false)}>
                  Confirm & Approve
                </Button>
              </>
            }
          >
            <p className="text-sm text-[#4B5563]">
              Are you sure you want to approve Quote #ZQB-QT-2026-0042? This will trigger automated production preparation and customer notification.
            </p>
          </Modal>
        </section>
      )}
    </div>
  );
}
