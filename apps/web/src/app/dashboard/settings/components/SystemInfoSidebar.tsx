import React from 'react';
import { HardDrive, RotateCw, Activity } from 'lucide-react';

export default function SystemInfoSidebar({ info, health, cloudinary }: any) {
  return (
    <div className="space-y-6">
      {/* System Information Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden">
        <div className="p-5 border-b border-[#E5E7EB]">
          <h3 className="text-[15px] font-bold text-[#111111]">System Information</h3>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-[#6B7280]">Application</span>
            <span className="text-xs font-semibold text-[#111111]">ZOBBRA</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-[#6B7280]">Version</span>
            <span className="text-xs font-semibold text-[#111111]">{info?.version || 'v1.0.0'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-[#6B7280]">Environment</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              info?.environment === 'Production' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
            }`}>
              {info?.environment || 'Development'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-[#6B7280]">Last Updated</span>
            <span className="text-xs font-semibold text-[#111111]">
              {info?.lastUpdated ? new Date(info.lastUpdated).toLocaleDateString() : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-[#6B7280]">Server Time</span>
            <span className="text-xs font-semibold text-[#111111]">
              {info?.serverTime ? new Date(info.serverTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-[#6B7280]">Node.js</span>
            <span className="text-xs font-semibold text-[#111111]">{info?.nodeVersion || 'v18+'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-[#6B7280]">Database</span>
            <span className="text-xs font-semibold text-[#111111]">{info?.database || 'PostgreSQL'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-[#6B7280]">ORM</span>
            <span className="text-xs font-semibold text-[#111111]">{info?.orm || 'Prisma'}</span>
          </div>
        </div>
      </div>

      {/* Storage Information Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden">
        <div className="p-5 border-b border-[#E5E7EB]">
          <h3 className="text-[15px] font-bold text-[#111111]">Storage Usage</h3>
        </div>
        <div className="p-5">
          {cloudinary ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-[#111111]">Cloudinary (Configured)</span>
                <span className="text-[#6B7280]">Active</span>
              </div>
              <div className="w-full bg-[#F3F4F6] rounded-full h-1.5">
                <div className="bg-[#3B6FEB] h-1.5 rounded-full" style={{ width: '45%' }}></div>
              </div>
              <p className="text-[10px] text-center text-[#3B6FEB] font-medium cursor-pointer hover:underline mt-2">
                Manage Storage
              </p>
            </div>
          ) : (
            <p className="text-xs text-[#6B7280] text-center">Storage information unavailable</p>
          )}
        </div>
      </div>

      {/* Quick Actions Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden">
        <div className="p-5 border-b border-[#E5E7EB]">
          <h3 className="text-[15px] font-bold text-[#111111]">Quick Actions</h3>
        </div>
        <div className="p-2">
          <button className="w-full flex items-center gap-3 p-3 hover:bg-[#F9FAFB] rounded-xl transition-colors text-left group">
            <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors text-green-600">
              <RotateCw className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#111111]">Clear Cache</p>
              <p className="text-[10px] text-[#6B7280]">Improve system performance</p>
            </div>
          </button>

          <button className="w-full flex items-center gap-3 p-3 hover:bg-[#F9FAFB] rounded-xl transition-colors text-left group">
            <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors text-purple-600">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#111111]">System Backup</p>
              <p className="text-[10px] text-[#6B7280]">Backup functionality is not configured</p>
            </div>
          </button>

          <div className="w-full h-px bg-[#F3F4F6] my-1" />

          {/* System Health */}
          <div className="p-3">
             <p className="text-xs font-bold text-[#111111] mb-3 flex items-center gap-1.5">
               <Activity className="w-3.5 h-3.5 text-[#6B7280]" /> System Health
             </p>
             <div className="space-y-2">
               <div className="flex items-center justify-between">
                 <span className="text-[11px] text-[#6B7280]">API</span>
                 <span className="text-[10px] font-bold text-green-600 flex items-center gap-1">
                   <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> {health?.api || 'Healthy'}
                 </span>
               </div>
               <div className="flex items-center justify-between">
                 <span className="text-[11px] text-[#6B7280]">PostgreSQL</span>
                 <span className={`text-[10px] font-bold flex items-center gap-1 ${health?.database === 'Connected' ? 'text-green-600' : 'text-red-600'}`}>
                   <span className={`w-1.5 h-1.5 rounded-full ${health?.database === 'Connected' ? 'bg-green-500' : 'bg-red-500'}`}></span> {health?.database || 'Connected'}
                 </span>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
