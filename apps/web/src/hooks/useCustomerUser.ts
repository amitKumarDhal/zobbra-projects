/**
 * useCustomerUser
 *
 * Reads the authenticated customer's identity from localStorage (populated at
 * login/register by the API).  Falls back to fetching /auth/me when the
 * localStorage object is missing or appears stale.
 *
 * Returns:
 *   user        – raw user object (or null while loading)
 *   userName    – User.name (falls back to phone for new WhatsApp OTP accounts)
 *   companyName – Company.name
 *   email       – User.email
 *   phone       – User.phone
 *   loading     – true until the first read completes
 */
'use client';

import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/api';

export interface CustomerUser {
  id?: string;
  name: string;
  email?: string | null;
  phone?: string;
  role?: string;
  company?: {
    id?: string;
    name: string;
    gstin?: string;
    address?: string;
    addressType?: string | null;
    city?: string;
    state?: string;
    pincode?: string;
  };
}

interface UseCustomerUserResult {
  user: CustomerUser | null;
  userName: string;
  companyName: string;
  email: string;
  phone: string;
  loading: boolean;
  initials: string;
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token') || localStorage.getItem('zobra_token');
}

function getCachedUser(): CustomerUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('user') || localStorage.getItem('zobra_user');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Basic validity check – WhatsApp OTP accounts may not have a name yet
    if (!parsed?.id && !parsed?.name) return null;
    return parsed as CustomerUser;
  } catch {
    return null;
  }
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

export function useCustomerUser(): UseCustomerUserResult {
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const cached = getCachedUser();
    if (cached) {
      setUser(cached);
      setLoading(false);
      // Silently refresh from API in the background to keep data fresh
      refreshFromApi();
    } else {
      // No cache – fetch from API immediately
      refreshFromApi(true);
    }

    async function refreshFromApi(showLoading = false) {
      if (showLoading) setLoading(true);
      const token = getToken();
      if (!token) {
        if (!cancelled) setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const fresh: CustomerUser | null = data.user || data.data || null;
          // The session may have ended (or changed) while this was in flight: never write a
          // signed-out user back into storage.
          if ((fresh?.id || fresh?.name) && getToken() === token) {
            // Keep localStorage in sync
            localStorage.setItem('user', JSON.stringify(fresh));
            localStorage.setItem('zobra_user', JSON.stringify(fresh));
            if (!cancelled) setUser(fresh);
          }
        }
      } catch {
        // Silently swallow – we already showed cached data
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    return () => {
      cancelled = true;
    };
  }, []);

  const userName = user?.name || user?.phone || '';
  const companyName = user?.company?.name ?? '';
  const email = user?.email ?? '';
  const phone = user?.phone ?? '';

  return {
    user,
    userName,
    companyName,
    email,
    phone,
    loading,
    initials: user?.name ? initials(user.name) : '?',
  };
}
