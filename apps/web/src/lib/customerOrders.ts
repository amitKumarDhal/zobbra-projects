import { API_URL } from './api';
import type { CustomerOrderDetail } from '@/components/orders/CustomerOrderDetails';

const authHeaders = (): Record<string, string> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('zobra_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/** The signed-in customer's phone from the cached session, used when an order has none. */
export function getStoredCustomerPhone(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('user') || localStorage.getItem('zobra_user');
    return raw ? JSON.parse(raw).phone || null : null;
  } catch {
    return null;
  }
}

/**
 * Loads one order through the existing authorized endpoint (GET /orders/:id). The API only returns
 * an order to its owner; anything else is reported as a generic failure without server details.
 */
export async function fetchCustomerOrder(id: string): Promise<CustomerOrderDetail> {
  const res = await fetch(`${API_URL}/orders/${id}`, { headers: authHeaders() });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.success || !data.order) throw new Error('ORDER_UNAVAILABLE');
  return data.order as CustomerOrderDetail;
}
