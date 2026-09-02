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

// ============================================================================
// ERROR CLASSIFICATION SYSTEM
// ============================================================================

export enum ApiErrorCategory {
  NETWORK_ERROR = 'NETWORK_ERROR',
  REQUEST_TIMEOUT = 'REQUEST_TIMEOUT',
  API_UNAVAILABLE = 'API_UNAVAILABLE',
  SERVER_ERROR = 'SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  UNAUTHORIZED = 'UNAUTHORIZED',
  RATE_LIMITED = 'RATE_LIMITED',
  CORS_ERROR = 'CORS_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface ApiError {
  category: ApiErrorCategory;
  status?: number;
  message: string;
  requestId?: string;
}

/**
 * Classify API errors into meaningful categories for UI and logging.
 * This function never exposes sensitive backend details to users.
 */
export function classifyApiError(error: any, response?: Response): ApiError {
  // Network errors (no response from server)
  if (error instanceof TypeError) {
    if (error.message.includes('fetch')) {
      // Could be network offline, CORS, or DNS failure
      if (!navigator.onLine) {
        return {
          category: ApiErrorCategory.NETWORK_ERROR,
          message: 'No internet connection. Please check your network.',
        };
      }
      return {
        category: ApiErrorCategory.CORS_ERROR,
        message: 'Connection error. Please contact support if this persists.',
      };
    }
  }

  // Timeout errors
  if (error.name === 'AbortError' || error.message.includes('timeout')) {
    return {
      category: ApiErrorCategory.REQUEST_TIMEOUT,
      message: 'Request took too long. Please check your internet connection and try again.',
    };
  }

  // HTTP response errors
  if (response) {
    const status = response.status;
    const requestId = response.headers.get('x-request-id');

    if (status === 401) {
      return {
        category: ApiErrorCategory.INVALID_CREDENTIALS,
        status,
        message: 'Invalid email or password.',
        requestId: requestId || undefined,
      };
    }

    if (status === 429) {
      return {
        category: ApiErrorCategory.RATE_LIMITED,
        status,
        message: 'Too many attempts. Please wait a moment and try again.',
        requestId: requestId || undefined,
      };
    }

    if (status === 403) {
      return {
        category: ApiErrorCategory.UNAUTHORIZED,
        status,
        message: 'You do not have permission to access this resource.',
        requestId: requestId || undefined,
      };
    }

    if (status === 400) {
      return {
        category: ApiErrorCategory.VALIDATION_ERROR,
        status,
        message: 'Please check your input and try again.',
        requestId: requestId || undefined,
      };
    }

    if (status === 408) {
      return {
        category: ApiErrorCategory.REQUEST_TIMEOUT,
        status,
        message: 'Request timeout. Please check your internet connection and try again.',
        requestId: requestId || undefined,
      };
    }

    if (status >= 500 && status < 600) {
      if (status === 502 || status === 503 || status === 504) {
        return {
          category: ApiErrorCategory.API_UNAVAILABLE,
          status,
          message: 'ZOBBRA is temporarily unavailable. Please try again in a moment.',
          requestId: requestId || undefined,
        };
      }
      // 500, 505, etc
      return {
        category: ApiErrorCategory.SERVER_ERROR,
        status,
        message: 'Something went wrong on our server. Please try again.',
        requestId: requestId || undefined,
      };
    }
  }

  // Fallback
  return {
    category: ApiErrorCategory.UNKNOWN_ERROR,
    message: 'Unable to complete this action. Please try again.',
  };
}

// ============================================================================
// CENTRALIZED FETCH WRAPPER WITH TIMEOUT & ERROR HANDLING
// ============================================================================

const REQUEST_TIMEOUT_MS = 15000; // 15 seconds

/**
 * Wrapper around fetch() that adds:
 * - Automatic request timeout
 * - Request/response logging in development
 * - Structured error classification
 * - Request correlation IDs
 */
export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const requestId = generateRequestId();
  const url = `${API_URL}${endpoint}`;

  try {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API] ${options.method || 'GET'} ${endpoint}`, {
        requestId,
        timestamp: new Date().toISOString(),
      });
    }

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        ...options.headers,
        'x-request-id': requestId,
      },
    });

    if (process.env.NODE_ENV === 'development') {
      console.log(`[API] ${response.status} ${endpoint}`, {
        requestId,
        duration: `${Date.now()}ms`,
      });
    }

    return response;
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[API] ERROR ${endpoint}`, {
        requestId,
        error: error.message,
        type: error.name,
      });
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate a unique request ID for correlation across frontend/backend logs.
 */
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Determine if a request should be retried.
 * Only safe for GET requests; POST/PUT/DELETE should NOT auto-retry.
 */
export function isRetryableError(error: any, method: string = 'GET'): boolean {
  if (method !== 'GET') return false;

  if (error instanceof TypeError) {
    return true; // Network errors
  }

  if (error.name === 'AbortError') {
    return true; // Timeout
  }

  return false;
}

export default API_URL;