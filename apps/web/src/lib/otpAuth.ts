/**
 * Helpers for WhatsApp OTP customer sign-in.
 * Pure functions so they can be unit-tested without a DOM.
 */

export interface CountryDialCode {
  dial: string; // without '+'
  label: string;
  /** Expected national-number length range */
  min: number;
  max: number;
}

// Server enforces OTP_ALLOWED_COUNTRY_CODES; India is the default market.
export const COUNTRY_DIAL_CODES: CountryDialCode[] = [
  { dial: '91', label: 'IN +91', min: 10, max: 10 },
  { dial: '971', label: 'AE +971', min: 8, max: 9 },
  { dial: '65', label: 'SG +65', min: 8, max: 8 },
  { dial: '44', label: 'UK +44', min: 9, max: 10 },
  { dial: '1', label: 'US +1', min: 10, max: 10 },
];

export const OTP_LENGTH = 6;

/** Keep digits only, and drop a leading trunk 0 (e.g. 098765… → 98765…). */
export function cleanNationalNumber(input: string): string {
  return input.replace(/\D/g, '').replace(/^0+/, '').slice(0, 15);
}

export function isValidNationalNumber(dial: string, national: string): boolean {
  const country = COUNTRY_DIAL_CODES.find((c) => c.dial === dial);
  const digits = cleanNationalNumber(national);
  if (!country) return /^\d{6,14}$/.test(digits);
  if (digits.length < country.min || digits.length > country.max) return false;
  if (dial === '91') return /^[6-9]/.test(digits);
  return true;
}

export function toE164(dial: string, national: string): string {
  return `+${dial}${cleanNationalNumber(national)}`;
}

/** "+919876543210" → "+91 98765 43210" (other countries: "+<dial> <number>") */
export function formatPhoneForDisplay(dial: string, national: string): string {
  const digits = cleanNationalNumber(national);
  if (dial === '91' && digits.length === 10) return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  return `+${dial} ${digits}`;
}

export function formatCountdown(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  return s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : `${s}s`;
}

/**
 * Landing area for each role (role always comes from the server response).
 * Only ADMIN and CUSTOMER can sign in; SALES/PRODUCTION are disabled.
 */
export function roleHome(role: string | undefined): string {
  switch (role) {
    case 'CUSTOMER':
      return '/customer/products';
    case 'ADMIN':
      return '/dashboard/orders';
    default:
      return '/login';
  }
}

/** Where to send a user after sign-in. returnUrl must already be sanitized. */
export function postLoginDestination(role: string | undefined, returnUrl: string | null): string {
  if (returnUrl && isPathAllowedForRole(role, returnUrl)) return returnUrl;
  return roleHome(role);
}

/** Client-side mirror of the server's role guards, used only for redirects and navigation. */
export function isPathAllowedForRole(role: string | undefined, path: string): boolean {
  const p = path.split(/[?#]/)[0];
  const under = (prefix: string) => p === prefix || p.startsWith(`${prefix}/`);
  if (under('/dashboard')) return role === 'ADMIN';
  if (under('/customer')) return role === 'CUSTOMER';
  return true; // public pages (products, customizer, …)
}

/** Persist the session exactly as the existing email/password login does. */
export function storeSession(token: string, user: unknown) {
  localStorage.setItem('token', token);
  localStorage.setItem('zobra_token', token);
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('zobra_user', JSON.stringify(user));
}

/** Sign out: drop everything storeSession wrote, so the browser is a guest again. */
export function clearSession() {
  ['token', 'zobra_token', 'user', 'zobra_user'].forEach((key) => localStorage.removeItem(key));
}

export function adminLoginHref(returnUrl: string | null): string {
  return returnUrl ? `/login?mode=admin&returnUrl=${encodeURIComponent(returnUrl)}` : '/login?mode=admin';
}

export function customerLoginHref(returnUrl: string | null): string {
  return returnUrl ? `/login?returnUrl=${encodeURIComponent(returnUrl)}` : '/login';
}
