'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Building, Users, Shield, Bell, CreditCard, Mail, Database, Activity, Lock } from 'lucide-react';
import GeneralSettings from './components/GeneralSettings';
import CompanySettings from './components/CompanySettings';
import SecuritySettings from './components/SecuritySettings';
import PaymentEmailSettings from './components/PaymentEmailSettings';
import ActivityLog from './components/ActivityLog';
import SystemInfoSidebar from './components/SystemInfoSidebar';
import { API_URL } from '@/lib/api';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [settingsData, setSettingsData] = useState<any>({});
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        
        const [settingsRes, infoRes, healthRes] = await Promise.all([
          fetch(`${API_URL}/settings`, { headers }),
          fetch(`${API_URL}/settings/info`, { headers }),
          fetch(`${API_URL}/settings/health`, { headers })
        ]);

        const settingsJson = await settingsRes.json();
        const infoJson = await infoRes.json();
        const healthJson = await healthRes.json();

        if (settingsJson.success) {
          const map: any = {};
          settingsJson.settings.forEach((s: any) => {
            try {
              map[s.key] = JSON.parse(s.value);
            } catch (e) {
              map[s.key] = s.value;
            }
          });
          map.cloudinaryConfigured = settingsJson.cloudinaryConfigured;
          map.resendConfigured = settingsJson.resendConfigured;
          map.razorpayConfigured = settingsJson.razorpayConfigured ?? true;
          setSettingsData(map);
        }

        if (infoJson.success) setSystemInfo(infoJson.info);
        if (healthJson.success || healthJson.health) setSystemHealth(healthJson.health);
        
      } catch (err) {
        console.error('Error fetching settings', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSaveSetting = async (key: string, value: any) => {
    const token = localStorage.getItem('token');
    await fetch(`${API_URL}/settings`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ key, value })
    });
    setSettingsData((prev: any) => ({ ...prev, [key]: value }));
  };

  const tabs = [
    { id: 'general', label: 'General', desc: 'Basic system settings', icon: Settings },
    { id: 'company', label: 'Company Profile', desc: 'Your business information', icon: Building },
    { id: 'users', label: 'User Management', desc: 'Manage users and roles', icon: Users },
    { id: 'roles', label: 'Roles & Permissions', desc: 'Manage roles and permissions', icon: Shield },
    { id: 'notifications', label: 'Notifications', desc: 'Email and system notifications', icon: Bell },
    { id: 'payment', label: 'Payment Settings', desc: 'Payment methods and gateways', icon: CreditCard },
    { id: 'email', label: 'Email Settings', desc: 'Configure email settings', icon: Mail },
    { id: 'security', label: 'Security', desc: 'Password and security settings', icon: Lock },
    { id: 'backup', label: 'Backup & Restore', desc: 'Backup and restore data', icon: Database },
    { id: 'activity', label: 'Activity Log', desc: 'View all system activities', icon: Activity },
  ];

  if (loading) {
    return <div className="p-12 text-center text-gray-500 font-medium">Loading settings...</div>;
  }

  return (
    <div className="space-y-6 pb-12 font-sans bg-[#F8F9FC] min-h-screen">
      <div>
        <h1 className="text-[28px] font-heading font-black text-[#111111]">Settings</h1>
        <div className="text-sm text-[#6B7280] font-medium mt-1 flex items-center gap-2">
          Dashboard <span className="text-gray-300">/</span> Settings
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Settings Navigation Sidebar */}
        <div className="lg:col-span-3 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-left ${
                  isActive
                    ? 'bg-[#EBF1FF] text-[#3B6FEB]'
                    : 'text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111111]'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-white shadow-sm ${isActive ? 'text-[#3B6FEB]' : 'text-[#6B7280]'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className={`text-[13px] font-bold ${isActive ? 'text-[#3B6FEB]' : 'text-[#111111]'}`}>{tab.label}</p>
                  <p className={`text-[10px] ${isActive ? 'text-[#3B6FEB]/80' : 'text-[#6B7280]'}`}>{tab.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Settings Content Area */}
        <div className="lg:col-span-6">
          {activeTab === 'general' && <GeneralSettings settings={settingsData} onSave={handleSaveSetting} />}
          {activeTab === 'company' && <CompanySettings settings={settingsData} onSave={handleSaveSetting} />}
          {activeTab === 'security' && <SecuritySettings />}
          {activeTab === 'activity' && <ActivityLog />}
          {(activeTab === 'payment' || activeTab === 'email') && <PaymentEmailSettings settings={settingsData} />}
          
          {['users', 'roles', 'notifications', 'backup'].includes(activeTab) && (
            <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-12 text-center">
              <IconWrapper icon={tabs.find(t => t.id === activeTab)?.icon} />
              <h2 className="text-lg font-bold text-[#111111] mt-4">{tabs.find(t => t.id === activeTab)?.label}</h2>
              <p className="text-sm text-[#6B7280] mt-2">This section is currently under construction.</p>
            </div>
          )}
        </div>

        {/* Right System Information Sidebar */}
        <div className="lg:col-span-3">
          <SystemInfoSidebar 
            info={systemInfo} 
            health={systemHealth} 
            cloudinary={settingsData.cloudinaryConfigured} 
          />
        </div>
      </div>
    </div>
  );
}

function IconWrapper({ icon: Icon }: { icon: any }) {
  if (!Icon) return null;
  return (
    <div className="w-16 h-16 mx-auto bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mb-4">
      <Icon className="w-8 h-8" />
    </div>
  );
}
