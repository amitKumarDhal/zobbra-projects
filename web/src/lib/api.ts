// LEGACY FILE — This directory (web/) is NOT the active Railway frontend.
// The active deployed frontend is apps/web/. This file is preserved for
// historical reference only. See apps/web/src/lib/api.ts for the production version.
//
// Fix applied: removed bare localhost fallback; uses env var or Railway URL.
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://zobra-server-production.up.railway.app/api/v1';


export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('zobra_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export const formatINR = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
};
