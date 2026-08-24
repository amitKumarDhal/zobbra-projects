'use client';

import React from 'react';
import { Building2, GraduationCap, Briefcase, Utensils } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export default function IndustriesPage() {
  const list = [
    { title: 'Corporate Tech & IT', icon: Building2, desc: 'Employee welcome kits, onboarding boxes & Polo t-shirts for corporate teams.' },
    { title: 'Colleges & Universities', icon: GraduationCap, desc: 'Fest hoodies, batch t-shirts, snapback caps & club merchandise.' },
    { title: 'Retail & Startups', icon: Briefcase, desc: 'Promotional giveaways, uniform shirts & custom printed tote bags.' },
    { title: 'Hospitality & Events', icon: Utensils, desc: 'Staff aprons, embroidered uniforms & event thermal drinkware.' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div>
        <Badge variant="default" className="mb-2">SECTORS</Badge>
        <h1 className="text-3xl font-black text-white">Industries We Serve</h1>
        <p className="text-slate-400 text-xs mt-1">Custom merchandise solutions tailored to your industry requirements.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {list.map((item, i) => {
          const Icon = item.icon;
          return (
            <Card key={i} className="bg-slate-900 border-slate-800 p-8 space-y-4">
              <div className="w-12 h-12 bg-blue-600/10 text-blue-400 rounded-2xl flex items-center justify-center">
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-xl">{item.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
