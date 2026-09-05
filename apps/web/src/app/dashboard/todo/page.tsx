'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Plus, CheckCircle2, Clock, Calendar as CalendarIcon, User, RefreshCw, MoreVertical, Edit2, Trash2, ArrowRight, X, Phone } from 'lucide-react';
import Link from 'next/link';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';

import { API_URL } from '@/lib/api';
import { triggerSidebarCountsRefresh } from '@/hooks/useAdminSidebarCounts';

export default function TodoPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ total: 0, pending: 0, dueToday: 0, overdue: 0, completed: 0 });
  const [users, setUsers] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [filterPriority, setFilterPriority] = useState('All Priority');
  const [filterAssignee, setFilterAssignee] = useState('All Assignees');
  const [filterCategory, setFilterCategory] = useState('All Categories');
  
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, pageSize: 10 });

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'ADD' | 'DETAIL'>('ADD');
  const [selectedTask, setSelectedTask] = useState<any>(null);

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    // Fetch users for assignees
    fetch(`${API_URL}/customers?search=ADMIN`) // Ideally a real /users API, but we'll adapt from what exists, or just use auth context.
       .catch(() => {});
  }, []);

  useEffect(() => {
    fetchData();
  }, [search, filterStatus, filterPriority, filterAssignee, filterCategory, page]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('zobra_token') : null;
      const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};

      const qs = new URLSearchParams({ search, page: String(page) });
      if (filterStatus !== 'All Status') qs.append('status', filterStatus);
      if (filterPriority !== 'All Priority') qs.append('priority', filterPriority);
      if (filterAssignee !== 'All Assignees') qs.append('assigneeId', filterAssignee);
      if (filterCategory !== 'All Categories') qs.append('category', filterCategory);

      const [resList, resStats] = await Promise.all([
        fetch(`${API_URL}/tasks?${qs.toString()}`, { headers }).then(r => r.json()),
        fetch(`${API_URL}/tasks/stats`, { headers }).then(r => r.json())
      ]);

      if (resList.success) {
        setTasks(resList.data || []);
        if(resList.pagination) setPagination(resList.pagination);
      }
      if (resStats.success) {
         const s = resStats.stats;
         setStats({
            total: s.total || 0,
            pending: s.pending || 0,
            dueToday: s.dueToday || 0,
            overdue: s.overdue || 0,
            completed: s.completed || 0
         });
         triggerSidebarCountsRefresh();
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('zobra_token') : null;
      await fetch(`${API_URL}/tasks/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ status: newStatus })
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const openAdd = () => {
    setDrawerMode('ADD');
    setSelectedTask(null);
    setIsDrawerOpen(true);
  };

  const openDetail = (task: any) => {
    setDrawerMode('DETAIL');
    setSelectedTask(task);
    setIsDrawerOpen(true);
  };

  // UI Helpers
  const getPriorityColor = (priority: string) => {
     switch(priority) {
        case 'URGENT': return 'text-red-700 bg-red-50 border-red-200';
        case 'HIGH': return 'text-red-600 bg-red-50 border-red-100';
        case 'MEDIUM': return 'text-amber-600 bg-amber-50 border-amber-100';
        case 'LOW': return 'text-green-600 bg-green-50 border-green-100';
        default: return 'text-gray-600 bg-gray-50 border-gray-200';
     }
  };

  return (
    <div className="space-y-6 pb-12 font-sans bg-[#F8F9FC] min-h-screen relative flex flex-col">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-black text-[#111111]">To Do</h1>
          <div className="text-sm text-[#6B7280] font-medium mt-1 flex items-center gap-2">
            Dashboard <span className="text-[#D1D5DB]">&gt;</span> To Do
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
           <button className="bg-white border border-[#E5E7EB] text-[#374151] px-4 py-2.5 rounded-lg text-sm font-bold shadow-sm hover:bg-[#F9FAFB] transition-colors flex items-center gap-2 min-h-[44px]">
             <Download className="w-4 h-4"/> Export
           </button>
           <button onClick={openAdd} className="bg-[#3B6FEB] text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm hover:bg-[#2563EB] transition-colors flex items-center gap-2 min-h-[44px]">
             <Plus className="w-4 h-4"/> New Task
           </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <StatCard icon={<CheckCircle2 className="w-5 h-5 text-blue-600" />} iconBg="bg-blue-50" title="Total Tasks" value={stats.total} sub="All tasks" />
        <StatCard icon={<Clock className="w-5 h-5 text-amber-600" />} iconBg="bg-amber-50" title="Pending" value={stats.pending} sub={`${stats.total ? Math.round((stats.pending/stats.total)*100) : 0}% of total`} />
        <StatCard icon={<CalendarIcon className="w-5 h-5 text-purple-600" />} iconBg="bg-purple-50" title="Due Today" value={stats.dueToday} sub="Tasks due today" />
        <StatCard icon={<CalendarIcon className="w-5 h-5 text-red-600" />} iconBg="bg-red-50" title="Overdue" value={stats.overdue} sub="Past due tasks" />
        <StatCard icon={<CheckCircle2 className="w-5 h-5 text-green-600" />} iconBg="bg-green-50" title="Completed" value={stats.completed} sub={`${stats.total ? Math.round((stats.completed/stats.total)*100) : 0}% of total`} />
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
                placeholder="Search tasks, customers, orders..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#111111] focus:outline-none focus:border-[#3B6FEB] focus:ring-1 focus:ring-[#3B6FEB] shadow-sm transition-shadow"
              />
            </div>
            <div className="flex items-center gap-2">
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#374151] outline-none hover:bg-[#F9FAFB]">
                <option>All Status</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="OVERDUE">Overdue</option>
              </select>
              <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#374151] outline-none hover:bg-[#F9FAFB] hidden sm:block">
                <option>All Priority</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#374151] outline-none hover:bg-[#F9FAFB] hidden sm:block">
                <option>All Categories</option>
                <option value="FOLLOW_UP">Follow Up</option>
                <option value="QUOTE">Quote</option>
                <option value="ORDER">Order</option>
                <option value="PAYMENT">Payment</option>
              </select>
              <button className="flex items-center gap-2 px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm font-semibold text-[#374151] hover:bg-[#F9FAFB] transition-colors bg-white">
                <Filter className="w-4 h-4" /> Filter
              </button>
              <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#3B6FEB] hover:bg-blue-50 rounded-lg transition-colors bg-white">
                <RefreshCw className="w-4 h-4" /> Reset
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="table-scroll flex-1">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#FDFDFD]">
                  <th className="px-4 py-3 w-10 text-center"><input type="checkbox" className="rounded border-gray-300" /></th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Task</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Related To</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Assignee</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider text-center">Priority</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Due Date</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {loading ? (
                  <tr><td colSpan={9} className="p-8 text-center text-gray-500 font-medium">Loading tasks...</td></tr>
                ) : tasks.length === 0 ? (
                  <tr><td colSpan={9} className="p-8 text-center flex flex-col items-center">
                    <CheckCircle2 className="w-12 h-12 text-gray-300 mb-2"/>
                    <p className="text-[#111111] font-bold text-sm">No tasks yet</p>
                    <p className="text-[#6B7280] text-xs mt-1">Create a first follow-up task</p>
                  </td></tr>
                ) : tasks.map((t) => {
                  
                  let relationText = '';
                  let relationSub = '';
                  if (t.inquiry) { relationText = t.inquiry.inquiryNumber; relationSub = t.customer?.name || 'Inquiry'; }
                  else if (t.quote) { relationText = t.quote.quoteNumber; relationSub = t.customer?.name || 'Quote'; }
                  else if (t.order) { relationText = t.order.orderNumber; relationSub = t.customer?.name || 'Order'; }
                  else if (t.customer) { relationText = t.customer.name; relationSub = 'Customer'; }
                  else { relationText = '-'; }

                  const isCompleted = t.status === 'COMPLETED';

                  return (
                    <tr key={t.id} className={`hover:bg-[#F9FAFB] transition-colors cursor-pointer group ${isCompleted ? 'opacity-60 bg-gray-50' : ''}`} onClick={() => openDetail(t)}>
                      <td className="px-4 py-4 text-center" onClick={e => e.stopPropagation()}>
                         <input type="checkbox" checked={isCompleted} onChange={() => handleComplete(t.id, t.status)} className="rounded border-gray-300 w-4 h-4 text-emerald-600 focus:ring-emerald-600 cursor-pointer" />
                      </td>
                      <td className="px-4 py-4">
                        <p className={`text-xs font-bold text-[#111111] ${isCompleted ? 'line-through text-gray-500' : ''}`}>{t.title}</p>
                        <p className="text-[10px] text-[#6B7280] mt-0.5 max-w-[200px] truncate">{t.description || 'No description'}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-xs font-bold text-[#3B6FEB] hover:underline cursor-pointer">{relationText}</p>
                        <p className="text-[10px] text-[#6B7280] mt-0.5">{relationSub}</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                           <div className="w-6 h-6 rounded-full bg-slate-200 flex flex-shrink-0 items-center justify-center text-[10px] font-bold text-slate-600">
                             {t.assignedTo?.name ? t.assignedTo.name.charAt(0) : 'U'}
                           </div>
                           <div>
                             <p className="text-xs font-bold text-[#111111]">{t.assignedTo?.name || 'Unassigned'}</p>
                             <p className="text-[10px] text-[#6B7280]">Sales Exec.</p>
                           </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 border rounded ${getPriorityColor(t.priority)}`}>
                          {t.priority}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <p className={`text-xs font-semibold ${t.status === 'OVERDUE' ? 'text-red-600' : 'text-[#4B5563]'}`}>
                           {t.dueAt ? new Date(t.dueAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                        </p>
                        <p className={`text-[10px] mt-0.5 ${t.status === 'OVERDUE' ? 'text-red-500 font-bold' : 'text-[#6B7280]'}`}>
                           {t.dueAt ? new Date(t.dueAt).toLocaleTimeString('en-US', { hour: '2-digit', minute:'2-digit' }) : ''}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="px-4 py-4 text-xs text-[#4B5563] capitalize font-medium">
                        {t.category.replace('_', ' ')}
                      </td>
                      <td className="px-4 py-4 text-center" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
            <span>Showing {(page - 1) * pagination.pageSize + 1} to {Math.min(page * pagination.pageSize, pagination.total)} of {pagination.total} tasks</span>
            <div className="flex gap-1 items-center">
              <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-2 py-1 border border-[#E5E7EB] rounded hover:bg-[#F3F4F6] disabled:opacity-50">&lt;</button>
              <span className="px-3 font-semibold text-[#111111] bg-blue-50 text-blue-700 py-1 rounded">{page}</span>
              <button disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)} className="px-2 py-1 border border-[#E5E7EB] rounded hover:bg-[#F3F4F6] disabled:opacity-50">&gt;</button>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR - Calendar & Upcoming */}
        <div className="w-full lg:w-72 flex flex-col gap-6 shrink-0">
           {/* Calendar Card */}
           <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold text-[#111111]">Calendar</h3>
                 <div className="flex gap-1">
                   <button className="p-1 text-gray-500 hover:bg-gray-100 rounded">&lt;</button>
                   <button className="p-1 text-gray-500 hover:bg-gray-100 rounded">&gt;</button>
                 </div>
              </div>
              <p className="text-sm font-bold text-center text-[#374151] mb-4">
                 {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-gray-400 mb-2">
                 <div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div><div>Sun</div>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold">
                 {/* Dynamic calendar grid mapping actual tasks */}
                 {Array.from({length: 31}).map((_, i) => {
                    const dayTasks = tasks.filter(t => t.dueAt && new Date(t.dueAt).getDate() === i + 1);
                    const isToday = new Date().getDate() === i + 1;
                    return (
                      <div key={i} className={`p-1.5 rounded-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 
                         ${isToday ? 'bg-[#3B6FEB] text-white hover:bg-[#2563EB]' : 'text-[#374151]'}`}>
                         {i+1}
                         {dayTasks.length > 0 && <span className={`w-1 h-1 rounded-full mt-0.5 ${isToday ? 'bg-white' : 'bg-orange-400'}`}></span>}
                      </div>
                    );
                 })}
              </div>
           </div>

           {/* Upcoming Tasks */}
           <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold text-[#111111]">Upcoming Tasks</h3>
                 <button className="text-[10px] font-bold text-[#3B6FEB] hover:underline">View All</button>
              </div>
              <div className="space-y-4">
                 {tasks.filter(t => t.status === 'PENDING').slice(0,4).map(t => (
                    <div key={t.id} className="flex gap-3 items-start group cursor-pointer" onClick={() => openDetail(t)}>
                       <CalendarIcon className="w-4 h-4 text-gray-400 mt-0.5" />
                       <div className="flex-1">
                          <p className="text-xs font-bold text-[#111111] group-hover:text-[#3B6FEB] line-clamp-1">{t.title}</p>
                          <p className="text-[10px] text-[#6B7280]">{t.dueAt ? new Date(t.dueAt).toLocaleTimeString('en-US', { hour: '2-digit', minute:'2-digit' }) : 'No time'}</p>
                       </div>
                       <span className={`text-[9px] font-bold ${t.dueAt && new Date(t.dueAt) < new Date() ? 'text-red-500' : 'text-amber-500'}`}>
                          {t.dueAt && new Date(t.dueAt) < new Date() ? 'Overdue' : 'Today'}
                       </span>
                    </div>
                 ))}
                 {tasks.length === 0 && <p className="text-xs text-gray-500 text-center">No upcoming tasks</p>}
              </div>
           </div>

           {/* Quick Actions */}
           <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-[#111111] mb-4">Quick Actions</h3>
              <div className="grid grid-cols-4 gap-2 text-center">
                 <button onClick={openAdd} className="flex flex-col items-center gap-1 p-2 rounded hover:bg-gray-50 group">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors"><CheckCircle2 className="w-4 h-4 text-blue-600"/></div>
                    <span className="text-[9px] font-bold text-gray-600">Add Task</span>
                 </button>
                 <button onClick={() => {setFilterAssignee('ME'); fetchData();}} className="flex flex-col items-center gap-1 p-2 rounded hover:bg-gray-50 group">
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center border border-gray-200 group-hover:bg-gray-100 transition-colors"><User className="w-4 h-4 text-gray-600"/></div>
                    <span className="text-[9px] font-bold text-gray-600">My Tasks</span>
                 </button>
                 <button className="flex flex-col items-center gap-1 p-2 rounded hover:bg-gray-50 group">
                    <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors"><CalendarIcon className="w-4 h-4 text-purple-600"/></div>
                    <span className="text-[9px] font-bold text-gray-600">Calendar View</span>
                 </button>
                 <button className="flex flex-col items-center gap-1 p-2 rounded hover:bg-gray-50 group">
                    <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors"><Filter className="w-4 h-4 text-green-600"/></div>
                    <span className="text-[9px] font-bold text-gray-600">Task Report</span>
                 </button>
              </div>
           </div>
        </div>

        {/* RIGHT DRAWER */}
        {isDrawerOpen && (
          <TaskDrawer 
            mode={drawerMode}
            task={selectedTask}
            onClose={() => setIsDrawerOpen(false)} 
            onRefresh={fetchData}
          />
        )}
      </div>
    </div>
  );
}


function TaskDrawer({ mode, task, onClose, onRefresh }: { mode: 'ADD'|'DETAIL', task: any, onClose: () => void, onRefresh: () => void }) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
     title: task?.title || '',
     description: task?.description || '',
     priority: task?.priority || 'MEDIUM',
     category: task?.category || 'FOLLOW_UP',
     dueAtDate: task?.dueAt ? new Date(task.dueAt).toISOString().split('T')[0] : '',
     dueAtTime: task?.dueAt ? new Date(task.dueAt).toTimeString().slice(0,5) : '',
     customerId: task?.customerId || '',
     inquiryId: task?.inquiryId || '',
     quoteId: task?.quoteId || '',
     orderId: task?.orderId || '',
     assignedToId: task?.assignedToId || ''
  });

  const handleSave = async () => {
    try {
      setSaving(true);
      if(!formData.title) return alert('Title is required.');
      
      let dueAt = null;
      if (formData.dueAtDate) {
         dueAt = new Date(`${formData.dueAtDate}T${formData.dueAtTime || '12:00'}:00`);
      }

      const payload = {
         ...formData,
         dueAt: dueAt?.toISOString(),
         customerId: formData.customerId || null,
         inquiryId: formData.inquiryId || null,
         quoteId: formData.quoteId || null,
         orderId: formData.orderId || null,
         assignedToId: formData.assignedToId || null
      };

      const url = mode === 'ADD' ? `${API_URL}/tasks` : `${API_URL}/tasks/${task.id}`;
      const method = mode === 'ADD' ? 'POST' : 'PUT';
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('zobra_token') : null;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify(payload)
      }).then(r => r.json());

      if (res.success) {
         onRefresh();
         onClose();
      } else {
         alert('Failed: ' + res.message);
      }
    } catch(e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
     if(!confirm('Delete this task?')) return;
     try {
        await fetch(`${API_URL}/tasks/${task.id}`, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } });
        onRefresh();
        onClose();
     } catch(e) { console.error(e); }
  }

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[400px] bg-white shadow-2xl flex flex-col border-l border-[#E5E7EB] animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="px-6 py-5 border-b border-[#E5E7EB] bg-[#FDFDFD] flex items-center justify-between">
        <h2 className="text-lg font-heading font-black text-[#111111]">
           {mode === 'ADD' ? 'New Task' : 'Task Details'}
        </h2>
        <button onClick={onClose} className="p-1.5 text-[#9CA3AF] hover:text-[#111111] hover:bg-[#F3F4F6] rounded-lg transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
         
         {/* DETAIL VIEW SPECIFIC */}
         {mode === 'DETAIL' && task && (
            <div className="mb-6 space-y-4">
               <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-[#111111] leading-tight">{task.title}</h3>
                    <p className="text-xs text-[#6B7280] mt-1">{task.description || 'No description provided.'}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${
                     task.status === 'COMPLETED' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
                     task.status === 'OVERDUE' ? 'text-red-700 bg-red-50 border-red-200' :
                     'text-amber-700 bg-amber-50 border-amber-200'
                  }`}>
                    {task.status}
                  </span>
               </div>
               
               <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div>
                     <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Due Date</p>
                     <p className="text-sm font-semibold text-gray-900 mt-0.5">
                        {task.dueAt ? new Date(task.dueAt).toLocaleString() : '-'}
                     </p>
                  </div>
                  <div>
                     <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Priority</p>
                     <p className="text-sm font-semibold text-gray-900 mt-0.5">{task.priority}</p>
                  </div>
                  <div>
                     <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Assignee</p>
                     <p className="text-sm font-semibold text-gray-900 mt-0.5">{task.assignedTo?.name || '-'}</p>
                  </div>
                  <div>
                     <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Category</p>
                     <p className="text-sm font-semibold text-gray-900 mt-0.5">{task.category}</p>
                  </div>
               </div>

               {task.customer && (
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                     <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Related Customer</p>
                        <p className="text-sm font-bold text-blue-600 hover:underline cursor-pointer mt-0.5">{task.customer.name}</p>
                     </div>
                     <button className="p-2 bg-green-50 text-green-600 rounded hover:bg-green-100" title="WhatsApp Customer">
                        <Phone className="w-4 h-4"/>
                     </button>
                  </div>
               )}
            </div>
         )}

         {/* FORM (Used for ADD or Edit inside Detail) */}
         <div className="space-y-4">
            {mode === 'DETAIL' && <h4 className="text-sm font-bold text-[#111111] border-b pb-2">Edit Task</h4>}
            
            <div>
              <label className="block text-xs font-bold text-[#374151] mb-1">Task Title *</label>
              <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Follow up regarding order" className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#3B6FEB]" />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-[#374151] mb-1">Description</label>
              <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Add notes..." className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#3B6FEB] min-h-[80px]" />
            </div>

            <div className="grid grid-cols-2 gap-3">
               <div>
                  <label className="block text-xs font-bold text-[#374151] mb-1">Due Date</label>
                  <input type="date" value={formData.dueAtDate} onChange={e => setFormData({...formData, dueAtDate: e.target.value})} className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#3B6FEB]" />
               </div>
               <div>
                  <label className="block text-xs font-bold text-[#374151] mb-1">Due Time</label>
                  <input type="time" value={formData.dueAtTime} onChange={e => setFormData({...formData, dueAtTime: e.target.value})} className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#3B6FEB]" />
               </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
               <div>
                  <label className="block text-xs font-bold text-[#374151] mb-1">Priority</label>
                  <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#3B6FEB] bg-white">
                     <option value="LOW">Low</option>
                     <option value="MEDIUM">Medium</option>
                     <option value="HIGH">High</option>
                     <option value="URGENT">Urgent</option>
                  </select>
               </div>
               <div>
                  <label className="block text-xs font-bold text-[#374151] mb-1">Category</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#3B6FEB] bg-white">
                     <option value="FOLLOW_UP">Follow Up</option>
                     <option value="QUOTE">Quote</option>
                     <option value="ORDER">Order</option>
                     <option value="PAYMENT">Payment</option>
                     <option value="CUSTOMER">Customer</option>
                     <option value="OTHER">Other</option>
                  </select>
               </div>
            </div>
            
            <div className="pt-2">
               <label className="block text-xs font-bold text-[#374151] mb-1">Relations (Optional)</label>
               <input type="text" placeholder="Customer ID" value={formData.customerId} onChange={e=>setFormData({...formData, customerId:e.target.value})} className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm mb-2" />
               <input type="text" placeholder="Quote ID" value={formData.quoteId} onChange={e=>setFormData({...formData, quoteId:e.target.value})} className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm mb-2" />
               <input type="text" placeholder="Order ID" value={formData.orderId} onChange={e=>setFormData({...formData, orderId:e.target.value})} className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm" />
            </div>
         </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[#E5E7EB] bg-[#FDFDFD] flex gap-3">
        {mode === 'DETAIL' && (
           <button onClick={handleDelete} className="px-4 py-2 border border-red-200 text-red-600 bg-red-50 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors">
              Delete
           </button>
        )}
        <button onClick={onClose} className="px-4 py-2 border border-[#E5E7EB] bg-white rounded-lg text-sm font-bold text-[#374151] hover:bg-[#F9FAFB] transition-colors flex-1">
          Cancel
        </button>
        <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-[#3B6FEB] text-white rounded-lg text-sm font-bold shadow-sm hover:bg-[#2563EB] transition-colors flex-1 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Task'}
        </button>
      </div>
    </div>
  );
}
