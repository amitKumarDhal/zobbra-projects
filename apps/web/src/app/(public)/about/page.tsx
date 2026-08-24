'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export default function AboutPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div>
        <Badge variant="default" className="mb-2">ABOUT ZOBBRA</Badge>
        <h1 className="text-3xl font-black text-white">Modern B2B Merchandise SaaS</h1>
        <p className="text-slate-400 text-xs mt-1">Empowering garment printers, corporate gift providers & clients.</p>
      </div>

      <Card className="bg-slate-900 border-slate-800 p-8 space-y-4 text-slate-300 text-xs leading-relaxed">
        <p>
          ZOBBRA is a specialized B2B Merchandise Management SaaS designed specifically for Indian printing, garment, and corporate gifting businesses. We streamline the complete merchandise lifecycle from enquiry to quote generation, order processing, printing pipeline, and dispatch.
        </p>
        <p>
          Headquartered in Bhubaneswar, Odisha, ZOBBRA combines precision DTF printing, 3D computerized embroidery, and automated GST billing tools for modern corporate gifting.
        </p>
      </Card>
    </div>
  );
}
