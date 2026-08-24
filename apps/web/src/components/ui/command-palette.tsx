'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  LayoutDashboard,
  Package,
  FileText,
  ShoppingBag,
  CreditCard,
  Settings,
  X,
  Command,
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
}

export function CommandPalette({ isOpen, onClose, onToggle }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const commands = [
    { name: 'Dashboard Overview', href: '/dashboard', icon: LayoutDashboard, category: 'Admin' },
    { name: 'Customer Inquiries', href: '/dashboard/inquiries', icon: FileText, category: 'Sales' },
    { name: 'Quote Builder', href: '/dashboard/quotes', icon: FileText, category: 'Sales' },
    { name: 'Orders Pipeline', href: '/dashboard/orders', icon: ShoppingBag, category: 'Operations' },
    { name: 'Product Catalog', href: '/dashboard/products', icon: Package, category: 'Inventory' },
    { name: 'Payments & Revenue', href: '/dashboard/payments', icon: CreditCard, category: 'Finance' },
    { name: 'System Settings', href: '/dashboard/settings', icon: Settings, category: 'Admin' },
    { name: 'Client Portal', href: '/customer', icon: LayoutDashboard, category: 'Customer' },
    { name: 'Create New Quote', href: '/dashboard/quotes/new', icon: FileText, category: 'Actions' },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onToggle();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onToggle, onClose]);

  const filtered = commands.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (href: string) => {
    router.push(href);
    onClose();
    setQuery('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#111111]/60 backdrop-blur-sm"
          />

          {/* Command Palette Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="relative w-full max-w-xl bg-white border border-[#E5E7EB] rounded-2xl shadow-2xl overflow-hidden z-10 text-[#111111]"
          >
            {/* Search Input Bar */}
            <div className="flex items-center px-5 border-b border-[#E5E7EB] bg-[#F9FAFB]">
              <Search className="w-5 h-5 text-[#3B6FEB] shrink-0 mr-3" />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a command or search modules... (Esc to close)"
                className="w-full py-4 bg-transparent text-sm text-[#111111] placeholder:text-[#9CA3AF] focus:outline-none font-medium"
              />
              <button onClick={onClose} className="p-1 text-[#9CA3AF] hover:text-[#111111] rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Results List */}
            <div className="max-h-80 overflow-y-auto p-2 space-y-1">
              {filtered.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#6B7280]">No command matching "{query}"</div>
              ) : (
                filtered.map((cmd) => {
                  const Icon = cmd.icon;
                  return (
                    <button
                      key={cmd.href}
                      onClick={() => handleSelect(cmd.href)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold text-[#111111] hover:bg-[#F9FAFB] transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-[#EEF2FF] text-[#3B6FEB] group-hover:bg-[#3B6FEB] group-hover:text-white transition-colors">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="font-bold">{cmd.name}</span>
                      </div>
                      <span className="text-[10px] text-[#6B7280] uppercase tracking-wider font-bold bg-[#F3F4F6] px-2 py-0.5 rounded-md">
                        {cmd.category}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-between text-[11px] text-[#6B7280] font-medium">
              <span className="flex items-center gap-1.5 text-[#3B6FEB] font-bold">
                <Command className="w-3.5 h-3.5 text-[#3B6FEB]" /> ZOBBRA Command Shell
              </span>
              <span>Use ↑ ↓ to navigate, Enter to select</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
