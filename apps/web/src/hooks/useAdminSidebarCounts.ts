'use client';

import { useState, useEffect, useCallback } from 'react';
import { API_URL } from '@/lib/api';

export interface AdminSidebarCounts {
  inquiries: number;
  quotes: number;
  orders: number;
  todo: number;
}

export interface UseAdminSidebarCountsResult {
  counts: AdminSidebarCounts;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const DEFAULT_COUNTS: AdminSidebarCounts = {
  inquiries: 0,
  quotes: 0,
  orders: 0,
  todo: 0,
};

const EVENT_REFRESH_COUNTS = 'zobbra:refresh-sidebar-counts';

/**
 * Dispatches a global event across the application to immediately refresh
 * admin sidebar counts whenever a mutation (create/update/delete) occurs.
 */
export function triggerSidebarCountsRefresh() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT_REFRESH_COUNTS));
  }
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token') || localStorage.getItem('zobra_token');
}

function getStoredUserRole(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('user') || localStorage.getItem('zobra_user');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.role || null;
  } catch {
    return null;
  }
}

export function useAdminSidebarCounts(): UseAdminSidebarCountsResult {
  const [counts, setCounts] = useState<AdminSidebarCounts>(DEFAULT_COUNTS);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCounts = useCallback(async (isSilent = false) => {
    const token = getToken();
    const role = getStoredUserRole();

    // Only authorized staff/admin roles should fetch sidebar counts
    if (!token || role === 'CUSTOMER') {
      setCounts(DEFAULT_COUNTS);
      setLoading(false);
      return;
    }

    if (!isSilent) {
      setLoading(true);
    }
    setError(null);

    try {
      // 1. Primary endpoint: single consolidated COUNT query
      const res = await fetch(`${API_URL}/reports/sidebar-counts`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.counts) {
          setCounts({
            inquiries: Number(data.counts.inquiries) || 0,
            quotes: Number(data.counts.quotes) || 0,
            orders: Number(data.counts.orders) || 0,
            todo: Number(data.counts.todo) || 0,
          });
          return;
        }
      }

      // 2. Resilient fallback to individual stats endpoints if consolidated route is deploying
      const [resInq, resQuotes, resOrders, resTasks] = await Promise.allSettled([
        fetch(`${API_URL}/inquiries/stats`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch(`${API_URL}/quotes/stats`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch(`${API_URL}/orders/stats`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch(`${API_URL}/tasks/stats`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      ]);

      const inqCount = resInq.status === 'fulfilled' && resInq.value ? (
        Number(resInq.value.new || 0) + Number(resInq.value.contacted || 0)
      ) : 0;

      const quoteCount = resQuotes.status === 'fulfilled' && resQuotes.value?.stats ? (
        Number(resQuotes.value.stats.pending || (resQuotes.value.stats.draft + resQuotes.value.stats.sent) || 0)
      ) : 0;

      const orderCount = resOrders.status === 'fulfilled' && resOrders.value?.stats ? (
        Number(resOrders.value.stats.pending || 0) + Number(resOrders.value.stats.confirmed || 0)
      ) : 0;

      const taskCount = resTasks.status === 'fulfilled' && resTasks.value?.stats ? (
        Number(resTasks.value.stats.pending || 0) + Number(resTasks.value.stats.overdue || 0)
      ) : 0;

      setCounts({
        inquiries: inqCount,
        quotes: quoteCount,
        orders: orderCount,
        todo: taskCount,
      });
    } catch (err: any) {
      console.error('Failed to fetch sidebar counts:', err);
      setError(err?.message || 'Error fetching sidebar counts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchCounts(false);

    // Periodic lightweight background sync every 45s
    const interval = setInterval(() => {
      fetchCounts(true);
    }, 45000);

    // Global mutation listener
    const handleMutation = () => {
      fetchCounts(true);
    };

    // Window focus refresh
    const handleFocus = () => {
      fetchCounts(true);
    };

    window.addEventListener(EVENT_REFRESH_COUNTS, handleMutation);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener(EVENT_REFRESH_COUNTS, handleMutation);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchCounts]);

  return {
    counts,
    loading,
    error,
    refresh: () => fetchCounts(false),
  };
}
