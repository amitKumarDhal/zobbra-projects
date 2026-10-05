import { describe, it, expect } from 'vitest';
import {
  cleanNationalNumber,
  customerLoginHref,
  formatCountdown,
  formatPhoneForDisplay,
  isValidNationalNumber,
  postLoginDestination,
  adminLoginHref,
  isPathAllowedForRole,
  roleHome,
  toE164,
} from '@/lib/otpAuth';

describe('WhatsApp OTP helpers', () => {
  it('cleans national numbers', () => {
    expect(cleanNationalNumber('98765 43210')).toBe('9876543210');
    expect(cleanNationalNumber('098765-43210')).toBe('9876543210');
    expect(cleanNationalNumber('abc')).toBe('');
  });

  it('validates Indian mobile numbers', () => {
    expect(isValidNationalNumber('91', '9876543210')).toBe(true);
    expect(isValidNationalNumber('91', '98765 43210')).toBe(true);
    expect(isValidNationalNumber('91', '987654321')).toBe(false); // too short
    expect(isValidNationalNumber('91', '1234567890')).toBe(false); // must start 6-9
  });

  it('validates other supported countries by length', () => {
    expect(isValidNationalNumber('971', '501234567')).toBe(true);
    expect(isValidNationalNumber('971', '5012')).toBe(false);
  });

  it('builds E.164 numbers', () => {
    expect(toE164('91', '98765 43210')).toBe('+919876543210');
    expect(toE164('971', '050 123 4567')).toBe('+971501234567');
  });

  it('formats numbers for display', () => {
    expect(formatPhoneForDisplay('91', '9876543210')).toBe('+91 98765 43210');
    expect(formatPhoneForDisplay('65', '81234567')).toBe('+65 81234567');
  });

  it('formats the resend countdown', () => {
    expect(formatCountdown(30)).toBe('30s');
    expect(formatCountdown(0)).toBe('0s');
    expect(formatCountdown(90)).toBe('1:30');
  });

  it('redirects each active role to its own area', () => {
    expect(roleHome('CUSTOMER')).toBe('/customer/products');
    expect(roleHome('ADMIN')).toBe('/dashboard/orders');
    // SALES/PRODUCTION are disabled roles and have no landing area
    expect(roleHome('SALES')).toBe('/login');
    expect(roleHome('PRODUCTION')).toBe('/login');
  });

  it('redirects to the intended destination after authentication', () => {
    expect(postLoginDestination('CUSTOMER', '/products/abc/customize?resume=1')).toBe(
      '/products/abc/customize?resume=1'
    );
    expect(postLoginDestination('CUSTOMER', null)).toBe('/customer/products');
    expect(postLoginDestination('ADMIN', '/dashboard/customers')).toBe('/dashboard/customers');
  });

  it('ignores a returnUrl the role cannot use', () => {
    expect(postLoginDestination('CUSTOMER', '/dashboard/customers')).toBe('/customer/products');
    expect(postLoginDestination('ADMIN', '/customer/quotes')).toBe('/dashboard/orders');
  });

  it('keeps the dashboard admin-only', () => {
    expect(isPathAllowedForRole('ADMIN', '/dashboard/orders/o1')).toBe(true);
    expect(isPathAllowedForRole('CUSTOMER', '/dashboard')).toBe(false);
    expect(isPathAllowedForRole('SALES', '/dashboard')).toBe(false);
    expect(isPathAllowedForRole('PRODUCTION', '/dashboard/orders')).toBe(false);
    expect(isPathAllowedForRole('CUSTOMER', '/customer/quotes')).toBe(true);
    expect(isPathAllowedForRole('CUSTOMER', '/products/abc/customize')).toBe(true);
  });

  it('keeps returnUrl when switching between OTP and admin sign-in', () => {
    expect(adminLoginHref(null)).toBe('/login?mode=admin');
    expect(adminLoginHref('/dashboard/orders')).toBe('/login?mode=admin&returnUrl=%2Fdashboard%2Forders');
    expect(customerLoginHref('/customer/quotes')).toBe('/login?returnUrl=%2Fcustomer%2Fquotes');
  });
});
