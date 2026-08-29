/**
 * ZOBBRA Centralized API Client & Base URL Config
 *
 * All browser-side API requests MUST route through this module.
 * Never hard-code API URLs directly in pages, components, or hooks.
 *
 * Production API:  https://zobra-server-production.up.railway.app/api/v1
 * Development API: http://localhost:5000/api/v1  (local only, never deployed)
 *
 * Railway environment variable required for production builds:
 *   NEXT_PUBLIC_API_URL=https://zobra-server-production.up.railway.app/api/v1
 *
 * NEXT_PUBLIC_* variables are inlined at build time by Next.js.
 * A missing NEXT_PUBLIC_API_URL in a production build will cause a
 * clear error below rather than silently falling back to localhost.
 */

const PRODUCTION_API_URL =
  'https://zobra-server-production.up.railway.app/api/v1';

const DEV_API_URL = 'http://localhost:5000/api/v1';

function resolveApiUrl(): string {
  // 1. Prefer explicitly configured env var (set by Railway in production builds)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // 2. In production builds, NEXT_PUBLIC_API_URL MUST be set.
  //    Fall back to the hardcoded Railway URL rather than localhost,
  //    but emit a clear warning so the misconfiguration is visible in logs.
  if (process.env.NODE_ENV === 'production') {
    console.warn(
      '[ZOBBRA] WARNING: NEXT_PUBLIC_API_URL is not set. ' +
        'Falling back to hardcoded production URL. ' +
        'Please configure NEXT_PUBLIC_API_URL in your Railway environment variables.',
    );
    return PRODUCTION_API_URL;
  }

  // 3. Local development — use local server
  return DEV_API_URL;
}

export const API_URL = resolveApiUrl();

/** Alias kept for backwards compatibility with existing imports */
export const API_BASE_URL = API_URL;

export default API_URL;