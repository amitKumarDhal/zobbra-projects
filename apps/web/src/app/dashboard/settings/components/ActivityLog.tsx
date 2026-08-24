import React, { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
import { API_URL } from '@/lib/api';

export default function ActivityLog() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/settings/activity`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success) {
          setLogs(json.activities);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB]">
      <div className="p-6 border-b border-[#E5E7EB] flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#111111]">Activity Log</h2>
          <p className="text-sm text-[#6B7280]">Recent system configuration changes and administrative actions</p>
        </div>
      </div>
      
      <div className="p-0">
        {loading ? (
          <div className="p-8 text-center text-sm text-[#6B7280]">Loading activities...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#6B7280]">No activities recorded yet.</div>
        ) : (
          <div className="divide-y divide-[#E5E7EB]">
            {logs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-[#F9FAFB] transition-colors flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0 mt-1">
                  {log.user?.name?.charAt(0).toUpperCase() || 'S'}
                </div>
                <div>
                  <p className="text-sm text-[#111111]">
                    <span className="font-bold">{log.user?.name || 'System'}</span> {log.message}
                  </p>
                  <p className="text-xs text-[#6B7280] mt-1 flex items-center gap-2">
                    <span>{new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString()}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                    <span className="font-medium text-gray-500">{log.action}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
