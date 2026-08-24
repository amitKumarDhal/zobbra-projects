/**
 * ZOBBRA Centralized API Client & Base URL Config
 * 
 * Development Default: http://localhost:5000/api/v1
 * Production: https://api.zobbra.com/api/v1 (or via NEXT_PUBLIC_API_URL)
 */

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
export const API_BASE_URL = API_URL;

export default API_URL;
