/**
 * Active sign-in roles: ADMIN (email + password) and CUSTOMER (WhatsApp OTP).
 * SALES and PRODUCTION are disabled. Server-side enforcement is covered by
 * server/tests/otpAuth.test.ts; this spec covers the browser behaviour.
 */

const stubOtpRequest = () =>
  cy.intercept('POST', '**/auth/otp/request', {
    statusCode: 200,
    body: { success: true, message: 'A 6-digit code has been sent to your WhatsApp.', expiresIn: 300, resendIn: 30 },
  }).as('otpRequest');

const enterOtp = (path = '/login') => {
  cy.visit(path);
  cy.get('[data-cy="otp-phone-input"]').type('9876543210');
  cy.get('[data-cy="otp-send-button"]').click();
  cy.wait('@otpRequest');
  cy.get('[data-cy="otp-digit-0"]').type('123456');
  cy.get('[data-cy="otp-verify-button"]').click();
};

describe('Only ADMIN and CUSTOMER can sign in', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.viewport(1280, 800);
  });

  it('a SALES/PRODUCTION number is refused with a generic message', () => {
    stubOtpRequest();
    cy.intercept('POST', '**/auth/otp/verify', {
      statusCode: 403,
      body: { success: false, code: 'SIGN_IN_UNAVAILABLE', message: 'This number cannot be used to sign in. Please contact support.' },
    }).as('otpVerify');
    enterOtp();
    cy.wait('@otpVerify');
    cy.get('[data-cy="otp-error"]').should('contain', 'cannot be used to sign in');
    cy.location('pathname').should('eq', '/login');
    cy.window().its('localStorage').invoke('getItem', 'token').should('be.null');
  });

  (['SALES', 'PRODUCTION'] as const).forEach((role) => {
    it(`a leftover ${role} session cannot open the dashboard`, () => {
      cy.visit('/');
      cy.window().then((win) => {
        const user = { id: `legacy-${role}`, role, name: `Legacy ${role}` };
        win.localStorage.setItem('token', 'legacy-token');
        win.localStorage.setItem('user', JSON.stringify(user));
      });
      cy.visit('/dashboard/orders');
      cy.location('pathname', { timeout: 10000 }).should('eq', '/login');
    });
  });

  it('CUSTOMER → OTP → customer portal; a dashboard returnUrl is ignored', () => {
    // Fresh customer (works on a freshly reset database; see cypress.config.ts)
    cy.request('POST', 'http://localhost:5000/api/v1/auth/register', {
      name: 'OTP Role Spec',
      email: `otp-role-${Date.now()}@zobra.test`,
    }).then((res) => {
      stubOtpRequest();
      cy.intercept('POST', '**/auth/otp/verify', { statusCode: 200, body: { success: true, token: res.body.token, user: res.body.user } }).as('otpVerify');
      enterOtp('/login?returnUrl=%2Fdashboard%2Fcustomers');
      cy.wait('@otpVerify');
      cy.location('pathname', { timeout: 10000 }).should('eq', '/customer/products');
    });
  });
});

describe('Admin keeps email + password', () => {
  beforeEach(() => cy.clearLocalStorage());

  it('Admin Login is a secondary link, not the default form', () => {
    cy.visit('/login');
    cy.get('[data-cy="email-input"]').should('not.exist');
    cy.get('[data-cy="admin-login-link"]').should('contain', 'Admin Login').click();
    cy.get('[data-cy="email-input"]').should('be.visible');
    cy.get('[data-cy="password-input"]').should('be.visible');
  });

  it('admin signs in and reaches the dashboard', () => {
    cy.viewport(1280, 800);
    cy.visit('/login?mode=admin');
    cy.get('[data-cy="email-input"]').type('admin@zobra.test');
    cy.get('[data-cy="password-input"]').type('admin123');
    cy.get('[data-cy="login-submit-button"]').click();
    cy.location('pathname', { timeout: 10000 }).should('eq', '/dashboard/orders');
    cy.get('aside').should('be.visible');
  });

  it('a non-admin using the admin form does not get in', () => {
    cy.intercept('POST', '**/auth/login').as('pwLogin');
    cy.visit('/login?mode=admin');
    cy.get('[data-cy="email-input"]').type('not-an-admin@zobra.test');
    cy.get('[data-cy="password-input"]').type('whatever123');
    cy.get('[data-cy="login-submit-button"]').click();
    cy.wait('@pwLogin').its('response.statusCode').should('be.oneOf', [401, 403]);
    cy.location('pathname').should('eq', '/login');
    cy.window().its('localStorage').invoke('getItem', 'token').should('be.null');
  });
});
