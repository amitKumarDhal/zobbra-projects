'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Phone, Mail, Building, MapPin, CheckCircle2, TrendingUp, Users, FileText, ShoppingBag, MessageSquare, AlertCircle } from 'lucide-react';
import Link from 'next/link';

const API_URL = 'http://localhost:5000/api/v1';

export default function AgentDetailPage({ params }: { params: { id: string } }) {
  const [agent, setAgent] = useState<any>(null);
  const [performance, setPerformance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');

  useEffect(() => {
    fetchAgent();
  }, [params.id]);

  const fetchAgent = async () => {
    try {
      const res = await fetch(`${API_URL}/agents/${params.id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      }).then(r => r.json());
      
      if (res.success) {
        setAgent(res.agent);
        setPerformance(res.performance);
      }
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
  };

  if (loading) return <div className="p-8 text-center text-gray-500 font-medium">Loading agent details...</div>;
  if (!agent) return <div className="p-8 text-center text-red-500 font-medium">Agent not found</div>;

  return (
    <div className="space-y-6 pb-12 font-sans bg-[#F8F9FC] min-h-screen relative flex flex-col">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/dashboard/agents" className="inline-flex items-center gap-2 text-sm font-bold text-[#3B6FEB] hover:underline mb-2">
            <ArrowLeft className="w-4 h-4" /> Back to Agents
          </Link>
          <h1 className="text-3xl font-heading font-black text-[#111111]">Agent Profile</h1>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* LEFT COLUMN - Profile */}
        <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0">
           {/* Profile Card */}
           <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-4xl font-black text-blue-700 mb-4 border-4 border-white shadow-md">
                 {agent.name.charAt(0)}
              </div>
              <h2 className="text-xl font-black text-[#111111]">{agent.name}</h2>
              <p className="text-sm font-bold text-[#6B7280] uppercase tracking-wider">{agent.department || agent.role}</p>
              
              <div className="mt-4 flex gap-2">
                 <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${
                     agent.isActive ? 'text-green-700 bg-green-50 border-green-200' : 'text-gray-600 bg-gray-50 border-gray-200'
                  }`}>
                    {agent.isActive ? '● Active' : '○ Inactive'}
                 </span>
                 <span className="text-[10px] font-bold px-3 py-1 rounded-full border text-blue-700 bg-blue-50 border-blue-200">
                    {agent.role}
                 </span>
              </div>

              <div className="w-full mt-6 space-y-4 text-left border-t border-[#E5E7EB] pt-6">
                 <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <div>
                       <p className="text-[10px] font-bold text-gray-500 uppercase">Email Address</p>
                       <p className="text-sm font-semibold text-gray-900">{agent.email}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <div>
                       <p className="text-[10px] font-bold text-gray-500 uppercase">Phone Number</p>
                       <p className="text-sm font-semibold text-gray-900">{agent.phone || 'Not provided'}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <div>
                       <p className="text-[10px] font-bold text-gray-500 uppercase">Location</p>
                       <p className="text-sm font-semibold text-gray-900">{agent.location || 'Head Office'}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-gray-400" />
                    <div>
                       <p className="text-[10px] font-bold text-gray-500 uppercase">Joined Date</p>
                       <p className="text-sm font-semibold text-gray-900">{new Date(agent.createdAt).toLocaleDateString()}</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* RIGHT COLUMN - Performance & Tabs */}
        <div className="flex-1 flex flex-col gap-6">
           
           {/* Performance Summary Grid */}
           <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
              <MetricCard icon={<Users className="text-blue-600"/>} title="Customers" value={performance.customersCount} bg="bg-blue-50" />
              <MetricCard icon={<MessageSquare className="text-purple-600"/>} title="Inquiries" value={performance.inquiriesCount} bg="bg-purple-50" />
              <MetricCard icon={<FileText className="text-orange-600"/>} title="Quotes" value={performance.quotesCount} bg="bg-orange-50" />
              <MetricCard icon={<ShoppingBag className="text-green-600"/>} title="Orders" value={performance.ordersCount} bg="bg-green-50" />
              <MetricCard icon={<TrendingUp className="text-pink-600"/>} title="Conversion" value={`${performance.conversionRate}%`} bg="bg-pink-50" />
              <MetricCard icon={<TrendingUp className="text-indigo-600"/>} title="Revenue" value={formatINR(performance.totalRevenue)} bg="bg-indigo-50" />
           </div>

           {/* Content Tabs */}
           <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col">
              <div className="flex overflow-x-auto border-b border-[#E5E7EB] bg-[#FDFDFD]">
                 {['Overview', 'Customers', 'Inquiries', 'Quotes', 'Orders', 'Activities'].map(tab => (
                    <button 
                       key={tab}
                       onClick={() => setActiveTab(tab)}
                       className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                          activeTab === tab ? 'border-[#3B6FEB] text-[#3B6FEB]' : 'border-transparent text-[#6B7280] hover:text-[#111111]'
                       }`}
                    >
                       {tab}
                    </button>
                 ))}
              </div>
              
              <div className="p-6 flex-1 bg-white">
                 {activeTab === 'Overview' && (
                    <div className="space-y-6">
                       <h3 className="text-lg font-bold text-[#111111]">Performance Overview</h3>
                       <p className="text-sm text-[#4B5563]">
                          This agent manages {performance.customersCount} unique customers, resulting in {performance.quotesCount} quotes. 
                          Their order conversion rate is {performance.conversionRate}% based on {performance.ordersCount} completed orders.
                       </p>
                       <div className="p-8 border border-dashed border-gray-300 rounded-xl bg-gray-50 text-center">
                          <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500 font-semibold text-sm">Detailed performance graphs will appear here.</p>
                       </div>
                    </div>
                 )}

                 {(activeTab === 'Customers' || activeTab === 'Inquiries' || activeTab === 'Quotes' || activeTab === 'Orders' || activeTab === 'Activities') && (
                    <div className="h-full flex flex-col items-center justify-center py-12 text-center">
                       <AlertCircle className="w-16 h-16 text-gray-200 mb-4" />
                       <h3 className="text-lg font-bold text-[#111111]">{activeTab} Details</h3>
                       <p className="text-sm text-[#6B7280] mt-2 max-w-sm">
                          Use the main {activeTab} module and filter by this agent to view their complete list of records.
                       </p>
                       <Link href={`/dashboard/${activeTab.toLowerCase()}`} className="mt-6 bg-white border border-[#E5E7EB] text-[#374151] px-5 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-[#F9FAFB] transition-colors">
                          Go to {activeTab} Module
                       </Link>
                    </div>
                 )}
              </div>
           </div>

        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, title, value, bg }: any) {
   return (
      <div className="bg-white border border-[#E5E7EB] p-4 rounded-xl shadow-sm flex flex-col justify-center gap-2">
         <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded flex items-center justify-center ${bg}`}>{React.cloneElement(icon, { className: 'w-3.5 h-3.5' })}</div>
            <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">{title}</p>
         </div>
         <p className="text-xl font-heading font-black text-[#111111] truncate">{value}</p>
      </div>
   )
}
