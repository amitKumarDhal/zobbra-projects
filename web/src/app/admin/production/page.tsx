'use client';

import React, { useState } from 'react';
import { Kanban, Clock, CheckCircle2, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function AdminProductionPage() {
  const [stages, setStages] = useState({
    PENDING: [
      { id: 'JOB-102', order: 'ZQB-ORD-2026-5002', item: '50 Cotton Caps (3D Embroidery)', customer: 'Zepto Logistics' },
    ],
    PRINTING: [
      { id: 'JOB-101', order: 'ZQB-ORD-2026-5001', item: '100 Polo T-Shirts (DTF Both Sides)', customer: 'Acme Tech', assigned: 'Amitav (Print Lead)' },
    ],
    QUALITY_CHECK: [],
    PACKING: [],
    READY_TO_DISPATCH: [],
  });

  const moveJob = (fromStage: keyof typeof stages, toStage: keyof typeof stages, job: any) => {
    setStages((prev) => ({
      ...prev,
      [fromStage]: prev[fromStage].filter((j) => j.id !== job.id),
      [toStage]: [...prev[toStage], job],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Production Kanban Board</h1>
          <p className="text-xs text-slate-500 font-semibold">Track garment printing & embroidery workflow stages in real-time.</p>
        </div>
      </div>

      {/* 5 Column Kanban Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[
          { key: 'PENDING', title: '1. Pending', color: 'border-slate-300 bg-slate-100' },
          { key: 'PRINTING', title: '2. Printing', color: 'border-amber-400 bg-amber-50' },
          { key: 'QUALITY_CHECK', title: '3. Quality Check', color: 'border-blue-400 bg-blue-50' },
          { key: 'PACKING', title: '4. Packing', color: 'border-purple-400 bg-purple-50' },
          { key: 'READY_TO_DISPATCH', title: '5. Ready to Dispatch', color: 'border-emerald-400 bg-emerald-50' },
        ].map((col) => {
          const jobs = stages[col.key as keyof typeof stages];
          return (
            <div key={col.key} className={`p-4 rounded-2xl border-2 ${col.color} min-h-[450px] space-y-3`}>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <h3 className="font-bold text-slate-900 text-xs uppercase">{col.title}</h3>
                <span className="w-5 h-5 bg-white font-bold text-xs rounded-full flex items-center justify-center border text-slate-700">
                  {jobs.length}
                </span>
              </div>

              {jobs.map((job) => (
                <div key={job.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-2">
                  <span className="text-[10px] font-bold text-blue-600 block">{job.order}</span>
                  <h4 className="font-bold text-slate-900 text-xs">{job.item}</h4>
                  <p className="text-[11px] text-slate-500 font-medium">{job.customer}</p>

                  {job.assigned && (
                    <p className="text-[10px] text-slate-400 flex items-center gap-1 font-bold pt-1">
                      <UserCheck className="w-3 h-3 text-emerald-600" /> {job.assigned}
                    </p>
                  )}

                  {/* Stage Advancement Quick Action */}
                  <div className="pt-2 flex justify-end">
                    {col.key === 'PENDING' && (
                      <Button size="sm" variant="secondary" onClick={() => moveJob('PENDING', 'PRINTING', job)}>
                        Start Printing →
                      </Button>
                    )}
                    {col.key === 'PRINTING' && (
                      <Button size="sm" variant="secondary" onClick={() => moveJob('PRINTING', 'QUALITY_CHECK', job)}>
                        Send to QC →
                      </Button>
                    )}
                    {col.key === 'QUALITY_CHECK' && (
                      <Button size="sm" variant="secondary" onClick={() => moveJob('QUALITY_CHECK', 'PACKING', job)}>
                        Pass QC & Pack →
                      </Button>
                    )}
                    {col.key === 'PACKING' && (
                      <Button size="sm" variant="secondary" onClick={() => moveJob('PACKING', 'READY_TO_DISPATCH', job)}>
                        Ready to Ship →
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
