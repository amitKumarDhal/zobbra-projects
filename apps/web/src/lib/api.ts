/**
 * ZOBBRA Centralized API Client & Base URL Config
 *
 * Development: http://localhost:5000/api/v1
 * Production: https://zobra-server-production.up.railway.app/api/v1
 */

const productionApiUrl =
  'https://zobra-server-production.up.railway.app/api/v1';

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'production'
    ? productionApiUrl
    : 'http://localhost:5000/api/v1');

export const API_BASE_URL = API_URL;

export default API_URL;