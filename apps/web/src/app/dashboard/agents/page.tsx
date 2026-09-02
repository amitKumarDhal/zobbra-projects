'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Plus, Users, UserCheck, UserPlus, TrendingUp, Award, MoreVertical, Edit2, Eye, Phone, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';

import { API_URL } from '@/lib/api';

export default function AgentsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ totalAgents: 0, activeAgents: 0, newThisMonth: 0, totalSalesThisMonth: 0, topPerformer: null, topPerformers: [] });
  
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [filterDepartment, setFilterDepartment] = useState('All Departments');
  const [filterLocation, setFilterLocation] = useState('All Locations');
  
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, pageSize: 10 });

  useEffect(() => {
    fetchData();
  }, [search, filterStatus, filterDepartment, filterLocation, page]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const qs = new URLSearchParams({ search, page: String(page) });
      if (filterStatus !== 'All Status') qs.append('status', filterStatus);
      if (filterDepartment !== 'All Departments') qs.append('department', filterDepartment);
      if (filterLocation !== 'All Locations') qs.append('location', filterLocation);

      const [resList, resStats] = await Promise.all([
        fetch(`${API_URL}/agents?${qs.toString()}`, { headers }).then(r => r.json()),
        fetch(`${API_URL}/agents/stats`, { headers }).then(r => r.json())
      ]);

      if (resList.success) {
        setAgents(resList.data || []);
        if(resList.pagination) setPagination(resList.pagination);
      }
      if (resStats.success) {
         setStats(resStats.stats);
      }
    } catch (error) {
      console.error('Failed to load agents:', error);
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  // Convert stats topPerformers into chart data
  const chartData = stats.topPerformers.map((p: any) => ({
     name: p.name.split(' ')[0],
     sales: p.total
  }));

  return (
    <div className="space-y-6 pb-12 font-sans bg-[#F8F9FC] min-h-screen relative flex flex-col">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-black text-[#111111]">Agents</h1>
          <div className="text-sm text-[#6B7280] font-medium mt-1 flex items-center gap-2">
            Dashboard <span className="text-[#D1D5DB]">&gt;</span> Agents
          </div>
        </div>
        <div className="flex gap-3">
           <Link href="/dashboard/settings" className="bg-[#3B6FEB] text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm hover:bg-[#2563EB] transition-colors flex items-center gap-2 min-h-[44px]">
             <Plus className="w-4 h-4"/> Add New Agent
           </Link>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <StatCard icon={<Users className="w-5 h-5 text-purple-600" />} iconBg="bg-purple-50" title="Total Agents" value={stats.totalAgents} sub="All agents" />
        <StatCard icon={<UserCheck className="w-5 h-5 text-green-600" />} iconBg="bg-green-50" title="Active Agents" value={stats.activeAgents} sub={`${stats.totalAgents ? Math.round((stats.activeAgents/stats.totalAgents)*100) : 0}% of total`} />
        <StatCard icon={<UserPlus className="w-5 h-5 text-orange-600" />} iconBg="bg-orange-50" title="New This Month" value={stats.newThisMonth} sub="Joined this month" />
        <StatCard icon={<TrendingUp className="w-5 h-5 text-blue-600" />} iconBg="bg-blue-50" title="Total Sales (This Month)" value={formatINR(stats.totalSalesThisMonth)} sub="+0% vs last month" />
        <StatCard icon={<Award className="w-5 h-5 text-pink-600" />} iconBg="bg-pink-50" title="Top Performer" value={stats.topPerformer ? stats.topPerformer.name : '-'} sub={stats.topPerformer ? formatINR(stats.topPerformer.total) : '-'} />
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex flex-col lg:flex-row gap-6 relative">
        {/* LIST TABLE - Left Side */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm transition-all duration-300 flex-1 overflow-hidden flex flex-col">
          {/* Toolbar */}
          <div className="p-4 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:flex-wrap gap-3 justify-between items-stretch sm:items-center bg-[#FDFDFD]">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
              <input 
                type="text" 
                placeholder="Search agents by name, email, phone..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#111111] focus:outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] shadow-sm transition-shadow"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#374151] outline-none hover:bg-[#F9FAFB]">
                <option>All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
              <select value={filterDepartment} onChange={e => setFilterDepartment(e.target.value)} className="px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#374151] outline-none hover:bg-[#F9FAFB] hidden sm:block">
                <option>All Departments</option>
                <option value="Sales">Sales</option>
                <option value="Support">Support</option>
                <option value="Admin">Admin</option>
              </select>
              <select value={filterLocation} onChange={e => setFilterLocation(e.target.value)} className="px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#374151] outline-none hover:bg-[#F9FAFB] hidden sm:block">
                <option>All Locations</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Delhi">Delhi</option>
                <option value="Bangalore">Bangalore</option>
              </select>
              <button className="flex items-center gap-2 px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm font-semibold text-[#374151] hover:bg-[#F9FAFB] transition-colors bg-white">
                <Filter className="w-4 h-4" /> Filter
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm font-semibold text-[#374151] hover:bg-[#F9FAFB] transition-colors bg-white">
                <Download className="w-4 h-4" /> Export
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="table-scroll flex-1">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#FDFDFD]">
                  <th className="px-4 py-3 w-10 text-center"><input type="checkbox" className="rounded border-gray-300" /></th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Agent</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Contact</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider text-center">Department</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider text-center">Customers</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider text-center">Orders</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider text-right">Sales (This Month)</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider text-center">Commission</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider text-center">Status</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {loading ? (
                  <tr><td colSpan={10} className="p-8 text-center text-gray-500 font-medium">Loading agents...</td></tr>
                ) : agents.length === 0 ? (
                  <tr><td colSpan={10} className="p-8 text-center flex flex-col items-center">
                    <Users className="w-12 h-12 text-gray-300 mb-2"/>
                    <p className="text-[#111111] font-bold text-sm">No agents found</p>
                    <p className="text-[#6B7280] text-xs mt-1">Adjust filters or add a new agent</p>
                  </td></tr>
                ) : agents.map((agent, index) => {
                  
                  return (
                    <tr key={agent.id} className="hover:bg-[#F9FAFB] transition-colors group">
                      <td className="px-4 py-4 text-center">
                         <input type="checkbox" className="rounded border-gray-300 w-4 h-4 text-blue-600 focus:ring-blue-600 cursor-pointer" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-xs shrink-0">
                              {agent.name.charAt(0)}
                           </div>
                           <div>
                              <p className="text-xs font-bold text-[#111111] flex items-center gap-2">
                                 {agent.name}
                                 {index === 0 && stats.topPerformer?.id === agent.id && <span className="text-[9px] font-bold text-purple-600 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded">Top</span>}
                              </p>
                              <p className="text-[10px] text-[#6B7280] mt-0.5">{agent.email}</p>
                           </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-xs font-semibold text-[#374151] flex items-center gap-1.5">
                           <Phone className="w-3 h-3 text-green-500"/>
                           {agent.phone || '-'}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <p className="text-xs text-[#4B5563]">{agent.department || agent.role}</p>
                      </td>
                      <td className="px-4 py-4 text-center text-xs font-bold text-[#111111]">{agent.customersCount}</td>
                      <td className="px-4 py-4 text-center text-xs font-bold text-[#111111]">{agent.ordersCount}</td>
                      <td className="px-4 py-4 text-right">
                        <p className="text-xs font-bold text-[#111111]">{formatINR(agent.salesThisMonth)}</p>
                        {agent.salesThisMonth > 0 && <p className="text-[10px] text-green-600 font-bold mt-0.5">↑ Paid</p>}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-xs text-gray-400 font-medium">—</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <StatusBadge status={agent.isActive ? 'ACTIVE' : 'INACTIVE'} />
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link href={`/dashboard/agents/${agent.id}`} className="p-1.5 text-[#6B7280] hover:text-[#111111] hover:bg-[#F3F4F6] rounded" title="View"><Eye className="w-3.5 h-3.5" /></Link>
                          <button className="p-1.5 text-[#6B7280] hover:text-[#111111] hover:bg-[#F3F4F6] rounded" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button className="p-1.5 text-[#6B7280] hover:text-[#111111] hover:bg-[#F3F4F6] rounded" title="Options"><MoreVertical className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="p-4 border-t border-[#E5E7EB] flex justify-between items-center text-xs text-[#6B7280] bg-[#FDFDFD]">
            <span>Showing {(page - 1) * pagination.pageSize + 1} to {Math.min(page * pagination.pageSize, pagination.total)} of {pagination.total} agents</span>
            <div className="flex gap-1 items-center">
              <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-2 py-1 border border-[#E5E7EB] rounded hover:bg-[#F3F4F6] disabled:opacity-50">&lt;</button>
              <span className="px-3 font-semibold text-[#111111] bg-blue-50 text-blue-700 py-1 rounded">{page}</span>
              <button disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)} className="px-2 py-1 border border-[#E5E7EB] rounded hover:bg-[#F3F4F6] disabled:opacity-50">&gt;</button>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR - Charts & Top Performers */}
        <div className="w-full lg:w-[320px] flex flex-col gap-6 shrink-0">
           
           {/* Performance Chart Card */}
           <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-[#111111] mb-6">Agent Performance (This Month)</h3>
              <div className="h-[200px] w-full">
                 {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                          <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                          <YAxis tickFormatter={(val) => `₹${(val/100000).toFixed(1)}L`} tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                          <Tooltip formatter={(value: any) => [formatINR(Number(value)), 'Sales']} cursor={{ fill: '#F3F4F6' }} />
                          <Bar dataKey="sales" fill="#3B6FEB" radius={[4, 4, 0, 0]} maxBarSize={30}>
                          </Bar>
                       </BarChart>
                    </ResponsiveContainer>
                 ) : (
                    <div className="h-full flex items-center justify-center text-sm text-gray-400 font-medium">No sales data this month</div>
                 )}
              </div>
           </div>

           {/* Top Performers List */}
           <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold text-[#111111]">Top Performers</h3>
                 <button className="text-[10px] font-bold text-[#3B6FEB] hover:underline">View All</button>
              </div>
              <div className="space-y-4">
                 {stats.topPerformers.map((p: any, i: number) => (
                    <div key={p.id} className="flex items-center gap-3">
                       <span className="text-xs font-bold text-gray-400 w-3">{i+1}</span>
                       <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-600 shrink-0">
                          {p.name.charAt(0)}
                       </div>
                       <p className="text-xs font-bold text-[#111111] flex-1 truncate">{p.name}</p>
                       <p className="text-xs font-bold text-[#111111] shrink-0">{formatINR(p.total)}</p>
                    </div>
                 ))}
                 {stats.topPerformers.length === 0 && <p className="text-xs text-gray-500 text-center">No active performers</p>}
              </div>
           </div>

           {/* Quick Actions */}
           <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-[#111111] mb-4">Quick Actions</h3>
              <div className="grid grid-cols-4 gap-2 text-center">
                 <Link href="/dashboard/settings" className="flex flex-col items-center gap-1 p-2 rounded hover:bg-gray-50 group">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors"><UserPlus className="w-4 h-4 text-blue-600"/></div>
                    <span className="text-[9px] font-bold text-gray-600">Add Agent</span>
                 </Link>
                 <button className="flex flex-col items-center gap-1 p-2 rounded hover:bg-gray-50 group">
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center border border-gray-200 group-hover:bg-gray-100 transition-colors"><CheckCircle2 className="w-4 h-4 text-gray-600"/></div>
                    <span className="text-[9px] font-bold text-gray-600">Agent Report</span>
                 </button>
                 <button className="flex flex-col items-center gap-1 p-2 rounded hover:bg-gray-50 group opacity-50 cursor-not-allowed" title="Not Implemented">
                    <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors"><Award className="w-4 h-4 text-purple-600"/></div>
                    <span className="text-[9px] font-bold text-gray-600">Commission</span>
                 </button>
                 <button className="flex flex-col items-center gap-1 p-2 rounded hover:bg-gray-50 group">
                    <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors"><TrendingUp className="w-4 h-4 text-green-600"/></div>
                    <span className="text-[9px] font-bold text-gray-600">Performance</span>
                 </button>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}


