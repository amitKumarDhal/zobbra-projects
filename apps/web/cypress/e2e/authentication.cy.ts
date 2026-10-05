describe('Authentication Flows', () => {
  beforeEach(() => {
    // Clear tokens before each test to ensure a clean state
    cy.clearLocalStorage();
  });

  // ─── Customer (WhatsApp OTP) ──────────────────────────────────────────────

  it('shows the WhatsApp OTP sign-in by default (no email/password fields)', () => {
    cy.visit('/login');
    cy.contains('Welcome to ZOBBRA').should('be.visible');
    cy.contains('WEAR YOUR BRAND').should('exist');
    cy.get('[data-cy="otp-phone-input"]').should('be.visible');
    cy.get('[data-cy="otp-send-button"]').should('be.disabled');
    cy.get('[data-cy="email-input"]').should('not.exist');
    cy.get('[data-cy="password-input"]').should('not.exist');
  });

  it('redirects /register to the OTP sign-in and keeps the returnUrl', () => {
    cy.visit('/register?returnUrl=%2Fproducts%2Fabc%2Fcustomize%3Fresume%3D1');
    cy.location('pathname').should('eq', '/login');
    cy.location('search').should('include', 'returnUrl=%2Fproducts%2Fabc%2Fcustomize%3Fresume%3D1');
    cy.get('[data-cy="otp-phone-input"]').should('be.visible');
  });

  it('prevents customer from accessing admin dashboard', () => {
    cy.loginAsCustomer();
    cy.url().should('include', '/customer');

    cy.visit('/dashboard');
    cy.url().should('include', '/login');
  });

  // ─── Admin (email + password) ─────────────────────────────────────────────

  it('verifies the admin login page design and validation', () => {
    cy.visit('/login');
    cy.get('[data-cy="admin-login-link"]').click();
    cy.location('search').should('include', 'mode=admin');
    cy.contains('Admin sign in').should('be.visible');

    // Invalid submission
    cy.get('[data-cy="login-submit-button"]').click();
    cy.contains('Please enter your email and password').should('be.visible');
  });

  it('fails with invalid credentials', () => {
    cy.visit('/login?mode=admin');
    cy.get('[data-cy="email-input"]').type('invalid@zobra.com');
    cy.get('[data-cy="password-input"]').type('wrongpassword');
    cy.get('[data-cy="login-submit-button"]').click();

    cy.contains('Invalid email or password').should('be.visible');
  });

  it('successfully logs in an admin and redirects to dashboard', () => {
    cy.viewport(1280, 800); // admin sidebar is off-canvas below the lg breakpoint
    cy.visit('/login?mode=admin');
    // Typed rather than the dev-only autofill button so this also runs against `next start`
    cy.get('[data-cy="email-input"]').type('admin@zobra.test');
    cy.get('[data-cy="password-input"]').type('admin123');
    cy.get('[data-cy="login-submit-button"]').click();

    cy.url({ timeout: 10000 }).should('include', '/dashboard');
    cy.get('aside', { timeout: 8000 }).should('be.visible');
  });

  it('sends unauthenticated dashboard visits to the WhatsApp OTP sign-in', () => {
    cy.visit('/dashboard');
    cy.location('pathname').should('eq', '/login');
    cy.get('[data-cy="otp-phone-input"]').should('be.visible');
    cy.get('[data-cy="admin-login-link"]').should('be.visible');
  });

  it('the old ?mode=staff link still opens the admin form', () => {
    cy.visit('/login?mode=staff');
    cy.contains('Admin sign in').should('be.visible');
    cy.get('[data-cy="email-input"]').should('be.visible');
  });

  it('tests forgot password ui', () => {
    cy.visit('/forgot-password');
    cy.get('[data-cy="forgot-email"]').type('test@zobra.com');
    cy.get('[data-cy="forgot-submit-button"]').click();
    cy.contains('Check your email').should('be.visible');
  });
});
