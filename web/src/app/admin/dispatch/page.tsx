'use client';

import React, { useState } from 'react';
import { Truck, ExternalLink, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

export default function AdminDispatchPage() {
  const [isShipOpen, setIsShipOpen] = useState(false);

  const shipments = [
    {
      shipmentNumber: 'SHP-ZB-2026-1001',
      orderNumber: 'ZQB-ORD-2026-5001',
      courier: 'BlueDart Express',
      trackingNumber: 'BLUEDART-88997766',
      status: 'DISPATCHED',
      dispatchedAt: '05 Aug 2026',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Dispatch & Shipping</h1>
          <p className="text-xs text-slate-500 font-semibold">Generate shipment tracking numbers, select couriers & update delivery status.</p>
        </div>
        <Button variant="secondary" onClick={() => setIsShipOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> CREATE SHIPMENT
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 custom-shadow overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
            <tr>
              <th className="p-4">Shipment #</th>
              <th className="p-4">Order #</th>
              <th className="p-4">Courier Name</th>
              <th className="p-4">Tracking Number</th>
              <th className="p-4">Status</th>
              <th className="p-4">Dispatched Date</th>
              <th className="p-4 text-right">Track Link</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {shipments.map((s) => (
              <tr key={s.shipmentNumber} className="hover:bg-slate-50">
                <td className="p-4 font-bold text-slate-900 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-blue-600" /> {s.shipmentNumber}
                </td>
                <td className="p-4 font-mono text-slate-500">{s.orderNumber}</td>
                <td className="p-4 font-bold text-slate-900">{s.courier}</td>
                <td className="p-4 font-mono text-blue-600">{s.trackingNumber}</td>
                <td className="p-4">
                  <Badge variant="info">{s.status}</Badge>
                </td>
                <td className="p-4 text-slate-400">{s.dispatchedAt}</td>
                <td className="p-4 text-right">
                  <a
                    href={`https://www.bluedart.com/tracking/${s.trackingNumber}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 font-bold hover:underline inline-flex items-center gap-1"
                  >
                    Track <ExternalLink className="w-3 h-3" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isShipOpen} onClose={() => setIsShipOpen(false)} title="Dispatch Order & Assign Tracking">
        <form onSubmit={(e) => { e.preventDefault(); setIsShipOpen(false); }} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Order</label>
            <select className="w-full px-3 py-2 border rounded-lg text-sm">
              <option>ZQB-ORD-2026-5001 (Acme Tech - 100 Polo T-Shirts)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Courier Partner</label>
            <select className="w-full px-3 py-2 border rounded-lg text-sm">
              <option>BlueDart Express</option>
              <option>Delhivery Surface</option>
              <option>DTDC Air Courier</option>
              <option>Express Logistics Odisha</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">AWB / Tracking Number</label>
            <input type="text" required placeholder="e.g. BLUEDART-88997766" className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <Button type="submit" variant="secondary" className="w-full py-3 font-bold">
            CONFIRM DISPATCH & NOTIFY CLIENT
          </Button>
        </form>
      </Modal>
    </div>
  );
}
